import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { Buffer } from 'buffer'

// Polyfill Buffer for libraries that depend on it
if (typeof window !== 'undefined') {
  window.Buffer = Buffer
}

// Error Boundary for catching rendering errors
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null, errorInfo: null }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
    console.error('Error caught by ErrorBoundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 dark:bg-red-900/10 p-4">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-4 text-left">
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                {this.state.error?.toString()}
              </p>
              <details className="text-xs">
                <summary className="cursor-pointer mb-1">Technical details</summary>
                <pre className="overflow-x-auto p-2 bg-gray-100 dark:bg-gray-700 rounded">
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Development wrapper for performance monitoring
const DevelopmentWrapper = ({ children }) => {
  if (process.env.NODE_ENV === 'development') {
    return (
      <React.Profiler
        id="App"
        onRender={(id, phase, actualDuration) => {
          if (actualDuration > 100) {
            console.warn(`Performance warning: ${id} took ${actualDuration}ms`);
          }
        }}
      >
        {children}
      </React.Profiler>
    )
  }
  return children
}

// Main render function
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <DevelopmentWrapper>
          <App />
        </DevelopmentWrapper>
      </ErrorBoundary>
    </BrowserRouter>
  </React.StrictMode>
)