interface FacebookWorkerResponse {
  success: boolean;
  data?: Record<string, any>;
  error?: string;
  method?: string;
}

interface FacebookPageData {
  page_id?: string;
  name: string;
  profile_picture: string;
  cover_image?: string;
  categories?: string[];
  intro?: string;
  instagram_url?: string;
  instagram_details?: any;
  verified?: boolean;
  website?: string;
  followers?: number;
}

const WORKER_URL = process.env.FACEBOOK_WORKER_URL?.replace(/\/$/, '') || 'https://meta.edwinlovett.com';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  let body: any = req.body;
  if (!body || typeof body === 'string') {
    try {
      body = body ? JSON.parse(body) : await readRequestBody(req);
    } catch (error) {
      return res.status(400).json({ success: false, error: 'Invalid JSON payload' });
    }
  }

  const facebookUrl = typeof body?.facebookUrl === 'string' ? body.facebookUrl.trim() : '';
  const websiteUrl = typeof body?.websiteUrl === 'string' ? body.websiteUrl.trim() : undefined;

  if (!facebookUrl) {
    return res.status(400).json({ success: false, error: 'facebookUrl is required' });
  }

  const errors: string[] = [];
  let method = '';
  let pageData: FacebookPageData | null = null;

  try {
    const workerResult = await fetchFromWorker(facebookUrl);
    if (workerResult) {
      pageData = sanitizePageData(workerResult.data);
      method = workerResult.method || 'worker_api';
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Worker request failed');
  }

  if (!pageData) {
    const usernameFallback = buildUsernameFallback(facebookUrl);
    if (usernameFallback) {
      pageData = usernameFallback;
      method = 'url_fallback';
    }
  }

  if (!pageData && websiteUrl) {
    const domainFallback = buildDomainFallback(websiteUrl);
    if (domainFallback) {
      pageData = domainFallback;
      method = 'domain_fallback';
    }
  }

  if (!pageData) {
    return res.status(502).json({
      success: false,
      error: 'Unable to fetch Facebook page information',
      details: errors
    });
  }

  return res.status(200).json({
    success: true,
    data: pageData,
    method,
    errors: errors.length ? errors : undefined
  });
}

async function readRequestBody(req: any): Promise<any> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const buffer = Buffer.concat(chunks);
  if (!buffer.length) {
    return {};
  }
  return JSON.parse(buffer.toString('utf8'));
}

async function fetchFromWorker(facebookUrl: string): Promise<FacebookWorkerResponse | null> {
  if (!WORKER_URL) {
    return null;
  }

  const endpoint = `${WORKER_URL}?page=${encodeURIComponent(facebookUrl)}`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new Error(`Worker responded with status ${response.status}${text ? ` - ${text}` : ''}`);
  }

  const result = (await response.json()) as FacebookWorkerResponse;

  if (!result?.success || !result.data) {
    throw new Error(result?.error || 'Worker returned no data');
  }

  return result;
}

function sanitizePageData(raw: Record<string, any>): FacebookPageData {
  if (!raw) {
    throw new Error('Invalid page data');
  }

  const name = (raw.name || raw.page_name || raw.username || '').toString().trim();
  const profilePicture =
    raw.profile_picture ||
    raw.profilePicture ||
    raw.picture ||
    raw.image ||
    (raw.username ? buildGraphImage(raw.username) : fallbackAvatar(name));

  const categories = Array.isArray(raw.categories)
    ? raw.categories.filter(Boolean).map((category: any) => String(category))
    : typeof raw.category === 'string'
      ? [raw.category]
      : [];

  return {
    page_id: raw.page_id || raw.id || '',
    name: name || 'Unknown Page',
    profile_picture: profilePicture,
    cover_image: raw.cover_image || raw.coverImage || raw.cover_photo || '',
    categories,
    intro: raw.intro || raw.about || raw.description || '',
    instagram_url: raw.instagram_url || undefined,
    instagram_details: raw.instagram_details || undefined,
    verified: Boolean(raw.verified),
    website: raw.website || raw.url || undefined,
    followers: typeof raw.followers === 'number' ? raw.followers : undefined
  };
}

function buildUsernameFallback(facebookUrl: string): FacebookPageData | null {
  let username: string | null = null;
  try {
    const Url = new URL(facebookUrl);
    const parts = Url.pathname.split('/').filter(Boolean);
    if (parts.length > 0) {
      username = parts[0];
    }
  } catch (error) {
    return null;
  }

  if (!username) {
    return null;
  }

  const readableName = formatReadableName(username);

  return {
    page_id: username,
    name: readableName,
    profile_picture: buildGraphImage(username),
    website: facebookUrl,
    intro: 'Facebook page information derived from URL',
    categories: [],
    verified: false
  };
}

function buildDomainFallback(websiteUrl: string): FacebookPageData | null {
  try {
    const Url = new URL(websiteUrl);
    const hostname = Url.hostname.replace('www.', '');
    const readableName = formatReadableName(hostname.split('.')[0]);

    return {
      page_id: hostname,
      name: readableName,
      profile_picture: fallbackAvatar(readableName),
      website: websiteUrl,
      intro: `Business information derived from ${hostname}`,
      categories: [],
      verified: false
    };
  } catch (error) {
    return null;
  }
}

function formatReadableName(value: string): string {
  return value
    .replace(/[-_]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map(word => (word.length <= 2 ? word.toUpperCase() : `${word[0].toUpperCase()}${word.slice(1)}`))
    .join(' ');
}

function buildGraphImage(username: string): string {
  return `https://graph.facebook.com/${encodeURIComponent(username)}/picture?type=large`;
}

function fallbackAvatar(name: string): string {
  const initial = (name || 'FB').charAt(0).toUpperCase() || 'F';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initial)}&background=1877f2&color=fff&size=128`;
}
