import styled from 'styled-components';
import ReactTooltip from 'react-tooltip';
import React from "react";
import { FaFileCode } from "react-icons/fa";

export const IntroParagraph = styled.div`
max-width: 60%;
padding-top: 20px;
margin: auto;
font-size: 16px;
`;

const statusColours = (status) => {
  if (status && status.startsWith("Error")) return "#e31a1c";
  if (status && status.startsWith("Warning")) return "#fd8d3c";
  else if (status==="inProgress") return "#41b6c4";
  else if (status==="success") return "#41ab5d";
  else if (status==="notAttempted") return "#bdbdbd";
  else if (status==="internalError") return "#8c6bb1";
  return "";
};


export const FileIcon = styled(FaFileCode)`
  fill: ${(props) => props.dragActive ? 'rgba(255, 255, 255, 0)' : '#41ab5d'};
`;

export const FilePickerContainer = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 50%;
  margin: auto;
  margin-top: 40px;
  & h4 {
    margin: 20px;
  }
`;

export const FilePickerHeader = styled.div`
  display: flex;
  margin-bottom: 0;
  padding-bottom: 0;
  font-size: 24px;
  font-weight: 300;
`;

export const DraggedText = styled.div`
  display: flex;
  flex-direction: column;
  font-size: 20px;
  margin-left: 20px;
`;

export const FilePickerBody = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 20vw;
  min-height: 200px;
  border-radius: 5px;
  border: 4px dashed rgba(173, 181, 189, 0.75);
  /* color:  ${(props) => props.dragActive ? 'white' : 'rgb(73, 80, 87)'}; */
  color: rgb(73, 80, 87);
  background-color: ${(props) => props.dragActive ? '#d9f0a3' : 'rgba(255, 255, 255, 0)'};
  box-shadow: none;
  & * {
    pointer-events: none;
  }
`;

export const DropContainerOuter = styled.div`
  max-width: 50%;
  margin: auto;
  margin-top: 40px;
  background-color: #fff7bc;
  width: 50%;
  height: 150px;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
`;

export const DropContainerInner = styled.div`
  text-align: center; // horizontal axis
  font-size: 24px;
  color: #fc4e2a;
`;

export const ErrorContainer = styled.div`
  max-width: 50%;
  margin: auto;
  margin-top: 40px;
  background-color: #fc4e2a;
  color: white;
  text-align: center;
  font-size: 24px;
`;

export const HoverBox = styled(ReactTooltip)`
  /* TODO - inherit the styling of the narrative sidebar */
  max-width: 40vh;
  white-space: normal;
  line-height: 1.2;
  padding: 21px !important; /* override internal styling */
  & > br {
    margin-bottom: 10px;
  }
`;

const IntroOuter = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  padding-top: 50px;
  width: 100%;
`;

const IntroInner = styled.div`
  text-align: center;
  max-width: 800px;
  font-size: 18px;
  font-weight: 300;
  line-height: 2.5rem;
  color: #737373;
  & > em {
    font-weight: 400;
    font-style: normal;
  }
  & > br {
    margin-bottom: 15px;
  }
`;

export const Introduction = ({children}) => (
  <IntroOuter>
    <IntroInner>
      {children}
    </IntroInner>
  </IntroOuter>
);

export const ExperimentalBanner = styled.div`
  height: 100px;
  background-color: #fd8d3c;
  color: white;
  font-size: 24px;
  font-weight: 300;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center; // horizontal axis
  padding: 10px 80px;
  & a {
    color: inherit;
  }
  & a:hover {
    color: inherit;
  }
`;

export const GridContainer = styled.div`
  margin: auto; /* horizontally center the grid on the screen */
  margin-top: 20px;
  margin-bottom: 10px;
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 40px 20px; // row-gap column-gap
  /* background-color: #f0f0f0; */
  font-size: 16px;
  max-width: 800px;
  border: 1px solid rgba(173, 181, 189, 0.75);
  padding: 10px;
`;
export const SlideDescription = styled.div`
  cursor: pointer;
  max-height: 120px;
  overflow: hidden;
`;
export const SlideDatasetContainer = styled.div`
  flex: 1 0 30%;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  flex-wrap: no-wrap;
`;
export const SlideDataset = styled.div`
`;
export const GridHeaderCell = styled.div`
  font-size: 18px;
  font-weight: 600;
`;
export const DatasetIcon = ({num, status, datasetType, hoverContent, width=40}) => {
  const stroke = "white";
  const id = `hover_${num}_${datasetType}`;
  let svgGroup;
  if (datasetType === "main") {
    /* Following adapted from our svg-icons.js  */
    svgGroup = (
      <g id="Group" stroke="none" strokeWidth="2" fill="none" fillRule="evenodd" transform="scale(0.27 0.32) translate(5 5)">
        <polyline id="Path-3" stroke={stroke} points="2.94117647 12.8571429 2.94117647 18.6083984 17.8459616 18.6083984 17.8459616 16.0260882 24.870031 16.0260882"/>
        <polyline id="Path-4" stroke={stroke} points="17.8500004 18.5714286 17.8500004 20 25.0119374 20"/>
        <polyline id="Path-5" stroke={stroke} points="2.94117647 12.8571429 3.00303284 7.21191058 10.2360102 7.11220045 10.4159559 2.99881623 17.1561911 2.93803403 17.1561911 0 24.313534 0"/>
        <polyline id="Path-6" stroke={stroke} points="17.1599998 2.85714286 17.1599998 4.28571429 24.512941 4.28571429"/>
        <path d="M0,12.8571429 L2.94117647,12.8571429" id="Path-6" stroke={stroke}/>
        <polyline id="Path-7" stroke={stroke} points="10.2941176 7.14285714 10.2941176 11.4285714 24.5454676 11.4285714"/>
      </g>
    );
  } else if (datasetType === "rootSeq") {
    svgGroup = (
      <g>
        <text x="2" y="4.5" fontSize="4px" fill="white">A T</text>
        <text x="2" y="8.5" fontSize="4px" fill="white">C G</text>
      </g>
    );
  } else if (datasetType === "frequencies") {
    svgGroup = (
      <g>
        <mask id="mask-2" fill="white">
          <circle id="path-1" cx="5" cy="5" r="5"/>
        </mask>
        <g mask="url(#mask-2)" fill="#FFFFFF" fillOpacity="0.33">
          <g transform="translate(-1.000000, 0.000000)">
            <path id="middle_slice" d="M4.52213324,3.60368881 C5.27922385,1.52902719 7.43852464,0.327797589 11.0000356,5.68434189e-14 L11.0000356,10.001328 L1,10.001328 L0.917926834,7.55792371 C2.54956115,7.03501049 3.75096328,5.71693219 4.52213324,3.60368881 Z"/>
            <path id="lower_slice" d="M5.86327501,5.5 C7.18776688,3.72396 8.90002041,4.07834961 11.0000356,6.56316883 L11.0000356,10.001328 L1,10.001328 L1,7.71195799 C2.91769148,8.01335933 4.53878315,7.27604 5.86327501,5.5 Z"/>
          </g>
        </g>
      </g>
    );
  } else {
    console.error(`Unknown datasetType ${datasetType}`);
    return null;
  }
  return (
    <div style={{paddingLeft: "5px"}}>
      <svg width={width} height={width} viewBox="0 0 10 10 " data-tip data-for={id}>
        <circle cx="5" cy="5" r="5" fill={statusColours(status)}/>
        {svgGroup}
      </svg>
      <HoverBox place="bottom" effect="solid" id={id}>
        {hoverContent}
      </HoverBox>
    </div>
  );
};


export const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
`;

export const Button = styled.button`
  border: none;
  padding: 5px 10px;
  background-color: #41b6c4;
  color: white;
  font-size: 24px;
  border-radius: 5px;
`;
