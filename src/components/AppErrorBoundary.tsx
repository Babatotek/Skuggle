// @ts-nocheck — this workspace's React 19 install does not type class component state/props.
import React, {type ErrorInfo, type ReactNode} from 'react';

interface Props {
  children: ReactNode;
  preserveShell?: boolean;
  resetKey?: string;
}

interface State {
  hasError: boolean;
  reloading: boolean;
  referenceId: string;
}

function isChunkLoadFailure(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /ChunkLoadError|Failed to fetch dynamically imported module|Importing a module script failed/i.test(message);
}

export class AppErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {hasError: false, reloading: false, referenceId: ''};
  }

  static getDerivedStateFromError(): Pick<State, 'hasError'> {
    return {hasError: true};
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.setState({referenceId: globalThis.crypto?.randomUUID?.() ?? `ERR-${Date.now().toString(36).toUpperCase()}`});
    console.error('Skuggle render failure', error, info.componentStack);
    if (isChunkLoadFailure(error) && !sessionStorage.getItem('skuggle-vite-reload')) {
      sessionStorage.setItem('skuggle-vite-reload', '1');
      this.setState({reloading: true});
      window.location.reload();
    }
  }

  componentDidUpdate(previousProps: Props): void {
    if (this.state.hasError && previousProps.resetKey !== this.props.resetKey) {
      this.setState({hasError: false, reloading: false, referenceId: ''});
    }
  }

  render(): ReactNode {
    if (this.state.reloading) {
      return (
        <div className="min-h-screen bg-[#f3f0ff] flex items-center justify-center p-6 font-sans text-slate-600">
          <p className="text-sm">Refreshing Skuggle…</p>
        </div>
      );
    }

    if (this.state.hasError) {
      if (this.props.preserveShell) {
        return (
          <section role="alert" className="my-8 rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-sm">
            <strong className="block text-lg text-slate-900">This page could not be displayed.</strong>
            <p className="mt-2 text-sm text-slate-600">The rest of your workspace is still available. Try this page again or choose another section.</p>
            {this.state.referenceId && <p className="mt-2 text-xs text-slate-500">Reference: {this.state.referenceId}</p>}
            <button type="button" className="mt-5 rounded-xl bg-violet-600 px-5 py-2.5 font-bold text-white" onClick={() => this.setState({hasError: false, referenceId: ''})}>
              Try page again
            </button>
          </section>
        );
      }
      return (
        <div className="min-h-screen bg-[#f3f0ff] flex items-center justify-center p-6 font-sans">
          <div className="w-[min(88vw,360px)] p-7 text-center bg-white border border-violet-100 rounded-3xl shadow-[0_20px_45px_rgba(76,29,149,0.1)]">
            <div className="w-12 h-12 mx-auto mb-4 grid place-items-center rounded-2xl bg-violet-600 text-white text-2xl font-extrabold">
              S
            </div>
            <strong className="block text-slate-900 text-lg mb-2">Skuggle was unable to load this version correctly.</strong>
            <p className="text-[13px] leading-relaxed text-slate-600 m-0">
              Reload to fetch the latest application shell. Your data is not affected.
            </p>
            {this.state.referenceId && <p className="mt-2 text-xs text-slate-500">Reference: {this.state.referenceId}</p>}
            <button
              type="button"
              className="mt-[18px] w-full py-[11px] border-0 rounded-xl bg-violet-600 text-white font-bold cursor-pointer"
              onClick={() => window.location.reload()}
            >
              Reload application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
