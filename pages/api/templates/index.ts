// pages/api/templates/index.js
import { verifyToken } from "@/utils/auth"
import prisma from "@/utils/db"
import { Tag, Template } from "@prisma/client"
import { Request, Response } from "express"
import { JwtPayload } from "jsonwebtoken"

// Allows users to save a new template if method is POST
export default async function handler(req: Request, res: Response){
    // check for user or visitor
    
    if (req.method === 'POST'){
        const { title, desc, body, templateTags } = req.body as 
            { title: string, desc: string, body: string, templateTags: string[] };
        const user: JwtPayload | null = verifyToken(req.headers.authorization) 
        if (!user) {
            return res.status(401).json({ error: "Visitors may not save code as a template." })
        }
        
        try {
            const tags: Tag[] = await Promise.all(
                templateTags.map(async (tagName) => {
                    // check if the tag already exists
                    let tag: Tag | null = await prisma.tag.findUnique({
                        where: { name: tagName },
                    });
                    
                    // create a new tag if it doesn't exist
                    if (!tag) {
                        tag = await prisma.tag.create({
                            data: {
                                name: tagName,
                            },
                        });
                    }

                    return tag; // return the existing or newly created tag
                })
            );
            const codeTemplate: Template = await prisma.template.create({
                data: {
                    parentId: -1,
                    title: title,
                    desc: desc,
                    body: body,
                    userId: user.userId,
                    templateTags:{
                        connect: tags.map(tag => ({ name: tag.name })),
                    },
                },
            });
            res.status(201).json(codeTemplate);
        } catch (error: any) {
            console.error(error);
            res.status(400).json({ error: "Failed to create template" });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
