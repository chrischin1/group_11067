import prisma from "@/utils/db";
import { comparePassword, generateToken, generateRefreshToken } from "@/utils/auth";
import { User } from "@prisma/client"
import { Request, Response } from "express"

interface Token extends JSON {
    userId: number;
    role : string;
}

// Some code sourced from Lecture 6 Codes

export default async function handler(req: Request, res: Response) {
  	if (req.method !== "POST") {
    	return res.status(405).json({ error: "Method not permitted" });
  	}
  
  	const { email, password } = req.body as { email: string, password: string}

	if (!email || !password) {
		return res.status(400).json({ error: "Please provide an email and password." });
	}

	// Find user in database with given email
	const user: User | null = await prisma.user.findUnique({
		where: { email },
	});

	// Check user exists and password is correct
	if (!user || !(await comparePassword(password, user.password))) {
		return res.status(401).json({ error: "Invalid credentials." });
	}

	const token: string = generateToken({ userId: user.id, role: user.role } as Token);
	const refreshToken: string = generateRefreshToken({ userId: user.id, role: user.role } as Token);

	// Store the refresh token in the database
	await prisma.refreshToken.create({
		data: {
		token: refreshToken,
		userId: user.id,
		},
	});

	return res.status(200).json({ id: user.id, accessToken: token, refreshToken });
}
