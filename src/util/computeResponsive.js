/*
  Why this function is here
  -------------------------

  This function figures out the dimensions of a panel. There are several challenges to this.
  It's harder mental model wise than code wise.

  In a normal responsive layout, you would allow flexbox (which nextstrain uses) to determine
  the width of an element. In that case, one describes a layout with a higher level API and
  lets the browser compute the widths and heights.

  That doesn't work because most of the panels have svgs that have scales, and scales need absolute
  width and height values.

  How to use this function
  ------------------------

  Tell it what percent (as a decimal, so 50% is .5) of the horizontal and vertical space the
  given panel should take up. Also pass it the window dimensions and some boolean flags that
  tell it how to access global style data.

  Some things in this function come from globals, like the width of the sidebar. As we add
  various elements that take up height and width, we'll need to adjust this function.
*/

/* HARDCODED CONSTANTS */
const xPaddingOneCard = 40; // derived from empirical testing, depends on Card margins
const xPaddingTwoCards = 100; // 56 works fine on chrome, mac-firefox, but not on IE, linux/windows firefox.
const verticalPadding = 52;

export const calcUsableWidth = (availableWidth, fraction) => {
  const horizontalPadding = fraction === 1 ? xPaddingOneCard : xPaddingTwoCards;
  return fraction * (availableWidth - horizontalPadding);
};

export const computeResponsive = ({
  horizontal, /* multiplicative 1 (mobile, tablet, laptop) or .5 (2 column big monitor) */
  vertical, /* multiplicative .5 (if splitting with another pane) or 1 (if full height of browser window) */
  availableWidth, /* after sidebar etc taken away */
  availableHeight,
  minHeight = undefined, /* minimum height of element */
  maxAspectRatio = undefined /* maximum aspect ratio of element */
}) => {
  /* HARDCODED CONSTANTS */
  const horizontalPadding = horizontal === 1 ? xPaddingOneCard : xPaddingTwoCards;

  const width = horizontal * (availableWidth - horizontalPadding);
  let height = (vertical * availableHeight) - verticalPadding;

  if (maxAspectRatio && height > maxAspectRatio * width) {
    height = maxAspectRatio * width;
  }
  // favor minHeight over maxAspectRatio
  if (minHeight && height < minHeight) {
    height = minHeight;
  }
  return {width, height};
};
