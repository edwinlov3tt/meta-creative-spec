import React from 'react';
import { X } from 'lucide-react';
import { FacebookPreview } from './FacebookPreview';
import { InstagramPreview } from './InstagramPreview';
import { useCreativePreviewData } from '@/hooks/useCreativePreviewData';

interface DetailedPreviewModalProps {
  open: boolean;
  onClose: () => void;
}

export const DetailedPreviewModal: React.FC<DetailedPreviewModalProps> = ({ open, onClose }) => {
  const {
    adData,
    adFormat,
    adType
  } = useCreativePreviewData();

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center px-6">
      <div className="bg-white rounded-[16px] shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-16 font-semibold text-text-primary">Placement Preview</h2>
            <p className="text-12 text-text-muted">Side-by-side view of Facebook and Instagram formats</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="meta-icon-button"
            aria-label="Close detailed preview"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-auto bg-canvas p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-14 font-semibold text-text-primary">Facebook</h3>
              <FacebookPreview
                device="desktop"
                adType={adType}
                adFormat={adFormat}
                adData={adData}
              />
            </div>
            <div className="space-y-3">
              <h3 className="text-14 font-semibold text-text-primary">Instagram</h3>
              <InstagramPreview
                device="mobile"
                adType={adType}
                adFormat={adFormat}
                adData={adData}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
