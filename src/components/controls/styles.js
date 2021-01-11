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
  font-family: ${(props) => props.theme["font-family"]};
  font-size: 16px;
  line-height: 28px;
  min-height: 28px; /* needed for safari, else the div height is 0 */
  margin-top: 15px;
  margin-bottom: 5px;
  font-weight: 500;
  color: ${(props) => props.theme.color};
`;

export const HeaderIconContainer = styled.span`
  padding-top: 4px;
  padding-right: 3px;
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

/* React Select is a lot of work to style
 * I can't yet get it working with styled components
 * We import the theme here, rather than accessing it via the <ThemeProvider>
 */
// const customReactSelectStyles = {
//   container: (provided, state) => {
//     console.log(provided);
//     return {
//       ...provided,
//       height: "20px"
//     };
//   },
//   control: (provided, state) => {
//     return {
//       ...provided,
//       color: "yellow",
//       backgroundColor: "pink",
//       borderColor: "red",
//       height: "20px"
//     };
//   }
// };
// export const Select = (props) => (
//   <ReactSelect styles={customReactSelectStyles} {...props}/>
// );

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
