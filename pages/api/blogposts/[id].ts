// pages/api/blogposts/[id].ts
import { verifyToken } from "@/utils/auth";
import prisma from "@/utils/db";
import { NextApiRequest, NextApiResponse } from "next";
import { Post } from "@prisma/client";
import { JwtPayload } from "jsonwebtoken";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query as { id: string };
    const user = verifyToken(req.headers.authorization);

    if (req.method === 'GET') {
        try {
            const postId = parseInt(id, 10);
            if (isNaN(postId)) {
                return res.status(400).json({ error: 'Invalid post ID.' });
            }

            const post: Post | null = await prisma.post.findUnique({
                where: { id: postId },
                include: {
                    comments: {
                        include: { user: true, ratings: true }
                    },
                    // Include only the reports made by the current user
                    reports: user ? {
                        where: { reporterId: user.userId },
                        select: { reporterId: true }
                    } : false,
                    user: true,
                    ratings: true,
                    postTags: true,
                    postTemplates: true,
                },
            });

            if (!post) {
                return res.status(404).json({ error: 'Post not found.' });
            }
            res.status(200).json(post);
        } catch (error) {
            console.error("Error fetching post:", error);
            res.status(500).json({ error: 'Failed to fetch post.' });
        }
    } else {
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
