import styled from 'styled-components';
import { hasExtension, getExtension } from "../../util/extensions";

export const PanelsContainer = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  transition: left 0.3s ease-out;
  background-color: #fff;
  height: ${(props) => props.height+"px"};
  width: ${(props) => props.width+"px"};
  overflow-x: hidden;
  overflow-y: scroll;
  left: ${(props) => props.left+"px"};
`;

export const SidebarContainer = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  transition: left 0.3s ease-out;
  left: ${(props) => props.left+"px"};
  background-color: ${(props) => props.theme.background};
  height: ${(props) => props.height+"px"};
  width: ${(props) => props.width+"px"};
  max-width: ${(props) => props.width+"px"};
  overflow-y: auto;
  overflow-x: hidden;
  box-shadow: -3px 0px 3px -3px ${(props) => props.theme.sidebarBoxShadow} inset;
  font-family: ${(props) => props.theme["font-family"]};
`;


/* The sidebar theme is available to all styled components in the sidebar.
 */
const sidebarThemeDefaults = {
  background: "#30353F",
  color: "#D3D3D3",
  "font-family": "Lato, Helvetica Neue, Helvetica, sans-serif",
  sidebarBoxShadow: "rgba(255, 255, 255, 1)",
  selectedColor: "#5DA8A3",
  unselectedColor: "#BBB",
  unselectedBackground: "#888"
};
let sidebarThemeExtensions = {};
if (hasExtension("sidebarTheme")) {
  sidebarThemeExtensions = getExtension("sidebarTheme");
}
export const sidebarTheme = {...sidebarThemeDefaults, ...sidebarThemeExtensions};
