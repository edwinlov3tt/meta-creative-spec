import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/UI/Button';
import { useCreativeStore } from '@/stores/creativeStore';
import { showToast } from '@/stores/toastStore';

export const AdvertiserInfoStep: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAdditional, setShowAdditional] = useState(false);

  const facebookLink = useCreativeStore(state => state.brief.facebookLink);
  const websiteUrl = useCreativeStore(state => state.brief.websiteUrl);
  const companyOverview = useCreativeStore(state => state.brief.companyOverview);
  const campaignObjective = useCreativeStore(state => state.brief.campaignObjective);
  const updateBriefField = useCreativeStore(state => state.updateBriefField);
  const facebook = useCreativeStore(state => state.facebook);
  const aiState = useCreativeStore(state => state.ai);
  const verifyFacebookPage = useCreativeStore(state => state.verifyFacebookPage);
  const generateAdCopy = useCreativeStore(state => state.generateAdCopy);
  const setFacebookPageData = useCreativeStore(state => state.setFacebookPageData);
  const includeEmoji = useCreativeStore(state => state.brief.includeEmoji);
  const additionalInstructions = useCreativeStore(state => state.brief.additionalInstructions);
  const creativeFile = useCreativeStore(state => state.brief.creativeFile);
  const processCreativeUpload = useCreativeStore(state => state.processCreativeUpload);

  const isGenerateDisabled = !websiteUrl || !companyOverview || aiState.isGenerating;
  const advertiserFieldsDisabled = facebook.verificationStatus !== 'success';
  const pageData = facebook.pageData;
  const pageCategory = useMemo(() => (pageData?.categories ? pageData.categories.join(', ') : ''), [pageData?.categories]);
  const instagramHandle = useMemo(() => {
    if (!pageData) return '';
    if (pageData.instagram_url) return pageData.instagram_url;
    const username = pageData.instagram_details?.result?.username;
    return username ? `https://www.instagram.com/${username}` : '';
  }, [pageData]);

  const handleVerifyFacebook = async () => {
    await verifyFacebookPage(facebookLink, websiteUrl);
  };

  const handleGenerateAdCopy = async () => {
    await generateAdCopy();
  };

  const handleFacebookButtonClick = async () => {
    if (facebook.verificationStatus === 'success') {
      setFacebookPageData(null);
      showToast('Facebook page reset', 'info');
      return;
    }
    await handleVerifyFacebook();
  };

  return (
    <div className="card">
      <button
        type="button"
        className="w-full flex items-center justify-between p-6 text-left"
        onClick={() => setIsExpanded(prev => !prev)}
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-text-muted" />
          ) : (
            <ChevronRight className="w-5 h-5 text-text-muted" />
          )}
          <div>
            <h2 className="text-16 font-semibold text-text-primary">Step 1: Advertiser Info</h2>
            <p className="text-12 text-text-muted">Provide brand context, website, and goals.</p>
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 space-y-sp-4">
          <div className="space-y-2">
            <label className="text-12 text-text-muted font-medium">Advertiser Facebook Link</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={facebookLink}
                onChange={(e) => updateBriefField('facebookLink', e.target.value)}
                placeholder="https://facebook.com/brand"
                className="form-input flex-1"
              />
              <Button
                variant={facebook.verificationStatus === 'success' ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => { void handleFacebookButtonClick(); }}
                disabled={facebook.verificationStatus === 'pending' || !facebookLink}
              >
                {facebook.verificationStatus === 'pending'
                  ? 'Verifying…'
                  : facebook.verificationStatus === 'success'
                    ? 'Reset'
                    : 'Verify'}
              </Button>
            </div>
            {facebook.error && (
              <p className="text-11 text-danger">{facebook.error}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-12 text-text-muted font-medium">
              Website / CTA URL <span className="text-danger">*</span>
            </label>
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => updateBriefField('websiteUrl', e.target.value)}
              placeholder="https://example.com"
              className="form-input"
              required
              disabled={advertiserFieldsDisabled}
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center justify-between text-12 text-text-muted font-medium">
              <span>Company Overview <span className="text-danger">*</span></span>
              <span className="text-11 text-text-muted">{companyOverview.length}/500</span>
            </label>
            <textarea
              value={companyOverview}
              onChange={(e) => updateBriefField('companyOverview', e.target.value.slice(0, 500))}
              placeholder="Describe your company, products, and target audience..."
              className="form-textarea h-24"
              maxLength={500}
              required
              disabled={advertiserFieldsDisabled}
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center justify-between text-12 text-text-muted font-medium">
              <span>Campaign Objective</span>
              <span className="text-11 text-text-muted">{campaignObjective.length}/300</span>
            </label>
            <textarea
              value={campaignObjective}
              onChange={(e) => updateBriefField('campaignObjective', e.target.value.slice(0, 300))}
              placeholder="What are your marketing goals for this campaign?"
              className="form-textarea h-20"
              maxLength={300}
              disabled={advertiserFieldsDisabled}
            />
          </div>

          <div className="space-y-2">
            <label className="text-12 text-text-muted font-medium">Creative Upload</label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={(event) => {
                  const file = event.target.files?.[0] || null;
                  void processCreativeUpload(file);
                }}
                disabled={advertiserFieldsDisabled}
              />
              {creativeFile?.name && (
                <span className="text-12 text-text-muted truncate max-w-[12rem]" title={creativeFile.name}>
                  {creativeFile.name}
                </span>
              )}
              {creativeFile && (
                <button
                  type="button"
                  className="text-11 text-link underline"
                  onClick={() => { void processCreativeUpload(null); }}
                  disabled={advertiserFieldsDisabled}
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          <div className="border border-border rounded-card">
            <button
              type="button"
              className="w-full flex items-center justify-between px-4 py-3 text-left text-12 font-semibold text-text-primary"
              onClick={() => setShowAdditional(prev => !prev)}
            >
              <span>Additional Settings</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showAdditional ? 'rotate-180' : ''}`} />
            </button>
            {showAdditional && (
              <div className="px-4 pb-4 space-y-sp-3">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-12 text-text-muted font-medium">
                    <input
                      type="checkbox"
                      className="meta-checkbox"
                      checked={includeEmoji}
                      onChange={(e) => updateBriefField('includeEmoji', e.target.checked)}
                      disabled={advertiserFieldsDisabled}
                    />
                    Include emoji in generated copy
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="text-12 text-text-muted font-medium">Additional Instructions</label>
                  <textarea
                    value={additionalInstructions}
                    onChange={(e) => updateBriefField('additionalInstructions', e.target.value)}
                    placeholder="Provide context, offers, or tone guidance"
                    className="form-textarea h-16"
                    disabled={advertiserFieldsDisabled}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-12 text-text-muted font-medium">Facebook Page ID</label>
                    <input
                      type="text"
                      value={pageData?.page_id || ''}
                      readOnly
                      className="form-input bg-surface-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-12 text-text-muted font-medium">Page Category</label>
                    <input
                      type="text"
                      value={pageCategory}
                      readOnly
                      className="form-input bg-surface-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-12 text-text-muted font-medium">Page Name</label>
                    <input
                      type="text"
                      value={pageData?.name || ''}
                      readOnly
                      className="form-input bg-surface-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-12 text-text-muted font-medium">Cover Photo</label>
                    <input
                      type="url"
                      value={pageData?.cover_image || ''}
                      readOnly
                      className="form-input bg-surface-50"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <label className="text-12 text-text-muted font-medium">Instagram Handle</label>
                    <input
                      type="text"
                      value={instagramHandle}
                      readOnly
                      className="form-input bg-surface-50"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-2">
            <Button
              onClick={() => { void handleGenerateAdCopy(); }}
              disabled={isGenerateDisabled}
              className="w-full"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {aiState.isGenerating ? 'Generating…' : 'Generate Ad Copy'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
