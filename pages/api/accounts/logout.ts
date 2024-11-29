import prisma from "@/utils/db";
import { verifyRefreshToken } from "@/utils/auth";
import { Request, Response } from "express"
import { JwtPayload } from "jsonwebtoken"

export default async function handler(req: Request, res: Response) {
    // only POST is permitted
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not permitted" });
    }

    const { refreshToken } = req.body as { refreshToken: string };

    if (!refreshToken) {
        return res.status(400).json({ error: "Refresh token is required." });
    }

    // verify the refresh token
    const decoded: JwtPayload | null = verifyRefreshToken(refreshToken);

    if (!decoded) {
        return res.status(401).json({ error: "Invalid refresh token." });
    }

    try {
        // delete the refresh token from the database
        await prisma.refreshToken.deleteMany({
            where: {
                token: refreshToken,
                userId: decoded.userId,
            },
        });

        return res.status(200).json({ message: "Logged out successfully." });
    } catch (error) {
        console.error("Error during logout:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
}
