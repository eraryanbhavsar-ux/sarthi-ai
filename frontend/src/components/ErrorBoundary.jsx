import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('SARTHI Error Boundary caught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-slate-950 border-2 border-amber-500 rounded-3xl p-8 shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 font-black text-2xl">
              ⚠️
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-black text-white">SARTHI Accessibility Recovery</h1>
              <p className="text-sm text-slate-400">
                A client rendering exception was caught. SARTHI has prevented an empty white screen to keep navigation accessible.
              </p>
            </div>

            {this.state.error && (
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-left font-mono text-xs text-rose-300 overflow-x-auto max-h-36">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-3 px-5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-sm transition-all focus:ring-4 focus:ring-amber-300"
              >
                Reload Page
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 py-3 px-5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-sm border border-slate-700 focus:ring-4 focus:ring-amber-400"
              >
                Reset Preferences &amp; Return Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
