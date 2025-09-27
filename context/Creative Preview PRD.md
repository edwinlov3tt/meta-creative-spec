## Executive Summary

The Ad Creative AI Platform is a comprehensive web application designed to generate professional Facebook and Instagram ad copy with real-time preview capabilities. The platform combines AI-powered content generation with visual ad mockups, spec sheet generation, and future integration with templated.io for creative generation.

## 1. Project Overview

### Vision

Create a streamlined tool that automates ad copy generation for Facebook/Instagram campaigns while providing real-time visual feedback and professional trafficking materials.

### Goals

- **Primary**: Generate high-quality ad copy based on user inputs and AI guidelines
- **Secondary**: Provide accurate ad previews matching Facebook/Instagram specifications
- **Tertiary**: Generate downloadable spec sheets for trafficking teams
- **Future**: Integrate creative generation via templated.io API

### Target Users

- Digital marketers
- Ad traffickers
- Social media managers
- Creative teams
- Agency professionals

## 2. Core Features & Functionality

### 2.1 Input Collection System

**Primary Input Mode:**

- **Advertiser Facebook Link** (text field)
- **Company Overview** (text area)
- **Website/CTA URL** (text field, optional)
- **Campaign Objective** (dropdown/text)

**Alternative Input Mode:**

- **Facebook Link** (text field)
- **Website URL** (text field)
- **Custom Prompt** (text area for specific creative requirements)

**Additional Options** (expandable section):

- **Sales Formula** (dropdown: AIDA, HSO)
- **Company Information** (text area, optional)
- **Additional Instructions** (text area, optional)
- **Creative File Upload** (JPG, PNG, GIF - optional)

### 2.2 AI Content Generation

**API Integration:**

- Call to AI service with collected inputs
- Process response in JSON format
- Apply Facebook/Instagram guidelines and best practices
- Generate content for all required spec sheet fields

**Generated Content Fields:**

- Ad Name (descriptive reference)
- Post Text (125 characters max)
- Headline (40 characters max)
- Newsfeed Link Description (30 characters max)
- Website Destination URL (with UTM parameters)
- Display Link
- Call to Action (from Facebook CTA options)

### 2.3 Real-Time Preview System

**Preview Capabilities:** Based on the project files, the preview system should support:

**Device Types:**

- Mobile view
- Desktop view

**Ad Types:**

- News Feed
- Story
- Reel

**Ad Formats:**

- Single Image
- Original format
- 1:1 format

**Platform Variants:**

- Facebook previews
- Instagram previews

**Interactive Features:**

- Real-time updates as fields are edited
- Character count display with remaining characters
- Live preview refresh without page reload

### 2.4 Content Editing Interface

**Left Panel - Editable Fields:**

- All generated content in editable input fields
- Character counters for limited fields
- Dropdown for Call to Action selection
- UTM parameter advanced options
- Validation and error handling

**Field Specifications:** Based on the Excel spec sheet analysis:

- **Ad Name**: Descriptive reference (no character limit)
- **Post Text**: 125 characters maximum
- **Image Name**: File name reference
- **Facebook Page URL**: Client's Facebook page link
- **Headline**: 40 characters maximum
- **Newsfeed Link Description**: 30 characters maximum
- **Website Destination URL**: Full URL with UTM tracking
- **Display Link**: Shortened domain display
- **Call to Action**: From approved Facebook options

**Facebook CTA Options:**

- No Button, Apply Now, Book Now, Call Now, Contact Us, Donate Now, Download, Get Access, Get Offer, Get Quote, Get Showtimes, Learn More, Listen Now, Order Now, Play Game, Request Time, See Menu, Send Message, Shop Now, Sign Up, Subscribe, Watch More

### 2.5 Action Buttons & Features

**Primary Actions:**

- **Save**: Store current field values
- **Regenerate**: Create new AI-generated content
- **Copy**: Copy content to clipboard
- **Download Spec Sheet**: Generate and download trafficking document

**Preview Actions:**

- **Settings Toggle**: Device/ad type/format options
- **Share Button**: Download PNG/JPG of preview
- **Export Options**: Multiple format downloads

## 3. Technical Architecture

### 3.1 Frontend Framework

- **React.js** for interactive user interface
- **Real-time state management** for live preview updates
- **Responsive design** supporting mobile/desktop views
- **Component-based architecture** for ad preview variations

### 3.2 API Integration

- **AI Content Generation API** for copy creation
- **Claude/OpenAI API** for intelligent content generation
- **Character validation** and content optimization
- **Error handling** and retry mechanisms

### 3.3 Preview Rendering

- **CSS/HTML replication** of Facebook/Instagram ad layouts
- **Dynamic content injection** for real-time updates
- **Image placeholder system** for creative uploads
- **Export functionality** for PNG/JPG downloads

### 3.4 Spec Sheet Generation

Based on the Excel analysis, generate downloadable documents containing:

**Single Image Spec Sheet Fields:**

- Advertiser Name
- Name of Ad
- Post Text (125 characters)
- Name of Image
- URL of Facebook Page
- Headline (40 characters)
- Newsfeed Link Description (30 characters)
- Website Destination URL (with UTM)
- Display Link
- Call to Action
- Include Call Extension (Yes/No)
- Phone Number (if applicable)
- Disclaimer (360 characters - political ads only)

## 4. User Experience Flow

### 4.1 User Journey

1. **Input Collection**: User provides company/campaign information
2. **Processing**: "Generating..." loading screen with progress indicator
3. **Content Review**: Generated fields displayed with preview
4. **Editing Phase**: Real-time editing with live preview updates
5. **Export/Download**: Spec sheet and preview image generation

### 4.2 Screen Layouts

- **Input Screen**: Clean form interface for data collection
- **Generation Screen**: Loading state with progress indication
- **Main Interface**: Split-screen with fields (left) and preview (right)
- **Settings Panel**: Device/format/platform toggle options

## 5. Future Enhancements

### 5.1 Templated.io Integration

**API Integration**: POST requests to https://api.templated.io/v1/render with template parameters

**Implementation Plan:**

- **Template Creation**: Design Facebook/Instagram ad templates in Templated.io editor
- **Dynamic Content**: Map generated copy to template layers
- **Creative Generation**: Automatically generate visual creatives with copy
- **Multi-format Output**: Support for various ad formats and dimensions

**API Usage:**

```javascript
// Sample integration with templated.io
const response = await fetch('https://api.templated.io/v1/render', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`
  },
  body: JSON.stringify({
    template: TEMPLATE_ID,
    layers: {
      'headline-text': { text: generatedHeadline },
      'post-text': { text: generatedPostText },
      'cta-button': { text: selectedCTA },
      'brand-logo': { image_url: uploadedLogo }
    }
  })
});
```

### 5.2 Database Integration (Supabase)

**Data Storage:**

- User accounts and authentication
- Generated content history
- Template preferences
- Campaign tracking
- Usage analytics

**Features:**

- Save and retrieve previous generations
- Template favorites and customizations
- Team collaboration capabilities
- Version history and rollback

### 5.3 Advanced Features

- **A/B Testing**: Generate multiple variations for testing
- **Brand Guidelines**: Custom style and tone parameters
- **Bulk Generation**: Process multiple campaigns simultaneously
- **Analytics Dashboard**: Performance tracking and optimization
- **API Access**: Allow third-party integrations

## 6. Technical Specifications

### 6.1 Performance Requirements

- **Generation Time**: Sub-10 second AI response times
- **Real-time Updates**: <100ms latency for preview updates
- **Scalability**: Support 100+ concurrent users
- **Uptime**: 99.9% availability target

### 6.2 Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest 2 versions)
- **Mobile Responsive**: iOS Safari, Chrome Mobile
- **Progressive Enhancement**: Graceful degradation for older browsers

### 6.3 Security & Privacy

- **API Key Management**: Secure storage and rotation
- **Data Encryption**: HTTPS for all communications
- **User Privacy**: No storage of sensitive business information
- **Rate Limiting**: Prevent API abuse and ensure fair usage

## 7. Success Metrics

### 7.1 User Engagement

- **Time to Generate**: Average time from input to final output
- **Edit Frequency**: Number of manual edits per generation
- **Download Rate**: Percentage of users downloading spec sheets
- **Return Usage**: Monthly active users and retention

### 7.2 Quality Metrics

- **Character Compliance**: Percentage of generated content within limits
- **User Satisfaction**: Ratings and feedback scores
- **Regeneration Rate**: Frequency of content regeneration requests
- **Error Rates**: API failures and technical issues

## 8. Implementation Phases

### Phase 1: Core MVP

- Input collection system
- AI content generation
- Basic preview functionality
- Spec sheet download

### Phase 2: Enhanced UX

- Real-time preview updates
- Advanced editing capabilities
- Multiple platform previews
- Export improvements

### Phase 3: Templated.io Integration

- Creative generation API
- Template management
- Multi-format support
- Advanced customization

### Phase 4: Platform Expansion

- Database integration (Supabase)
- User accounts and history
- Team collaboration
- Advanced analytics