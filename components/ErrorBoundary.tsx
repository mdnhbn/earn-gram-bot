import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-10 text-center space-y-4 bg-slate-900 min-h-[200px] rounded-3xl border border-slate-800">
          <div className="text-5xl">⚠️</div>
          <h2 className="text-xl font-bold text-white">Something went wrong</h2>
          <p className="text-slate-400 text-sm">This section failed to load.</p>
          <button 
            onClick={() => this.setState({ hasError: false })}
            className="bg-blue-600 px-6 py-2 rounded-xl font-bold text-white"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
