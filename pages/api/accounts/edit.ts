// pages/api/accounts/edit.ts

import { hashPassword, verifyToken } from "@/utils/auth";
import prisma from "@/utils/db";
import { NextApiRequest, NextApiResponse } from "next";

// Define allowed roles as a TypeScript type
type Role = "USER" | "ADMIN";

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

// Interface for the complete User data (including password)
interface User {
  id: number;
  firstName: string;
  lastName: string;
  password: string;
  email: string;
  phoneNumber: string;
  avatar: string;
  role: Role;
}

// Interface for the User profile data (excluding password)
interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  avatar: string;
  role: Role;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization;
  const user = verifyToken(authHeader); // Pass the entire header

  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userId = user.userId;
  const userRole = user.role as Role;

  if (req.method === "GET") {
    // Fetch current user data
    try {
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phoneNumber: true,
          avatar: true,
          role: true,
        },
      });

      if (!existingUser) {
        return res.status(404).json({ error: "User not found." });
      }

      // Ensure role is a valid `Role` type
      const userProfile: UserProfile = {
        ...existingUser,
        role: existingUser.role as Role,
      };

      return res.status(200).json({ user: userProfile });
    } catch (error) {
      console.error("Error fetching user:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  } else if (req.method === "PUT") {
    // Handle account update
    const { firstName, lastName, email, password, phoneNumber, avatar, role } = req.body as {
      firstName: string;
      lastName: string;
      email: string;
      password?: string;
      phoneNumber: string;
      avatar: string;
      role?: Role;
    };

    // Validate input
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ error: "Please provide all required information." });
    } else if (isNaN(Number(phoneNumber)) || phoneNumber.length !== 10) {
      return res
        .status(400)
        .json({ error: "Please provide a valid phone number, with no punctuation." });
    } else if (!allowedAvatars.includes(avatar)) {
      return res.status(400).json({ error: "Invalid avatar selection." });
    }

    try {
      // Check if email is taken by another user
      const takenUser = await prisma.user.findUnique({ where: { email } });

      if (takenUser && takenUser.id !== userId) {
        return res.status(400).json({ error: "Email has been taken." });
      }

      // Prepare data for update
      const updateData: Partial<User> = {
        firstName,
        lastName,
        email,
        phoneNumber,
        avatar,
      };

      if (password && password.trim() !== "") {
        updateData.password = await hashPassword(password);
      }

      // Prevent role changes by regular users; only admins can change roles
      if (userRole === "ADMIN" && role) {
        if (role !== "ADMIN" && role !== "USER") {
          return res.status(400).json({ error: "Role must be either USER or ADMIN." });
        }
        updateData.role = role;
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });

      // Exclude password before sending response
      const { password: _, ...userWithoutPassword } = updatedUser;

      const userProfile: UserProfile = {
        ...userWithoutPassword,
        role: userWithoutPassword.role as Role,
      };

      return res.status(200).json({ user: userProfile });
    } catch (error) {
      console.error("Error updating user:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  } else if (req.method === "DELETE") {
    // Handle account deletion
    try {
      await prisma.template.deleteMany({ where: { userId } });
      await prisma.comment.deleteMany({ where: { userId } });
      await prisma.post.deleteMany({ where: { userId } });
      await prisma.rating.deleteMany({ where: { userId } });
      await prisma.report.deleteMany({ where: { reporterId: userId } });
      await prisma.refreshToken.deleteMany({ where: { userId } });
      await prisma.user.delete({ where: { id: userId } });

      return res.status(200).json({ message: "Account deleted successfully." });
    } catch (error) {
      console.error("Error deleting account:", error);
      return res.status(500).json({ error: "Internal server error." });
    }
  } else {
    return res.status(405).json({ error: "Method not permitted" });
  }
}
