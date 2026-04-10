import { getAllJobs } from '../_data.js';

export default async function handler(request: Request) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (request.method === 'GET') {
      const jobs = getAllJobs().filter((j: any) => !j.__deleted);
      const summary = jobs.map((j: any) => ({
        id: j.id,
        slug: j.slug,
        jobTitle: j.jobTitle,
        industry: j.industry,
        category: j.category || `${j.industry} job descriptions`,
        published: j.published !== false,
        views: j.views || 0,
        createdAt: j.createdAt,
      }));
      return new Response(JSON.stringify(summary), {
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
