import { verifyToken } from "@/utils/auth"
import prisma from "@/utils/db"
import { Prisma, User, Post, Tag, Template } from "@prisma/client"
import { Request, Response } from "express"
import { JwtPayload } from "jsonwebtoken"

export default async function handler(req: Request, res: Response) {

    let id: number = Number(req.query.id)

    let { title, desc, tags, templates } = req.body as 
        { title: string, desc: string, tags: string[], templates: number[]}

    const user: JwtPayload | null = verifyToken(req.headers.authorization)

    // Get post
    const post: Prisma.PostGetPayload<{include: { postTags: true, postTemplates: true }}> 
        | null = await prisma.post.findUnique({
        where: {
            id: id,
        },
        include: {
            postTags: true,
            postTemplates: true,
        },
    })

    if (!post) return res.status(400).json({ error: "Post not found." })

    // Check if the current user is the owner of the post
    const originalPoster: User | null = await prisma.user.findUnique({
        where: {
            id: post.userId,
        },
    })

    if (!user || !originalPoster || user.userId !== originalPoster.id) {
        return res.status(401).json({ error: "Only the post owner may modify posts." })
    }

    if (req.method === "PUT") {

        let updatedTags: Tag[] = post.postTags
        let tagsToDisconnect: Tag[] = []
        if (tags) {
            updatedTags = await Promise.all(
                tags.map(async (tagName) => {
                    // check if the tag already exists
                    let tag = await prisma.tag.findUnique({
                        where: { name: tagName },
                    });
                    
                    // create a new tag
                    if (!tag) {
                        tag = await prisma.tag.create({
                            data: {
                                name: tagName,
                            },
                        });
                    }
                    
                    return tag; // return the existing or newly made tag
                })
            );

            // tags to disconnect (through modification)
            tagsToDisconnect = post.postTags.filter(
                (tag: Tag) => !updatedTags!.some((updatedTag) => updatedTag.name === tag.name)
            );
        }

        let updatedTemplates: Template[] = post.postTemplates
        let templatesToDisconnect: Template[] = []
        if (templates) {
            updatedTemplates = await Promise.all(
                templates.map(async (templateId) => {
                    // check if the template already exists
                    let template = await prisma.template.findUnique({
                        where: { id: templateId },
                    });
                    
                    // return error if template not found
                    if (!template) {
                        return res.status(400).json({ error: `Could not find template ${templateId}.`})
                    }
                    
                    return template; // return the existing or newly made template
                })
            ) as Template[]

            // templates to disconnect (through modification)
            templatesToDisconnect = post.postTemplates.filter(
                (template: Template) => !updatedTemplates.some((updatedTemplate) => updatedTemplate.id === template.id)
            );
        }

		// Edit post
        const updatedPost: Post | null = await prisma.post.update({
            data: {
                title: title,
                desc: desc,
                postTags: {
                    set: updatedTags.map(tag => ({ name:tag.name })),
                    disconnect: tagsToDisconnect.map(tag => ({ name: tag.name })),
                },
                postTemplates: {
                    set: updatedTemplates.map(template => ({ id:template.id })),
                    disconnect: templatesToDisconnect.map(template => ({ id: template.id })),
                },
            },
            where: {
                id: id,
            },
            include: {
                postTags: true,
                postTemplates: true,
            },
        })
        res.status(200).json(updatedPost)

    } else if (req.method === "DELETE") {
	
		// Cascading deletion also deletes associated comments, ratings
      	await prisma.comment.deleteMany({
        	where: {
          		postId: id,
        	},
		})
		await prisma.rating.deleteMany({
			where: {
				postId: id,
			},
		})
		await prisma.post.delete({
			where: {
				id: id,
			},
		})
		res.status(200).json({ message: "Post deleted successfully"})
	} else {
		res.status(405).json({ message: "Method not allowed" });
	}
}