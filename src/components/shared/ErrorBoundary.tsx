import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(_: Error): State {
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen grid place-items-center bg-slate-50 p-8">
                    <div className="text-center space-y-4 max-w-md">
                        <div className="w-16 h-16 bg-accent-rose/10 text-accent-rose rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                        </div>
                        <h1 className="text-2xl font-black text-slate-900">Oops, Terjadi Kesalahan.</h1>
                        <p className="text-sm text-slate-500 leading-relaxed">System mendeteksi gangguan pada modul ini. Mohon refresh halaman atau hubungi IT Support.</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm tracking-wider uppercase"
                        >
                            Refresh App
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
