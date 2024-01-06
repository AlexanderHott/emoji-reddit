import { type Vote } from "~/server/db/schema";
export type CachedPost = {
  id: string;
  title: string;
  authorUsername: string;
  content: string;
  currentVote: Vote | null;
  createdAt: Date;
};
