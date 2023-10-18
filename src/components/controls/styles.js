import styled from 'styled-components';
import ReactTooltip from 'react-tooltip';

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

export const HeaderContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  line-height: 28px;
  min-height: 28px; /* needed for safari, else the div height is 0 */
  margin-top: 15px;
  margin-bottom: 5px;
`;

export const PanelSectionContainer = styled.div`
  // Less padding is necessary on the top because there is already some space
  // from HeaderContainer's top margin.
  padding-top: 2px;
  padding-bottom: 8px;

  // Add borders to delineate panel sections from other sections.
  border-top: 1px solid ${(props) => props.theme.alternateBackground};
  border-bottom: 1px solid ${(props) => props.theme.alternateBackground};

  // Don't add a top border when there is already a bottom border from a sibling
  // above.
  & + & {
    border-top: none;
  }
`;

export const TitleAndIconContainer = styled.span`
  display: inline-flex;
  align-items: center;
`;

export const HeaderTitle = styled.span`
  font-family: ${(props) => props.theme["font-family"]};
  font-size: 16px;
  font-weight: 500;
  color: ${(props) => props.theme.color};
`;

export const HeaderIconContainer = styled.span`
  display: inline-flex;
  font-size: 16px;
  padding-left: 6px;
  cursor: help;
  color: #888;
`;

export const SidebarButton = styled.button`
  border: 0px;
  background-color: inherit;
  margin: 5px 5px 10px 5px;
  border-radius: 2px;
  cursor: pointer;
  padding: 2px;
  font-family: ${(props) => props.theme["font-family"]};
  color: ${(props) => props.selected ? props.theme.selectedColor : props.theme.unselectedColor};
  font-weight: 400;
  text-transform: uppercase;
  font-size: 14px;
  vertical-align: top;
  outline: 0;
`;

/* marginTop was 7px */
export const SidebarSubtitle = styled.div`
  font-family: ${(props) => props.theme["font-family"]};
  margin: ${(props) => props.spaceAbove ? "5" : "0"}px 0px 5px 0px;
  font-size: 12px;
  font-weight: 400;
  color: ${(props) => props.theme.color};
`;

export const SidebarSubtitleFlex = styled(SidebarSubtitle)`
  display: flex;
  justify-content: space-between;
`;

export const SidebarIconContainer = styled.span`
  padding-right: 3px;
  font-size: 16px;
  cursor: help;
  color: #888;
`;

export const StyledTooltip = styled(ReactTooltip)`
  max-width: 30vh;
  white-space: normal;
  line-height: 1.2;
  padding: 21px !important; /* override internal styling */
  z-index: 1001 !important; /* on top of viz legend */
  & > br {
    margin-bottom: 10px;
  }
`;
