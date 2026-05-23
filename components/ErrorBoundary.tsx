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
      <div className="border border-red-200 bg-red-50/40 px-4 py-3 my-2 flex items-start gap-3">
        <span className="font-display text-red-700 text-base leading-none mt-0.5">◆</span>
        <div className="flex-1 min-w-0">
          <p className="font-heading text-red-800 text-[14px] leading-snug">
            Coś się popsuło {this.props.label ? `w sekcji „${this.props.label}"` : 'w tej sekcji'}.
          </p>
          <p className="font-serif-body italic text-red-700/85 text-[12.5px] mt-1 leading-snug">
            reszta dashboardu działa. możesz spróbować ponownie albo odświeżyć stronę.
          </p>
          <button
            onClick={this.reset}
            className="mt-2 font-ui uppercase tracking-luxury text-[10px] text-red-900 hover:opacity-70 underline transition-opacity"
          >
            spróbuj jeszcze raz
          </button>
        </div>
      </div>
    )
  }
}
