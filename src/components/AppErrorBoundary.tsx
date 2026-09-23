import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { message: string | null }

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { message: null }

  static getDerivedStateFromError(error: Error): State {
    return { message: error.message || 'Unknown error' }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack)
  }

  render() {
    if (!this.state.message) return this.props.children
    return (
      <div className="mx-auto flex min-h-svh max-w-lg flex-col justify-center px-6 text-ink">
        <h1 className="font-display text-3xl">That page hit a snag</h1>
        <p className="mt-3 text-sm leading-6 text-muted">{this.state.message}</p>
        <button
          type="button"
          className="mt-6 w-fit rounded-full bg-accent px-5 py-2 text-sm font-semibold text-black"
          onClick={() => {
            this.setState({ message: null })
            window.location.assign('/dashboard')
          }}
        >
          Back to dashboard
        </button>
      </div>
    )
  }
}
