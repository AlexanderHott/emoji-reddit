import { z } from "zod";
import { SubredditSubscriptionValidator } from "~/lib/validators/subreddit";
import { getServerAuthSession } from "~/server/auth";
import { db } from "~/server/db";
import { subscriptions } from "~/server/db/schema";

export async function POST(req: Request) {
  try {
    const session = await getServerAuthSession();

    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { subredditId } = SubredditSubscriptionValidator.parse(
      await req.json(),
    );

    const subscription = await db
      .insert(subscriptions)
      .values({ userId: session.user.id, subredditId });
    return new Response(subscription.insertId);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(error.message, { status: 400 });
    }

    return new Response(
      "Could not subscribe to subreddit at this time. Please try later",
      { status: 500 },
    );
  }
}
