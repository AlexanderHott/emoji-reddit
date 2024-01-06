import { and, eq } from "drizzle-orm";
import { type CachedPost } from "~/types";
import { z } from "zod";
import { redis } from "~/lib/redis";
import { PostVoteValidator } from "~/lib/validators/vote";
import { getServerAuthSession } from "~/server/auth";
import { db } from "~/server/db";
import { postVotes, posts } from "~/server/db/schema";

const CACHE_AFTER_UPVOTES = 1;

export async function PATCH(req: Request) {
  try {
    const { postId, voteType } = PostVoteValidator.parse(await req.json());
    const session = await getServerAuthSession();

    if (!session) {
      return new Response("Unauthorized", { status: 401 });
    }

    // TODO: promise.all
    const post = await db.query.posts.findFirst({
      where: eq(posts.id, postId),
      with: {
        author: true,
        votes: true,
      },
    });
    if (!post) return new Response("Post not found", { status: 404 });

    let response: Response;
    const existingVote = await db.query.postVotes.findFirst({
      where: and(
        eq(postVotes.userId, session.user.id),
        eq(postVotes.postId, postId),
      ),
    });
    if (existingVote && existingVote.type === voteType) {
      // user unvoted the post
      await db
        .delete(postVotes)
        .where(
          and(
            eq(postVotes.postId, postId),
            eq(postVotes.userId, session.user.id),
          ),
        );
      response = new Response("Vote removed", { status: 200 });
    } else if (existingVote && existingVote.type !== voteType) {
      // user changed the vote type
      await db
        .update(postVotes)
        .set({ type: voteType })
        .where(
          and(
            eq(postVotes.postId, postId),
            eq(postVotes.userId, session.user.id),
          ),
        );
      response = new Response("Vote updated", { status: 200 });
    } /* (!existingVote)*/ else {
      // user voted for the first time on this post
      await db
        .insert(postVotes)
        .values({ postId, userId: session.user.id, type: voteType });
      response = new Response("Vote created", { status: 201 });
    }

    const votesAmt = post.votes.reduce((acc, vote) => {
      if (vote.type === "UP") return acc + 1;
      if (vote.type === "DOWN") return acc - 1;
      return acc;
    }, 0);
    if (votesAmt > CACHE_AFTER_UPVOTES) {
      const cachePayload: CachedPost = {
        authorUsername: post.author.name ?? "",
        content: JSON.stringify(post.content),
        id: post.id,
        title: post.title,
        createdAt: post.createdAt,
        currentVote: voteType,
      };
      await redis.hset(`post:${postId}`, cachePayload);
    }
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(error.message, { status: 400 });
    }

    console.log("error voting for post", error);
    return new Response("Could not vote at this time. Please try later", {
      status: 500,
    });
  }
}
