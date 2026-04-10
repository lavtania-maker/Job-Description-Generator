import { kv } from '@vercel/kv';

export const config = {
  runtime: 'edge',
};

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

function checkAuth(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  return authHeader === 'Bearer admin-token-2026';
}

export default async function handler(request: Request) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (!checkAuth(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  try {
    const jobs = (await kv.get<any[]>('jobs')) || [];

    if (request.method === 'GET') {
      return new Response(JSON.stringify(jobs), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (request.method === 'POST') {
      const body = await request.json();
      const newJob = {
        ...body,
        location: body.location || 'Malaysia',
        id: Date.now().toString(),
        slug: slugify(body.jobTitle + ' job description'),
        createdAt: new Date().toISOString(),
      };
      jobs.push(newJob);
      await kv.set('jobs', jobs);

      return new Response(JSON.stringify(newJob), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}
