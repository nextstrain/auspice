import React from "react";
import styled from "styled-components";

const Background = styled.div`
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 20px,
    #f4d2ff 20px,
    #f4d2ff 21px
  );
  margin: 10px 10px;
  padding: 10px 10px;
  border: 1px solid #f4d2ff;
  display: inline-block;
  position: relative;
`;

interface Props {
  width: number;
  height: number;
  name: string;
}
interface State {
  hasError: boolean;
  errorMessage: string;
}

class PanelErrorBoundary extends React.Component<Props, State> {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: ''};
  }
  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return {
      hasError: true,
      errorMessage: error instanceof Error ? error.message : "Unknown error (thrown value was not an instance of Error)",
    };
  }
  override componentDidCatch(error, info) {
    // You can also log the error to an error reporting service
    console.error(error);
    console.error(info);
  }

  override render() {
    if (!this.state.hasError) return this.props.children;

    /**
     * We could add something like
     * <button onClick={() => {this.setState({hasError: false})}}>You can try clicking here to re-render the panel</button>
     * but it risks rendering an incorrect state so I'd prefer not to
     */

    return (
      <Background style={{width: this.props.width, height: this.props.height}}>
        <h1 style={{fontSize: '3rem'}}>{`Error! Something's gone wrong within the ${this.props.name} panel`}</h1>
        
        <p style={{fontSize: '1.8rem'}}>
          {`Error message: "${this.state.errorMessage}"`}
        </p>

        <p style={{fontSize: '1.8rem'}}>
          {'Please consider making a bug report either on '}
          <a href="https://github.com/nextstrain/auspice/issues/new" target="_blank" rel="noreferrer noopener">GitHub</a>
          {' or via '}
          <a href="mailto:hello@nextstrain.org" target="_blank" rel="noreferrer noopener">email</a>.
          (The more information you can include the better - things such as steps to reproduce the bug, your browser version, the version of Auspice etc are incredibly helpful.)
        </p>
        <p style={{fontSize: '1.8rem'}}>
          In the meantime you could try refreshing the page which may fix things in the short term.
        </p>

      </Background>
    );
  }
}

export default PanelErrorBoundary;
