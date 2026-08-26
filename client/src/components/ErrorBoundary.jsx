import React from 'react';
import { Link } from 'react-router-dom';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Global Error Caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 text-center">
          <div className="text-6xl mb-4">💥</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Oops! Something went wrong.</h1>
          <p className="text-gray-500 max-w-md mb-8">
            We've caught an unexpected application error. Don't worry, your data is safe.
          </p>
          <a 
            href="/dashboard" 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition shadow-sm"
          >
            Return to Dashboard
          </a>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;