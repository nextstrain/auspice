import { controlsWidth, controlsPadding, cardMinimumWidth } from "./globals";

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

const computeResponsive = ({
  horizontal, /* multiplicative 1 (mobile, tablet, laptop) or .5 (2 column big monitor) */
  vertical, /* multiplicative .5 (if splitting with another pane) or 1 (if full height of browser window) */
  browserDimensions, /* window.innerWidth & window.innerHeight as an object */
  sidebar, /* if open, subtract sidebar width from browser width? */
  minHeight, /* minimum height of element */
  maxAspectRatio /* maximum aspect ratio of element */
}) => {

  let width = null;
  let height = null;

  const horizontalPadding = horizontal === 1 ? 34 : 56; // derived from empirical testing, depends on Card margins
  const verticalPadding = 165;

  if (browserDimensions) {
    const computedControlWidth = sidebar ? controlsWidth + controlsPadding : 0;
    width = horizontal * (browserDimensions.width - computedControlWidth - horizontalPadding);
    if (width < cardMinimumWidth) {
      width = horizontal * (browserDimensions.width - horizontalPadding);
    }
    height = browserDimensions.height * vertical - verticalPadding;
  }

  if (maxAspectRatio && height > maxAspectRatio * width) {
    height = maxAspectRatio * width;
  }

  // favor minHeight over maxAspectRatio
  if (minHeight && height < minHeight) {
    height = minHeight;
  }

  return {
    width,
    height
  };

};

export default computeResponsive;
