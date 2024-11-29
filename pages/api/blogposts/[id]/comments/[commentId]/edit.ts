import { verifyToken } from "@/utils/auth"
import prisma from "@/utils/db"
import { User, Comment } from "@prisma/client"
import { Request, Response } from "express"
import { JwtPayload } from "jsonwebtoken"

export default async function handler(req: Request, res: Response) {

    const commentId: number = Number(req.query.commentId)
    if (isNaN(commentId)) { return res.status(404).json({ error: "Comment ID not found." })}

    const { body } = req.body as { body: string }

    const user: JwtPayload | null = verifyToken(req.headers.authorization!)

    // Get current comment
    const comment: Comment | null = await prisma.comment.findUnique({
        where: {
            id: commentId,
        },
    })

    if (!comment) return res.status(400).json({ error: "Comment not found." })

    // Check original commenter is the current user
    const originalCommenter: User | null = await prisma.user.findUnique({
        where: {
            id: comment.userId,
        },
      })

    if (!user || !originalCommenter || user.userId !== originalCommenter.id) {
        return res.status(401).json({ error: "Only the comment owner may modify comments." })
    }

    if (req.method === "PUT") {

        // Edit comment
        const comment: Comment | null = await prisma.comment.update({
            data: {
                body: body,
            },
            where: {
                id: commentId
            },
        })
        res.status(200).json(comment)

    } else if (req.method === "DELETE") {
        // Cascading deletion deletes child comments and ratings as well as comment
        await prisma.comment.deleteMany({
            where: {
                parentId: commentId,
            },
        })
        await prisma.rating.deleteMany({
            where: {
                commentId: commentId,
            },
        })
        await prisma.comment.delete({
            where: {
                id: commentId,
            },
        })
        res.status(200).json({ message: "Comment deleted successfully"})
    } else {
        res.status(405).json({ message: "Method not allowed" });
    }
}