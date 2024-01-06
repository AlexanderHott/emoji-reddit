import { type SQL, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { getServerAuthSession } from "~/server/auth";
import { db } from "~/server/db";
import {
  comments,
  postVotes,
  posts,
  subreddits,
  subscriptions,
  users,
} from "~/server/db/schema";

export async function GET(req: Request) {
  const url = new URL(req.url);

  const session = await getServerAuthSession();

  let followedCommunityIds: string[] = [];

  if (session) {
    followedCommunityIds = (
      await db.query.subscriptions.findMany({
        where: eq(subscriptions.userId, session.user.id),
      })
    ).map((sub) => sub.subredditId);
  }

  try {
    const {
      limit,
      page,
      // subredditName,
      subredditId,
    } = z
      .object({
        // TODO: z.preprocess( Number )
        limit: z.string(),
        page: z.string(),
        // subredditName: z.string().nullish(),
        subredditId: z.string().nullish(),
      })
      .parse({
        limit: url.searchParams.get("limit"),
        page: url.searchParams.get("page"),
        subredditId: url.searchParams.get("subredditId"),
      });

    let where: SQL;
    // if (subredditName) {
    if (subredditId) {
      where = eq(posts.subredditId, subredditId);
    } else if (session) {
      where = inArray(posts.subredditId, followedCommunityIds);
    } else {
      return new Response("Invalid query params", { status: 400 });
    }
    const feedPosts = await db.query.posts.findMany({
      where,
      with: { subreddit: true, votes: true, author: true, comments: true },
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      orderBy: desc(posts.createdAt),
    });
    return new Response(JSON.stringify(feedPosts));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(error.message, { status: 400 });
    }

    return new Response("Could not fetch more posts, please try again later", {
      status: 500,
    });
  }
}
