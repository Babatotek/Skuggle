/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { DashboardLoading } from './components/dashboard/DashboardPrimitives';
import { ReleaseSkewBanner } from './components/ReleaseSkewBanner';
import { AppRouter } from './routing/AppRouter';

export default function App() {
  return (
    <AppProvider>
      <ReleaseSkewBanner />
      <BrowserRouter>
        <Suspense fallback={<div className="min-h-screen bg-[#FFFCF7] p-6"><DashboardLoading /></div>}>
          <AppRouter />
        </Suspense>
      </BrowserRouter>
    </AppProvider>
  );
}
