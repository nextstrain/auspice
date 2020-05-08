import React from "react"; // eslint-disable-line import/no-extraneous-dependencies
import { Container, Leader, Button } from "./styles";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
    this.clearErrors = this.clearErrors.bind(this);
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  clearErrors() {
    this.setState({hasError: false});
  }
  render() {
    if (this.state.hasError) {
      return (
        <Container>
          <Leader>Default Error Boundary</Leader>
          <Button onClick={this.clearErrors}>Try to reload</Button>
        </Container>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
