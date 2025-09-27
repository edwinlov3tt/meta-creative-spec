import React, { useState } from 'react';
import { Download, RotateCcw, Save, FileImage, ChevronDown } from 'lucide-react';
import { Button } from '@/components/UI/Button';
import { useCreativeStore } from '@/stores/creativeStore';
import { showToast } from '@/stores/toastStore';

export const Header: React.FC = () => {
  const activeCreativeName = useCreativeStore(state => state.adCopy.adName || 'Creative Preview');
  const isDirty = useCreativeStore(state => state.isDirty);
  const resetStore = useCreativeStore(state => state.resetStore);
  const saveSnapshot = useCreativeStore(state => state.saveSnapshot);
  const copySpecToClipboard = useCreativeStore(state => state.copySpecToClipboard);
  const downloadSpecJson = useCreativeStore(state => state.downloadSpecJson);
  const downloadSpecSheet = useCreativeStore(state => state.downloadSpecSheet);
  const downloadBundle = useCreativeStore(state => state.downloadBundle);
  const exportPreviewImage = useCreativeStore(state => state.exportPreviewImage);
  const aiState = useCreativeStore(state => state.ai);

  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const handleReset = () => {
    resetStore();
    showToast('Workspace reset', 'info');
  };

  const handleSave = () => {
    const timestamp = Date.now();
    saveSnapshot(timestamp);
    showToast('Workspace saved', 'success');
  };

  const handleCopy = async () => {
    await copySpecToClipboard();
  };

  const handleDownloadBundle = async () => {
    await downloadBundle();
  };

  const handleExport = async (format: 'png' | 'jpg') => {
    try {
      await exportPreviewImage(format);
    } catch (error) {
      console.error('Preview export failed', error);
      showToast('Preview export failed', 'error');
    }
  };

  return (
    <header className="bg-white border-b border-surface-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-meta-blue rounded-lg flex items-center justify-center text-white font-semibold">
            C
          </div>
          <div>
            <h1 className="text-lg font-semibold text-surface-900">
              Meta Creative Builder
            </h1>
            <p className="text-sm text-surface-600">
              {activeCreativeName}
              {isDirty && <span className="text-warning ml-2">• Unsaved changes</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Button onClick={handleReset} variant="ghost" size="sm" title="Reset all form data">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Button onClick={handleSave} variant="outline" size="sm" title="Save current fields locally" disabled={aiState.isGenerating}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>

          <div className="h-8 w-px bg-surface-200" />

          <div className="flex items-center space-x-2">
            <div className="relative">
              <Button
                onClick={() => setExportMenuOpen(prev => !prev)}
                variant="outline"
                size="sm"
                title="Export preview or spec"
              >
                <FileImage className="w-4 h-4 mr-2" />
                Export
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
              {exportMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-card border border-border bg-white shadow-lg text-12 text-text-primary py-2"
                  onMouseLeave={() => setExportMenuOpen(false)}
                >
                  <button
                    type="button"
                    className="w-full text-left px-4 py-2 hover:bg-surface-100"
                    onClick={() => { setExportMenuOpen(false); void handleExport('png'); }}
                  >
                    Preview PNG
                  </button>
                  <button
                    type="button"
                    className="w-full text-left px-4 py-2 hover:bg-surface-100"
                    onClick={() => { setExportMenuOpen(false); void handleExport('jpg'); }}
                  >
                    Preview JPG
                  </button>
                  <button
                    type="button"
                    className="w-full text-left px-4 py-2 hover:bg-surface-100"
                    onClick={() => { setExportMenuOpen(false); downloadSpecSheet(); }}
                  >
                    Spec Sheet (.txt)
                  </button>
                  <button
                    type="button"
                    className="w-full text-left px-4 py-2 hover:bg-surface-100"
                    onClick={() => { setExportMenuOpen(false); downloadSpecJson(); }}
                  >
                    Spec JSON (.json)
                  </button>
                  <button
                    type="button"
                    className="w-full text-left px-4 py-2 hover:bg-surface-100"
                    onClick={() => { setExportMenuOpen(false); void handleCopy(); }}
                  >
                    Copy JSON to Clipboard
                  </button>
                </div>
              )}
            </div>
            <Button onClick={() => { void handleDownloadBundle(); }} variant="meta" size="sm" title="Download zip bundle">
              <Download className="w-4 h-4 mr-2" />
              Download Spec
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
