import { verifyToken } from "@/utils/auth"
import prisma from "@/utils/db"
import { Comment, Rating } from "@prisma/client"
import { Request, Response } from "express"
import { JwtPayload } from "jsonwebtoken"

export default async function handler(req: Request, res: Response) {

    const commentId: number = Number(req.query.commentId)
    if (isNaN(commentId)) { return res.status(404).json({ error: "Comment ID not found." })}
    const postId: number = Number(req.query.id)
    if (isNaN(postId)) { return res.status(404).json({ error: "Post ID not found." })}
    const { value } = req.body as { value: number}

    const user: JwtPayload | null = verifyToken(req.headers.authorization)

    // Get current comment
    const comment: Comment | null = await prisma.comment.findUnique({
        where: {
            id: commentId,
        },
    })

    if (!comment) {
        return res.status(400).json({ error: "Comment not found." })
    } else if (!user) {
        return res.status(401).json({ error: "Must be logged in to rate comments." })
    } else if (typeof(value) === "undefined") {
        return res.status(400).json({ error: "Must include a rating value." })
    } else if (value < 0 || value > 1) {
        return res.status(400).json({ error: "Rating should be either 0 or 1." })
    }

    // Check if user has already rated this comment
    let rating: Rating | null = await prisma.rating.findFirst({
        where: {
            commentId: comment.id,
            userId: user.userId,
        },
    })

    if (req.method === "PUT") {

        // If user has already rated this comment, update their existing rating
        if (rating) {
            
            rating = await prisma.rating.update({
                where: {
                    id: rating.id,
                },
                data: {
                    value: value,
                },
            })
            
            res.status(200).json(rating)

        } else {

            // Otherwise, make a new rating for this user
            rating = await prisma.rating.create({
                data: {
                    value: value,
                    userId: user.userId,
                    commentId: comment.id,
                    postId: postId,
                },
            })

            res.status(201).json(rating)
        }

    } else {
      res.status(405).json({ message: "Method not allowed" });
    }
}