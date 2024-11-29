import { verifyToken } from "@/utils/auth"
import prisma from "@/utils/db"
import { Post, Rating } from "@prisma/client"
import { Request, Response } from "express"
import { JwtPayload } from "jsonwebtoken"

export default async function handler(req: Request, res: Response) {

    const id: number = Number(req.query.id)
    if (isNaN(id)) { return res.status(404).json({ error: "Post ID not found." })}
    const { value } = req.body as { value: number }

    const user: JwtPayload | null = verifyToken(req.headers.authorization)

    // Get post to rate
    const post: Post | null = await prisma.post.findUnique({
        where: {
            id: id,
        },
    })

    if (!post) {
        return res.status(400).json({ error: "Post not found." })
    } else if (!user) {
        return res.status(401).json({ error: "Must be logged in to rate posts." })
    } else if (typeof(value) === "undefined") {
        return res.status(400).json({ error: "Must include a rating value." })
    } else if (value < 0 || value > 1) {
        return res.status(400).json({ error: "Rating should be either 0 or 1." })
    }

    // Find if the user has already left a rating
    let rating: Rating | null = await prisma.rating.findFirst({
        where: {
            postId: post.id,
            userId: user.userId,
        },
    })

    if (req.method === "PUT") {

        // If the user has already left a rating, change it to the new rating
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

        // Otherwise, make a new rating for this user
        } else {
            rating = await prisma.rating.create({
                data: {
                    value: value,
                    userId: user.userId,
                    postId: post.id,
                },
            })

            res.status(201).json(rating)
        }

    } else {
      res.status(405).json({ message: "Method not allowed" });
    }
  }