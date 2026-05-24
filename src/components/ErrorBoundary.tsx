import { Component } from "react";
import type { ReactNode, ErrorInfo } from "react";

interface Props  { children: ReactNode; }
interface State  { hasError: boolean; error: Error | null; }

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // You could log to an error reporting service here
    console.error("ErrorBoundary caught:", error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="text-center space-y-5 max-w-sm">
            {/* Icon */}
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
                <span className="text-4xl">😕</span>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-xl font-bold text-gray-900" dir="rtl">
              حدث خطأ غير متوقع
            </h1>

            {/* Subtitle */}
            <p className="text-gray-500 text-sm" dir="rtl">
              نعتذر عن هذا الخطأ. يرجى إعادة المحاولة.
            </p>

            {/* Error detail (dev only) */}
            {import.meta.env.DEV && this.state.error && (
              <pre className="text-left text-xs bg-gray-100 rounded-xl p-3 text-red-600 overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            )}

            {/* Reload button */}
            <button
              onClick={this.handleReload}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-2xl text-sm transition active:scale-95"
              dir="rtl"
            >
              أعد المحاولة
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}