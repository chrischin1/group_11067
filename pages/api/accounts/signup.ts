// pages/api/accounts/signup.ts
import { hashPassword } from "@/utils/auth";
import prisma from "@/utils/db";
import { NextApiRequest, NextApiResponse } from "next";
import { User } from "@prisma/client";

// Define the list of allowed avatars
const allowedAvatars = [
  "/avatars/avatar1.png",
  "/avatars/avatar2.png",
  "/avatars/avatar3.png",
  "/avatars/avatar4.png",
  "/avatars/avatar5.png",
  "/avatars/avatar6.png",
  "/avatars/avatar7.png",
  "/avatars/avatar8.png",
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not permitted" });
  }

  const { firstName, lastName, password, email, phoneNumber, avatar } = req.body as {
    firstName: string;
    lastName: string;
    password: string;
    email: string;
    phoneNumber: string;
    avatar: string;
  };

  // Set role to 'USER' by default
  const role = "USER";

  // Basic validation
  if (!firstName || !lastName || !password || !email) {
    return res.status(400).json({ error: "Please provide all required information." });
  } else if (Number.isNaN(Number(phoneNumber)) || phoneNumber.length !== 10) {
    return res.status(400).json({ error: "Please provide a valid phone number, with no punctuation." });
  } else if (!allowedAvatars.includes(avatar)) {
    return res.status(400).json({ error: "Invalid avatar selection." });
  }

  // Check if email has already been taken
  const email_uniq: User | null = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (email_uniq !== null) {
    return res.status(400).json({ error: "Email is already taken." });
  }

  // Create new user
  try {
    const user: User = await prisma.user.create({
      data: {
        firstName: firstName,
        lastName: lastName,
        password: await hashPassword(password),
        email: email,
        phoneNumber: phoneNumber,
        avatar: avatar,
        role: role, // Assign default role
      },
    });
    res.status(201).json({ user });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Internal server error." });
  }
}
