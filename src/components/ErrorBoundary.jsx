import React from 'react';
import { ShieldAlert, RotateCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught page-level crash:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[70vh] p-6">
          <div className="cyber-panel p-8 max-w-lg w-full bg-brand-surface/70 backdrop-blur-xl border border-brand-danger/30 rounded-2xl text-center space-y-6 relative overflow-hidden">
            {/* Top scanning header decoration */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-danger to-transparent animate-pulse"></div>

            <div className="w-16 h-16 bg-brand-danger/10 border border-brand-danger/30 rounded-2xl flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(244,124,124,0.15)]">
              <ShieldAlert className="w-8 h-8 text-brand-danger" />
            </div>

            <div className="space-y-2">
              <h3 className="font-display font-bold text-2xl text-brand-text tracking-wide uppercase">
                HEURISTIC ENGINE CRASH
              </h3>
              <p className="text-xs text-brand-text-muted font-mono tracking-wider uppercase">
                CODE: PAGE_RENDER_EXCEPTION
              </p>
            </div>

            <p className="text-sm text-brand-text-muted leading-relaxed">
              A runtime exception occurred while executing the visual threat analysis interface. The container context has been isolated to protect banking transaction security.
            </p>

            {this.state.error && (
              <div className="p-3 bg-brand-bg/60 border border-brand-danger/10 rounded font-mono text-[10px] text-brand-danger/80 text-left overflow-x-auto max-h-32">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <button
                onClick={this.handleReset}
                className="w-full bg-brand-danger text-white font-mono font-bold py-3.5 px-4 rounded-lg hover:bg-brand-danger/85 transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 tracking-wider text-xs shadow-[0_0_15px_rgba(244,124,124,0.2)]"
              >
                <RotateCcw className="w-4 h-4 text-white" />
                RETURN TO DASHBOARD
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
