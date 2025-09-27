import { useMemo } from 'react';
import { useCreativeStore } from '@/stores/creativeStore';
import type { AdFormat, AdType, Device, Platform } from '@/types/creative';

const applySeeMore = (text: string, removeLimit: boolean) => {
  if (!removeLimit) return text;
  if (text.length <= 140) return text;
  const visible = text.slice(0, 140).replace(/\s+$/, '');
  return `${visible}… See more`;
};

export const useCreativePreviewData = () => {
  const preview = useCreativeStore(state => state.preview);
  const adCopy = useCreativeStore(state => state.adCopy);
  const brief = useCreativeStore(state => state.brief);
  const facebook = useCreativeStore(state => state.facebook);

  const truncatedPrimary = useMemo(
    () => applySeeMore(adCopy.primaryText || '', brief.removeCharacterLimit),
    [adCopy.primaryText, brief.removeCharacterLimit]
  );

  const platform = preview.platform as Platform;
  const device = preview.device as Device;
  const adType = preview.adType as AdType;
  const adFormat = preview.adFormat as AdFormat;

  const brandName = facebook.pageData?.name || adCopy.adName || 'Your Brand';

  const profileImage = useMemo(() => {
    const pageData = facebook.pageData;
    if (!pageData) return '';
    if (pageData.profile_picture) return pageData.profile_picture;
    if (pageData.image) return pageData.image;
    if (Array.isArray(pageData.Images)) {
      const imageEntry = pageData.Images.find(entry => entry?.type === 'facebook_profile_image');
      if (imageEntry?.url) return imageEntry.url;
    }
    if (pageData.instagram_details?.result?.profile_pic_url) {
      return pageData.instagram_details.result.profile_pic_url;
    }
    return '';
  }, [facebook.pageData]);

  const adData = useMemo(() => ({
    adName: adCopy.adName,
    primaryText: truncatedPrimary,
    headline: adCopy.headline || 'Compelling headline',
    description: adCopy.description || 'Short supporting copy',
    callToAction: adCopy.callToAction,
    websiteUrl: adCopy.destinationUrl,
    displayLink: adCopy.displayLink || 'example.com',
    brandName,
    profileImage
  }), [adCopy.adName, truncatedPrimary, adCopy.headline, adCopy.description, adCopy.callToAction, adCopy.destinationUrl, adCopy.displayLink, brandName, profileImage]);

  return {
    platform,
    device,
    adType,
    adFormat,
    adData,
    truncatedPrimary,
    brandName,
    profileImage
  };
};
