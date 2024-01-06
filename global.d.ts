import { type Vote } from "~/server/db/schema";

declare module "@editorjs/embed";
declare module "@editorjs/table";
declare module "@editorjs/list";
declare module "@editorjs/code";
declare module "@editorjs/link";
declare module "@editorjs/inline-code";
declare module "@editorjs/image";

export type CachedPost = {
  id: string;
  title: string;
  authorUsername: string;
  content: string;
  currentVote: Vote | null;
  createdAt: Date;
};
