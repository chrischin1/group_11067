// pages/api/reports/submit.ts
import prisma from '@/utils/db';
import { verifyToken } from '@/utils/auth';
import { NextApiRequest, NextApiResponse } from "next";
import { Report, Post } from "@prisma/client";
import { JwtPayload } from "jsonwebtoken";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Use POST.' });
    }

    // Use the entire Authorization header for verification
    const authorizationHeader: string | undefined = req.headers.authorization;

    const user: JwtPayload | null = verifyToken(authorizationHeader);

    if (!user) {
        return res.status(401).json({ error: "Unauthorized. Please log in to report content." });
    }

    const { contentId, contentType, reason } = req.body as
        { contentId: string, contentType: string, reason: string };

    // Input Validation
    if (!contentId || !contentType || !reason) {
        return res.status(400).json({ error: 'All fields (contentId, contentType, reason) are required.' });
    }

    const contentIdInt: number = parseInt(contentId, 10);

    if (isNaN(contentIdInt)) {
        return res.status(400).json({ error: 'contentId must be a valid integer.' });
    }

    if (contentType !== 'post') { // Since we're focusing on posts for now
        return res.status(400).json({ error: 'contentType must be "post".' });
    }

    try {
        const existingReport: Report | null = await prisma.report.findFirst({
            where: {
                reporterId: user.userId,
                postId: contentIdInt,
            },
        });

        if (existingReport) {
            return res.status(400).json({ error: 'You have already reported this post.' });
        }

        const postExists: Post | null = await prisma.post.findUnique({
            where: { id: contentIdInt },
        });

        if (!postExists) {
            return res.status(404).json({ error: 'Post not found.' });
        }

        // Create the report
        const report = await prisma.report.create({
            data: {
                reason,
                reporterId: user.userId,
                postId: contentIdInt,
            },
        });

        // Increment the report count on the post
        await prisma.post.update({
            where: { id: contentIdInt },
            data: { reportCount: { increment: 1 } },
        });

        res.status(200).json({ message: 'Report submitted successfully.', report });
    } catch (error: any) {
        console.error("Error submitting report:", error);

        if (error.code === 'P2025') { // Prisma error code for "Record not found"
            return res.status(404).json({ error: 'Post not found.' });
        }

        res.status(500).json({ error: 'Internal server error.' });
    }
}
