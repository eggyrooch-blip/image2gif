import React, { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

/**
 * ErrorBoundary - Catches JavaScript errors in child components
 * Prevents crashes from propagating to the rest of the app
 */
class ErrorBoundaryInner extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        // Log error to console for debugging
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        if (this.props.onReset) {
            this.props.onReset();
        }
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            const { language } = this.props;
            const isZh = language === 'zh';

            // Default error UI
            return (
                <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-6">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-500" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">
                            {isZh ? '出现错误' : 'Something went wrong'}
                        </h2>
                        <p className="text-gray-600 mb-6">
                            {isZh
                                ? '编辑器遇到错误无法继续。您的图片是安全的 - 点击下方重试。'
                                : 'The editor encountered an error and couldn\'t continue. Your images are safe - click below to try again.'}
                        </p>
                        {this.state.error && (
                            <details className="mb-6 text-left">
                                <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                                    {isZh ? '技术详情' : 'Technical details'}
                                </summary>
                                <pre className="mt-2 p-3 bg-gray-100 rounded-lg text-xs text-gray-700 overflow-x-auto">
                                    {this.state.error.toString()}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </details>
                        )}
                        <button
                            onClick={this.handleReset}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            {isZh ? '关闭并重试' : 'Close and Try Again'}
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

// Wrapper component to use hooks
function ErrorBoundary(props) {
    const { language } = useLanguage();
    return <ErrorBoundaryInner {...props} language={language} />;
}

export default ErrorBoundary;
