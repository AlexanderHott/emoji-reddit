import { SubredditSubscriptionValidator } from "~/lib/validators/subreddit";
import { z } from "zod";
import { getServerAuthSession } from "~/server/auth";
import { db } from "~/server/db";
import { subscriptions } from "~/server/db/schema";
import { and, eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const session = await getServerAuthSession();

    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { subredditId } = SubredditSubscriptionValidator.parse(
      await req.json(),
    );

    await db
      .delete(subscriptions)
      .where(
        and(
          eq(subscriptions.subredditId, subredditId),
          eq(subscriptions.userId, session.user.id),
        ),
      );

    return new Response(subredditId);
  } catch (error) {
    error;
    if (error instanceof z.ZodError) {
      return new Response(error.message, { status: 400 });
    }

    return new Response(
      "Could not unsubscribe from subreddit at this time. Please try later",
      { status: 500 },
    );
  }
}
