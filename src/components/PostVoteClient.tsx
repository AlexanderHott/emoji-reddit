"use client";

import { usePrevious } from "@mantine/hooks";
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { ArrowBigDown, ArrowBigUp } from "lucide-react";
import { cn } from "~/lib/utils";
import { type Vote } from "~/server/db/schema";
import { useCustomToasts } from "~/hooks/use-custom-toasts";
import { type PostVoteRequest } from "~/lib/validators/vote";
import { toast } from "./ui/use-toast";
import { Button } from "./ui/button";

interface PostVoteClientProps {
  postId: string;
  initialVotesAmt: number;
  initialVote?: Vote | null;
}

const PostVoteClient = ({
  postId,
  initialVotesAmt,
  initialVote,
}: PostVoteClientProps) => {
  const { loginToast } = useCustomToasts();
  const [votesAmt, setVotesAmt] = useState<number>(initialVotesAmt);
  const [currentVote, setCurrentVote] = useState(initialVote);
  const prevVote = usePrevious(currentVote);

  // ensure sync with server
  useEffect(() => {
    setCurrentVote(initialVote);
  }, [initialVote]);

  const { mutate: vote } = useMutation({
    mutationFn: async (type: Vote) => {
      const payload: PostVoteRequest = {
        voteType: type,
        postId: postId,
      };

      await axios.patch("/api/subreddit/post/vote", payload);
    },
    onError: (err, voteType) => {
      if (voteType === "UP") setVotesAmt((prev) => prev - 1);
      else setVotesAmt((prev) => prev + 1);

      // reset current vote
      setCurrentVote(prevVote);

      if (err instanceof AxiosError) {
        if (err.response?.status === 401) {
          return loginToast();
        }
      }

      return toast({
        title: "Something went wrong.",
        description: "Your vote was not registered. Please try again.",
        variant: "destructive",
      });
    },
    onMutate: (type: Vote) => {
      if (currentVote === type) {
        // User is voting the same way again, so remove their vote
        setCurrentVote(undefined);
        if (type === "UP") setVotesAmt((prev) => prev - 1);
        else if (type === "DOWN") setVotesAmt((prev) => prev + 1);
      } else {
        // User is voting in the opposite direction, so subtract 2
        setCurrentVote(type);
        if (type === "UP") setVotesAmt((prev) => prev + (currentVote ? 2 : 1));
        else if (type === "DOWN")
          setVotesAmt((prev) => prev - (currentVote ? 2 : 1));
      }
    },
  });

  return (
    <div className="flex flex-col gap-4 pb-4 pr-6 sm:w-20 sm:gap-0 sm:pb-0">
      {/* upvote */}
      <Button
        onClick={() => vote("UP")}
        size="sm"
        variant="ghost"
        aria-label="upvote"
      >
        <ArrowBigUp
          className={cn("h-5 w-5 text-zinc-700", {
            "fill-emerald-500 text-emerald-500": currentVote === "UP",
          })}
        />
      </Button>

      {/* score */}
      <p className="py-2 text-center text-sm font-medium text-zinc-900">
        {votesAmt}
      </p>

      {/* downvote */}
      <Button
        onClick={() => vote("DOWN")}
        size="sm"
        className={cn({
          "text-emerald-500": currentVote === "DOWN",
        })}
        variant="ghost"
        aria-label="downvote"
      >
        <ArrowBigDown
          className={cn("h-5 w-5 text-zinc-700", {
            "fill-red-500 text-red-500": currentVote === "DOWN",
          })}
        />
      </Button>
    </div>
  );
};

export default PostVoteClient;
