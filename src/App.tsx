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
            <div className="h-full flex flex-col bg-white">
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto p-6 space-y-sp-6">
                  <FormBuilder />
                </div>
              </div>
            </div>
          }
          rightPanel={
            <div className="h-full bg-surface-50 px-4 py-6 flex justify-center overflow-hidden">
              <div className="w-full max-w-md">
                <div className="sticky top-6">
                  <AdPreview />
                </div>
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
