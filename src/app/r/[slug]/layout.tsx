import SubscribeLeaveToggle from "~/components/SubscribeLeaveToggle";
import ToFeedButton from "~/components/ToFeedButton";
import { buttonVariants } from "~/components/ui/button";
import { format } from "date-fns";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerAuthSession } from "~/server/auth";
import { db } from "~/server/db";
import { and, count, eq } from "drizzle-orm";
import { subreddits, subscriptions } from "~/server/db/schema";

export const metadata: Metadata = {
  title: "Emoji Reddit",
  description: "A Reddit clone built with Next.js and TypeScript.",
};

const Layout = async ({
  children,
  params: { slug },
}: {
  children: React.ReactNode;
  params: { slug: string };
}) => {
  const session = await getServerAuthSession();

  const subreddit = await db.query.subreddits.findFirst({
    where: eq(subreddits.name, slug),
    with: { posts: { with: { author: true, votes: true } } },
  });

  if (!subreddit) return notFound();

  const subscription = !session?.user
    ? undefined
    : await db.query.subscriptions.findFirst({
        where: and(
          eq(subscriptions.userId, session.user.id),
          eq(subscriptions.subredditId, subreddit.id),
        ),
      });

  const isSubscribed = !!subscription;

  const memberCountRow = (
    await db
      .select({ memberCount: count() })
      .from(subscriptions)
      .where(eq(subscriptions.subredditId, subreddit.id))
  )[0];
  if (!memberCountRow) return notFound();
  const { memberCount } = memberCountRow;

  return (
    <div className="mx-auto h-full max-w-7xl pt-12 sm:container">
      <div>
        <ToFeedButton />

        <div className="grid grid-cols-1 gap-y-4 py-6 md:grid-cols-3 md:gap-x-4">
          <ul className="col-span-2 flex flex-col space-y-6">{children}</ul>

          {/* info sidebar */}
          <div className="order-first h-fit overflow-hidden rounded-lg border border-gray-200 md:order-last">
            <div className="px-6 py-4">
              <p className="py-3 font-semibold">About r/{subreddit.name}</p>
            </div>
            <dl className="divide-y divide-gray-100 bg-white px-6 py-4 text-sm leading-6">
              <div className="flex justify-between gap-x-4 py-3">
                <dt className="text-gray-500">Created</dt>
                <dd className="text-gray-700">
                  <time dateTime={subreddit.createdAt.toDateString()}>
                    {format(subreddit.createdAt, "MMMM d, yyyy")}
                  </time>
                </dd>
              </div>
              <div className="flex justify-between gap-x-4 py-3">
                <dt className="text-gray-500">Members</dt>
                <dd className="flex items-start gap-x-2">
                  <div className="text-gray-900">{memberCount}</div>
                </dd>
              </div>
              {subreddit.ownerId === session?.user?.id ? (
                <div className="flex justify-between gap-x-4 py-3">
                  <dt className="text-gray-500">You own this community</dt>
                </div>
              ) : null}

              {subreddit.ownerId !== session?.user?.id ? (
                <SubscribeLeaveToggle
                  isSubscribed={isSubscribed}
                  subredditId={subreddit.id}
                  subredditName={subreddit.name}
                />
              ) : null}
              <Link
                className={buttonVariants({
                  variant: "outline",
                  className: "mb-6 w-full",
                })}
                href={`r/${slug}/submit`}
              >
                Create Post
              </Link>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
