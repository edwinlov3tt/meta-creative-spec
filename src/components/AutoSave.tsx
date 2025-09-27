import React, { useEffect, useState } from 'react';
import { Check, Save, AlertCircle } from 'lucide-react';
import { useCreativeStore } from '@/stores/creativeStore';

export const AutoSave: React.FC = () => {
  const isDirty = useCreativeStore(state => state.isDirty);
  const saveSnapshot = useCreativeStore(state => state.saveSnapshot);
  const lastSavedAt = useCreativeStore(state => state.autosave.lastSavedAt);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(lastSavedAt ? new Date(lastSavedAt) : null);

  useEffect(() => {
    if (!isDirty) return;

    setIsSaving(true);
    setSaveError(null);

    const timer = window.setTimeout(() => {
      try {
        const timestamp = Date.now();
        saveSnapshot(timestamp);
        setLastSaved(new Date(timestamp));
      } catch (error) {
        console.error('Auto-save failed', error);
        setSaveError('Failed to auto-save');
      } finally {
        setIsSaving(false);
      }
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [isDirty, saveSnapshot]);

  useEffect(() => {
    if (lastSavedAt) {
      setLastSaved(new Date(lastSavedAt));
    }
  }, [lastSavedAt]);

  if (!isDirty && !lastSaved) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white border border-border rounded-card shadow-card px-3 py-2.5 flex items-center gap-2 min-w-[12rem]">
        {isSaving ? (
          <>
            <Save className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-12 text-text-primary">Saving…</span>
          </>
        ) : saveError ? (
          <>
            <AlertCircle className="w-4 h-4 text-danger" />
            <span className="text-12 text-danger">{saveError}</span>
          </>
        ) : lastSaved ? (
          <>
            <Check className="w-4 h-4 text-success" />
            <div className="text-12">
              <div className="text-text-primary">Auto-saved</div>
              <div className="text-text-muted">
                {lastSaved.toLocaleTimeString()}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};
