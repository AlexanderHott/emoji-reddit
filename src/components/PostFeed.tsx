"use client";
import type {
  Comment,
  Post as PostT,
  PostVote,
  Subreddit,
  User,
} from "~/server/db/schema";
import { useIntersection } from "@mantine/hooks";
import { useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";
import { useSession } from "next-auth/react";
import Post from "~/components/Post";
import { Loader2 } from "lucide-react";

export type ExtendedPost = PostT & {
  subreddit: Subreddit;
  votes: PostVote[];
  author: User;
  comments: Comment[];
};
const INFINITE_SCROLL_PAGINATION_RESULTS = 2;

export default function PostFeed({
  initialPosts,
  subredditName,
}: {
  initialPosts: ExtendedPost[];
  subredditName: string;
}) {
  const lastPostRef = useRef<HTMLLIElement>(null);
  const { ref, entry } = useIntersection({
    root: lastPostRef.current,
    threshold: 1,
  });
  const { data, fetchNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["infinite-query"],
    queryFn: async ({ pageParam }) => {
      const query =
        `/api/posts?limit=${INFINITE_SCROLL_PAGINATION_RESULTS}&page=${pageParam}` +
        (!!subredditName ? `&subredditName=${subredditName}` : "");

      const { data } = await axios.get<ExtendedPost[]>(query);
      return data;
    },
    getNextPageParam: (_, pages) => {
      return pages.length + 1;
    },
    initialPageParam: 1,
    initialData: { pages: [initialPosts], pageParams: [1] },
  });
  const { data: session } = useSession();

  const posts = data?.pages.flat() ?? initialPosts;
  return (
    <ul className="col-span-2 flex flex-col space-y-6">
      {posts.map((post, index) => {
        const votesAmt = post.votes.reduce((acc, vote) => {
          if (vote.type === "UP") return acc + 1;
          if (vote.type === "DOWN") return acc - 1;
          return acc;
        }, 0);

        const currentVote = post.votes.find(
          (vote) => vote.userId === session?.user.id,
        );

        if (index === posts.length - 1) {
          // Add a ref to the last post in the list
          return (
            <li key={post.id} ref={lastPostRef}>
              <Post
                post={post}
                commentAmt={post.comments.length}
                subredditName={post.subreddit.name}
                votesAmt={votesAmt}
                currentVote={currentVote}
              />
            </li>
          );
        } else {
          return (
            <Post
              key={post.id}
              post={post}
              commentAmt={post.comments.length}
              subredditName={post.subreddit.name}
              votesAmt={votesAmt}
              currentVote={currentVote}
            />
          );
        }
      })}

      {isFetchingNextPage && (
        <li className="flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
        </li>
      )}
    </ul>
  );
}
