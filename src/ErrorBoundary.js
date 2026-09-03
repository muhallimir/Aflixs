import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Keep client-side logging minimal; surface a friendly fallback.
    if (process.env.NODE_ENV !== "production") {
      console.error("Aflixs error boundary caught:", error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="errorBoundary" role="alert">
          <h1>Something went wrong</h1>
          <p>
            This section failed to load. Your watchlist and progress are saved
            locally and are safe.
          </p>
          <div className="errorBoundary__actions">
            <button onClick={this.handleRetry}>Try again</button>
            <button onClick={() => (window.location.href = "/")}>
              Back to Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
