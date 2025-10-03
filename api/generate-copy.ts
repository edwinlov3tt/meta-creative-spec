type CreativeData = {
  type: string;
  data: string;
};

interface GenerateCopyPayload {
  website?: string;
  companyOverview?: string;
  objective?: string;
  salesFormula?: string;
  companyInfo?: string;
  instructions?: string;
  customPrompt?: string;
  includeEmoji?: boolean;
  creativeDescription?: string;
  facebookPageData?: Record<string, any> | null;
  creativeData?: CreativeData | null;
}

// Support multiple environment variable names for flexibility
const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || '';
const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL || process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';
const CLAUDE_MAX_TOKENS = Number(process.env.ANTHROPIC_MAX_TOKENS || process.env.CLAUDE_MAX_TOKENS || 2500);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  if (!CLAUDE_API_KEY) {
    console.error('Missing API key. Available env vars:', Object.keys(process.env).filter(k => k.includes('ANTHROPIC') || k.includes('CLAUDE')));
    return res.status(500).json({
      success: false,
      error: 'Anthropic API key is not configured. Set ANTHROPIC_API_KEY or CLAUDE_API_KEY in Vercel environment variables.'
    });
  }

  let body: GenerateCopyPayload | undefined;

  try {
    body = await parseRequestBody(req);
  } catch (error) {
    return res.status(400).json({ success: false, error: 'Invalid JSON payload' });
  }

  if (!body?.website || !body?.companyOverview || !body?.objective) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: website, companyOverview, objective'
    });
  }

  try {
    const prompt = buildPrompt(body);
    const aiResult = await callAnthropic(prompt, body.creativeData);

    return res.status(200).json({
      success: true,
      data: aiResult,
      method: body.creativeData ? 'anthropic_with_creative' : 'anthropic_text'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate copy';
    console.error('generate-copy error', message);
    return res.status(502).json({ success: false, error: message });
  }
}

async function parseRequestBody(req: any): Promise<GenerateCopyPayload> {
  if (req.body && typeof req.body !== 'string') {
    return req.body;
  }

  const chunks: Uint8Array[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const buffer = Buffer.concat(chunks);
  if (!buffer.length) {
    return {} as GenerateCopyPayload;
  }
  return JSON.parse(buffer.toString('utf8')) as GenerateCopyPayload;
}

function buildPrompt(input: GenerateCopyPayload): string {
  const currentDate = new Date();
  const monthYear = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const lines: string[] = [
    'You are an expert Facebook/Instagram ad copywriter.',
    `Today is ${monthYear}.`,
    '',
    'Generate compelling ad copy based on the following information:',
    '',
    `**Website/Landing Page:** ${input.website}`,
    `**Company Overview:** ${input.companyOverview}`,
    `**Campaign Objective:** ${input.objective}`
  ];

  if (input.salesFormula) {
    lines.push(`**Sales Formula:** ${input.salesFormula}`);
  }

  if (input.companyInfo) {
    lines.push(`**Additional Company Info:** ${input.companyInfo}`);
  }

  if (input.instructions) {
    lines.push(`**Special Instructions:** ${input.instructions}`);
  }

  if (input.customPrompt) {
    lines.push(`**Custom Requirements:** ${input.customPrompt}`);
  }

  if (input.facebookPageData) {
    const page = input.facebookPageData;
    lines.push('', '**FACEBOOK PAGE CONTEXT:**');
    if (page.name) lines.push(`**Page Name:** ${page.name}`);
    if (Array.isArray(page.categories) && page.categories.length > 0) {
      lines.push(`**Business Category:** ${page.categories.join(', ')}`);
    }
    if (page.intro) lines.push(`**Business Description:** ${page.intro}`);
    if (page.followers) lines.push(`**Social Following:** ${page.followers} followers`);
    if (page.website) lines.push(`**Business Website:** ${page.website}`);
    if (page.instagram_details?.result?.full_name) {
      lines.push(`**Instagram Name:** ${page.instagram_details.result.full_name}`);
    }
  }

  const emojiInstruction = input.includeEmoji
    ? 'Include 1 relevant emoji at the beginning of the post text.'
    : 'Do NOT include any emojis in the post text.';

  if (input.creativeDescription) {
    lines.push('', `**Creative Visual Description:** ${input.creativeDescription}`);
  }

  lines.push('', `**Emoji Instructions:** ${emojiInstruction}`);

  lines.push(
    '',
    '**REQUIREMENTS:**',
    `- Primary Text: Maximum 125 characters. ${emojiInstruction}`,
    '- Headline: Maximum 40 characters, compelling and clear.',
    "- Link Description: Maximum 30 characters, action-oriented copy that complements the headline.",
    "- Display Link: Use a clean domain format (e.g., 'example.com').",
    '- CTA: Choose from: Learn More, Shop Now, Sign Up, Download, Get Quote, Book Now, Apply Now, Contact Us.',
    `- Ad Name: Brief, descriptive name including ${monthYear}. Focus on the content, avoid underscores or hyphens.`,
    '',
    '**OUTPUT FORMAT:**',
    'Respond with ONLY a valid JSON object in this exact structure:',
    '{',
    '  "postText": "primary text under 125 chars",',
    '  "headline": "headline under 40 chars",',
    '  "linkDescription": "supporting copy under 30 chars",',
    '  "displayLink": "clean domain",',
    '  "cta": "selected CTA from list",',
    '  "adName": "descriptive campaign name under 50 chars",',
    '  "reasoning": "brief explanation of creative approach"',
    '}',
    '',
    'Do not add commentary before or after the JSON. Adhere to all character limits.'
  );

  return lines.join('\n');
}

async function callAnthropic(prompt: string, creativeData?: CreativeData | null) {
  const contentBlocks: Array<any> = [];

  if (creativeData && creativeData.type && creativeData.data) {
    contentBlocks.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: creativeData.type,
        data: creativeData.data
      }
    });
  }

  contentBlocks.push({ type: 'text', text: prompt });

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: CLAUDE_MAX_TOKENS,
      messages: [
        {
          role: 'user',
          content: contentBlocks
        }
      ]
    })
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => response.statusText);
    throw new Error(`Anthropic API error ${response.status}: ${errorBody}`);
  }

  const result = await response.json();
  const textBlock = Array.isArray(result?.content)
    ? result.content.find((item: any) => item.type === 'text')
    : null;

  if (!textBlock?.text) {
    throw new Error('Anthropic response missing text content');
  }

  const cleaned = textBlock.text
    .replace(/```json\s?/g, '')
    .replace(/```\s?/g, '')
    .trim();

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (error) {
    throw new Error('Failed to parse AI response as JSON');
  }

  const requiredFields = ['postText', 'headline', 'linkDescription', 'displayLink', 'cta', 'adName'];
  for (const field of requiredFields) {
    if (!parsed[field]) {
      throw new Error(`Generated copy missing required field: ${field}`);
    }
  }

  return parsed;
}
