import React from "react";
import PropTypes from 'prop-types';

const ZoomOutIcon = ({
  x,
  y,
  scale,
  rectWidth,
  rectHeight,
  IconTranslateX,
  IconTranslateY,
  handleClick,
  active,
  activeFill,
  fill
}) => {
    return (
      <g onClick={handleClick} style={{cursor: "pointer"}} transform={`translate(${x},${y})`}>
        <rect
          width={rectWidth}
          height={rectHeight}
          rx="3"
          ry="3"
          x={0}
          y={0}
          fill={"rgb(255,255,255)"}
          filter="url(#dropshadow)" />
        <g transform={`translate(${IconTranslateX},${IconTranslateY}),scale(${scale})`}>
          <path fill={active ? activeFill : fill} d="M364.8,299.5c46.3-75.8,36.9-176.3-28.6-241.9c-76.8-76.8-201.8-76.8-278.6,0s-76.8,201.8,0,278.6   c65.5,65.5,166,74.9,241.9,28.6L412,477.3c18,18,47.3,18,65.3,0s18-47.3,0-65.3L364.8,299.5z M295.5,295.5   c-54.4,54.4-142.8,54.4-197.1,0C44,241.1,44,152.7,98.4,98.4c54.4-54.4,142.8-54.4,197.1,0C349.8,152.7,349.8,241.1,295.5,295.5z    M128,167.3h138.7v54.6H128V167.3z"></path>
        </g>
      </g>
    );
}

ZoomOutIcon.propTypes = {
  scale: PropTypes.number,
  IconTranslateX: PropTypes.number,
  IconTranslateY: PropTypes.number,
  rectWidth: PropTypes.number,
  rectHeight: PropTypes.number
}
ZoomOutIcon.defaultProps = {
  scale: .04,
  IconTranslateX: 5,
  IconTranslateY: 5,
  rectWidth: 30,
  rectHeight: 30,
  fill: "rgb(180,180,180)",
  activeFill: "rgb(80,80,80)",
  active: false
}

export default ZoomOutIcon;
