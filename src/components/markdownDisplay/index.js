import React from "react";
import { parseMarkdown } from "../../util/parseMarkdown";

export default function MarkdownDisplay({ mdstring, placeholder, ...props }) {
  try {
    return (
      <div
        {...props}
        dangerouslySetInnerHTML={{ __html: parseMarkdown(mdstring) }}
      />
    );
  } catch (error) {
    if (typeof mdstring === 'string') {
      // This runs when there is a bug within parseMarkdown or the marked package.
      console.error(`There was an error parsing the provided text as Markdown. Using the raw text as-is. Error: ${error}`);
      return (
        <div {...props}>
          <p>{mdstring}</p>
          <p>Note: This message was meant to be rendered with formatting, however there was an error parsing the message as Markdown.</p>
        </div>
      );
    } else {
      console.error(`There was an error parsing the provided text as Markdown or raw text. Error: ${error}`);
      return (
        <div {...props}>
          <p>{placeholder}</p>
        </div>
      );
    }
  }
}
