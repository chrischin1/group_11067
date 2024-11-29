// pages/api/reports/getReportedContent.ts
import prisma from '@/utils/db';
import { verifyToken } from '@/utils/auth';
import { NextApiRequest, NextApiResponse } from "next";
import { Post, Comment } from "@prisma/client";
import { JwtPayload } from "jsonwebtoken";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed. Use GET.' });
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

    try {
        const reportedPosts: Post[] = await prisma.post.findMany({
            where: { reportCount: { gt: 0 }, isHidden: false }, // Only include posts that are reported and not hidden
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true,
                        avatar: true,
                    },
                },
                reports: {
                    include: {
                        reporter: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                role: true,
                                avatar: true,
                            },
                        },
                    },
                },
            },
            orderBy: { reportCount: 'desc' },
        });

        const reportedComments: Comment[] = await prisma.comment.findMany({
            where: { reportCount: { gt: 0 }, isHidden: false }, // Only include comments that are reported and not hidden
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true,
                        avatar: true,
                    },
                },
                reports: {
                    include: {
                        reporter: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                role: true,
                                avatar: true,
                            },
                        },
                    },
                },
            },
            orderBy: { reportCount: 'desc' },
        });

        res.status(200).json({ reportedPosts, reportedComments });
    } catch (error) {
        console.error("Error fetching reported content:", error);
        res.status(500).json({ error: 'Internal server error.' });
    }
}
