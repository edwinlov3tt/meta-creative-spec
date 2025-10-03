import React, { useEffect } from 'react';
import { Header } from './components/Layout/Header';
import { FormBuilder } from './components/FormBuilder';
import { AdPreview } from './components/AdPreview';
import { ResizablePanels } from './components/UI/ResizablePanels';
import { AutoSave } from './components/AutoSave';
import { ToastContainer } from './components/UI/ToastContainer';
import { useCreativeStore } from '@/stores/creativeStore';

function App() {
  const loadAutosaveSnapshot = useCreativeStore(state => state.loadAutosaveSnapshot);

  useEffect(() => {
    loadAutosaveSnapshot();
  }, [loadAutosaveSnapshot]);

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <Header />

      <main className="flex-1 min-h-0 overflow-hidden">
        <ResizablePanels
          className="h-full"
          initialLeftWidth={56}
          minLeftWidth={35}
          maxLeftWidth={70}
          leftPanel={
            <div className="max-w-3xl mx-auto p-6 space-y-sp-6">
              <FormBuilder />
            </div>
          }
          rightPanel={
            <div className="h-full bg-surface-50 flex items-center justify-center">
              <div className="w-full max-w-md px-4 py-6">
                <AdPreview />
              </div>
            </div>
          }
        />
      </main>

      <AutoSave />
      <ToastContainer />
    </div>
  );
}

export default App;
