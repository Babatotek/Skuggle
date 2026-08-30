// @ts-nocheck — this workspace's React 19 install does not type class component state/props.
import React, {type ErrorInfo, type ReactNode} from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  reloading: boolean;
}

function isChunkLoadFailure(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /ChunkLoadError|Failed to fetch dynamically imported module|Importing a module script failed/i.test(message);
}

export class AppErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {hasError: false, reloading: false};
  }

  static getDerivedStateFromError(): Pick<State, 'hasError'> {
    return {hasError: true};
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Skuggle render failure', error, info.componentStack);
    if (isChunkLoadFailure(error) && !sessionStorage.getItem('skuggle-vite-reload')) {
      sessionStorage.setItem('skuggle-vite-reload', '1');
      this.setState({reloading: true});
      window.location.reload();
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
