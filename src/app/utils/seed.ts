import { Role, UserStatus, VehicleType } from "../../generated/prisma/enums";
import config from "../config";
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";
export const seedAdmin = async () => {
  try {
    const isAdminExist = await prisma.user.findFirst({
      where: {
        role: Role.ADMIN,
      },
    });

    if (isAdminExist) {
      console.log("Admin already exist");
      return;
    }

    const name = config.admin_name;
    const email = config.admin_email;
    const password = config.admin_password;

    if (!name || !email || !password) {
      throw new Error("Admin name,email,password missing in env file");
    }
    const hashedPassword = await bcrypt.hash(
      password,
      Number(config.bcrypt_salt_rounds),
    );

    const admin = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: Role.ADMIN,
        needPasswordChange: false,
        emailVerified: true,
      },
    });
    console.log("admin is created:", admin);
  } catch (error) {
    console.log("error seeding supper admin", error);
    await prisma.user.delete({
      where: {
        email: config.admin_email,
      },
    });
  }
};

// tester courier

export const seedCourier = async () => {
  try {
    const isCourierExist = await prisma.user.findFirst({
      where: {
        role: Role.COURIER,
      },
    });

    if (isCourierExist) {
      console.log("Courier already exist");
      return;
    }

    const hashedPassword = await bcrypt.hash(
      "password123",
      Number(config.bcrypt_salt_rounds) || 10,
    );

    // Courier user along with courierProfile relation
    const courier = await prisma.user.create({
      data: {
        name: "Test Courier",
        email: "courier@test.com",
        password: hashedPassword,
        role: Role.COURIER,
        status: UserStatus.ACTIVE, // Admin approve করেছে এমন টেস্ট করার জন্য ACTIVE দেওয়া হয়েছে
        needPasswordChange: false,
        emailVerified: true,
        courierProfile: {
          create: {
            phone: "01700000000",
            vehicleType: VehicleType.BIKE,
            vehicleNumber: "DHAKA-METRO-HA-1234",
            licenseNumber: "LIC-12345678",
            nidNumber: "1998283748293",
            profileImageUrl: "https://placehold.co/600x400/png",
            isAvailable: true,
          },
        },
      },
      include: {
        courierProfile: true,
      },
    });

    console.log("Courier created successfully:", courier);
  } catch (error) {
    console.log("Error seeding courier:", error);

    // Safety cleanup in case of error
    await prisma.user.deleteMany({
      where: {
        email: "courier@test.com",
      },
    });
  }
};
