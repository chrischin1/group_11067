// pages/api/templates/viewOwn.js
import { verifyToken } from "@/utils/auth"
import prisma from "@/utils/db"
import { Request, Response } from "express"
import { Template } from "@prisma/client"
import { JwtPayload } from "jsonwebtoken"

export default async function handler(req: Request, res: Response){
    // check for user or visitor
    const user: JwtPayload | null = verifyToken(req.headers.authorization)
    if (req.method === 'GET'){ 
        const { searchTerm, page, limit } = req.query as { 
            searchTerm: string;
            page?: string;
            limit?: string;
        };

        // default values for pagination
        const pageNum = parseInt(page || "1", 10); // defaults to page 1
        const pageLimit = parseInt(limit || "10", 10); // defaults to 10 items per page

        try {
            let userTemplates: Template[];
            if (user){ // allows user to list all saved templates if method is GET
                console.log("Authenticated user:", user);
                if (searchTerm){
                    userTemplates = await prisma.template.findMany({
                        where: {
                            AND: [
                                { userId: user.userId }, // fetch all templates belonging to this user via user id
                                searchTerm ? {
                                    OR: [
                                        { title: { contains: searchTerm} },
                                        { desc: { contains: searchTerm} },
                                        { body: { contains: searchTerm } },
                                        { templateTags: { some: { name: { contains: searchTerm } } } }
                                    ]
                                } : {} // if search term is empty, no more filtering, shows all user templates
                            ]
                        },
                        include: { templateTags: true },
                    });
                } else {
                    userTemplates = await prisma.template.findMany({
                        where: {
                            userId: user.userId,
                        },
                        include: { templateTags: true },
                    });
                }
                const totalTemplates = userTemplates.length;
                const startIndex = (pageNum - 1) * pageLimit;
                const endIndex = pageNum * pageLimit;
                const paginatedTemplates = userTemplates.slice(startIndex, endIndex);
                
                res.status(200).json({
                    templates: paginatedTemplates,
                    currentPage: pageNum,
                    totalPages: Math.ceil(totalTemplates / pageLimit),
                    totalTemplates,
                });
            } else { // a visitors don't have any saved templates
                res.status(200).json({ message: 'Visitors do not have any saved templates.' });
            }  
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: 'Failed to fetch templates.' });
        }
        
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
