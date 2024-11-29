import { verifyToken } from "@/utils/auth"
import prisma from "@/utils/db"
import { Request, Response } from "express"
import { Comment } from "@prisma/client"


export default async function handler(req: Request, res: Response) {
    const { postId, id } = req.query as { postId: string, id: string };
    // const { title, desc, userId, comments, reports, isHidden, ratings, postTags, postTemplates } = req.body as 
    // { title: string, desc: string, userId: number, comments: string, reports: string, isHidden: string, ratings: string, postTags: string, postTemplates: string};
    
    const user = verifyToken(req.headers.authorization)

    if (req.method === 'GET') {
        try {
            const comment: Comment | null = await prisma.comment.findUnique({
                where: { id: parseInt(id) },
                include: {
                    user: true,
                    ratings: true,
                },
            });

            if (!comment) {
                return res.status(404).json({ error: 'Comment not found.' });
            }

            const replies: Comment[] = await prisma.comment.findMany({
                where: { parentId: parseInt(id) },
                include: {
                    user: true,
                    ratings: true,
                },
            });

            res.status(200).json({comment: comment, replies: replies});
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Failed to fetch comment.' });
        }
    } else {
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
