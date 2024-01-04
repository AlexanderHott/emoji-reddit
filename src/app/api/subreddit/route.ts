import { SubredditValidator } from "~/lib/validators/subreddit";
import { z } from "zod";
import { getServerAuthSession } from "~/server/auth";
import { db } from "~/server/db";
import { subreddits, subscriptions } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function POST(req: Request) {
  try {
    const session = await getServerAuthSession();

    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { name } = SubredditValidator.parse(await req.json());

    // check if subreddit already exists
    const subredditExists = await db.query.subreddits.findFirst({
      where: eq(subreddits.name, name),
    });
    // const subredditExists = await db.subreddit.findFirst({
    //   where: {
    //     name,
    //   },
    // });

    if (subredditExists) {
      return new Response("Subreddit already exists", { status: 409 });
    }

    // create subreddit and associate it with the user
    const subredditId = nanoid();
    const subreddit = await db.insert(subreddits).values({
      id: subredditId,
      name,
      ownerId: session.user.id,
    });

    // creator also has to be subscribed
    console.log("Created subreddit with id", subreddit.insertId);
    await db.insert(subscriptions).values({
      userId: session.user.id,
      subredditId,
    });

    return new Response(name);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log(error);
      return new Response(error.message, { status: 422 });
    }

    console.log(error);
    return new Response("Could not create subreddit", { status: 500 });
  }
}
