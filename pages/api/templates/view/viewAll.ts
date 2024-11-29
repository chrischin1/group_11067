// pages/api/templates/view/viewAll.js
import { verifyToken } from "@/utils/auth";
import prisma from "@/utils/db";
import { NextApiRequest, NextApiResponse } from "next";
import { Template } from "@prisma/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const { searchTerm, page, limit } = req.query as {
      searchTerm?: string;
      page?: string;
      limit?: string;
    };

    // Default values for pagination
    const pageNum = parseInt(page || "1", 10); // Defaults to page 1
    const pageLimit = parseInt(limit || "12", 10); // Defaults to 12 items per page

    try {
      let publicTemplates: Template[];

      if (searchTerm) {
        publicTemplates = await prisma.template.findMany({
          where: {
            OR: [
              // Search the title, desc, and body for matching data
              { title: { contains: searchTerm } },
              { desc: { contains: searchTerm } },
              { body: { contains: searchTerm } },
              { templateTags: { some: { name: { contains: searchTerm } } } },
            ],
          },
          include: { templateTags: true },
        });
      } else {
        // If no searchTerm, retrieve all templates
        publicTemplates = await prisma.template.findMany({
          include: { templateTags: true },
        });
      }

      const totalTemplates = publicTemplates.length;
      const startIndex = (pageNum - 1) * pageLimit;
      const endIndex = pageNum * pageLimit;
      const paginatedTemplates = publicTemplates.slice(startIndex, endIndex);

      res.status(200).json({
        templates: paginatedTemplates,
        currentPage: pageNum,
        totalPages: Math.ceil(totalTemplates / pageLimit),
        totalTemplates,
      });
    } catch (error: any) {
      console.error("Error fetching templates", error);
      res.status(500).json({ error: "Failed to fetch templates." });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
