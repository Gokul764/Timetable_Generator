const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Connecting to the database...");
  await prisma.$connect();
  console.log("Connected successfully!");
  
  const userCount = await prisma.user.count().catch(() => 0);
  console.log("User count:", userCount);
}

main()
  .catch((e) => {
    console.error("Error connecting to the database:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
