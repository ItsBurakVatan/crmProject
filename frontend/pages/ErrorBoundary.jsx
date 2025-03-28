// ErrorBoundary.jsx
import React from "react";

class ErrorBoundary extends React.Component {
    state = { hasError: false, error: null };

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-message">
                    <h2>Bir hata oluştu!</h2>
                    <p>{this.state.error?.message || "Bilinmeyen bir hata oluştu."}</p>
                    <button onClick={() => window.location.reload()}>Sayfayı Yenile</button>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
