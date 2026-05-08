'use client'
import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  label?: string
}

interface State {
  hasError: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.error(`[ErrorBoundary${this.props.label ? ` · ${this.props.label}` : ''}]`, error)
  }

  reset = () => this.setState({ hasError: false })

  render() {
    if (!this.state.hasError) return this.props.children
    if (this.props.fallback) return this.props.fallback

    return (
      <div className="bg-rose-50/80 border border-rose-200/60 rounded-xl px-4 py-3 my-2">
        <p className="font-serif text-rose-800 text-sm mb-1">
          Coś się popsuło {this.props.label ? `w sekcji "${this.props.label}"` : 'w tej sekcji'}.
        </p>
        <p className="font-sans text-xs text-rose-700/80 mb-2">
          Reszta dashboardu działa. Możesz spróbować ponownie albo odświeżyć stronę.
        </p>
        <button
          onClick={this.reset}
          className="font-sans text-xs text-rose-900 underline hover:no-underline"
        >
          Spróbuj jeszcze raz
        </button>
      </div>
    )
  }
}
