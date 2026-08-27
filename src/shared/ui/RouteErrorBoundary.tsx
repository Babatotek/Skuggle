import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  label?: string;
};

type State = {
  error: Error | null;
};

/**
 * Prevents a failed lazy chunk or render error from trapping users on a Suspense spinner forever.
 */
export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Skuggle route failed to render", error, info.componentStack);
  }

  private retry = (): void => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="mx-auto flex min-h-[50vh] w-full max-w-lg flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <h1 className="text-xl font-black text-slate-900">
          {this.props.label ?? "Skuggle could not load this screen"}
        </h1>
        <p className="text-sm leading-6 text-slate-600">
          A required part of the app failed to load. Check your connection, then try again.
          If this continues after a deploy, hard-refresh to clear an old cached bundle.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={this.retry}
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => window.location.assign("/")}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-800"
          >
            Go to home
          </button>
        </div>
      </main>
    );
  }
}
