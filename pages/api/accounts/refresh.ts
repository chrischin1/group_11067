import { verifyRefreshToken, generateToken } from "@/utils/auth";
import { Request, Response } from "express"
import { JwtPayload } from "jsonwebtoken"

interface Token extends JSON {
    userId: number;
    role : string;
}

// Code sourced from Lecture 6 Codes

export default function handler(req: Request, res: Response) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not permitted" })
    }

    const user: JwtPayload | null = verifyRefreshToken(req.body.refreshToken)

    if (!user) {
        return res.status(401).json({ error: "Unauthorized" })
    }

    const token: string = generateToken({ userId: user.Id, role: user.role } as Token)
    res.status(200).json({ accessToken: token })
}