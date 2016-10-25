import React from "react";

const ZoomOutIcon = ({x, y, scale, rectWidth, rectHeight, IconTranslateX, IconTranslateY}) => {
    return (
      <g transform={`translate(${x},${y})`}>
        <rect
          style={{cursor: "pointer"}}
          width={rectWidth}
          height={rectHeight}
          rx="3"
          ry="3"
          x={0}
          y={0}
          fill={"rgb(255,255,255)"}
          filter="url(#dropshadow)" />
        <g transform={`translate(${IconTranslateX},${IconTranslateY}),scale(${scale})`}>
          <path d="M364.8,299.5c46.3-75.8,36.9-176.3-28.6-241.9c-76.8-76.8-201.8-76.8-278.6,0s-76.8,201.8,0,278.6   c65.5,65.5,166,74.9,241.9,28.6L412,477.3c18,18,47.3,18,65.3,0s18-47.3,0-65.3L364.8,299.5z M295.5,295.5   c-54.4,54.4-142.8,54.4-197.1,0C44,241.1,44,152.7,98.4,98.4c54.4-54.4,142.8-54.4,197.1,0C349.8,152.7,349.8,241.1,295.5,295.5z    M128,167.3h138.7v54.6H128V167.3z"></path>
        </g>
      </g>
    );
}

ZoomOutIcon.propTypes = {
  scale: React.PropTypes.number,
  IconTranslateX: React.PropTypes.number,
  IconTranslateY: React.PropTypes.number,
  rectWidth: React.PropTypes.number,
  rectHeight: React.PropTypes.number
}
ZoomOutIcon.defaultProps = {
  scale: .04,
  IconTranslateX: 5,
  IconTranslateY: 5,
  rectWidth: 30,
  rectHeight: 30
}

export default ZoomOutIcon;
