import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { api, ApiError, API_BASE_URL as CREATIVE_API_BASE } from '@/services/api';
import { fileToBase64 } from '@/utils/file';
import { toPng, toJpeg } from 'html-to-image';
import JSZip from 'jszip';
import { slugify } from '@/utils/slugify';
import { showToast } from '@/stores/toastStore';
import { ExcelExportService } from '@/services/excelExportService';
import type {
  CreativeStore,
  CreativeBrief,
  AdCopyFields,
  PreviewSettings,
  UTMParameters,
  FacebookState,
  AIState,
  FacebookPageData,
  SpecExport,
  AutosaveState
} from '@/types/creative';

const ensureHttps = (url: string) => {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://${url}`;
};

const deriveFacebookFallback = (facebookUrl: string): FacebookPageData | null => {
  if (!facebookUrl) return null;

  const normalized = ensureHttps(facebookUrl.trim());

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch (error) {
    console.warn('Unable to parse Facebook URL for fallback', error);
    return null;
  }

  const host = parsed.hostname.toLowerCase();
  if (!host.includes('facebook.com') && !host.endsWith('fb.com')) {
    return null;
  }

  const slugCandidate = parsed.pathname.split('/').filter(Boolean)[0];
  if (!slugCandidate) return null;

  const slug = slugCandidate.split('?')[0].split('#')[0];
  if (!slug) return null;

  const readableName = slug
    .replace(/[-_]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(word => (word.length <= 2 ? word.toUpperCase() : `${word[0].toUpperCase()}${word.slice(1)}`))
    .join(' ');

  return {
    page_id: slug,
    name: readableName || slug,
    profile_picture: `https://graph.facebook.com/${encodeURIComponent(slug)}/picture?type=large`,
    url: normalized,
    method: 'client_url_fallback'
  } as FacebookPageData;
};

const humanizeMethod = (method?: string) => {
  if (!method) return undefined;
  return method
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map(segment => `${segment.charAt(0).toUpperCase()}${segment.slice(1)}`)
    .join(' ');
};

const labelFacebookMethod = (method?: string) => {
  if (!method) return undefined;
  const normalized = method.toLowerCase();
  if (normalized === 'worker_api' || normalized === 'worker') {
    return 'Meta Worker';
  }
  if (normalized === 'url_fallback') {
    return 'URL Fallback';
  }
  if (normalized === 'domain_fallback') {
    return 'Domain Fallback';
  }
  return humanizeMethod(method);
};

const base64ToUint8Array = (base64: string) => {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const dataUrlToUint8Array = (dataUrl: string) => {
  const parts = dataUrl.split(',');
  const base64 = parts.length > 1 ? parts[1] : parts[0];
  return base64ToUint8Array(base64);
};

const generateSpecSheet = (spec: SpecExport, trackedUrl: string) => {
  const lines = [
    'Meta Creative Spec Sheet',
    '==========================',
    '',
    `Ad Name: ${spec.refName || 'Untitled Creative'}`,
    '',
    'Primary Text:',
    spec.postText || '—',
    '',
    `Headline: ${spec.headline || '—'}`,
    `Description: ${spec.description || '—'}`,
    `CTA: ${spec.cta || '—'}`,
    '',
    `Platform: ${spec.platform}`,
    `Device: ${spec.device}`,
    `Ad Type: ${spec.adType}`,
    `Ad Format: ${spec.adFormat}`,
    '',
    `Destination URL: ${spec.destinationUrl || '—'}`,
    `Tracked URL: ${trackedUrl || '—'}`,
    '',
    'Meta Details:',
    `Company Overview: ${spec.meta.company || '—'}`,
    `Company Info: ${spec.meta.companyInfo || '—'}`,
    `Campaign Objective: ${spec.meta.objective || '—'}`,
    `Notes: ${spec.meta.notes || '—'}`,
    `Facebook Link: ${spec.meta.facebookLink || '—'}`,
    `Website: ${spec.meta.url || '—'}`,
  ];

  return lines.join('\n');
};

const defaultUTM = (): UTMParameters => ({
  campaign: 'Ignite',
  medium: 'Facebook',
  source: 'Townsquare',
  content: ''
});

const defaultBrief = (): CreativeBrief => ({
  facebookLink: '',
  websiteUrl: '',
  companyOverview: '',
  campaignObjective: '',
  companyInfo: '',
  additionalInstructions: '',
  customPrompt: '',
  salesFormula: '',
  includeEmoji: true,
  removeCharacterLimit: false,
  utm: defaultUTM(),
  creativeFile: null
});

const defaultAdCopy = (): AdCopyFields => ({
  adName: '',
  primaryText: '',
  headline: '',
  description: '',
  destinationUrl: '',
  displayLink: '',
  callToAction: 'Learn More'
});

const defaultPreview = (): PreviewSettings => ({
  platform: 'facebook',
  device: 'desktop',
  adType: 'feed',
  adFormat: 'original',
  forceExpandText: false
});

const defaultFacebookState = (): FacebookState => ({
  pageData: null,
  verificationStatus: 'idle',
  hasAttempted: false,
  error: null
});

const defaultAIState = (): AIState => ({
  isGenerating: false,
  hasGenerated: false,
  error: null,
  lastGeneratedAt: null
});

const defaultAutosaveState = (): AutosaveState => ({
  lastSavedAt: null,
  isSaving: false,
  error: null
});

const AUTOSAVE_STORAGE_KEY = 'meta-creative-autosave-snapshot';

export const useCreativeStore = create<CreativeStore>()(
  devtools(
    persist(
      (set, get) => ({
        brief: defaultBrief(),
        adCopy: defaultAdCopy(),
        preview: defaultPreview(),
        facebook: defaultFacebookState(),
        ai: defaultAIState(),
        autosave: defaultAutosaveState(),
        isDirty: false,
        previewNode: null,

        updateBrief: (updates) =>
          set(state => ({
            brief: { ...state.brief, ...updates },
            isDirty: true
          })),

        updateBriefField: (key, value) =>
          set(state => ({
            brief: { ...state.brief, [key]: value },
            isDirty: true
          })),

        updateUTM: (updates) =>
          set(state => ({
            brief: {
              ...state.brief,
              utm: { ...state.brief.utm, ...updates }
            },
            isDirty: true
          })),

        setCreativeFile: (file) =>
          set(state => ({
            brief: { ...state.brief, creativeFile: file },
            isDirty: true
          })),

        updateAdCopy: (updates) =>
          set(state => ({
            adCopy: { ...state.adCopy, ...updates },
            isDirty: true
          })),

        updateAdCopyField: (key, value) =>
          set(state => ({
            adCopy: { ...state.adCopy, [key]: value },
            isDirty: true
          })),

        setPreview: (updates) =>
          set(state => ({
            preview: { ...state.preview, ...updates },
            isDirty: true
          })),

        setFacebookState: (facebookUpdates) =>
          set(state => ({
            facebook: { ...state.facebook, ...facebookUpdates },
            isDirty: facebookUpdates.pageData !== undefined ? true : state.isDirty
          })),

        setFacebookPageData: (data) =>
          set(state => ({
            facebook: {
              ...state.facebook,
              pageData: data,
              verificationStatus: data ? 'success' : 'idle',
              hasAttempted: Boolean(data),
              error: null
            },
            brief: {
              ...state.brief,
              companyOverview:
                state.brief.companyOverview || (data?.intro ?? state.brief.companyOverview),
              websiteUrl:
                state.brief.websiteUrl || (data?.website ? ensureHttps(data.website) : state.brief.websiteUrl)
            },
            isDirty: true
          })),

        setAIState: (aiUpdates) =>
          set(state => ({
            ai: { ...state.ai, ...aiUpdates }
          })),

        setAutosaveState: (updates) =>
          set(state => ({
            autosave: { ...state.autosave, ...updates }
          })),

        setPreviewNode: (node) =>
          set({ previewNode: node ?? null }),

        markDirty: () => set({ isDirty: true }),

        markSaved: (timestamp = Date.now()) =>
          set({
            isDirty: false,
            autosave: { lastSavedAt: timestamp, isSaving: false, error: null }
          }),

        resetStore: () =>
          set({
            brief: defaultBrief(),
            adCopy: defaultAdCopy(),
            preview: defaultPreview(),
            facebook: defaultFacebookState(),
            ai: defaultAIState(),
            autosave: defaultAutosaveState(),
            isDirty: false
          }),

        exportSpec: (): SpecExport => {
          const state = get();
          const { adCopy, brief, preview, facebook } = state;

          const spec: SpecExport = {
            refName: adCopy.adName,
            adName: adCopy.adName,
            postText: adCopy.primaryText,
            headline: adCopy.headline,
            description: adCopy.description,
            destinationUrl: adCopy.destinationUrl || brief.websiteUrl,
            displayLink: adCopy.displayLink,
            cta: adCopy.callToAction,
            imageName: brief.creativeFile?.name || 'creative-image',
            facebookPageUrl: brief.facebookLink,
            platform: preview.platform,
            device: preview.device,
            adType: preview.adType,
            adFormat: preview.adFormat,
            meta: {
              company: brief.companyOverview,
              companyInfo: brief.companyInfo,
              objective: brief.campaignObjective,
              customPrompt: brief.customPrompt,
              formula: brief.salesFormula,
              facebookLink: brief.facebookLink,
              url: brief.websiteUrl,
              notes: brief.additionalInstructions,
              facebookPageData: facebook.pageData
            }
          };
          return spec;
        },

        getTrackedUrl: () => {
          const state = get();
          const baseInput = state.adCopy.destinationUrl || state.brief.websiteUrl;
          if (!baseInput) return '';

          let url: URL;
          try {
            url = new URL(baseInput);
          } catch {
            try {
              url = new URL(`https://${baseInput}`);
            } catch {
              return '';
            }
          }

          const defaults = defaultUTM();
          const campaign = (state.brief.utm.campaign || defaults.campaign).trim();
          const medium = (state.brief.utm.medium || defaults.medium).trim();
          const source = (state.brief.utm.source || defaults.source).trim();
          const contentRaw = state.brief.utm.content || state.adCopy.adName || '';
          const content = slugify(contentRaw);

          const params = url.searchParams;
          params.set('utm_campaign', campaign || defaults.campaign);
          params.set('utm_medium', medium || defaults.medium);
          params.set('utm_source', source || defaults.source);
          if (content) {
            params.set('utm_content', content);
          } else {
            params.delete('utm_content');
          }

          url.search = params.toString();
          return url.toString();
        },

        applyTrackedUrl: () => {
          const tracked = get().getTrackedUrl();
          if (!tracked) return;
          set(state => ({
            adCopy: {
              ...state.adCopy,
              destinationUrl: tracked
            },
            isDirty: true
          }));
        },

        processCreativeUpload: async (file) => {
          if (!file) {
            set(state => ({
              brief: { ...state.brief, creativeFile: null },
              isDirty: true
            }));
            showToast('Creative removed', 'info');
            return;
          }

          const base64 = await fileToBase64(file);
          set(state => ({
            brief: {
              ...state.brief,
              creativeFile: {
                name: file.name,
                size: file.size,
                type: file.type,
                data: base64.data
              }
            },
            isDirty: true
          }));
          showToast('Creative ready for AI analysis', 'success');
        },

        verifyFacebookPage: async (facebookUrl, websiteUrl) => {
          const inputUrl = facebookUrl.trim();
          if (!inputUrl) {
            set(state => ({
              facebook: {
                ...state.facebook,
                error: 'Please provide a Facebook page URL',
                verificationStatus: 'error'
              }
            }));
            return;
          }

          const resolvedFacebookUrl = ensureHttps(inputUrl);

          set(state => ({
            facebook: {
              ...state.facebook,
              verificationStatus: 'pending',
              hasAttempted: true,
              error: null
            }
          }));

          const commitFacebookSuccess = (pageData: FacebookPageData | null, methodLabel?: string) => {
            set(state => ({
              facebook: {
                ...state.facebook,
                pageData,
                verificationStatus: 'success',
                hasAttempted: true,
                error: null
              },
              brief: {
                ...state.brief,
                facebookLink: resolvedFacebookUrl,
                companyOverview:
                  state.brief.companyOverview || pageData?.intro || state.brief.companyOverview,
                websiteUrl:
                  state.brief.websiteUrl ||
                  (pageData?.website ? ensureHttps(pageData.website) : state.brief.websiteUrl)
              },
              isDirty: true
            }));
            const suffix = methodLabel ? ` (${methodLabel})` : '';
            showToast(`Facebook page verified${suffix}`, 'success');
          };

          try {
            const response = await api.verifyFacebookPage({
              facebookUrl: resolvedFacebookUrl,
              websiteUrl: websiteUrl || get().brief.websiteUrl
            });
            const pageData = (response.data ?? null) as FacebookPageData | null;
            const methodLabel = labelFacebookMethod(response.method);
            if (Array.isArray(response.errors) && response.errors.length > 0) {
              console.warn('Facebook verification warnings', {
                facebookUrl: resolvedFacebookUrl,
                warnings: response.errors
              });
            }
            commitFacebookSuccess(pageData, methodLabel);
            return;
          } catch (error) {
            if (error instanceof ApiError && error.status === 0) {
              const fallbackData = deriveFacebookFallback(resolvedFacebookUrl);
              if (fallbackData) {
                set(state => ({
                  facebook: {
                    ...state.facebook,
                    pageData: fallbackData,
                    verificationStatus: 'success',
                    hasAttempted: true,
                    error: null
                  },
                  brief: {
                    ...state.brief,
                    facebookLink: resolvedFacebookUrl
                  },
                  isDirty: true
                }));
                const baseHint = CREATIVE_API_BASE ? ` (${CREATIVE_API_BASE})` : '';
                console.warn('Using client-side Facebook fallback', {
                  facebookUrl: resolvedFacebookUrl
                });
                showToast(`API offline${baseHint}. Using basic info from URL.`, 'warning');
                return;
              }
            }

            console.error('Facebook verification failed', {
              facebookUrl: resolvedFacebookUrl,
              error
            });

            const message = error instanceof ApiError ? error.message : 'Unable to verify Facebook page';
            set(state => ({
              facebook: {
                ...state.facebook,
                verificationStatus: 'error',
                hasAttempted: true,
                error: message
              }
            }));
            showToast(message, 'error');
          }
        },

        generateAdCopy: async () => {
          const state = get();
          const { brief, facebook } = state;
          const previouslyGenerated = state.ai.hasGenerated;

          if (!brief.websiteUrl || !brief.companyOverview || !brief.campaignObjective) {
            set(() => ({
              ai: {
                ...state.ai,
                error: 'Please complete required fields before generating copy'
              }
            }));
            return;
          }

          set(() => ({
            ai: {
              ...state.ai,
              isGenerating: true,
              error: null
            }
          }));

          try {
            const payload = {
              website: ensureHttps(brief.websiteUrl),
              companyOverview: brief.companyOverview,
              objective: brief.campaignObjective,
              salesFormula: brief.salesFormula || undefined,
              companyInfo: brief.companyInfo || undefined,
              instructions: brief.additionalInstructions || undefined,
              customPrompt: brief.customPrompt || undefined,
              includeEmoji: brief.includeEmoji,
              facebookPageData: facebook.pageData || undefined,
              creativeData: brief.creativeFile
                ? {
                    type: brief.creativeFile.type,
                    data: brief.creativeFile.data || ''
                  }
                : null
            };

            const response = await api.generateAdCopy(payload);
            const methodLabel = response.method ? `AI — ${humanizeMethod(response.method)}` : undefined;

            set(state => ({
              adCopy: {
                ...state.adCopy,
                primaryText: response.data.postText,
                headline: response.data.headline,
                description: response.data.linkDescription,
                displayLink: response.data.displayLink,
                callToAction: response.data.cta,
                adName: response.data.adName,
                destinationUrl: ensureHttps(brief.websiteUrl)
              },
              ai: {
                isGenerating: false,
                hasGenerated: true,
                error: null,
                lastGeneratedAt: Date.now()
              },
              isDirty: true
            }));
            const toastSuffix = methodLabel ? ` (${methodLabel})` : '';
            showToast(
              previouslyGenerated ? `Ad copy regenerated${toastSuffix}` : `Ad copy generated${toastSuffix}`,
              'success'
            );
            get().applyTrackedUrl();
          } catch (error) {
            const message = error instanceof ApiError ? error.message : 'Unable to generate ad copy';
            set(state => ({
              ai: {
                ...state.ai,
                isGenerating: false,
                error: message
              }
            }));
            showToast(message, 'error');
          }
        },

        regenerateAdCopy: async () => {
          await get().generateAdCopy();
        },

        copySpecToClipboard: async () => {
          const spec = get().exportSpec();
          await navigator.clipboard.writeText(JSON.stringify(spec, null, 2));
          showToast('Creative spec copied to clipboard', 'success');
        },

        downloadSpecJson: () => {
          const spec = get().exportSpec();
          const blob = new Blob([JSON.stringify(spec, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${spec.refName || 'creative-spec'}-${Date.now()}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          showToast('Creative spec JSON downloaded', 'success');
        },

        downloadSpecSheet: async () => {
          try {
            const spec = get().exportSpec();
            const excelService = new ExcelExportService();
            const excelBuffer = await excelService.generateExcel(spec, spec.facebookPageUrl);
            const filename = excelService.generateFilename(spec.refName || 'creative-spec', true);

            const blob = new Blob([excelBuffer], {
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('Excel spec sheet downloaded', 'success');
          } catch (error) {
            console.error('Failed to download spec sheet', error);
            showToast('Failed to download spec sheet', 'error');
          }
        },

        downloadBundle: async () => {
          const node = get().previewNode;
          if (!node) {
            showToast('Preview not ready to export', 'error');
            return;
          }

          try {
            const zip = new JSZip();
            const spec = get().exportSpec();
            const timestamp = Date.now();

            // 1. Add JSON spec
            zip.file('creative-spec.json', JSON.stringify(spec, null, 2));

            // 2. Generate and add Excel spec sheet
            try {
              const excelService = new ExcelExportService();
              const excelBuffer = await excelService.generateExcel(spec, spec.facebookPageUrl);
              const excelFilename = excelService.generateFilename(spec.refName || 'creative-spec', false);
              zip.file(excelFilename, excelBuffer);
            } catch (error) {
              console.error('Failed to generate Excel file', error);
              showToast('Warning: Excel file skipped', 'warning');
            }

            // 3. Add text-based spec sheet for easy reading
            const trackedUrl = spec.destinationUrl || spec.facebookPageUrl || '';
            const textSpec = generateSpecSheet(spec, trackedUrl);
            zip.file('creative-spec.txt', textSpec);

            // 4. Add preview screenshots (PNG and JPG)
            try {
              // Temporarily expand text for export
              set(state => ({
                preview: { ...state.preview, forceExpandText: true }
              }));

              // Wait for React to re-render
              await new Promise(resolve => setTimeout(resolve, 100));

              const creative = get().brief.creativeFile;

              // Convert blob URLs back to data URLs for export
              const filter = (node: HTMLElement) => {
                if (node.tagName === 'IMG') {
                  const img = node as HTMLImageElement;
                  if (img.src.startsWith('blob:') && creative?.data && creative?.type) {
                    // Replace blob URL with data URL for export
                    img.src = `data:${creative.type};base64,${creative.data}`;
                  }
                }
                return true;
              };

              const pngDataUrl = await toPng(node, {
                cacheBust: true,
                pixelRatio: 2,
                skipFonts: true,
                filter
              });
              const jpgDataUrl = await toJpeg(node, {
                cacheBust: true,
                quality: 0.95,
                pixelRatio: 2,
                skipFonts: true,
                filter
              });

              zip.file('previews/preview.png', dataUrlToUint8Array(pngDataUrl));
              zip.file('previews/preview.jpg', dataUrlToUint8Array(jpgDataUrl));

              // Restore normal state
              set(state => ({
                preview: { ...state.preview, forceExpandText: false }
              }));
            } catch (error) {
              console.error('Failed to generate preview screenshots', error);
              showToast('Warning: Preview screenshots skipped', 'warning');
              // Restore normal state even on error
              set(state => ({
                preview: { ...state.preview, forceExpandText: false }
              }));
            }

            // 5. Add original creative file
            const creativeFile = get().brief.creativeFile;
            if (creativeFile?.data && creativeFile?.name) {
              try {
                const bytes = base64ToUint8Array(creativeFile.data);
                const ext = creativeFile.name.split('.').pop()?.toLowerCase();

                // Add original
                zip.file(`creatives/original/${creativeFile.name}`, bytes);

                // Add copies in standard formats for easy use
                if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'webp') {
                  zip.file(`creatives/1080x1080-feed.${ext}`, bytes);
                  zip.file(`creatives/1080x1350-story.${ext}`, bytes);
                }
              } catch (error) {
                console.error('Failed to add creative file', error);
                showToast('Warning: Creative file skipped', 'warning');
              }
            }

            // Generate and download the bundle
            const bundle = await zip.generateAsync({
              type: 'blob',
              compression: 'DEFLATE',
              compressionOptions: { level: 6 }
            });

            const url = URL.createObjectURL(bundle);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${slugify(spec.refName || 'creative-spec')}-bundle-${timestamp}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showToast('Creative bundle downloaded successfully', 'success');
          } catch (error) {
            console.error('Failed to export bundle', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            showToast(`Failed to export bundle: ${errorMessage}`, 'error');
          }
        },

        loadAutosaveSnapshot: () => {
          try {
            const raw = localStorage.getItem(AUTOSAVE_STORAGE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw) as {
              savedAt: number;
              state: {
                brief: CreativeBrief;
                adCopy: AdCopyFields;
                preview: PreviewSettings;
                facebook: FacebookState;
              };
            };
            if (!parsed?.state) return;
            set(state => ({
              brief: { ...state.brief, ...parsed.state.brief },
              adCopy: { ...state.adCopy, ...parsed.state.adCopy },
              preview: { ...state.preview, ...parsed.state.preview },
              facebook: { ...state.facebook, ...parsed.state.facebook },
              autosave: { lastSavedAt: parsed.savedAt, isSaving: false, error: null },
              isDirty: false
            }));
          } catch (error) {
            console.error('Failed to load autosave snapshot', error);
          }
        },

        saveSnapshot: (timestamp = Date.now()) => {
          const state = get();
          const snapshot = {
            savedAt: timestamp,
            state: {
              brief: state.brief,
              adCopy: state.adCopy,
              preview: state.preview,
              facebook: state.facebook
            }
          } satisfies { savedAt: number; state: { brief: CreativeBrief; adCopy: AdCopyFields; preview: PreviewSettings; facebook: FacebookState } };

          try {
            localStorage.setItem(AUTOSAVE_STORAGE_KEY, JSON.stringify(snapshot));
            set(state => ({
              autosave: { ...state.autosave, lastSavedAt: timestamp, isSaving: false, error: null },
              isDirty: false
            }));
          } catch (error) {
            console.error('Failed to persist snapshot', error);
            set(state => ({
              autosave: { ...state.autosave, isSaving: false, error: 'Failed to auto-save' }
            }));
          }
        },

        exportPreviewImage: async (format) => {
          const node = get().previewNode;
          if (!node) {
            throw new Error('Preview element not available');
          }

          // Temporarily expand text for export
          set(state => ({
            preview: { ...state.preview, forceExpandText: true }
          }));

          // Wait for React to re-render
          await new Promise(resolve => setTimeout(resolve, 100));

          try {
            const creative = get().brief.creativeFile;

            // Convert blob URLs back to data URLs for export
            const filter = (node: HTMLElement) => {
              if (node.tagName === 'IMG') {
                const img = node as HTMLImageElement;
                if (img.src.startsWith('blob:') && creative?.data && creative?.type) {
                  // Replace blob URL with data URL for export
                  img.src = `data:${creative.type};base64,${creative.data}`;
                }
              }
              return true;
            };

            const exportFn = format === 'png' ? toPng : toJpeg;
            const dataUrl = await exportFn(node, {
              cacheBust: true,
              quality: format === 'jpg' ? 0.92 : 1,
              skipFonts: true,
              filter
            });

            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `creative-preview-${Date.now()}.${format}`;
            link.click();
            showToast(`Preview exported as ${format.toUpperCase()}`, 'success');
          } finally {
            // Restore normal state
            set(state => ({
              preview: { ...state.preview, forceExpandText: false }
            }));
          }
        }
      }),
      {
        name: 'meta-creative-builder-storage',
        partialize: (state) => ({
          brief: state.brief,
          adCopy: state.adCopy,
          preview: state.preview,
          facebook: state.facebook,
          ai: state.ai,
          autosave: state.autosave,
          isDirty: state.isDirty
        }),
        merge: (persistedState, currentState) => {
          const typedPersisted = persistedState as Partial<CreativeStore> | undefined;
          return {
            ...currentState,
            ...typedPersisted,
            autosave: {
              ...defaultAutosaveState(),
              ...(typedPersisted?.autosave ?? {})
            }
          };
        }
      }
    )
  )
);
