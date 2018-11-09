import styled from 'styled-components';
import { headerFont } from "../../globalStyles";

/* All of these styled components are for the controls, which is part of the sidebar.
 * The sidebar is is wrapped by a <ThemeProvider> so you can access
 * props.theme.x
 */

export const ControlsContainer = styled.div`
display: flex;
flex-direction: column;
align-content: stretch;
flex-wrap: nowrap;
height: 100%;
order: 0;
flex-grow: 0;
flex-shrink: 1;
flex-basis: auto;
align-self: auto;
padding: 0px 20px 20px 20px;
`;


export const SidebarHeader = styled.span`
  font-family: ${headerFont};
  font-size: 16px;
  line-height: 28px;
  margin-top: 15px;
  margin-bottom: 5px;
  font-weight: 500;
  color: ${(props) => props.theme.color};
`;
