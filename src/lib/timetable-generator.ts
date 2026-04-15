import { prisma } from "./prisma";

const SLOTS = [
  { start: "08:45", end: "09:35" },
  { start: "09:35", end: "10:25" },
  { start: "10:40", end: "11:30" },
  { start: "11:30", end: "12:30" },
  { start: "13:30", end: "14:20" },
  { start: "14:20", end: "15:10" },
  { start: "15:25", end: "16:25" },
];

const TOTAL_SLOTS = 5 * SLOTS.length; // 35 slots per week (5 days * 7 slots)

// Institutional Slot Definitions (indices 0-34)
const MINOR_HONOR_SLOTS = [32, 33, 34]; // Friday Afternoon (Slots 4, 5, 6)
const OPEN_ELECTIVE_SLOTS = [18, 19, 20]; // Wednesday Afternoon (Slots 4, 5, 6)
const RESERVED_SLOTS = [...MINOR_HONOR_SLOTS, ...OPEN_ELECTIVE_SLOTS];

interface Requirement {
  subjectId: string;
  type: "theory" | "lab";
  subject: any;
}

interface Chromosome {
  genes: number[]; // Array of daySlot indices (0 to 34) exactly matching requirements array length
  fitness: number;
  hardViolations: number;
  slotsToCreate: any[]; // The decoded resulting slots
}

// Genetic Algorithm Configuration
const POPULATION_SIZE = 50;
const MAX_GENERATIONS = 100;

function getDayAndSlot(daySlot: number) {
  return { day: Math.floor(daySlot / SLOTS.length), slotIdx: daySlot % SLOTS.length };
}

// Deterministic Allocation & Fitness Evaluation
function evaluateFitness(
  chromosome: Chromosome,
  requirements: Requirement[],
  rooms: any[],
  faculty: any[],
  baseUsedRooms: Set<string>[][],
  baseUsedFaculty: Set<string>[][],
  facultyRequests: any[],
  totalStudents: number,
  timetableId: string,
  departmentId: string,
  year: number,
  semester: number
) {
  let hardViolations = 0;
  let softScore = 0;
  const slotsToCreate: any[] = [];

  // Clone the base usage matrices so we don't mutate shared state during evaluation
  const usedRooms = baseUsedRooms.map(dayArr => dayArr.map(set => new Set(set)));
  const usedFaculty = baseUsedFaculty.map(dayArr => dayArr.map(set => new Set(set)));

  // Group requirements by assigned daySlot, resolving collisions
  const mapping: { [daySlot: number]: Requirement[] } = {};

  // Track faculty load to balance it
  const facultyWeeklyLoad = new Map<string, number>();
  const facultyDailySlots = Array.from({ length: 5 }, () => new Map<string, Set<number>>());

  // Initialize base load from pre-existing fixed slots (other years/semesters)
  for (let d = 0; d < 5; d++) {
    for (let s = 0; s < SLOTS.length; s++) {
      for (const fId of baseUsedFaculty[d][s]) {
        facultyWeeklyLoad.set(fId, (facultyWeeklyLoad.get(fId) || 0) + 1);
        if (!facultyDailySlots[d].has(fId)) {
          facultyDailySlots[d].set(fId, new Set());
        }
        facultyDailySlots[d].get(fId)!.add(s);
      }
    }
  }
  for (let i = 0; i < chromosome.genes.length; i++) {
    let ds = chromosome.genes[i];
    
    // Resolve collisions by scanning forward (linear probing)
    let trips = 0;
    while (mapping[ds] !== undefined && mapping[ds].length > 0 && trips < TOTAL_SLOTS) {
      ds = (ds + 1) % TOTAL_SLOTS;
      hardViolations += 1; // Penalize collision heavily so GA breeds this out
      trips++;
    }
    
    if (trips >= TOTAL_SLOTS) {
      hardViolations += 100; // Unresolvable collision (more subjects than slots!)
      continue;
    }
    
    mapping[ds] = [requirements[i]];
  }

  // Iterate over each timeslot and attempt to allocate resources
  for (let daySlot = 0; daySlot < TOTAL_SLOTS; daySlot++) {
    const reqsInSlot = mapping[daySlot];
    if (!reqsInSlot) continue;

    const { day, slotIdx } = getDayAndSlot(daySlot);
    const slotTime = SLOTS[slotIdx];

    // To prevent a teacher teaching multiple subjects in the SAME slot for this generation
    const facultyUsedInThisSplit = new Set<string>();
    
    // Subjects cannot be scheduled multiple times on the same day ideally.
    // Hard constraint: The same subject should not be taught twice in the same day unless it's a lab back-to-back.
    // We will penalize multiple lectures of the SAME subject on the SAME day.
    
    for (const req of reqsInSlot) {
      let studentsRemaining = totalStudents;
      // Hard Constraints
    // Institutional Slot Enforcement
    const isMinorHonor = req.subject.isMinor || req.subject.isHonor;
    const isOpenElective = req.subject.isOpenElective;

    if (isMinorHonor && !MINOR_HONOR_SLOTS.includes(daySlot)) {
      hardViolations += 50; // Must be in Friday slots
    }
    if (isOpenElective && !OPEN_ELECTIVE_SLOTS.includes(daySlot)) {
      hardViolations += 50; // Must be in Wednesday slots
    }
    if (!isMinorHonor && !isOpenElective && RESERVED_SLOTS.includes(daySlot)) {
      hardViolations += 50; // Core subjects cannot occupy elective slots
    }

    const availableRooms = rooms.filter(r => !usedRooms[day][slotIdx].has(r.id));
      
      // Sort rooms: labs first if lab, else non-labs
      availableRooms.sort((a, b) => {
        const aIsLab = a.name.toUpperCase().includes("LAB") || a.code.toUpperCase().includes("LAB");
        const bIsLab = b.name.toUpperCase().includes("LAB") || b.code.toUpperCase().includes("LAB");
        if (req.type === 'lab') {
          return (aIsLab === bIsLab) ? b.capacity - a.capacity : (aIsLab ? -1 : 1);
        } else {
          return (aIsLab === bIsLab) ? b.capacity - a.capacity : (!aIsLab ? -1 : 1);
        }
      });

      while (studentsRemaining > 0) {
        if (availableRooms.length === 0) {
          hardViolations += 1; // Out of rooms
          break;
        }

        const room = availableRooms.shift()!;
        const assignedStudents = Math.min(studentsRemaining, room.capacity);

        // Find eligible faculty
        const eligibleFaculty = faculty.filter(f =>
          f.subjects.some((s: any) => s.id === req.subjectId) &&
          !usedFaculty[day][slotIdx].has(f.id) &&
          !facultyUsedInThisSplit.has(f.id)
        );

        if (eligibleFaculty.length === 0) {
          hardViolations += 1; // Out of faculty
          break;
        }

        // 1. Sort eligible faculty by their current weekly load (ASC) to ensure load balancing
        eligibleFaculty.sort((a, b) => {
          const loadA = facultyWeeklyLoad.get(a.id) || 0;
          const loadB = facultyWeeklyLoad.get(b.id) || 0;
          return loadA - loadB;
        });

        // Filter out faculty who marked themselves as [UNAVAILABLE] 
        const trulyEligible = eligibleFaculty.filter(f => {
          const block = facultyRequests.find(
            r => r.facultyId === f.id && r.dayOfWeek === day && r.startTime === slotTime.start && r.status === "approved" && r.reason?.startsWith("[UNAVAILABLE]")
          );
          return !block;
        });

        const finalFacultyList = trulyEligible.length > 0 ? trulyEligible : eligibleFaculty;
        if (trulyEligible.length === 0 && eligibleFaculty.length > 0) {
           hardViolations += 5; // Heavy penalty if forced to use an unavailable faculty
        }

        // Check if any eligible faculty has an approved [PREFERENCE] timeslot request
        let selectedFaculty = finalFacultyList[0];
        let foundPreferred = false;
        for (const f of finalFacultyList) {
          const matchingRequest = facultyRequests.find(
            r => r.facultyId === f.id &&
                 r.dayOfWeek === day &&
                 r.startTime === slotTime.start &&
                 r.status === "approved" &&
                 (!r.reason || r.reason.startsWith("[PREFERENCE]")) // fallback if old request has no reason
          );
          if (matchingRequest) {
            selectedFaculty = f;
            foundPreferred = true;
            softScore += 10; // Massive bonus for satisfying a constraint
            break;
          }
        }

        if (!foundPreferred) {
           // We just use the first available. A true GA relies on the fitness score, not just randomness inside the evaluation.
           selectedFaculty = eligibleFaculty[0]; 
        }

        slotsToCreate.push({
          timetableId: timetableId,
          roomId: room.id,
          facultyId: selectedFaculty.id,
          subjectId: req.subjectId,
          type: req.type,
          dayOfWeek: day,
          startTime: slotTime.start,
          endTime: slotTime.end,
          studentCount: assignedStudents,
        });

        usedRooms[day][slotIdx].add(room.id);
        usedFaculty[day][slotIdx].add(selectedFaculty.id);
        facultyUsedInThisSplit.add(selectedFaculty.id);
        
        // Update faculty metrics
        facultyWeeklyLoad.set(selectedFaculty.id, (facultyWeeklyLoad.get(selectedFaculty.id) || 0) + 1);
        if (!facultyDailySlots[day].has(selectedFaculty.id)) {
           facultyDailySlots[day].set(selectedFaculty.id, new Set());
        }
        const fSlots = facultyDailySlots[day].get(selectedFaculty.id)!;
        fSlots.add(slotIdx);
        
        // Max 2 continuous hours constraint. Count consecutive slots backwards.
        let consecutive = 1;
        let checkSlot = slotIdx - 1;
        while (checkSlot >= 0 && fSlots.has(checkSlot)) { consecutive++; checkSlot--; }
        checkSlot = slotIdx + 1;
        while (checkSlot < SLOTS.length && fSlots.has(checkSlot)) { consecutive++; checkSlot++; }
        
        if (consecutive > 2) {
           hardViolations += (consecutive - 2) * 5; // Penalize consecutive classes
        }
        
        studentsRemaining -= assignedStudents;
      }
    }
  }

  // Calculate final fitness
  let fitness = 1000 - (hardViolations * 100) + softScore;
  
  chromosome.fitness = fitness;
  chromosome.hardViolations = hardViolations;
  chromosome.slotsToCreate = slotsToCreate.map(s => ({...s, timetableId})); 
}

function initializePopulation(popSize: number, reqCount: number): Chromosome[] {
  const population: Chromosome[] = [];
  for (let i = 0; i < popSize; i++) {
    const genes = Array.from({ length: reqCount }, () => Math.floor(Math.random() * TOTAL_SLOTS));
    population.push({ genes, fitness: 0, hardViolations: 0, slotsToCreate: [] });
  }
  return population;
}

function crossover(parent1: Chromosome, parent2: Chromosome): Chromosome {
  // Uniform crossover
  const childGenes = parent1.genes.map((g, i) => (Math.random() > 0.5 ? g : parent2.genes[i]));
  return { genes: childGenes, fitness: 0, hardViolations: 0, slotsToCreate: [] };
}

function mutate(chromosome: Chromosome, mutationRate: number) {
  for (let i = 0; i < chromosome.genes.length; i++) {
    if (Math.random() < mutationRate) {
      chromosome.genes[i] = Math.floor(Math.random() * TOTAL_SLOTS);
    }
  }
}

export async function generateTimetableForDepartment(
  departmentId: string,
  year: number,
  semester: number,
  sharedState?: {
    usedRooms: Set<string>[][];
    usedFaculty: Set<string>[][];
  }
) {
  const [rooms, faculty, subjects, facultyRequests] = await Promise.all([
    prisma.room.findMany({ where: { departmentId, isAvailable: true } }),
    prisma.faculty.findMany({
      where: { departmentId },
      include: { user: true, subjects: true }
    }),
    prisma.subject.findMany({
      where: { departmentId, year, semester, isActive: true },
      include: { faculty: true }
    }),
    prisma.facultyTimeslotRequest.findMany({
      where: { faculty: { departmentId } }
    })
  ]);

  // Determine timetable ID upfront
  const existing = await prisma.timetable.findFirst({
    where: { departmentId, year, semester },
  });
  const timetableId = existing?.id || `temp-${Date.now()}`;

  if (rooms.length === 0 || faculty.length === 0 || subjects.length === 0) {
    throw new Error(`Need rooms, faculty, and subjects for ${year} Sem ${semester}.`);
  }

  const baseUsedRooms = sharedState?.usedRooms ?? Array.from({ length: 5 }, () =>
    SLOTS.map(() => new Set<string>())
  );
  const baseUsedFaculty = sharedState?.usedFaculty ?? Array.from({ length: 5 }, () =>
    SLOTS.map(() => new Set<string>())
  );

  if (!sharedState) {
    const isOdd = semester % 2 !== 0;
    // FETCH ALL TIMETABLES ACROSS ALL DEPARTMENTS to ensure faculty/room availability
    const otherTimetables = await prisma.timetable.findMany({
      where: {
        // We only care about timetables for the same semester type (odd/even)
        // Exclude the current logical timetable (even if not yet created in DB)
        OR: [
          { NOT: { departmentId } },
          { NOT: { year } },
          { NOT: { semester } }
        ]
      },
      include: {
        slots: true
      }
    });

    const relevantTimetables = otherTimetables.filter(t => (t.semester % 2 !== 0) === isOdd);

    for (const timetable of relevantTimetables) {
      for (const slot of timetable.slots) {
        const day = slot.dayOfWeek;
        const slotIdx = SLOTS.findIndex(s => s.start === slot.startTime);
        if (day >= 0 && day < 5 && slotIdx !== -1) {
          baseUsedRooms[day][slotIdx].add(slot.roomId);
          baseUsedFaculty[day][slotIdx].add(slot.facultyId);
        }
      }
    }
  }

  await prisma.timetableSlot.deleteMany({ where: { timetableId } });

  const studentCount = await prisma.student.count({
    where: { departmentId, year },
  });

  const studentsToSeatTotal = studentCount > 0 ? studentCount : 60;

  // Prepare requirements pool
  let requirements: Requirement[] = [];
  for (const sub of subjects) {
    // Theory classes
    for (let i = 0; i < (sub as any).classesPerWeek; i++) {
      requirements.push({ subjectId: sub.id, type: 'theory', subject: sub });
    }
    // Lab sessions
    if ((sub as any).isLab) {
      for (let i = 0; i < (sub as any).labSessionsPerWeek; i++) {
        requirements.push({ subjectId: sub.id, type: 'lab', subject: sub });
      }
    }
  }

  if (requirements.length === 0) {
    return {
      timetableId,
      success: true,
      hardViolations: 0,
    };
  }

  // GENETIC ALGORITHM EXECUTION
  let population = initializePopulation(POPULATION_SIZE, requirements.length);
  let bestChromosome: Chromosome | null = null;
  let currentMutationRate = 0.05; // Adaptive Mutation (ML element)
  let generationsWithoutImprovement = 0;

  // 2. Evolution Loop
  for (let g = 0; g < MAX_GENERATIONS; g++) {
    for (const chromosome of population) {
      evaluateFitness(
        chromosome,
        requirements,
        rooms,
        faculty,
        baseUsedRooms,
        baseUsedFaculty,
        facultyRequests,
        studentsToSeatTotal,
        timetableId,
        departmentId,
        year,
        semester
      );
    }

    // Sort by fitness descending
    population.sort((a, b) => b.fitness - a.fitness);

    // Track best
    if (!bestChromosome || population[0].fitness > bestChromosome.fitness) {
      bestChromosome = JSON.parse(JSON.stringify(population[0])); // Deep clone best
      generationsWithoutImprovement = 0;
      currentMutationRate = 0.05; // Reset mutation rate when improving
    } else {
      generationsWithoutImprovement++;
    }

    // Early exit if perfect schedule found (no hard violations)
    if (population[0].hardViolations === 0) {
      break;
    }

    // Adaptive Mutation Rate (simulated annealing / basic reinforcement learning heuristic)
    // If stuck in a local minima, increase mutation to jump out of it.
    if (generationsWithoutImprovement > 10) {
      currentMutationRate = Math.min(0.5, currentMutationRate + 0.05);
    }

    // Create next generation
    const nextGeneration: Chromosome[] = [];
    
    // Elitism: Keep top 10%
    const eliteCount = Math.max(1, Math.floor(POPULATION_SIZE * 0.1));
    for (let i = 0; i < eliteCount; i++) {
      nextGeneration.push(population[i]);
    }

    // Tournament selection & crossover
    while (nextGeneration.length < POPULATION_SIZE) {
      // Tournament for parent 1
      let p1 = population[Math.floor(Math.random() * POPULATION_SIZE)];
      for (let i = 0; i < 3; i++) {
        const candidate = population[Math.floor(Math.random() * POPULATION_SIZE)];
        if (candidate.fitness > p1.fitness) p1 = candidate;
      }
      
      // Tournament for parent 2
      let p2 = population[Math.floor(Math.random() * POPULATION_SIZE)];
      for (let i = 0; i < 3; i++) {
        const candidate = population[Math.floor(Math.random() * POPULATION_SIZE)];
        if (candidate.fitness > p2.fitness) p2 = candidate;
      }

      const child = crossover(p1, p2);
      mutate(child, currentMutationRate);
      nextGeneration.push(child);
    }

    population = nextGeneration;
  }

  // Final evaluation of the best chromosome (in case it wasn't the last evaluated)
  if (bestChromosome) {
    evaluateFitness(
      bestChromosome, requirements, rooms, faculty,
      baseUsedRooms, baseUsedFaculty, facultyRequests,
      studentsToSeatTotal, timetableId, departmentId, year, semester
    );

    if (bestChromosome.hardViolations > 0) {
      console.warn(`GA finished with ${bestChromosome.hardViolations} hard violations for Year ${year} Sem ${semester}. Constraints may be too strict.`);
      // We will still insert the best attempt, it will just have gaps or missing classes.
      // Alternatively, we could throw an Error, but partial timetables are better for manual fixing.
    }

    if (bestChromosome.slotsToCreate.length > 0) {
      await prisma.timetableSlot.createMany({ data: bestChromosome.slotsToCreate });
      
      // Update the shared state for consecutive runs (generateAllYearsTimetable)
      for (const slot of bestChromosome.slotsToCreate) {
        const day = slot.dayOfWeek;
        const slotIdx = SLOTS.findIndex(s => s.start === slot.startTime);
        if (day >= 0 && day < 5 && slotIdx !== -1) {
          baseUsedRooms[day][slotIdx].add(slot.roomId);
          baseUsedFaculty[day][slotIdx].add(slot.facultyId);
        }
      }
    }
  }

  return {
    timetableId,
    success: (bestChromosome?.hardViolations ?? 0) === 0,
    hardViolations: bestChromosome?.hardViolations ?? 0,
  };
}

export async function generateAllYearsTimetable(departmentId: string, semesterType?: 'odd' | 'even') {
  const results: any[] = [];

  // Shared state across all years/semesters in THIS department
  const sharedState = {
    usedRooms: Array.from({ length: 5 }, () => SLOTS.map(() => new Set<string>())),
    usedFaculty: Array.from({ length: 5 }, () => SLOTS.map(() => new Set<string>()))
  };

  for (let year = 1; year <= 4; year++) {
    const allSemesters = [(year * 2) - 1, year * 2];
    const targetSemesters = semesterType
      ? allSemesters.filter(s => semesterType === 'odd' ? s % 2 !== 0 : s % 2 === 0)
      : allSemesters;

    for (const sem of targetSemesters) {
      const res = await generateTimetableForDepartment(departmentId, year, sem, sharedState);
      results.push(res);
    }
  }
  return results;
}
