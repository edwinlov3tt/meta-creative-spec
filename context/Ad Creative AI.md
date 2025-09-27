Create a web app that will generate ad copy for ads, starting with facebook/instagram ads
- User puts in advertiser facebook link, company overview, Website/CTURL (optional), and campaign objective
	- OR have the option to type in a prompt to tell the AI what creative they want (Inputs: Facebook Link, Website URL, Prompt)
- Upon submit, API call is made to AI with provided content to generate copy based on provided inputs based on guidelines
- Once received (in JSON format), show fields/preview put responses in input fields relative to spec parameters below
- Show the fields and the preview - Screens: > Inputs > "Generating..." wait screen > Ad Copy Fields / Preview
- Allow the ad copy fields to be edited, and update in real time time for the preview
- The preview section should look like the real Facebook/Instagram ad preview (see: https://admockups.com/facebook-ad-mockup)
- Have setting buttons to change the view of the ad: Mobile/Desktop Toggle, Settings, Share Button
	- Device Type: Mobile/Desktop
	- Ad Type: News Feed, Story Reed
	- Ad Format: Single Image
- ![[Screenshot 2025-08-15 at 6.31.38 PM.png]]
- Share button Download PNG, JPG
	- Future: Shareable Preview links, preview links include downloadable spec sheets, and creative for trafficking teams to download and upload directly to the facebook platform - Preview links are editable in real time, links do not expire like creative hub does
- Ad Copy fields should be on the left hand side, Ad Previews should be on the right hand side
- Have button to save fields, regenerate, copy, and download spec sheet 

Inspiration: https://admockups.com/facebook-ad-mockup
Creative API: https://templated.io/docs/renders/create/

Brand analysis input for AI content generator
- Company Overview Context 
- Campaign Objective Context

User input field:
Ad Type - Dropdown: Single Image, Video
Creative File Upload (Optional) - File Upload - restrict to jpg, png, or .gif
Advertiser Name - Text Area Field
Facebook Page - Text Area Field
CTURL (Optional) - Text Area Field
Campaign Description - Name of product or service, and what it is about. - Text Area Field

Additional Options [Hidden Drop Down]
Sales Formula (Optional) - Dropdown: AIDA, HSO
Company Information (Optional) - Text Area Field
Additional Instructions (Optional) - Text Area Field
Prompt - Text Area Field

Facebook/Instagram - Single Image
Spec Sheet:
- Advertiser Name
- Name of Ad
- Post Text (125 characters)
- Name of Image
- URL of Facebook Page
- Headline (40 characters)
- Newsfeed Link Description (30 characters)
- Website Destination URL - CTURL + UTM (Ignite/Facebook/Ad Name)
	- Have "Advanced Options" to change UTM code
- Display Link
- Call to Action (Facebook CTA Options)
- Include Call Extension? (Yes/No)
	- Phone Number
- Disclaimer (360 characters) - Only political ads

Detailed Spec Sheet:
- Name of Ad - Think of a descriptive name to reference this ad based on what it’s about (ex: Membership Promo June 2024)
- Post Text - Tell people what you’re promoting in this ad in 125 characters or less
- Name of Image - Put the name of the file that includes the creative
Is the single image in a clear 1080x1080 resolution - Select “Yes” if the creative was made my the creative team.
- URL of Facebook Page - Add the link to the client's Facebook page here
- Headline - What do you want people to click on the link for?
- Newsfeed Link Description - Describe what action they should take on the landing page.
- Website Destination URL - Add the link to the final landing page
- Display Link - Basically copy and paste the link here without https:// or http://  
- Call to Action - Choose from one of these options in the spec sheet: No Button, Get Quote, Get Showtimes, Listen Now, Request Time, See Menu, Shop Now, Sign Up, Subscribe, Watch More, Learn More, Apply Now, Book Now, Contact Us, Donate Now, Download, Get Offer

Example:
- Ad Name: Summer Membership Special 2024
- Post Text: Join now and enjoy exclusive summer benefits!
- Image Name: summer_membership_special.jpg
- Is the single image in clear 1080×1080 resolution: Yes
- URL of Facebook Page: www.facebook.com/clientpage
- Headline: Click here for a summer full of perks!
- Newsfeed Link Description: Sign up today for a season of exclusive offers.
- Website Destination URL: www.clientwebsite.com/summer-membership
- Display Link: clientwebsite.com
- Call to Action: Sign Up

Facebook/Instagram - Post Engagement
Spec Sheet:
- Advertiser Name
- Name of Ad
- Name of Image
- URL of Facebook Page
- Post Text (125 characters)
- Call to Action (Facebook CTA Options: No Button, Get Quote, Learn More, Send Message, Shop Now)
- Website Destination URL - CTURL + UTM (Ignite/Facebook/Ad Name)
- Disclaimer (360 characters) - Only political ads

Facebook - Single Image
- Device Type: Desktop/Mobile Toggle
- Ad Type: (News Feed), Story, Reel
- Ad Format: Single Image

![[Pasted image 20250815170935.png]]

Facebook - Story
- Ad Type: News Feed, (Story), Reel
- Ad Format: Original, 1:1

![[Pasted image 20250815171938.png]]

Facebook - Reel
- Ad Type: News Feed, Story, (Reel)
- Ad Format: Original, 1:1

![[Pasted image 20250815171319.png]]

Instagram - Single Image
- Device Type: Desktop/Mobile
- Ad Type: News Feed, Story, Reel
- Ad Format: Single Image

![[Pasted image 20250815171645.png]]

Instagram - Story
- Ad Type: News Feed, (Story), Reel
- Ad Format: Original, 1:1

![[Pasted image 20250815171712.png]]

Instagram - Reel
- Ad Type: News Feed, Story, (Reel)
- Ad Format: Original, 1:1

![[Pasted image 20250815171754.png]]


Have toolbar section collapsable
When Device is "Mobile" center and middle align the preview, it current goes to the upper left - do the same for Reel/Story too (all creatives) just make sure its centered and middle aligned
Have preview section be sticky, with an invisible scroll wheel, with logic to detect if the content is going past the view
Have "Ad Copy Options" collapsable section like the "Additional Section" above, include:
- Remove Post Text Limit - (Will remove the limit from the "Post Text" and allow users to add more content to the box - after 140 characters truncate the post text and show the blue "See More" button text in the preview)
- Destination URL UTM - this will be a utm generator for the "Destination URL" based on the provided Website / CTURL - below are the fields and defaults
	- UTM Campaign: Ignite
	- UTM Medium: Facebook
	- UTM Source: Townsquare
	- UTM Content: {{ad-name}} (based on Ad Name field)
- Slugify and encode url for "Destination URL"
- Show the full url with the UTM info at the bottom of the "Destination URL" make clickable - same with the CTA button
When on Platform: Facebook, Device: Desktop, Format: 1:1
- Change "Type" to "Ad Type" so its more clear
- Change "Format" to "Ad Format" and show "Single Image" option only when Platform = Facebook and Ad Type = Feed
![[Screenshot 2025-08-15 at 8.03.00 PM.png]]
Have a section seperation card like this for each step.
- Step 1: Advertiser Info
- Step 2: Ad Copy [Greyed out until user provides required fields] above
- Have a button in Step 1 above "Additional Options" to Generate Ad Copy, once clicked, Collapse section 1
Update preview to be more accurate remove the padding between the image and ad section, remove rounding of border, reduce rounding of CTA button, add Like, Comment, Share buttons at the bottom like in the example (see attached code for that info), change the background and cta colors (see attached code)

Okay so, keep the "Step 2: Ad Copy" section under the "Step 1: Advertiser Info" - each of these sections should be collapsible, with "Step 2: Ad Copy" collapsed, rather than greyed out until Ad Copy is generated. This will allow users to skip the Step 1 inputs if not needed

Add the "Preview" heading back with "Choose placement, device, and format." sub heading and have the Preview Controls collapse under that title

Make the "Campaign Objective" full width and a text area box
Move "Generate Ad Copy" button below "Campaign Objective"
Keep the preview on the right side, and keep it sticky
Fix the format for the "Note: Visual approximation for planning only." and "Display Link" label the font is off
Default the Preview to:
- Platform: Facebook
- Device: Desktop
- Ad Type: Feed
- Ad Format: Original
Generate Like, Comment, Share buttons
If Platform = Facebook - hide the "@brand" only show that on Instagram - show the globe on facebook <svg fill="currentColor" viewBox="0 0 16 16" width="1em" height="1em" title="Shared with Public" data-v-7d5f43ca=""><title data-v-7d5f43ca="">Shared with Public</title><g fill-rule="evenodd" transform="translate(-448 -544)" data-v-7d5f43ca=""><g data-v-7d5f43ca=""><path d="M109.5 408.5c0 3.23-2.04 5.983-4.903 7.036l.07-.036c1.167-1 1.814-2.967 2-3.834.214-1 .303-1.3-.5-1.96-.31-.253-.677-.196-1.04-.476-.246-.19-.356-.59-.606-.73-.594-.337-1.107.11-1.954.223a2.666 2.666 0 0 1-1.15-.123c-.007 0-.007 0-.013-.004l-.083-.03c-.164-.082-.077-.206.006-.36h-.006c.086-.17.086-.376-.05-.529-.19-.214-.54-.214-.804-.224-.106-.003-.21 0-.313.004l-.003-.004c-.04 0-.084.004-.124.004h-.037c-.323.007-.666-.034-.893-.314-.263-.353-.29-.733.097-1.09.28-.26.863-.8 1.807-.22.603.37 1.166.667 1.666.5.33-.11.48-.303.094-.87a1.128 1.128 0 0 1-.214-.73c.067-.776.687-.84 1.164-1.2.466-.356.68-.943.546-1.457-.106-.413-.51-.873-1.28-1.01a7.49 7.49 0 0 1 6.524 7.434" transform="translate(354 143.5)" data-v-7d5f43ca=""></path><path d="M104.107 415.696A7.498 7.498 0 0 1 94.5 408.5a7.48 7.48 0 0 1 3.407-6.283 5.474 5.474 0 0 0-1.653 2.334c-.753 2.217-.217 4.075 2.29 4.075.833 0 1.4.561 1.333 2.375-.013.403.52 1.78 2.45 1.89.7.04 1.184 1.053 1.33 1.74.06.29.127.65.257.97a.174.174 0 0 0 .193.096" transform="translate(354 143.5)" data-v-7d5f43ca=""></path><path fill-rule="nonzero" d="M110 408.5a8 8 0 1 1-16 0 8 8 0 0 1 16 0zm-1 0a7 7 0 1 0-14 0 7 7 0 0 0 14 0z" transform="translate(354 143.5)" data-v-7d5f43ca=""></path></g></g></svg>
Change Ad Creative Preview Style based on the platform and Ad Type - each one is different
See attached for Instagram, Instagram/Feed, Instagram/Story, Instagram/Reel, Facebook/Story, Facebook/Reel
Keep the current preview for Facebook/Feed only, should change based on "Preview Controls"