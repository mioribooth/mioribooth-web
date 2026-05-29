import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";


async function main() {
  const hashedPassword = await bcrypt.hash(
    "blueskydark123",
    12
  );

  const owner = await prisma.user.upsert({
    where: {
      email: "mioribooth@gmail.com",
    },
    update: {
      name: "Rama",
      username: "admin",
      password: hashedPassword,
      role: "OWNER",
    },
    create: {
      name: "Rama",
      username: "admin",
      email: "mioribooth@gmail.com",
      password: hashedPassword,
      role: "OWNER",
    },
  });

  console.log("OWNER CREATED:");
  console.log(owner);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });