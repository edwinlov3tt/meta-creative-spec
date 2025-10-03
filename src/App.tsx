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
    <div className="h-screen bg-canvas flex flex-col overflow-hidden">
      <Header />

      <main className="flex-1 min-h-0 overflow-hidden">
        <ResizablePanels
          className="h-full"
          initialLeftWidth={56}
          minLeftWidth={35}
          maxLeftWidth={70}
          leftPanel={
            <FormBuilder />
          }
          rightPanel={
            <AdPreview />
          }
        />
      </main>

      <AutoSave />
      <ToastContainer />
    </div>
  );
}

export default App;
