import React from 'react'
import { AdvertiserInfoStep } from './steps/AdvertiserInfoStep'
import { AdCopyStep } from './steps/AdCopyStep'

export const FormBuilder: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Step 1: Advertiser Info */}
      <AdvertiserInfoStep />

      {/* Step 2: Ad Copy */}
      <AdCopyStep />
    </div>
  )
}