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
  box-shadow: -3px 0px 3px -3px rgba(0, 0, 0, 0.2) inset;
`;


/* The sidebar theme is available to all styled components in the sidebar.
 */
const sidebarThemeDefaults = {
  background: "#F2F2F2",
  color: "#000"
};
let sidebarThemeExtensions = {};
if (hasExtension("sidebarTheme")) {
  sidebarThemeExtensions = getExtension("sidebarTheme");
}
export const sidebarTheme = {...sidebarThemeDefaults, ...sidebarThemeExtensions};
