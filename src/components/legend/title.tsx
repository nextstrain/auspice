import React from "react";
import { headerFont, darkGrey } from "../../globalStyles";
import { fastTransitionDuration } from "../../util/globals";

export function Title({ text }: { text: string }): JSX.Element {
  return (
    <span
      style={{
        fontSize: 12,
        color: darkGrey,
        fontFamily: headerFont,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  );
}

/**
 * The show/hide chevron. SVG allows the arrow to rotate smoothly.
 */
export function Chevron({ open }: { open: boolean }): JSX.Element {
  const degrees = open ? -180 : 0;
  return (
    <svg width="12" height="12" viewBox="0 0 1792 1792" style={{ display: "block", flex: "none" }}>
      <path
        fill={darkGrey}
        style={{
          transform: `rotate(${degrees}deg)`,
          transformOrigin: "50% 50%",
          transition: `${fastTransitionDuration}ms ease-in-out`,
        }}
        d="M1683 808l-742 741q-19 19-45 19t-45-19l-742-741q-19-19-19-45.5t19-45.5l166-165q19-19 45-19t45 19l531 531 531-531q19-19 45-19t45 19l166 165q19 19 19 45.5t-19 45.5z"
      />
    </svg>
  );
}
