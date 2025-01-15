import React from "react";
import { parseMarkdown } from "../../util/parseMarkdown";

export default function MarkdownDisplay({ mdstring, ...props }) {
  let html;
  try {
    html = parseMarkdown(mdstring);
  } catch (error) {
    console.error(`Error parsing Markdown: ${error}`);
    html = '<p>There was an error parsing the Markdown.  See the JS console.</p>';
  }
  return (
    <div
      {...props}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
