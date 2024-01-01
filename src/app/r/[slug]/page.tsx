import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import MiniCreatePost from "~/components/MiniCreatePost";
import { getServerAuthSession } from "~/server/auth";
import { db } from "~/server/db";
import { subreddits } from "~/server/db/schema";

export default async function SubredditPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  const session = await getServerAuthSession();
  const subreddit = await db.query.subreddits.findFirst({
    where: eq(subreddits.name, slug),
    with: {
      posts: {
        with: {
          author: true,
          comments: true,
          // votes: true,
          subreddit: true,
        },

        limit: 2,
      },
    },
  });

  if (!subreddit) return notFound();

  return (
    <>
      <h1 className="h-14 text-3xl font-bold md:text-4xl">
        r/{subreddit.name}
      </h1>
      <MiniCreatePost session={session} />
    </>
  );
}
