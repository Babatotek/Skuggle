import {useEffect, useState} from 'react';
import {reconcileReleaseSkew} from '../lib/releaseSkew';

export function ReleaseSkewBanner() {
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    let active = true;
    void reconcileReleaseSkew().then((status) => {
      if (active && status === 'stuck') {
        setStuck(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  if (!stuck) {
    return null;
  }

  return (
    <div
      role="status"
      className="fixed bottom-4 inset-x-4 z-[60] mx-auto max-w-lg rounded-2xl border border-indigo-200 bg-white px-4 py-3 shadow-xl flex items-center justify-between gap-3"
    >
      <p className="text-sm text-slate-700 m-0">
        A new version of Skuggle is available. Refresh to stay in sync.
      </p>
      <button
        type="button"
        className="shrink-0 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white"
        onClick={() => window.location.reload()}
      >
        Refresh
      </button>
    </div>
  );
}
