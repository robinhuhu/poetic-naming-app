import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('起名应用崩溃异常:', error, errorInfo);
  }

  private handleReset = () => {
    try {
      localStorage.clear();
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="loading-screen">
          <div className="loading-container" style={{ maxWidth: '500px' }}>
            <div className="loading-compass" style={{ animationDuration: '30s', borderStyle: 'dotted', borderColor: 'var(--cinnabar)' }}>
              <div className="loading-compass-inner" style={{ borderStyle: 'solid', animationDuration: '15s' }}></div>
            </div>
            <div className="loading-title color-cinnabar">推演失序 · 天机待补</div>
            <div className="loading-desc mb-25" style={{ lineHeight: '1.8' }}>
              系统在计算命理数理或古籍同源时发生了异常。
              <br />
              这可能是由于本地数据解析冲突或网络加载异常导致的。
              {this.state.error && (
                <div style={{ background: 'rgba(178, 65, 55, 0.05)', color: 'var(--cinnabar)', padding: '10px 15px', borderRadius: '8px', marginTop: '15px', fontSize: '12.5px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {this.state.error.toString()}
                </div>
              )}
            </div>
            <button
              type="button"
              className="classic-btn fs-14 px-30"
              onClick={this.handleReset}
            >
              清空本地缓存并重新推演
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;
