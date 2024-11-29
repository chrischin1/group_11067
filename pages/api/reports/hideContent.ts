// pages/api/reports/hideContent.ts
import prisma from '@/utils/db';
import { verifyToken } from '@/utils/auth';
import { NextApiRequest, NextApiResponse } from "next";
import { Post, Comment } from "@prisma/client";
import { JwtPayload } from "jsonwebtoken";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Use POST.' });
    }

    // Extract the Authorization header
    const authHeader: string | undefined = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized. No token provided.' });
    }

    const decoded: JwtPayload | null = verifyToken(authHeader);

    if (!decoded || !decoded.userId) {
        return res.status(401).json({ error: 'Unauthorized. Invalid token.' });
    }

    // Authorization: Only admins can access this endpoint
    if (decoded.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden. Admins only.' });
    }

    const { contentId, contentType, isHidden } = req.body as
        { contentId: string, contentType: string, isHidden: boolean };

    // Input Validation
    if (!contentId || !contentType || typeof isHidden !== 'boolean') {
        return res.status(400).json({ error: 'All fields (contentId, contentType, isHidden) are required.' });
    }

    const contentIdInt: number = parseInt(contentId, 10);

    if (isNaN(contentIdInt)) {
        return res.status(400).json({ error: 'contentId must be a valid integer.' });
    }

    if (!['post', 'comment'].includes(contentType)) {
        return res.status(400).json({ error: 'contentType must be either "post" or "comment".' });
    }

    try {
        if (contentType === 'post') {
            const postExists: Post | null = await prisma.post.findUnique({
                where: { id: contentIdInt },
            });

            if (!postExists) {
                return res.status(404).json({ error: 'Post not found.' });
            }

            await prisma.post.update({
                where: { id: contentIdInt },
                data: { isHidden },
            });

            res.status(200).json({ message: `Post has been ${isHidden ? 'hidden' : 'unhidden'} successfully.` });
        } else if (contentType === 'comment') {
            const commentExists: Comment | null = await prisma.comment.findUnique({
                where: { id: contentIdInt },
            });

            if (!commentExists) {
                return res.status(404).json({ error: 'Comment not found.' });
            }

            await prisma.comment.update({
                where: { id: contentIdInt },
                data: { isHidden },
            });

            res.status(200).json({ message: `Comment has been ${isHidden ? 'hidden' : 'unhidden'} successfully.` });
        }
    } catch (error) {
        console.error("Error hiding content:", error);
        res.status(500).json({ error: 'Internal server error.' });
    }
}
