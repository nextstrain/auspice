import styled from "styled-components"; // eslint-disable-line import/no-extraneous-dependencies

/* These are styled components which are _reused_ in different components.
One-offs should be in the same file as the react component which uses it */

export const Container = styled.div`
  border: 1px solid orange;
  padding: .5em;
  margin-bottom: 20px;
`;

export const Leader = styled.div`
  padding: 15px 0px;
`;

export const Fineprint = styled.div`
  font-size: 0.8rem;
  padding-bottom: 10px;
`;


export const Button = styled.button`
  color: ${(props) => props.selected ? "white" : "black"};
  background: transparent;
  ${(props) => props.selected ? "background-color: #008CBA;" : ""};
  border: 2px solid #0099CC;
  border-radius: 4px; 
  padding: 6px 12px;
  text-align: center;
  display: inline-block;
  font-size: 14px;
  margin: 3px 1px;
  transition-duration: 0.4s;
  cursor: pointer;
  text-decoration: none;
  text-transform: uppercase;
  &:hover {
    background-color: #008CBA;
    color: white;
  }
`;
