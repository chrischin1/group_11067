// pages/api/blogposts/blogpost.ts

import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/utils/db";
import { Prisma, Post, Tag, Template, Rating, User } from "@prisma/client";
import { JwtPayload } from "jsonwebtoken";
import { verifyToken } from "@/utils/auth";

// Define the type for posts with included relations
type PostWithRelations = Prisma.PostGetPayload<{
  include: {
    user: true;
    postTags: true;
    postTemplates: true;
    ratings: true;
  };
}>;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    // [Your existing POST method code remains unchanged]
  } else if (req.method === "GET") {
    // Get and process all search parameters
    const userName: string | undefined = req.query.userName as string;

    let userIds: number[] | undefined;

    if (userName) {
      const users: User[] = await prisma.user.findMany({
        where: {
          OR: [
            { firstName: { contains: userName } },
            { lastName: { contains: userName } },
          ],
        },
      });
      userIds = users.map((u) => u.id);
    }

    const title: string | undefined = req.query.title as string;
    const desc: string | undefined = req.query.desc as string;

    const tagsRaw: string | undefined = req.query.tags as string;
    const tags: string[] = tagsRaw ? tagsRaw.split(", ") : [];

    const templateSearch: string | undefined = req.query.templates as string;

    // Determines if posts with highest or lowest ratings show first
    const sortByControversial: boolean = req.query.sortByControversial === "true";
    const sortOption: string | undefined = req.query.sortOption as string;

    let posts: PostWithRelations[] = [];

    // Common filter options
    let postFilters: Prisma.PostWhereInput = {
      userId: userIds ? { in: userIds } : undefined,
      title: title ? { contains: title } : undefined,
      desc: desc ? { contains: desc } : undefined,
      isHidden: false,
      ...(tags.length > 0 && { postTags: { some: { name: { in: tags } } } }),
      ...(templateSearch && {
        postTemplates: {
          some: {
            title: {
              contains: templateSearch,
              mode: "insensitive", // Optional: makes the search case-insensitive
            },
          },
        },
      }),
    };

    // Get posts from the database
    posts = await prisma.post.findMany({
      where: postFilters,
      include: {
        user: true,
        postTags: true,
        postTemplates: true,
        ratings: true,
      },
      orderBy: getOrderByClause(sortOption),
    });

    let posts_ret: PostWithRelations[] = posts;

    // Sort posts based on sortOption
    if (sortOption === "highestRating") {
      posts_ret = await sortPostsByRating(posts_ret, "desc");
    } else if (sortOption === "lowestRating") {
      posts_ret = await sortPostsByRating(posts_ret, "asc");
    }

    // Paginate
    let page: number = Number(req.query.page);
    let limit: number = Number(req.query.limit);
    const total_pages: number = Math.ceil(posts_ret.length / limit);
    if (!isNaN(page) && !isNaN(limit)) {
      posts_ret = posts_ret.slice((page - 1) * limit, page * limit);
    }

    res.status(200).json({ posts_ret: posts_ret, total_pages: total_pages });
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}

function getOrderByClause(
  sortOption: string | undefined
): Prisma.PostOrderByWithRelationInput | undefined {
  if (sortOption === "mostReported") {
    return {
      reportCount: "desc",
    };
  }

  if (sortOption === "leastReported") {
    return {
      reportCount: "asc",
    };
  }

  if (sortOption === "az") {
    return { title: "asc" };
  }

  // For highest and lowest rating, we'll sort in memory
  return undefined; // No ordering applied at this stage
}

async function sortPostsByRating(
  posts: PostWithRelations[],
  order: "asc" | "desc"
): Promise<PostWithRelations[]> {
  // Calculate average rating for each post
  const postsWithAvgRating = posts.map((post) => {
    const ratings = post.ratings;
    const avgRating =
      ratings.length > 0
        ? ratings.reduce(
            (sum: number, rating: Rating) => sum + rating.value,
            0
          ) / ratings.length
        : null; // Set avgRating to null if there are no ratings

    return { ...post, avgRating };
  });

  // Sort the posts based on average rating, placing posts with no ratings at the end
  postsWithAvgRating.sort((a, b) => {
    if (a.avgRating === null && b.avgRating === null) {
      return 0;
    }
    if (a.avgRating === null) {
      return 1; // a comes after b (place at the end)
    }
    if (b.avgRating === null) {
      return -1; // a comes before b
    }
    if (order === "asc") {
      return a.avgRating - b.avgRating;
    } else {
      return b.avgRating - a.avgRating;
    }
  });

  // Remove avgRating from the posts before returning
  const sortedPosts = postsWithAvgRating.map(({ avgRating, ...post }) => post);

  return sortedPosts;
}
