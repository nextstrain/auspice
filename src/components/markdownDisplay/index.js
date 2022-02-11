import React from "react";
import { parseMarkdown } from "../../util/parseMarkdown";

export default function MarkdownDisplay({ mdstring, ...props }) {
  let cleanDescription;
  try {
    cleanDescription = parseMarkdown(mdstring);
  } catch (error) {
    console.error(`Error parsing Markdown: ${error}`);
    cleanDescription = '<p>There was an error parsing the Markdown.  See the JS console.</p>';
  }
  return (
    <div
      {...props}
      dangerouslySetInnerHTML={{ __html: cleanDescription }} // eslint-disable-line react/no-danger
    />
  );
}
