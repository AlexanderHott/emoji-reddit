import { z } from "zod";

export const PostValidator = z.object({
  title: z
    .string()
    .min(3, { message: "Title must be 3 characters or longer." })
    .max(128, { message: "Title most be 128 characters or fewer." }),
  subredditId: z.string().min(1),
  content: z.any(),
});

export type PostCreationRequest = z.infer<typeof PostValidator>;
