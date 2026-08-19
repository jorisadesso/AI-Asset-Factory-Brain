"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: unknown): State {
    const message =
      error instanceof Error ? error.message : "Unbekannter Fehler";
    return { hasError: true, message };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] gap-4 p-6 rounded-xl border border-[var(--border)] bg-[var(--surface-card)]">
          <p className="text-sm text-[var(--text-secondary)] text-center max-w-sm">
            Etwas ist schiefgelaufen: {this.state.message}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, message: "" })}
            className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition"
          >
            Neu laden
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
