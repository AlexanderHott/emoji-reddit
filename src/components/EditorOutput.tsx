"use client";

import { type FC } from "react";
import dynamic from "next/dynamic";
import CustomCodeRenderer from "./CustomCodeRenderer";
import CustomImageRenderer from "./CustomImageRenderer";

const Output = dynamic(
  async () => (await import("editorjs-react-renderer")).default,
  { ssr: false },
);

interface EditorOutputProps {
  // eslint-disable-next-line
  content: any;
}

const renderers = {
  image: CustomImageRenderer,
  code: CustomCodeRenderer,
};

const style = {
  paragraph: {
    fontSize: "0.875rem",
    lineHeight: "1.25rem",
  },
};

const EditorOutput: FC<EditorOutputProps> = ({ content }) => {
  return (
    <Output
      style={style}
      className="text-sm"
      renderers={renderers}
      // eslint-disable-next-line
      data={content}
    />
  );
};

export default EditorOutput;
