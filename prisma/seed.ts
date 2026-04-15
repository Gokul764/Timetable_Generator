import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { AGRI_STUDENTS } from "./data/agri-students";
import { AIDS_STUDENTS } from "./data/aids-students";
import { generateAllYearsTimetable } from "../src/lib/timetable-generator";

const prisma = new PrismaClient();

const DEPARTMENTS = [
  {
    code: "AGRI",
    name: "Agricultural Engineering",
    studentCount: 101,
    realData: AGRI_STUDENTS,
    facultyNames: []
  },
  {
    code: "AIDS",
    name: "Artificial Intelligence and Data Science",
    studentCount: 0,
    realData: AIDS_STUDENTS,
    facultyNames: [
      "Dr Gomathi R", "Dr Sundara Murthy S", "Dr Eswaramoorthy V", "Dr Arun Kumar R", "Dr Nandhini S S",
      "Prof. Balasamy K", "Dr Subbulakshmi M", "Prof. Ranjith G", "Prof. Prabanand S C", "Prof. Nithyapriya S",
      "Prof. Esakki Madura E", "Prof. Chozharajan P", "Prof. Navaneeth Kumar K", "Prof. Nisha Devi K",
      "Prof. Raj Kumar V S", "Prof. Divyabarathi P", "Prof. Vaanathi S", "Prof. Satheeshkumar S",
      "Prof. Satheesh N P", "Prof. Kiruthiga R", "Prof. Ashforn Hermina J M", "Prof. Jeevitha S V",
      "Prof. Premkumar C", "Prof. Benita Gracia Thangam J", "Prof. Reshmi T S", "Prof. Kalpana R",
      "Prof. Suriya V", "Prof. Hema Priya D", "Prof. Priyadharshni S", "Prof. Manju M",
      "Prof. Sasson Taffwin Moses S", "Prof. Manochitra A S"
    ]
  },
  {
    code: "AIML",
    name: "Artificial Intelligence and Machine Learning",
    studentCount: 389,
    facultyNames: ["Dr Bharathi A", "Dr Gopalakrishnan B", "Dr Kodieswari A", "Dr Rajasekar S S", "Dr Padmashree A", "Dr Karthikeyan G", "Prof. Eugene Berna I", "Prof. Balamurugan E", "Prof. Sudha R", "Prof. Haripriya R", "Prof. Nithin P", "Prof. Satheshkumar K", "Prof. Karthika S", "Prof. Mohanapriya K", "Prof. Ezhil R", "Prof. Pavithra G", "Prof. Kanimozhi A", "Prof. Nishanthini S", "Prof. Lokeswari P", "Prof. Gayathridevi M", "Prof. Sasithra S", "Prof. Saranya M K", "Prof. Sindhujaa N"]
  },
  { code: "BME", name: "Biomedical Engineering", studentCount: 29, facultyNames: [] },
  { code: "BT", name: "Biotechnology", studentCount: 345, facultyNames: [] },
  {
    code: "CIVIL",
    name: "Civil Engineering",
    studentCount: 24,
    facultyNames: []
  },
  { code: "CSBS", name: "Computer Science and Business Systems", studentCount: 110, facultyNames: [] },
  { code: "CSD", name: "Computer Science and Design", studentCount: 60, facultyNames: [] },
  {
    code: "CSE",
    name: "Computer Science and Engineering",
    studentCount: 1014,
    facultyNames: []
  },
  { code: "CT", name: "Computer Technology", studentCount: 63, facultyNames: [] },
  {
    code: "EEE",
    name: "Electrical and Electronics Engineering",
    studentCount: 284,
    facultyNames: []
  },
  {
    code: "ECE",
    name: "Electronics and Communication Engineering",
    studentCount: 747,
    facultyNames: []
  },
  { code: "EIE", name: "Electronics and Instrumentation Engineering", studentCount: 174, facultyNames: [] },
  { code: "FT", name: "Fashion Technology", studentCount: 20, facultyNames: [] },
  { code: "FOOD", name: "Food Technology", studentCount: 4, facultyNames: [] },
  { code: "ISE", name: "Information Science and Engineering", studentCount: 53, facultyNames: [] },
  {
    code: "IT",
    name: "Information Technology",
    studentCount: 727,
    facultyNames: []
  },
  {
    code: "MECH",
    name: "Mechanical Engineering",
    studentCount: 172,
    facultyNames: []
  },
  { code: "MCT", name: "Mechatronics Engineering", studentCount: 183, facultyNames: [] },
];

const YEARS = 4;

const SUBJECTS_POOL = [
  "Mathematics", "Physics", "Chemistry", "English", "Programming", "Data Structures",
  "Algorithms", "Database", "Networks", "OS", "AI", "ML", "Web Dev", "Cloud",
  "Cyber Security", "IoT", "Big Data", "Blockchain", "DevOps", "Testing"
];

const AIML_DESIGNATIONS: Record<string, string> = {
  "Dr Bharathi A": "Professor & Head",
  "Dr Gopalakrishnan B": "Professor",
  "Dr Kodieswari A": "Associate Professor",
  "Dr Rajasekar S S": "Associate Professor",
  "Dr Padmashree A": "Associate Professor",
  "Dr Karthikeyan G": "Assistant Professor Level III",
  "Prof. Eugene Berna I": "Assistant Professor Level III",
  "Prof. Balamurugan E": "Assistant Professor Level II",
  "Prof. Sudha R": "Assistant Professor Level II",
  "Prof. Haripriya R": "Assistant Professor Level II",
  "Prof. Nithin P": "Assistant Professor Level II",
  "Prof. Satheshkumar K": "Assistant Professor Level II",
  "Prof. Karthika S": "Assistant Professor",
  "Prof. Mohanapriya K": "Assistant Professor",
  "Prof. Ezhil R": "Assistant Professor",
  "Prof. Pavithra G": "Assistant Professor",
  "Prof. Kanimozhi A": "Assistant Professor",
  "Prof. Nishanthini S": "Assistant Professor",
  "Prof. Lokeswari P": "Assistant Professor",
  "Prof. Gayathridevi M": "Assistant Professor",
  "Prof. Sasithra S": "Assistant Professor",
  "Prof. Saranya M K": "Assistant Professor",
  "Prof. Sindhujaa N": "Assistant Professor"
};

const AIDS_DESIGNATIONS: Record<string, string> = {
  "Dr Gomathi R": "Professor & Head",
  "Dr Sundara Murthy S": "Professor",
  "Dr Eswaramoorthy V": "Professor",
  "Dr Arun Kumar R": "Associate Professor",
  "Dr Nandhini S S": "Associate Professor",
  "Prof. Balasamy K": "Assistant Professor Level III",
  "Dr Subbulakshmi M": "Assistant Professor Level III",
  "Prof. Ranjith G": "Assistant Professor Level III",
  "Prof. Prabanand S C": "Assistant Professor Level III",
  "Prof. Nithyapriya S": "Assistant Professor Level III",
  "Prof. Esakki Madura E": "Assistant Professor Level III",
  "Prof. Chozharajan P": "Assistant Professor Level III",
  "Prof. Navaneeth Kumar K": "Assistant Professor Level III",
  "Prof. Nisha Devi K": "Assistant Professor Level II",
  "Prof. Raj Kumar V S": "Assistant Professor Level II",
  "Prof. Divyabarathi P": "Assistant Professor Level II",
  "Prof. Vaanathi S": "Assistant Professor Level II",
  "Prof. Satheeshkumar S": "Assistant Professor Level II",
  "Prof. Satheesh N P": "Assistant Professor",
  "Prof. Kiruthiga R": "Assistant Professor",
  "Prof. Ashforn Hermina J M": "Assistant Professor",
  "Prof. Jeevitha S V": "Assistant Professor",
  "Prof. Premkumar C": "Assistant Professor",
  "Prof. Benita Gracia Thangam J": "Assistant Professor",
  "Prof. Reshmi T S": "Assistant Professor",
  "Prof. Kalpana R": "Assistant Professor",
  "Prof. Suriya V": "Assistant Professor",
  "Prof. Hema Priya D": "Assistant Professor",
  "Prof. Priyadharshni S": "Assistant Professor",
  "Prof. Manju M": "Assistant Professor",
  "Prof. Sasson Taffwin Moses S": "Assistant Professor",
  "Prof. Manochitra A S": "Assistant Professor"
};

async function main() {
  console.log("Starting seed (REAL DATA & ELECTIVES)...");

  // Cleanup: Delete all faculty and their profiles to start fresh
  console.log("Cleaning up existing faculty data...");
  await prisma.faculty.deleteMany();
  await prisma.user.deleteMany({ where: { role: "faculty" } });

  const passwordHash = await hash("password", 10);

  // Super Admin
  await prisma.user.upsert({
    where: { email: "superadmin@college.edu" },
    update: {},
    create: {
      email: "superadmin@college.edu",
      name: "Super Admin",
      passwordHash,
      role: "super_admin",
    },
  });

  for (const deptDef of DEPARTMENTS) {
    console.log(`Processing ${deptDef.code}...`);

    // 1. Create Dept
    const dept = await prisma.department.upsert({
      where: { code: deptDef.code },
      update: {},
      create: { name: deptDef.name, code: deptDef.code },
    });

    // 2. Create Admin
    await prisma.user.upsert({
      where: { email: `admin.${deptDef.code.toLowerCase()}@college.edu` },
      update: {},
      create: {
        email: `admin.${deptDef.code.toLowerCase()}@college.edu`,
        name: `Admin ${deptDef.code}`,
        passwordHash,
        role: "admin",
        departmentId: dept.id,
      },
    });

    // 3. Create Rooms (5 per dept)
    for (let i = 1; i <= 5; i++) {
      const roomCode = `${deptDef.code}-R${i}`;
      await prisma.room.upsert({
        where: { code: roomCode },
        update: {},
        create: {
          name: `${deptDef.code} Room ${i}`,
          code: roomCode,
          capacity: 60,
          departmentId: dept.id,
        }
      });
    }

    // Special Venues for AIDS
    if (deptDef.code === "AIDS") {
      const labs = [
        { name: "AI Lab", code: "AIDS-LAB-AI", capacity: 40 },
        { name: "Data Science Lab", code: "AIDS-LAB-DS", capacity: 40 },
        { name: "Compute Center", code: "AIDS-CC", capacity: 60 }
      ];

      for (const lab of labs) {
        await prisma.room.upsert({
          where: { code: lab.code },
          update: {},
          create: {
            name: lab.name,
            code: lab.code,
            capacity: lab.capacity,
            departmentId: dept.id,
          }
        });
      }
    }

    // 4. Create Subjects FIRST (so we can enroll students)
    console.log(`  Seeding subjects for ${deptDef.code}...`);
    const createdSubjects: any[] = [];
    for (let year = 1; year <= YEARS; year++) {
      // Create subjects for both semesters (Odd and Even)
      const semesters = [(year * 2) - 1, year * 2];

      for (const semester of semesters) {
        const startIdx = ((semester - 1) * 6) % SUBJECTS_POOL.length;
        for (let i = 0; i < 6; i++) {
          const subjName = SUBJECTS_POOL[(startIdx + i) % SUBJECTS_POOL.length];
          const code = `${deptDef.code}${year}${semester}${i + 1}`; // unique code logic

          // Upsert subject
          const typeRand = Math.random();
          const subject = await prisma.subject.upsert({
            where: { code_departmentId: { code, departmentId: dept.id } },
            update: {},
            create: {
              name: `${subjName} ${semester}`,
              code,
              departmentId: dept.id,
              year,
              semester,
              isHonor: typeRand > 0.9,
              isMinor: typeRand > 0.8 && typeRand <= 0.9,
              isAddOn: typeRand > 0.7 && typeRand <= 0.8,
              isProfessionalElective: typeRand > 0.6 && typeRand <= 0.7,
              isOpenElective: typeRand > 0.5 && typeRand <= 0.6,
              isCore: typeRand <= 0.5,
            }
          });
          createdSubjects.push(subject);
        }
      }
    }

    // 5. Seed Real Students & Enroll
    const studentsToSeed = (deptDef as any).realData || [];
    console.log(`  Seeding ${studentsToSeed.length} real students...`);

    for (const s of studentsToSeed) {
      const yearMap: Record<string, number> = { "I": 1, "II": 2, "III": 3, "IV": 4 };
      const year = yearMap[s.year] || 1;
      const email = `${s.regNo.toLowerCase()}@college.edu`;

      // Find core subjects for this year
      const yearSubjects = createdSubjects.filter(sub => sub.year === year);

      await prisma.user.upsert({
        where: { email },
        update: {},
        create: {
          email,
          name: s.name,
          passwordHash,
          role: "student",
          departmentId: dept.id,
          studentProfile: {
            create: {
              rollNo: s.regNo,
              departmentId: dept.id,
              year,
              // ENROLL IN SUBJECTS
              subjects: {
                connect: yearSubjects.map(sub => ({ id: sub.id }))
              }
            }
          }
        }
      });
    }

    // 6. Faculty
    const facultyNames = (deptDef as any).facultyNames || [];
    const facultyCount = facultyNames.length;

    if (facultyCount > 0) {
      console.log(`  Seeding ${facultyCount} faculty for ${deptDef.code}...`);

      for (let i = 0; i < facultyCount; i++) {
        const facultyName = facultyNames[i];
        let designation = "Assistant Professor";
        if (deptDef.code === "AIML") {
          designation = AIML_DESIGNATIONS[facultyName] || "Assistant Professor";
        } else if (deptDef.code === "AIDS") {
          designation = AIDS_DESIGNATIONS[facultyName] || "Assistant Professor";
        }
        const email = `faculty.${deptDef.code.toLowerCase()}${i + 1}@college.edu`;
        const user = await prisma.user.upsert({
          where: { email },
          update: { name: facultyName },
          create: {
            email,
            name: facultyName,
            passwordHash,
            role: "faculty",
            departmentId: dept.id,
            facultyProfile: {
              create: {
                employeeId: `${deptDef.code}F00${i + 1}`,
                designation,
                departmentId: dept.id
              }
            }
          }
        });

        // Randomly assign 3 subjects to faculty
        const facultyProfile = await prisma.faculty.findUnique({ where: { userId: user.id } });
        if (facultyProfile) {
          const shuffled = createdSubjects.sort(() => 0.5 - Math.random());
          const selected = shuffled.slice(0, 3);
          await prisma.faculty.update({
            where: { id: facultyProfile.id },
            data: {
              subjects: {
                set: selected.map(s => ({ id: s.id }))
              }
            }
          });
        }
      }
    } else {
      console.log(`  Skipping faculty seeding for ${deptDef.code} (empty faculty list)`);
    }

    // 7. Initialize Timetables
    for (let year = 1; year <= YEARS; year++) {
      const semester = (year * 2) - 1;
      const existing = await prisma.timetable.findFirst({ where: { departmentId: dept.id, year, semester } });
      if (!existing) {
        await prisma.timetable.create({
          data: { departmentId: dept.id, year, semester, isPublished: false }
        });
      }
    }
  }

  console.log("Generating initial timetables for all departments...");
  const allDepts = await prisma.department.findMany();
  for (const d of allDepts) {
    console.log(`  Generating for ${d.code}...`);
    try {
      await generateAllYearsTimetable(d.id);
    } catch (err: any) {
      console.error(`  Failed to generate for ${d.code}: ${err.message}`);
    }
  }

  console.log("Seed and Generation complete!");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
