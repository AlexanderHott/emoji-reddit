"use client";

import TextareaAutosize from "react-textarea-autosize";
import { useForm } from "react-hook-form";
import { type PostCreationRequest, PostValidator } from "~/lib/validators/post";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useRef, useState } from "react";
import type EditorJS from "@editorjs/editorjs";
import { uploadFiles } from "~/lib/uploadthing";

export default function Editor({ subredditId }: { subredditId: string }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PostCreationRequest>({
    resolver: zodResolver(PostValidator),
    defaultValues: { subredditId, title: "", content: null },
  });

  const ref = useRef<EditorJS>();
  const _titleRef = useRef<HTMLTextAreaElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMounted(true);
    }
  }, []);

  const initializeEditor = useCallback(async () => {
    const EditorJS = (await import("@editorjs/editorjs")).default;
    const Header = (await import("@editorjs/header")).default;
    // eslint-disable-next-line
    const Embed = (await import("@editorjs/embed")).default;
    // eslint-disable-next-line
    const Table = (await import("@editorjs/table")).default;
    // eslint-disable-next-line
    const List = (await import("@editorjs/list")).default;
    // eslint-disable-next-line
    const Code = (await import("@editorjs/code")).default;
    // eslint-disable-next-line
    const LinkTool = (await import("@editorjs/link")).default;
    // eslint-disable-next-line
    const InlineCode = (await import("@editorjs/inline-code")).default;
    // eslint-disable-next-line
    const ImageTool = (await import("@editorjs/image")).default;

    if (!ref.current) {
      const editor = new EditorJS({
        holder: "editor",
        onReady() {
          ref.current = editor;
        },
        placeholder: "Type here to add your post...",
        inlineToolbar: true,
        data: { blocks: [] },
        tools: {
          header: Header,
          linkTook: {
            // eslint-disable-next-line
            class: LinkTool,
            config: {
              endpoint: "/api/link",
            },
          },
          image: {
            // eslint-disable-next-line
            class: ImageTool,
            config: {
              uploader: {
                async uploadByFile(file: File) {
                  const res = (
                    await uploadFiles("imageUploader", {
                      files: [file],
                    })
                  )[0]!;
                  return { success: 1, url: res.url };
                },
              },
            },
          },
          // eslint-disable-next-line
          list: List,
          // eslint-disable-next-line
          code: Code,
          // eslint-disable-next-line
          inlineCode: InlineCode,
          // eslint-disable-next-line
          table: Table,
          // eslint-disable-next-line
          embed: Embed,
        },
      });
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await initializeEditor();
      // setTimeout(() => {
      //   ref.current?.focus();
      // });
    };
    if (isMounted) {
      init().catch((err) => console.error("Error initializing editor", err));
    }
  }, [isMounted, initializeEditor]);
  async function onSubmit(data: PostCreationRequest) {
    console.log("submit", data);
  }
  const { ref: titleRef, ...rest } = register("title");

  return (
    <div className="w-full rounded-lg border border-zinc-200 bg-zinc-50 p-4">
      <form
        id="subreddit-post-form"
        className="w-fit"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="prose prose-stone dark:prose-invert">
          <TextareaAutosize
            ref={(e) => {
              titleRef(e);
              // @ts-expect-error lmao
              _titleRef.current = e;
            }}
            {...rest}
            placeholder="Title"
            className="w-full resize-none appearance-none overflow-hidden bg-transparent text-5xl font-bold focus:outline-none"
          />
          <div id="editor" className="min-h-[500px]" />
          <p className="text-sm text-gray-500">
            Use{" "}
            <kbd className="bg-muted rounded-md border px-1 text-xs uppercase">
              Tab
            </kbd>{" "}
            to open the command menu.
          </p>
        </div>
      </form>
    </div>
  );
}
