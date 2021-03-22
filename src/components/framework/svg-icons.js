import React from "react";

export const RectangularTree = ({theme, selected, width}) => {
  const stroke = selected ? theme.selectedColor : theme.unselectedColor;
  return (
    <svg width={width} height={width + 5}>
      <g transform="translate(0,2)">
        <svg width={width} height={width} viewBox="16 19 27 22">
          <g id="Group" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd" transform="translate(17.000000, 20.000000)">
            <polyline id="Path-3" stroke={stroke} points="2.94117647 12.8571429 2.94117647 18.6083984 17.8459616 18.6083984 17.8459616 16.0260882 24.870031 16.0260882"/>
            <polyline id="Path-4" stroke={stroke} points="17.8500004 18.5714286 17.8500004 20 25.0119374 20"/>
            <polyline id="Path-5" stroke={stroke} points="2.94117647 12.8571429 3.00303284 7.21191058 10.2360102 7.11220045 10.4159559 2.99881623 17.1561911 2.93803403 17.1561911 0 24.313534 0"/>
            <polyline id="Path-6" stroke={stroke} points="17.1599998 2.85714286 17.1599998 4.28571429 24.512941 4.28571429"/>
            <path d="M0,12.8571429 L2.94117647,12.8571429" id="Path-6" stroke={stroke}/>
            <polyline id="Path-7" stroke={stroke} points="10.2941176 7.14285714 10.2941176 11.4285714 24.5454676 11.4285714"/>
          </g>
        </svg>
      </g>
    </svg>
  );
};

export const Clock = ({theme, selected, width}) => {
  const stroke = selected ? theme.selectedColor : theme.unselectedColor;
  return (
    <svg width={width} height={width + 5}>
      <g transform="translate(0,4)">
        <svg width={width} height={width} viewBox="0 0 30 30 ">
          <g id="Group" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd" transform="translate(17.000000, 20.000000)">
            <polyline id="Path-3" stroke={stroke} points="-15 5 -15 -25 "/>
            <polyline id="Path-4" stroke={stroke} points="-15 5 25 5"/>
            <polyline id="Path-5" stroke={stroke} points="-12 3 20 -25 "/>
            <circle id="c-1" stroke={stroke} cx="-8" cy="0" r="2"/>
            <circle id="c-2" stroke={stroke} cx="4" cy="-10" r="2"/>
            <circle id="c-3" stroke={stroke} cx="4" cy="-15" r="2"/>
            <circle id="c-4" stroke={stroke} cx="-4" cy="-5" r="2"/>
            <circle id="c-5" stroke={stroke} cx="-2" cy="-11" r="2"/>
          </g>
        </svg>
      </g>
    </svg>
  );
};

export const Scatter = ({theme, selected, width}) => {
  const stroke = selected ? theme.selectedColor : theme.unselectedColor;
  return (
    <svg width={width} height={width + 5}>
      <g transform="translate(0,4)">
        <svg width={width} height={width} viewBox="0 0 30 30 ">
          <g id="Group" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd" transform="translate(17.000000, 20.000000)">
            <polyline id="Path-3" stroke={stroke} points="-15 5 -15 -25 "/>
            <polyline id="Path-4" stroke={stroke} points="-15 5 25 5"/>
            <circle id="c-1" stroke={stroke} cx="-8" cy="0" r="2"/>
            <circle id="c-2" stroke={stroke} cx="3" cy="0" r="2"/>
            <circle id="c-3" stroke={stroke} cx="8" cy="-5" r="2"/>
            <circle id="c-4" stroke={stroke} cx="-4" cy="-15" r="2"/>
            <circle id="c-5" stroke={stroke} cx="1" cy="-11" r="2"/>
          </g>
        </svg>
      </g>
    </svg>
  );
};

export const RadialTree = ({theme, selected, width}) => {
  const stroke = selected ? theme.selectedColor : theme.unselectedColor;
  return (
    <svg width={width} height={width + 5}>
      <g transform="translate(0,0)">
        <svg width={width} height={width} viewBox="14 14 25 26" >
          <g id="Group" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd" transform="translate(15.000000, 15.000000)">
            <path d="M15,15 L17.6450195,15" id="Path-12" stroke={stroke}/>
            <path d="M15.229248,22.5795898 L15.229248,18.2854004 C15.229248,18.2854004 17.8465223,17.6291504 17.8508301,15.0574951 C17.8551378,12.4858398 15.2944336,11.9138184 15.2944336,11.9138184 L15.229248,7.53540039" id="Path-13" stroke={stroke}/>
            <path d="M7.63037109,6.10498047 L10.230957,9.08325195 C10.230957,9.08325195 12.25,7.08233714 15.126709,7.04162598 C18.003418,7.00091481 20.5390625,8.91748047 20.5390625,8.91748047 L22.9765625,5.60839844" id="Path-14" stroke={stroke}/>
            <path d="M0.15942005,4.99135298 L2.76065146,7.96962446 C2.76065146,7.96962446 4.78019556,5.96870965 7.65761856,5.92799848 C10.5350415,5.88728732 13.0713154,7.80385298 13.0713154,7.80385298 L15.5094204,4.49477094" id="Path-14" stroke={stroke} transform="translate(7.834420, 6.232198) rotate(-34.000000) translate(-7.834420, -6.232198) "/>
            <path d="M7.5,21.496582 L10.1005859,24.4748535 C10.1005859,24.4748535 12.1196289,22.4739387 14.9963379,22.4332275 C17.8730469,22.3925164 20.4086914,24.309082 20.4086914,24.309082 L22.8461914,21" id="Path-14" stroke={stroke} transform="translate(15.173096, 22.737427) scale(1, -1) translate(-15.173096, -22.737427) "/>
          </g>
        </svg>
      </g>
    </svg>
  );
};

export const UnrootedTree = ({theme, selected, width}) => {
  const stroke = selected ? theme.selectedColor : theme.unselectedColor;
  return (
    <svg width={width} height={width + 5}>
      <g transform="translate(0,2)">
        <svg width={width} height={width} viewBox="106 49 150 118">
          <polyline id="Path-2" stroke={stroke} strokeWidth="4" fill="none" points="108 77 125.182237 87.8599894 133.381156 119.402591 111.867082 144.368016"/>
          <path d="M125.2,87.5 L137.624777,70" id="Path-3" stroke={stroke} strokeWidth="4" fill="none"/>
          <polyline id="Path-4" stroke={stroke} strokeWidth="4" fill="none" points="133 119.331781 192.127357 119.400002 215.445998 80.3916603 203.946476 51.4000015"/>
          <path d="M215.5,80.5 L253.378522,73" id="Path-5" stroke={stroke} strokeWidth="4" fill="none"/>
          <path d="M192,119.2 L229.854937,164.55391" id="Path-6" stroke={stroke} strokeWidth="4" fill="none"/>
        </svg>
      </g>
    </svg>
  );
};

export const Meta = ({theme, selected, width}) => {
  const stroke = selected ? theme.selectedColor : theme.unselectedColor;
  return (
    <svg width={width} height={width + 5}>
      <g transform="translate(0,7)">
        <svg width={width} height={width} viewBox="0 0 30 30 ">
          <g id="Group" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
            <line stroke={stroke} x1="3.3" y1="3.8" x2="27.7" y2="3.8"/>
            <line stroke={stroke} x1="3.3" y1="9.2" x2="27.7" y2="9.2"/>
            <line stroke={stroke} x1="3.3" y1="14.5" x2="27.7" y2="14.5"/>
            <line stroke={stroke} x1="3.3" y1="19.9" x2="27.7" y2="19.9"/>
            <line stroke={stroke} x1="3.3" y1="25.2" x2="27.7" y2="25.2"/>
          </g>
        </svg>
      </g>
    </svg>
  );
};

export const PanelsGrid = ({theme, selected, width}) => {
  const stroke = selected ? theme.selectedColor : theme.unselectedColor;
  return (
    <svg width={width} height={width + 5}>
      <g transform="translate(0,6)">
        <svg width={width} height={width} viewBox="0 0 30 30 ">
          <g id="Group" stroke="none" strokeWidth="1" fillRule="evenodd">
            <rect fill="none" stroke={stroke} x="1" y="1" width="14" height="17"/>
            <rect fill="none" stroke={stroke} x="15" y="1" width="14" height="17"/>
            <rect fill="none" stroke={stroke} x="1" y="18" width="28" height="8"/>
          </g>
        </svg>
      </g>
    </svg>
  );
};

export const PanelsFull = ({theme, selected, width}) => {
  const stroke = selected ? theme.selectedColor : theme.unselectedColor;
  return (
    <svg width={width} height={width + 5}>
      <g transform="translate(0,6)">
        <svg width={width} height={width} viewBox="0 0 30 30 ">
          <g id="Group" stroke="none" strokeWidth="1" fillRule="evenodd">
            <rect fill="none" stroke={stroke} x="1" y="1" width="7" height="25"/>
            <rect fill="none" stroke={stroke} x="8" y="1" width="20" height="25"/>
          </g>
        </svg>
      </g>
    </svg>
  );
};
