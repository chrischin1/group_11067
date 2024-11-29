// pages/api/templates/[id].ts

import { verifyToken } from "@/utils/auth";
import prisma from "@/utils/db";
import { Request, Response } from "express";
import { Prisma, Template, Tag } from "@prisma/client";

export default async function handler(req: Request, res: Response) {
  const { id } = req.query as { id: string };
  const { title, desc, body, templateTags } = req.body as {
    title: string;
    desc: string;
    body: string;
    templateTags: string[];
  };
  const user = verifyToken(req.headers.authorization);

  if (req.method === "GET") {
    try {
      const template: Prisma.TemplateGetPayload<{
        include: { templateTags: true };
      }> | null = await prisma.template.findUnique({
        where: { id: parseInt(id) },
        include: {
          templateTags: true, // Include related tags if needed
        },
      });

      if (!template) {
        return res.status(404).json({ error: "Template not found." });
      }
      res.status(200).json(template);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch template." });
    }
  } else if (req.method === "PUT") {
    try {
      // Fetch the current template to check the author
      const existingTemplate: Prisma.TemplateGetPayload<{
        include: { templateTags: true };
      }> | null = await prisma.template.findUnique({
        where: { id: parseInt(id) },
        include: {
          templateTags: true, // Ensure to include templateTags
        },
      });

      // Check if the user is the author
      if (user && existingTemplate && existingTemplate.userId === user.userId) {
        // Create/fetch tags
        const updatedTags: Tag[] = await Promise.all(
          templateTags.map(async (tagName) => {
            // Check if the tag already exists
            let tag: Tag | null = await prisma.tag.findUnique({
              where: { name: tagName },
            });

            // Create a new tag
            if (!tag) {
              tag = await prisma.tag.create({
                data: {
                  name: tagName,
                },
              });
            }

            return tag; // Return the existing or newly made tag
          })
        );

        const updatedTemplate: Template = await prisma.template.update({
          where: { id: parseInt(id) },
          data: {
            title,
            desc,
            body,
            templateTags: {
              set: updatedTags.map((tag) => ({ name: tag.name })),
            },
          },
          include: { templateTags: true },
        });
        res.status(200).json(updatedTemplate);
      } else {
        // Not authorized to edit
        return res.status(403).json({ error: "You are not authorized to edit this template." });
      }
    } catch (error: any) {
      console.error(error);
      res.status(400).json({ error: "Failed to update template." });
    }
  } else if (req.method === "DELETE") {
    try {
      // Check the author
      const existingTemplate: Template | null = await prisma.template.findUnique({
        where: { id: parseInt(id) },
      });

      // Check if user is the author or has admin role
      if (
        user &&
        existingTemplate &&
        (existingTemplate.userId === user.userId || user.role === "ADMIN")
      ) {
        await prisma.template.delete({
          where: { id: parseInt(id) },
        });
        res.status(204).end();
      } else {
        // Not authorized to delete
        return res
          .status(403)
          .json({ error: "You are not authorized to delete this template." });
      }
    } catch (error: any) {
      console.error(error);
      res.status(400).json({ error: "Failed to delete template." });
    }
  } else if (req.method === "POST") {
    // Code for forking template
    try {
      const templateToFork: Prisma.TemplateGetPayload<{
        include: { templateTags: true };
      }> | null = await prisma.template.findUnique({
        where: { id: parseInt(id) },
        include: { templateTags: true },
      });

      if (!templateToFork) {
        return res.status(404).json({ error: "Template not found for forking." });
      }

      if (user) {
        const tags: Tag[] = await Promise.all(
          (templateToFork.templateTags || []).map(async (tag) => {
            // Check if the tag already exists
            let existingTag: Tag | null = await prisma.tag.findUnique({
              where: { name: tag.name },
            });

            // Create a new tag if it doesn't exist
            if (!existingTag) {
              existingTag = await prisma.tag.create({
                data: {
                  name: tag.name,
                },
              });
            }

            return existingTag; // Return the existing or newly created tag
          })
        );

        const forkedTemplate: Template = await prisma.template.create({
          data: {
            title: `${templateToFork.title} (Forked)`, // Append (Forked) to the title
            desc: `${templateToFork.desc}\n\n(Forked from template ${templateToFork.id}.)`, // Append forked description
            body: templateToFork.body,
            userId: user.userId,
            parentId: templateToFork.id,
            templateTags: {
              connect: tags.map((tag) => ({ name: tag.name })),
            },
          },
        });

        res.status(201).json({
          message: "You have successfully forked the template.",
          forkedTemplate,
        });
      } else {
        return res.status(403).json({
          message:
            "As a visitor, you cannot save a new template. Log in to save modifications as a fork.",
        });
      }
    } catch (error: any) {
      console.error(error);
      res.status(400).json({ error: "Failed to fork template." });
    }
  } else {
    res.setHeader("Allow", ["GET", "PUT", "DELETE", "POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
