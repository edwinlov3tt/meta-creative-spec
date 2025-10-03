/* Creative Preview Prototype v4 - Vanilla JS */
const $ = (sel)=> document.querySelector(sel);

// STEP gating & layout refs
const step1 = $("#step1-card");
const step2 = $("#step2-card");
const headerEl = $("#app-header");

// Track if we've generated before
let hasGeneratedCopy = false;

// Track Facebook page data
let facebookPageData = null;

// Compute header height for grid height calc
function setHeaderHeightVar(){
  const h = headerEl ? headerEl.offsetHeight : 72;
  document.documentElement.style.setProperty('--header-h', h + 'px');
}
window.addEventListener('resize', setHeaderHeightVar);
setHeaderHeightVar();

// Update button text based on state
function updateGenerateButtonText() {
  const btn = $("#btn-generate-copy");
  if (btn) {
    btn.textContent = hasGeneratedCopy ? "Regenerate Ad Copy" : "Generate Ad Copy";
  }
}

// Watch for Step 1 being opened to update button text
step1.addEventListener("toggle", ()=>{
  if (step1.open && hasGeneratedCopy) {
    updateGenerateButtonText();
  }
});

// Fields
const fields = {
  postText: $("#post-text"),
  headline: $("#headline"),
  linkDesc: $("#link-desc"),
  destUrl: $("#dest-url"),
  displayLink: $("#display-link"),
  cta: $("#cta"),
  adName: $("#ad-name"),
  creative: $("#input-creative"),
  company: $("#input-company"),
  companyInfo: $("#input-company-info"),
  objective: $("#input-objective"),
  prompt: $("#input-prompt"),
  formula: $("#input-formula"),
  fbLink: $("#input-facebook-link"),
  url: $("#input-url"),
  instructions: $("#input-instructions"),
  removeLimit: $("#toggle-limit"),
  includeEmoji: $("#toggle-emoji"),
  utmCampaign: $("#utm-campaign"),
  utmMedium: $("#utm-medium"),
  utmSource: $("#utm-source"),
  utmContent: $("#utm-content"),
  fbPageId: $("#facebook-page-id"),
  fbPageName: $("#facebook-page-name"),
  fbCategory: $("#facebook-category"),
  fbCoverPhoto: $("#facebook-cover-photo"),
  fbPageData: $("#facebook-page-data"),
  instagramHandle: $("#instagram-handle"),
  instagramLink: $("#instagram-link"),
  btnVerifyFacebook: $("#btn-verify-facebook")
};

// Counters
const counters = {
  post: $("#count-post"),
  headline: $("#count-headline"),
  desc: $("#count-desc"),
  company: $("#count-company"),
  objective: $("#count-objective"),
  companyInfo: $("#count-company-info"),
  instructions: $("#count-instructions"),
  prompt: $("#count-prompt")
};

// Preview nodes
const preview = {
  post: $("#preview-post"),
  headline: $("#preview-headline"),
  desc: $("#preview-desc"),
  displayLink: $("#preview-display-link"),
  cta: $("#preview-cta"),
  image: $("#preview-image"),
  root: $("#preview-root"),
  brand: $("#brand-name"),
  instagramBrand: $("#instagram-brand-name"),
  handle: $("#brand-handle"),
  globeIcon: $(".globe-icon"),
  ig: {
    below: $("#ig-below"),
    cta: $("#ig-cta-btn"),
    company: $("#ig-company"),
    primary: $("#ig-primary-text")
  },
  overlay: {
    root: $("#sr-overlay"),
    primary: $("#overlay-primary"),
    cta: $("#overlay-cta-btn")
  }
};

// Toggles
const toggles = {
  platform: $("#platform"),
  device: $("#device"),
  adtype: $("#adtype"),
  format: $("#format"),
  fbAdformat: $("#fb-adformat"),
  chipAdformat: $("#chip-adformat"),
  chipFormat: $("#chip-format"),
  labelFormat: $("#label-format"),
  labelAdtype: $("#label-adtype"),
  deviceChip: $("#chip-device")
};

// Sticky preview viewport overflow detection using sentinels
const viewport = $("#preview-viewport");
const shadowTop = $("#shadow-top");
const shadowBottom = $("#shadow-bottom");
const observer = new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if (entry.target.id === "top-sentinel") shadowTop.style.display = entry.isIntersecting ? "none" : "block";
    if (entry.target.id === "bottom-sentinel") shadowBottom.style.display = entry.isIntersecting ? "none" : "block";
  });
}, {root: viewport, threshold: 0.001});

// Create sentinels
const topSent = document.createElement("div");
topSent.id = "top-sentinel"; topSent.style.height="1px";
const bottomSent = document.createElement("div");
bottomSent.id = "bottom-sentinel"; bottomSent.style.height="1px";
viewport.prepend(topSent);
viewport.append(bottomSent);
observer.observe(topSent);
observer.observe(bottomSent);

// Defaults
toggles.platform.value = "facebook";
toggles.device.value = "desktop";
toggles.adtype.value = "feed";
toggles.format.value = "original";
if (!fields.cta.value) fields.cta.value = "Learn More";

// Sync functions
function updateCounters(){
  const limitText = fields.removeLimit.checked ? "(limit off)" : "/125";
  counters.post.textContent = `${fields.postText.value.length}${fields.removeLimit.checked ? " " + limitText : limitText}`;
  counters.headline.textContent = `${fields.headline.value.length}/40`;
  counters.desc.textContent = `${fields.linkDesc.value.length}/30`;
  
  // Step 1 counters
  if (counters.company) counters.company.textContent = `${fields.company.value.length}/500`;
  if (counters.objective) counters.objective.textContent = `${fields.objective.value.length}/300`;
  if (counters.companyInfo) counters.companyInfo.textContent = `${fields.companyInfo.value.length}/300`;
  if (counters.instructions) counters.instructions.textContent = `${fields.instructions.value.length}/200`;
  if (counters.prompt) counters.prompt.textContent = `${fields.prompt.value.length}/200`;
}

function truncateWithSeeMore(text){
  if (!fields.removeLimit.checked) return text;
  if (text.length <= 140) return text;
  const visible = text.slice(0,140).replace(/\s+$/,"");
  return `${visible}… <span class="see-more">See more</span>`;
}

function syncVariantClasses(){
  const platform = toggles.platform.value;
  const type = toggles.adtype.value;
  preview.root.classList.remove("platform-facebook","platform-instagram","adtype-feed","adtype-story","adtype-reel");
  preview.root.classList.add(`platform-${platform}`, `adtype-${type}`);
  if (platform === "facebook"){
    preview.handle.style.display = "none";
    // Show globe icon for Facebook
    if (preview.globeIcon) {
      preview.globeIcon.style.display = "inline-block";
    }
  } else {
    preview.handle.style.display = "";
    // Hide globe icon for Instagram
    if (preview.globeIcon) {
      preview.globeIcon.style.display = "none";
    }
  }
}

function syncPreview(){
  // Post text with optional See more
  const postText = fields.postText.value || "Tell people what you're promoting in 125 chars or less";
  preview.post.innerHTML = truncateWithSeeMore(escapeHtml(postText));
  preview.ig.primary.textContent = fields.postText.value || "Tell people what you're promoting…";
  preview.overlay.primary.textContent = fields.postText.value || "Tell people what you're promoting…";

  preview.headline.textContent = fields.headline.value || "Compelling headline";
  preview.desc.textContent = fields.linkDesc.value || "Short supporting copy";
  preview.displayLink.textContent = fields.displayLink.value || "example.com";
  
  // Don't override brand names if they've been set by Facebook API
  if (!facebookPageData) {
    preview.brand.textContent = (fields.fbLink.value && safeBrandFromUrl(fields.fbLink.value)) || "Your Brand";
    preview.instagramBrand.textContent = preview.brand.textContent;
  }

  const adtype = toggles.adtype.value;
  const format = toggles.format.value;
  
  // For Story/Reel, force mobile view and disable device selector
  let device = toggles.device.value;
  if (adtype === "story" || adtype === "reel") {
    device = "mobile";
    toggles.device.value = "mobile";
    if (toggles.deviceChip) {
      toggles.deviceChip.style.display = "none";
    }
  } else {
    if (toggles.deviceChip) {
      toggles.deviceChip.style.display = "";
    }
  }

  // Width/centering
  let width = device === "desktop" ? 640 : 380;
  if (adtype === "story" || adtype === "reel") width = 360; // Always mobile width for Story/Reel
  preview.root.style.maxWidth = `${width}px`;

  // Media aspect
  const img = preview.image;
  if (adtype === "feed"){
    if (format === "square") { img.style.aspectRatio = "1 / 1"; }
    else { img.style.aspectRatio = "16 / 9"; }
  } else {
    img.style.aspectRatio = "9 / 16";
  }

  // Show/hide variant UI handled by classes
  syncVariantClasses();

  // Link + CTA href
  const built = buildUrl();
  if (built){
    $("#utm-preview").innerHTML = `<a href="${built}" target="_blank" rel="noopener">${built}</a>`;
    ["preview-cta","ig-cta-btn","overlay-cta-btn"].forEach(id=>{
      const el = document.getElementById(id);
      el.href = built; el.textContent = fields.cta.value || "Learn More";
    });
  } else {
    $("#utm-preview").innerHTML = "";
  }

  // FB-only ad format control visibility (platform=facebook AND adtype=feed)
  const showFbAdFormat = toggles.platform.value === "facebook" && adtype === "feed";
  document.getElementById("chip-adformat").style.display = showFbAdFormat ? "" : "none";

  recenterPreview();
}

// File upload -> preview image
fields.creative?.addEventListener("change", (e)=>{
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev)=>{ preview.image.src = ev.target.result; };
  reader.readAsDataURL(file);
});

// Inputs wiring
["input","keyup","change"].forEach(evt=>{
  fields.postText.addEventListener(evt, ()=>{ updateCounters(); syncPreview(); });
  fields.headline.addEventListener(evt, ()=>{ updateCounters(); syncPreview(); });
  fields.linkDesc.addEventListener(evt, ()=>{ updateCounters(); syncPreview(); });
  fields.displayLink.addEventListener(evt, syncPreview);
  fields.cta.addEventListener(evt, syncPreview);
  fields.destUrl.addEventListener(evt, syncPreview);
  fields.url.addEventListener(evt, syncPreview);
  fields.adName.addEventListener(evt, ()=>{ syncPreview(); });
  
  // Step 1 fields with counters
  fields.company.addEventListener(evt, updateCounters);
  fields.objective.addEventListener(evt, updateCounters);
  fields.companyInfo.addEventListener(evt, updateCounters);
  fields.instructions.addEventListener(evt, updateCounters);
  fields.prompt.addEventListener(evt, updateCounters);
  
  fields.removeLimit.addEventListener(evt,()=>{
    if (fields.removeLimit.checked){
      fields.postText.removeAttribute("maxlength");
    } else {
      fields.postText.setAttribute("maxlength","125");
    }
    updateCounters(); syncPreview();
  });
  fields.utmCampaign.addEventListener(evt, syncPreview);
  fields.utmMedium.addEventListener(evt, syncPreview);
  fields.utmSource.addEventListener(evt, syncPreview);
  fields.utmContent.addEventListener(evt, syncPreview);
});

Object.values({ ...toggles }).forEach(node=> node.addEventListener("change", ()=>{
  $("#label-adtype").textContent = "Ad Type";
  $("#label-format").textContent = "Ad Format";
  syncPreview();
}));

// Local storage
const STORE_KEY = "creativePreviewFields.v4";
function save(){
  const data = {};
  for (const [k, el] of Object.entries(fields)){
    data[k] = el?.type === "file" ? null : el?.value;
  }
  localStorage.setItem(STORE_KEY, JSON.stringify(data));
}
function load(){
  const raw = localStorage.getItem(STORE_KEY);
  if (!raw) return;
  try{
    const data = JSON.parse(raw);
    for (const [k,v] of Object.entries(data)){
      if (fields[k] && fields[k].type !== "file") fields[k].value = v ?? "";
    }
  }catch(e){ console.warn("Could not parse saved fields", e); }
}
load(); 
updateCounters(); 

// If we have saved Facebook page data, restore it and verify the page
if (fields.fbPageData.value) {
  try {
    facebookPageData = JSON.parse(fields.fbPageData.value);
    // Update preview with saved Facebook data
    updatePreviewWithFacebookData(facebookPageData);
    // Lock the Facebook link field since we have verified data
    fields.fbLink.disabled = true;
    fields.btnVerifyFacebook.textContent = 'Reset';
    fields.btnVerifyFacebook.classList.remove('btn-primary');
    fields.btnVerifyFacebook.classList.add('btn-success');
    enableAdvertiserFields();
  } catch(e) {
    console.warn('Could not restore Facebook page data', e);
    // If we can't restore, ensure fields are disabled
    disableAdvertiserFields();
  }
} else {
  // No saved data, ensure fields are disabled
  disableAdvertiserFields();
}

syncPreview();

// Buttons
$("#btn-save").addEventListener("click", ()=>{ save(); toast("Saved locally."); });
$("#btn-copy").addEventListener("click", ()=>{
  const data = collectSpec();
  navigator.clipboard.writeText(JSON.stringify(data, null, 2));
  toast("Copied spec JSON.");
});
$("#btn-download-spec").addEventListener("click", ()=>{
  const data = collectSpec();
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:"application/json"});
  downloadBlob(blob, "ad-spec.json");
});

// Reset button functionality
$("#btn-reset").addEventListener("click", ()=>{
  if (confirm("This will clear all form data. Are you sure?")) {
    // Clear all form fields
    Object.values(fields).forEach(field => {
      if (field && field.type !== "file") {
        field.value = "";
      }
    });
    
    // Reset file input
    if (fields.creative) {
      fields.creative.value = "";
    }
    
    // Reset defaults
    fields.cta.value = "Learn More";
    fields.utmCampaign.value = "Ignite";
    fields.utmMedium.value = "Facebook";
    fields.utmSource.value = "Townsquare";
    
    // Reset toggle states
    toggles.platform.value = "facebook";
    toggles.device.value = "desktop";
    toggles.adtype.value = "feed";
    toggles.format.value = "original";
    fields.removeLimit.checked = false;
    fields.includeEmoji.checked = true;
    fields.postText.setAttribute("maxlength","125");
    
    // Reset preview image
    preview.image.src = "./assets/facebook-ad-mockup.png";
    
    // Reset avatar
    resetPreviewAvatar();
    
    // Reset Facebook verification state
    resetFacebookVerification();
    
    // Reset generation state
    hasGeneratedCopy = false;
    updateGenerateButtonText();
    
    // Reset step states
    step2.classList.add("step-disabled");
    step2.removeAttribute("open");
    step1.setAttribute("open","");
    
    // Clear local storage
    localStorage.removeItem(STORE_KEY);
    
    // Update UI
    updateCounters();
    syncPreview();
    
    toast("Form reset successfully.");
    
    // Scroll to top
    window.scrollTo({top: 0, behavior: "smooth"});
  }
});

// Regenerate button in header
$("#btn-regenerate").addEventListener("click", async ()=>{
  // Check if Step 2 is enabled
  if (step2.classList.contains("step-disabled")) {
    toast("Please generate ad copy first.");
    return;
  }
  
  await generateAdCopy(true);
});

// Export preview
async function exportNode(format="png"){
  const node = preview.root;
  try{
    if (window.htmlToImage){
      const dataUrl = format==="png" ? await window.htmlToImage.toPng(node) : await window.htmlToImage.toJpeg(node, {quality:0.95});
      downloadDataURL(dataUrl, `preview.${format}`);
      return;
    }
  }catch(e){ console.warn("html-to-image failed", e); }
  if (window.domtoimage){
    const fn = format==="png" ? window.domtoimage.toPng : window.domtoimage.toJpeg;
    fn(node).then((dataUrl)=> downloadDataURL(dataUrl, `preview.${format}`))
      .catch((err)=> toast("Export failed. See console."));
  } else {
    toast("Export libs not loaded.");
  }
}
$("#btn-export-png").addEventListener("click", ()=>exportNode("png"));
$("#btn-export-jpg").addEventListener("click", ()=>exportNode("jpg"));

// Detailed preview button
$("#btn-detailed-preview").addEventListener("click", (event)=>{
  event.preventDefault();
  event.stopPropagation();
  openDetailedPreview();
});

// Helpers
function collectSpec(){
  return {
    refName: fields.adName.value,
    postText: fields.postText.value,
    headline: fields.headline.value,
    description: fields.linkDesc.value,
    destinationUrl: buildUrl() || fields.destUrl.value,
    displayLink: fields.displayLink.value,
    cta: fields.cta.value || "Learn More",
    platform: toggles.platform.value,
    device: toggles.device.value,
    adType: toggles.adtype.value,
    format: toggles.format.value,
    meta: {
      company: fields.company.value,
      companyInfo: fields.companyInfo.value,
      objective: fields.objective.value,
      customPrompt: fields.prompt.value,
      formula: fields.formula.value,
      facebookLink: fields.fbLink.value,
      url: fields.url.value,
      notes: fields.instructions.value,
      facebookPageData: fields.fbPageData.value ? JSON.parse(fields.fbPageData.value) : null,
      facebookPageId: fields.fbPageId.value,
      pageName: fields.fbPageName.value,
      category: fields.fbCategory.value,
      coverPhoto: fields.fbCoverPhoto.value
    }
  };
}

function downloadBlob(blob, filename){
  const a = document.createElement("a");
  const url = URL.createObjectURL(blob);
  a.href = url; a.download = filename; a.click();
  setTimeout(()=> URL.revokeObjectURL(url), 1000);
}
function downloadDataURL(dataUrl, filename){ const a = document.createElement("a"); a.href=dataUrl; a.download=filename; a.click(); }

function toast(msg, type = 'default'){
  let t = document.getElementById("toast");
  if(!t){
    t = document.createElement("div");
    t.id = "toast";
    t.style.position="fixed"; t.style.bottom="16px"; t.style.left="50%"; t.style.transform="translateX(-50%)";
    t.style.padding="10px 14px";
    t.style.borderRadius="10px"; t.style.boxShadow="0 8px 20px rgba(0,0,0,.25)"; t.style.fontWeight="600";
    t.style.zIndex=9999; 
    t.style.transition="opacity 0.3s ease";
    document.body.appendChild(t);
  }
  
  // Set colors based on type
  if (type === 'success') {
    t.style.background="hsl(120 40% 40%)"; 
    t.style.color="#fff";
  } else if (type === 'error') {
    t.style.background="hsl(0 60% 45%)"; 
    t.style.color="#fff";
  } else {
    t.style.background="#111"; 
    t.style.color="#fff";
  }
  
  t.textContent = msg; 
  t.style.opacity=1;
  clearTimeout(t.tid);
  t.tid = setTimeout(()=>{ t.style.opacity=0; }, 3000);
}

function slugify(str){
  return (str || "").toString().normalize('NFKD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-zA-Z0-9]+/g,'-')
    .replace(/^-+|-+$/g,'')
    .toLowerCase();
}
function buildUrl(){
  const base = fields.url.value.trim() || fields.destUrl.value.trim();
  if (!base) return "";
  let url;
  try{ url = new URL(base); }
  catch(e){
    try{ url = new URL("https://" + base); }
    catch(_){ return ""; }
  }
  const params = url.searchParams;
  const campaign = fields.utmCampaign.value || "Ignite";
  const medium = fields.utmMedium.value || "Facebook";
  const source = fields.utmSource.value || "Townsquare";
  const contentRaw = fields.utmContent.value || fields.adName.value || "";
  const content = slugify(contentRaw);
  params.set("utm_campaign", campaign);
  params.set("utm_medium", medium);
  params.set("utm_source", source);
  if (content) params.set("utm_content", content);
  url.search = params.toString();
  fields.destUrl.value = url.toString();
  return url.toString();
}
function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, s=>({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[s]));
}
function safeBrandFromUrl(link){
  try{
    const u = new URL(link, "https://x.invalid");
    return (u.pathname || "").replace(/\/+/, "").replace(/\//g,"") || u.host || "Your Brand";
  }catch(e){ return "Your Brand"; }
}

// Open detailed preview in same tab
function openDetailedPreview() {
  // Save current form data to localStorage first
  save();
  
  // Collect current data
  const params = new URLSearchParams({
    postText: fields.postText.value || "Tell people what you're promoting in 125 chars or less",
    headline: fields.headline.value || "Compelling headline",
    description: fields.linkDesc.value || "Short supporting copy",
    displayLink: fields.displayLink.value || "example.com",
    cta: fields.cta.value || "Learn More",
    brandName: preview.brand.textContent || "Your Brand",
    instagramBrandName: preview.instagramBrand.textContent || "Your Brand",
    brandHandle: preview.handle ? preview.handle.textContent : "@yourbrand"
  });
  
  // Add image URL if a custom image was uploaded
  const imgElement = preview.image;
  if (imgElement && imgElement.src && !imgElement.src.includes('facebook-ad-mockup.png')) {
    params.append('imageUrl', imgElement.src);
  }
  
  // Add avatar URL if Facebook page was fetched
  if (facebookPageData && facebookPageData.picture) {
    params.append('avatarUrl', facebookPageData.picture);
  }
  
  // Navigate to detailed preview in same tab
  const url = `detailed-preview.html?${params.toString()}`;
  window.location.href = url;
}

// Absolute centering toggle based on size
function recenterPreview(){
  const vp = document.getElementById('preview-viewport');
  const node = document.getElementById('preview-root');
  if (!vp || !node) return;
  const tooTall = node.getBoundingClientRect().height > (vp.clientHeight - 24);
  node.classList.toggle('absolute', !tooTall);
  vp.classList.toggle('flex-center', tooTall);
}

new ResizeObserver(recenterPreview).observe(document.getElementById('preview-root'));
new ResizeObserver(recenterPreview).observe(document.getElementById('preview-viewport'));
window.addEventListener('load', recenterPreview);

// Function to generate or regenerate ad copy
async function generateAdCopy(isRegenerate = false) {
  const website = $("#input-url").value.trim();
  const company = $("#input-company").value.trim();
  const objective = $("#input-objective").value.trim();
  
  if (!website || !company || !objective){
    toast("Please provide Website/CTURL, Company Overview, and Campaign Objective.");
    return;
  }
  
  // Show loading state
  const btn = $("#btn-generate-copy");
  const originalText = btn.textContent;
  setButtonLoading(btn, true, isRegenerate ? "Regenerating..." : "Generating...");
  
  // Grey out and add spinners to Step 2 fields
  setStep2LoadingState(true);
  
  try {
    const requestData = {
      website: website,
      companyOverview: company,
      objective: objective,
      salesFormula: $("#input-formula").value,
      companyInfo: $("#input-company-info").value,
      instructions: $("#input-instructions").value,
      customPrompt: $("#input-prompt").value,
      includeEmoji: $("#toggle-emoji").checked,
      facebookPageData: fields.fbPageData.value ? JSON.parse(fields.fbPageData.value) : null
    };
    
    // Handle creative upload if present
    const creativeFile = $("#input-creative").files[0];
    if (creativeFile) {
      const creativeData = await processCreativeUpload(creativeFile);
      if (creativeData) {
        requestData.creativeData = creativeData;
      }
    }
    
    const response = await fetch('./api/generate-copy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Generation failed');
    }
    
    // Populate the generated copy
    populateGeneratedCopy(result.data);
    
    // Update generation state
    hasGeneratedCopy = true;
    updateGenerateButtonText();
    
    // Enable Step 2 and collapse Step 1 (only if first time)
    if (!isRegenerate) {
      step2.classList.remove("step-disabled");
      step2.setAttribute("open","");
      step1.removeAttribute("open");
      step2.scrollIntoView({behavior:"smooth", block:"start"});
    }
    
    toast(isRegenerate ? "Ad copy regenerated successfully!" : "Ad copy generated successfully!");
    
  } catch (error) {
    console.error('Generation error:', error);
    toast(`Generation failed: ${error.message}`);
  } finally {
    // Restore button and field states
    setButtonLoading(btn, false);
    setStep2LoadingState(false);
  }
}

// Enhanced Generate Ad Copy button handler
$("#btn-generate-copy").addEventListener("click", async ()=>{
  await generateAdCopy(hasGeneratedCopy);
});

// Process creative upload for AI analysis
async function processCreativeUpload(file) {
  if (!file.type.startsWith('image/')) {
    return null;
  }
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target.result.split(',')[1];
      resolve({
        type: file.type,
        data: base64Data
      });
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

// Populate form fields with generated copy
function populateGeneratedCopy(data) {
  if (data.postText) {
    fields.postText.value = data.postText;
  }
  if (data.headline) {
    fields.headline.value = data.headline;
  }
  if (data.linkDescription) {
    fields.linkDesc.value = data.linkDescription;
  }
  if (data.displayLink) {
    fields.displayLink.value = data.displayLink;
  }
  if (data.cta) {
    fields.cta.value = data.cta;
  }
  if (data.adName) {
    fields.adName.value = data.adName;
  }
  
  // Update counters and preview
  updateCounters();
  syncPreview();
  
  // Save to localStorage
  save();
}

// Enhanced Facebook page detection with instant URL parsing and fallbacks
function extractFacebookPageInfoFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Only do basic validation, let server handle complex extraction
    // Just provide a placeholder name while we wait for server response
    if (pathname.match(/^\/[^\/]+\/?$/) || pathname.includes('/pages/') || pathname === '/profile.php') {
      return {
        name: 'Loading Facebook page info...',
        picture: null,
        url: url,
        method: 'client_placeholder'
      };
    }
    
    return null;
  } catch (e) {
    console.error('Error parsing Facebook URL:', e);
    return null;
  }
}

// Function to verify Facebook page
async function verifyFacebookPage() {
  const url = fields.fbLink.value.trim();
  if (!url || !url.includes('facebook.com')) {
    toast('Please enter a valid Facebook page URL');
    fields.btnVerifyFacebook.classList.add('btn-error');
    setTimeout(() => fields.btnVerifyFacebook.classList.remove('btn-error'), 2000);
    return;
  }
  
  // Show loading state
  console.log('Starting Facebook page verification for:', url);
  const originalText = fields.btnVerifyFacebook.textContent;
  fields.btnVerifyFacebook.textContent = 'Verifying...';
  fields.btnVerifyFacebook.disabled = true;
  fields.btnVerifyFacebook.classList.add('btn-loading');
  
  try {
    const apiUrl = `https://meta.edwinlovett.com/?page=${encodeURIComponent(url)}`;
    console.log('Making API call to:', apiUrl);
    
    const response = await fetch(apiUrl);
    const result = await response.json();
    
    console.log('API Response:', response.status, result);
    
    if (response.ok && result.success && result.data) {
      // Store complete page data
      facebookPageData = result.data;
      fields.fbPageData.value = JSON.stringify(result.data);
      
      // Update form fields with Facebook data
      updateFormFieldsWithFacebookData(result.data);
      
      // Update preview elements
      updatePreviewWithFacebookData(result.data);
      
      // Update Company Overview with intro if available
      if (result.data.intro && !fields.company.value) {
        fields.company.value = result.data.intro;
        updateCounters(); // Update all counters including company
      }
      
      // Success state - lock field and change button
      fields.fbLink.disabled = true;
      fields.btnVerifyFacebook.textContent = 'Reset';
      fields.btnVerifyFacebook.disabled = false;
      fields.btnVerifyFacebook.classList.remove('btn-primary', 'btn-loading', 'btn-error');
      fields.btnVerifyFacebook.classList.add('btn-success');
      
      // Enable other fields
      enableAdvertiserFields();
      
      toast(`✓ Found: ${result.data.name}`, 'success');
    } else {
      // Error state
      console.error('Facebook page fetch failed:', result.error || 'Unknown error');
      fields.btnVerifyFacebook.textContent = 'Verify';
      fields.btnVerifyFacebook.disabled = false;
      fields.btnVerifyFacebook.classList.remove('btn-loading');
      fields.btnVerifyFacebook.classList.add('btn-error');
      toast(`✗ ${result.error || 'Could not fetch Facebook page info'}`, 'error');
      
      setTimeout(() => {
        fields.btnVerifyFacebook.classList.remove('btn-error');
      }, 3000);
    }
  } catch (error) {
    // Network or other error
    console.error('Facebook API error:', error);
    fields.btnVerifyFacebook.textContent = 'Verify';
    fields.btnVerifyFacebook.disabled = false;
    fields.btnVerifyFacebook.classList.remove('btn-loading');
    fields.btnVerifyFacebook.classList.add('btn-error');
    toast('✗ Network error - please try again', 'error');
    
    setTimeout(() => {
      fields.btnVerifyFacebook.classList.remove('btn-error');
    }, 3000);
  }
}

// Function to reset Facebook verification
function resetFacebookVerification() {
  // Clear Facebook data
  facebookPageData = null;
  fields.fbPageData.value = '';
  fields.fbPageId.value = '';
  fields.fbPageName.value = '';
  fields.fbCategory.value = '';
  fields.fbCoverPhoto.value = '';
  fields.instagramHandle.value = '';
  fields.instagramLink.style.display = 'none';
  fields.instagramLink.href = '#';
  
  // Reset preview to defaults
  preview.brand.textContent = 'Your Brand';
  preview.instagramBrand.textContent = 'Your Brand';
  preview.handle.textContent = '@brand';
  updatePreviewAvatar(''); // Clear avatar
  
  // Enable Facebook link field and reset button
  fields.fbLink.disabled = false;
  fields.btnVerifyFacebook.textContent = 'Verify';
  fields.btnVerifyFacebook.classList.remove('btn-success', 'btn-error', 'btn-secondary');
  fields.btnVerifyFacebook.classList.add('btn-primary');
  
  // Disable other fields until verified again
  disableAdvertiserFields();
  
  syncPreview();
}

// Verify/Reset button handler
fields.btnVerifyFacebook?.addEventListener('click', async () => {
  if (fields.btnVerifyFacebook.textContent === 'Reset') {
    resetFacebookVerification();
  } else {
    await verifyFacebookPage();
  }
});

// Function to disable advertiser fields until Facebook page is verified
function disableAdvertiserFields() {
  fields.url.disabled = true;
  fields.company.disabled = true;
  fields.objective.disabled = true;
  $("#btn-generate-copy").disabled = true;
}

// Function to enable advertiser fields after Facebook page is verified
function enableAdvertiserFields() {
  fields.url.disabled = false;
  fields.company.disabled = false;
  fields.objective.disabled = false;
  $("#btn-generate-copy").disabled = false;
}


function updateFormFieldsWithFacebookData(data) {
  // Update Facebook page fields
  if (data.page_id) {
    fields.fbPageId.value = data.page_id;
  }
  if (data.name) {
    fields.fbPageName.value = data.name;
  }
  if (data.categories && data.categories.length > 0) {
    // Remove "Page, " from categories if it exists
    let categories = data.categories.filter(cat => cat !== 'Page').join(', ');
    fields.fbCategory.value = categories;
  }
  if (data.cover_image) {
    fields.fbCoverPhoto.value = data.cover_image;
  }
  // Update Instagram handle with full URL and show link icon
  if (data.instagram_url) {
    fields.instagramHandle.value = data.instagram_url;
    fields.instagramLink.href = data.instagram_url;
    fields.instagramLink.style.display = 'block';
  } else if (data.instagram_details && data.instagram_details.result && data.instagram_details.result.username) {
    const instagramUrl = `https://www.instagram.com/${data.instagram_details.result.username}`;
    fields.instagramHandle.value = instagramUrl;
    fields.instagramLink.href = instagramUrl;
    fields.instagramLink.style.display = 'block';
  }
  // Update Website URL field (remove UTM parameters)
  if (data.website && !fields.url.value) {
    let cleanUrl = data.website;
    // Add https:// if not present
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }
    // Remove UTM parameters
    try {
      const urlObj = new URL(cleanUrl);
      urlObj.search = ''; // Remove all query parameters
      fields.url.value = urlObj.toString();
    } catch (e) {
      fields.url.value = cleanUrl;
    }
  }
}

function updatePreviewWithFacebookData(data) {
  // Update Facebook brand name
  if (data.name) {
    preview.brand.textContent = data.name;
  }
  
  // Update Instagram brand name from Instagram details if available
  if (data.instagram_details && data.instagram_details.result && data.instagram_details.result.full_name) {
    preview.instagramBrand.textContent = data.instagram_details.result.full_name;
  } else if (data.name) {
    // Fallback to Facebook name
    preview.instagramBrand.textContent = data.name;
  }
  
  // Update brand handle from Instagram username
  if (data.instagram_details && data.instagram_details.result && data.instagram_details.result.username) {
    preview.handle.textContent = `@${data.instagram_details.result.username}`;
  }
  
  // Update profile picture - use facebook_profile_image from Images array
  let profileImageUrl = null;
  if (data.Images && Array.isArray(data.Images)) {
    // Look for facebook_profile_image first
    const fbProfileImage = data.Images.find(img => img.type === 'facebook_profile_image');
    if (fbProfileImage && fbProfileImage.url) {
      profileImageUrl = fbProfileImage.url;
    }
  }
  
  // Fallback to other image sources if Images array doesn't have what we need
  if (!profileImageUrl) {
    if (data.image) {
      profileImageUrl = data.image;
    } else if (data.instagram_details && data.instagram_details.result && data.instagram_details.result.profile_pic_url) {
      profileImageUrl = data.instagram_details.result.profile_pic_url;
    }
  }
  
  if (profileImageUrl) {
    updatePreviewAvatar(profileImageUrl);
  }
  
  syncPreview();
}

function updatePreviewAvatar(pictureUrl) {
  // Update all avatar elements in the preview
  const avatars = document.querySelectorAll('.avatar');
  avatars.forEach(avatar => {
    if (pictureUrl) {
      // Create an image element to test loading
      const img = new Image();
      img.onerror = () => {
        console.warn('Could not load profile image due to CORS:', pictureUrl);
        // Set a fallback color or gradient
        avatar.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      };
      img.onload = () => {
        avatar.style.backgroundImage = `url(${pictureUrl})`;
        avatar.style.backgroundSize = 'cover';
        avatar.style.backgroundPosition = 'center';
      };
      img.src = pictureUrl;
    } else {
      // Clear avatar
      avatar.style.backgroundImage = '';
      avatar.style.background = '';
    }
  });
}

// Reset avatar on form reset or when Facebook link is cleared
function resetPreviewAvatar() {
  const avatars = document.querySelectorAll('.avatar');
  avatars.forEach(avatar => {
    avatar.style.backgroundImage = '';
    avatar.style.backgroundColor = 'hsl(220 10% 86%)';
  });
}

// Enhanced error handling and user feedback
function handleAPIError(error, context) {
  console.error(`${context} error:`, error);
  
  let userMessage = 'Something went wrong. Please try again.';
  
  if (error.message.includes('Rate limit')) {
    userMessage = 'Too many requests. Please wait a moment and try again.';
  } else if (error.message.includes('network') || error.message.includes('fetch')) {
    userMessage = 'Network error. Please check your connection.';
  } else if (error.message.includes('parse') || error.message.includes('JSON')) {
    userMessage = 'Invalid response format. Please try again.';
  }
  
  toast(userMessage);
}

// Loading states for buttons
function setButtonLoading(button, loading, loadingText = 'Generating...') {
  if (loading) {
    button.dataset.originalText = button.textContent;
    button.textContent = loadingText;
    button.disabled = true;
    button.classList.add('loading');
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
    button.disabled = false;
    button.classList.remove('loading');
    delete button.dataset.originalText;
  }
}

// Loading state for Step 2 fields
function setStep2LoadingState(loading) {
  const step2Fields = [
    '#post-text',
    '#headline', 
    '#link-desc',
    '#dest-url',
    '#display-link',
    '#cta',
    '#ad-name'
  ];
  
  step2Fields.forEach(selector => {
    const field = $(selector);
    if (field) {
      if (loading) {
        field.disabled = true;
        field.classList.add('loading-field');
        field.placeholder = field.placeholder || 'Generating...';
      } else {
        field.disabled = false;
        field.classList.remove('loading-field');
        // Reset placeholder if it was set to "Generating..."
        if (field.placeholder === 'Generating...') {
          field.placeholder = '';
        }
      }
    }
  });
  
  // Add/remove spinner overlay to Step 2
  const step2Card = $('#step2-card');
  if (step2Card) {
    if (loading) {
      step2Card.classList.add('step-loading');
    } else {
      step2Card.classList.remove('step-loading');
    }
  }
}
