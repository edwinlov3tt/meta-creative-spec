/* Creative Preview Prototype v4 - Vanilla JS */
const $ = (sel)=> document.querySelector(sel);

// STEP gating & layout refs
const step1 = $("#step1-card");
const step2 = $("#step2-card");
const headerEl = $("#app-header");

// Compute header height for grid height calc
function setHeaderHeightVar(){
  const h = headerEl ? headerEl.offsetHeight : 72;
  document.documentElement.style.setProperty('--header-h', h + 'px');
}
window.addEventListener('resize', setHeaderHeightVar);
setHeaderHeightVar();

// Click: Generate Ad Copy => enable Step 2 and collapse Step 1
$("#btn-generate-copy").addEventListener("click", ()=>{
  const url = $("#input-url").value.trim();
  const company = $("#input-company").value.trim();
  if (!url || !company){
    toast("Please provide Website/CTURL and Company Overview.");
    return;
  }
  step2.classList.remove("step-disabled");
  step2.setAttribute("open","");
  step1.removeAttribute("open");
  toast("Ad copy generated. Step 2 enabled.");
  step2.scrollIntoView({behavior:"smooth", block:"start"});
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
  utmCampaign: $("#utm-campaign"),
  utmMedium: $("#utm-medium"),
  utmSource: $("#utm-source"),
  utmContent: $("#utm-content")
};

// Counters
const counters = {
  post: $("#count-post"),
  headline: $("#count-headline"),
  desc: $("#count-desc")
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
  handle: $("#brand-handle"),
  privacy: $("#privacy-icon"),
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
    // FB globe inline SVG
    preview.privacy.innerHTML = `<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M8 0a8 8 0 100 16A8 8 0 008 0zm6 8a5.97 5.97 0 01-1.057 3.386A7.44 7.44 0 0013 11H9V9h5.917zM7 7V1.051A6.01 6.01 0 003 3c-.61.61-1.12 1.333-1.49 2.127L7 7zm2-5.917A6.006 6.006 0 0112.949 7H9V1.083zM7 9v2H3c-.345 0-.68.036-1 .104A6.002 6.002 0 007 2.083V9zm2 2h3.95A6.01 6.01 0 019 13.95V11z"></path></svg>`;
  } else {
    preview.handle.style.display = "";
    preview.privacy.innerHTML = "";
  }
}

function syncPreview(){
  // Post text with optional See more
  const postText = fields.postText.value || "Tell people what you’re promoting in 125 chars or less";
  preview.post.innerHTML = truncateWithSeeMore(escapeHtml(postText));
  preview.ig.primary.textContent = fields.postText.value || "Tell people what you’re promoting…";
  preview.overlay.primary.textContent = fields.postText.value || "Tell people what you’re promoting…";

  preview.headline.textContent = fields.headline.value || "Compelling headline";
  preview.desc.textContent = fields.linkDesc.value || "Short supporting copy";
  preview.displayLink.textContent = fields.displayLink.value || "example.com";
  preview.brand.textContent = (fields.fbLink.value && safeBrandFromUrl(fields.fbLink.value)) || "Your Brand";
  $("#ig-company").textContent = preview.brand.textContent;

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
load(); updateCounters(); syncPreview();

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

$("#btn-regenerate").addEventListener("click", ()=>{
  toast("Generate: wire to your AI endpoint.");
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
      notes: fields.instructions.value
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

function toast(msg){
  let t = document.getElementById("toast");
  if(!t){
    t = document.createElement("div");
    t.id = "toast";
    t.style.position="fixed"; t.style.bottom="16px"; t.style.left="50%"; t.style.transform="translateX(-50%)";
    t.style.background="#111"; t.style.color="#fff"; t.style.padding="10px 14px";
    t.style.borderRadius="10px"; t.style.boxShadow="0 8px 20px rgba(0,0,0,.25)"; t.style.fontWeight="600";
    t.style.zIndex=9999; document.body.appendChild(t);
  }
  t.textContent = msg; t.style.opacity=1;
  setTimeout(()=>{ t.style.opacity=0; }, 1800);
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

// Add to app.js after existing code

// Enhanced Generate Ad Copy button handler
$("#btn-generate-copy").addEventListener("click", async ()=>{
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
  setButtonLoading(btn, true);
  
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
      customPrompt: $("#input-prompt").value
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
    
    // Enable Step 2 and collapse Step 1
    step2.classList.remove("step-disabled");
    step2.setAttribute("open","");
    step1.removeAttribute("open");
    
    toast("Ad copy generated successfully!");
    step2.scrollIntoView({behavior:"smooth", block:"start"});
    
  } catch (error) {
    console.error('Generation error:', error);
    toast(`Generation failed: ${error.message}`);
  } finally {
    // Restore button and field states
    setButtonLoading(btn, false);
    setStep2LoadingState(false);
  }
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

// Facebook page info fetching
let facebookPageData = null;

// Enhanced Facebook page detection with instant URL parsing and fallbacks
function extractFacebookPageInfoFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Handle different Facebook URL formats
    let pageName = null;
    
    // Format: facebook.com/pagename
    if (pathname.match(/^\/[^\/]+\/?$/)) {
      pageName = pathname.replace(/^\/|\/$/g, '');
    }
    // Format: facebook.com/pages/Name/12345
    else if (pathname.includes('/pages/')) {
      const match = pathname.match(/\/pages\/([^\/]+)/);
      if (match) {
        pageName = match[1];
      }
    }
    // Format: facebook.com/profile.php?id=12345
    else if (pathname === '/profile.php') {
      const params = new URLSearchParams(urlObj.search);
      pageName = params.get('id');
    }
    
    if (pageName) {
      // Clean up the name
      pageName = decodeURIComponent(pageName);
      pageName = pageName.replace(/[._-]/g, ' ');
      pageName = pageName.replace(/\b\w/g, l => l.toUpperCase());
      
      return {
        name: pageName,
        picture: `https://graph.facebook.com/${encodeURIComponent(pageName)}/picture?type=large`,
        url: url,
        method: 'client_url_parsing'
      };
    }
    
    return null;
  } catch (e) {
    console.error('Error parsing Facebook URL:', e);
    return null;
  }
}

// Add event listener for Facebook link input with instant feedback
fields.fbLink?.addEventListener('blur', async (e) => {
  const url = e.target.value.trim();
  if (!url || !url.includes('facebook.com')) {
    return;
  }
  
  // Method 1: Instant client-side URL parsing
  const quickInfo = extractFacebookPageInfoFromUrl(url);
  if (quickInfo && quickInfo.name) {
    updatePreviewWithFacebookData(quickInfo);
    toast(`Found page: ${quickInfo.name}`);
  }
  
  // Method 2: Enhanced server-side processing (background)
  try {
    const websiteUrl = fields.url?.value?.trim(); // Get website URL for fallback
    
    const response = await fetch('./api/facebook-page.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        facebookUrl: url,
        websiteUrl: websiteUrl 
      })
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      facebookPageData = result.data;
      
      // Only update if we got better data than client-side parsing
      if (result.data.method !== 'url_parsing' || !quickInfo) {
        updatePreviewWithFacebookData(result.data);
        
        // Show method used for debugging
        const methodMsg = result.data.method === 'domain_fallback' 
          ? `Using website info: ${result.data.name}`
          : `Enhanced data: ${result.data.name}`;
        
        toast(methodMsg);
      }
    } else {
      console.warn('Facebook page fetch failed:', result.error);
      // If client-side parsing failed too, show error
      if (!quickInfo) {
        toast('Could not fetch Facebook page info');
      }
    }
  } catch (error) {
    console.error('Facebook API error:', error);
    // Silent fail if we already have client-side parsing results
    if (!quickInfo) {
      toast('Facebook lookup failed');
    }
  }
});

function updatePreviewWithFacebookData(data) {
  // Update brand name
  if (data.name) {
    preview.brand.textContent = data.name;
    $("#ig-company").textContent = data.name;
  }
  
  // Update profile picture
  if (data.picture) {
    updatePreviewAvatar(data.picture);
  }
  
  syncPreview();
}

function updatePreviewAvatar(pictureUrl) {
  // Update all avatar elements in the preview
  const avatars = document.querySelectorAll('.avatar');
  avatars.forEach(avatar => {
    avatar.style.backgroundImage = `url(${pictureUrl})`;
    avatar.style.backgroundSize = 'cover';
    avatar.style.backgroundPosition = 'center';
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
function setButtonLoading(button, loading) {
  if (loading) {
    button.dataset.originalText = button.textContent;
    button.textContent = 'Generating...';
    button.disabled = true;
    button.classList.add('loading');
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
    button.disabled = false;
    button.classList.remove('loading');
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
