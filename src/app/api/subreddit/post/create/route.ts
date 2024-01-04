import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { PostValidator } from "~/lib/validators/post";
import { getServerAuthSession } from "~/server/auth";
import { db } from "~/server/db";
import { posts, subscriptions } from "~/server/db/schema";

export async function POST(req: Request) {
  try {
    const session = await getServerAuthSession();

    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    // eslint-disable-next-line
    const { subredditId, title, content } = PostValidator.parse(
      await req.json(),
    );

    const subscriptionExists = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.userId, session.user.id),
        eq(subscriptions.subredditId, subredditId),
      ),
    });
    if (!subscriptionExists) {
      return new Response("You must be subscribed in order to post.", {
        status: 400,
      });
    }

    await db
      .insert(posts)
      // eslint-disable-next-line
      .values({ title, subredditId, content, authorId: session.user.id });
    return new Response("Created", { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(error.message, { status: 400 });
    }

    return new Response(
      "Could not post to subreddit at this time. Please try later",
      { status: 500 },
    );
  }
}
