import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // You can also log the error to an error reporting service
    console.error(error);
    console.error(info);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      if (this.props.showNothing) {
        return null;
      }
      return (<h1>Something went wrong.</h1>);
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
