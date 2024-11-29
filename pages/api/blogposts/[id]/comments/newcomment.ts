import { verifyToken } from "@/utils/auth"
import prisma from "@/utils/db"
import { Comment, Rating } from "@prisma/client"
import { Request, Response } from "express"
import { JwtPayload } from "jsonwebtoken"

// Portions of code sourced from https://dev.to/jaimaldullat/how-merge-sort-works-in-javascript-5c1e

export default async function handler(req: Request, res: Response) {
    
    if (req.method === "POST") {

        let { parentId, body } = req.body as { parentId: number, body: string}

        const postId: number = Number(req.query.id)
        if (isNaN(postId)) { return res.status(404).json({ error: "Invalid post ID." })}

        const user: JwtPayload | null = verifyToken(req.headers.authorization)

        if (!user) {
        return res.status(401).json({ error: "Visitors may not make comments." })
        }

        // parentId = -1 signifies a comment directly applied to a post
        // rather than a reply to another comment
        if (!parentId) { parentId = -1 }

        // Get the parent comment, if it exists
        const parent: Comment | null = await prisma.comment.findUnique({
            where: {
                id: parentId,
            },
        })

        // Check that either there is no parent or the parent is valid
        if (parentId > -1 && parent === null) {
            return res.status(400).json({ error: "Invalid parent comment ID." })
        }

        try {  
            // Create a new comment
            const comment: Comment = await prisma.comment.create({
                data: {
                    parentId: parentId,
                    postId: postId,
                    body: body,
                    userId: user.userId,
                },
            })
            res.status(201).json(comment)
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Failed to create comment." });
        }

    } else if (req.method === "GET") { 

        // Get all search parameters
        let postIdStr: string = req.query.postId as string
        let postId: number | undefined = undefined
        if (typeof(postIdStr) !== "undefined") {
            postId = Number(postIdStr)
        }
        let parentIdStr = req.query.parentId as string
        let parentId: number | undefined = undefined
        if (typeof(parentIdStr) !== "undefined") {
            parentId = Number(parentIdStr)
        }
        let userIdStr = req.query.userId as string
        let userId: number | undefined = undefined
        if (typeof(userIdStr) !== "undefined") {
            userId = Number(userIdStr)
        } 
        const body: string = req.query.body as string
        const sortByControversial: boolean = (req.query.sortByControversial === "true")

        if ((typeof(postId) !== "undefined" && isNaN(postId)) 
            || (typeof(parentId) !== "undefined" && isNaN(parentId))
            || (typeof(userId) !== "undefined" && isNaN(userId))) {
            res.status(400).json({message: "Improper type used for parameter(s)."})
        } else {

            // Get all comments all of whose fields contain the corresponding search parameters
            let comments: Comment[] = await prisma.comment.findMany({
                where: {
                postId: postId,
                parentId: parentId,
                userId: userId,
                body: {
                    contains: body,
                },
                isHidden: false,
                },
                include: {
                    ratings: true,
                    user: true
                }
            })

            let comments_ret: Comment[] = []
            let comment_ret: Comment | undefined = undefined
            comments.forEach(function(comment) {
                comment_ret = comment
                comments_ret.push(comment_ret)
            })

            // Sort by ratings
            if (comments_ret.length > 0) { comments_ret = await mergeSort(comments_ret) }

            if (sortByControversial) { comments_ret.reverse() }

            // Paginate
            let page: number = Number(req.query.page)
            let limit: number = Number(req.query.limit)
            if (!isNaN(page) && !isNaN(limit)) {
                comments_ret = comments_ret.slice((page - 1) * limit, (page) * limit)
            }

            res.status(200).json(comments_ret)
        }
    } else {
        res.status(405).json({ message: "Method not allowed" });
    }
}

async function mergeSort(array: Comment[]): Promise<Comment[]> {
    // Base case: If the array has only one element, return it (already sorted)
    if (array.length <= 1) {
        return array;
    }
  
    // Divide the array into two halves
    const middle: number = Math.floor(array.length / 2); // Find the middle index
    const left: Comment[] = array.slice(0, middle); // Split the array into left half
    const right: Comment[] = array.slice(middle); // Split the array into right half
  
    // Recursively call mergeSort on the left and right halves
    return merge(
        await mergeSort(left), // Recursively sort the left half
        await mergeSort(right) // Recursively sort the right half
    )
}
  
async function merge(left: Comment[], right: Comment[]) {
    let resultArray: Comment[] = [],
        leftIndex = 0,
        rightIndex = 0;
  
    // Loop through both arrays, comparing elements and adding the smaller one to the resultArray
    while (leftIndex < left.length && rightIndex < right.length) {
        if (await sort_by_ratings(left[leftIndex], right[rightIndex]) < 0) {
            resultArray.push(left[leftIndex]);
            leftIndex++; // Move to the next element in the `left` array
        } else {
            resultArray.push(right[rightIndex]);
            rightIndex++; // Move to the next element in the `right` array
        }
    }
  
    // Concatenate the remaining elements from either `left` or `right` (if any)
    return resultArray
        .concat(left.slice(leftIndex))
        .concat(right.slice(rightIndex));
}

async function sort_by_ratings(comment1: Comment, comment2: Comment) {

    // Get all ratings for first comment
    let rating_total: number = 0
    const ratings_comment1: Rating[] = await prisma.rating.findMany({
        where: {
            commentId: comment1.id,
        },
    })

    // Find average rating value for first comment
    ratings_comment1.forEach(curr_rating => {
        rating_total += curr_rating.value
    });
    let rating_avg_comment1: number = rating_total / ratings_comment1.length

    // If there are no ratings, average rating is 0
    if (isNaN(rating_avg_comment1)) { rating_avg_comment1 = 0}

    // Repeat for second comment
    rating_total = 0
    const ratings_comment2: Rating[] = await prisma.rating.findMany({
        where: {
            commentId: comment2.id,
        },
    })

    ratings_comment2.forEach(curr_rating => {
        rating_total += curr_rating.value
    });
    let rating_avg_comment2: number = rating_total / ratings_comment2.length

    if (isNaN(rating_avg_comment2)) { rating_avg_comment2 = 0}

    return rating_avg_comment2 - rating_avg_comment1

}