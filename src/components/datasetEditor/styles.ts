import styled from "styled-components";

export const Form = styled.form`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  align-items: stretch;

  /* Using border-box so row/columns work as expected */
  * {
    -webkit-box-sizing: border-box;
    -moz-box-sizing: border-box;
    box-sizing: border-box;
  }
  *:before,
  *:after {
    -webkit-box-sizing: border-box;
    -moz-box-sizing: border-box;
    box-sizing: border-box;
  }

  button {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    padding: 0.3em;
  }
`;

export const DatasetEditorForm = styled(Form)`
  input:not([type=radio]) {
    margin-bottom: 1em;
    width: 100%;
  }

  input[type=radio] {
    margin-right: 0.2em;
  }

  textarea {
    margin-bottom: 1em;
    width: 100%;
    resize: vertical;
    min-height: 1.5em;
    max-height: 50em;
  }

  .underlined {
    margin-bottom: 1em;
    text-decoration: underline;
  }

  .radio {
    width: 100%;
    display: inline-flex;
    align-items: center;
    margin: 0.25em 1em;
  }

`;

export const ColorByEditorForm = styled(Form)`
  input[type="color"] {
    width: 25px;
    height: 25px;
    margin-right: 1em;
    padding: 0;
    border: 3px solid;
  }
  // Remove internal border of color input
  // Copied from <https://stackoverflow.com/a/74751637>
  input[type="color"]::-moz-color-swatch {
    border: none;
  }
  input[type="color"]::-webkit-color-swatch-wrapper {
    padding: 0;
    border-radius: 0;
  }
  input[type="color"]::-webkit-color-swatch {
    border: none;
  }
`;
