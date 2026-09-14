/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { BootSuspenseFallback } from './components/PublicBootLoader';
import { ReleaseSkewBanner } from './components/ReleaseSkewBanner';
import { AppRouter } from './routing/AppRouter';

export default function App() {
  return (
    <AppProvider>
      <ReleaseSkewBanner />
      <BrowserRouter>
        <Suspense fallback={<BootSuspenseFallback />}>
          <AppRouter />
        </Suspense>
      </BrowserRouter>
    </AppProvider>
  );
}
