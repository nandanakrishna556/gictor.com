import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SharedVoice {
  public_owner_id: string;
  voice_id: string;
  name: string;
  accent?: string;
  gender?: string;
  age?: string;
  descriptive?: string;
  use_case?: string;
  category?: string;
  language?: string;
  description?: string;
  preview_url?: string;
}

interface SharedVoicesResponse {
  voices: SharedVoice[];
  has_more: boolean;
  next_page?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    
    if (!ELEVENLABS_API_KEY) {
      console.error('ELEVENLABS_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'ElevenLabs API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching shared voices from ElevenLabs...');
    
    const allVoices: SharedVoice[] = [];
    let hasMore = true;
    let pageUrl = 'https://api.elevenlabs.io/v1/shared-voices?page_size=100&category=professional';
    let pageCount = 0;
    const maxPages = 5; // Limit to prevent too many API calls
    
    // Paginate through results
    while (hasMore && pageCount < maxPages) {
      console.log(`Fetching page ${pageCount + 1}: ${pageUrl}`);
      
      const response = await fetch(pageUrl, {
        method: 'GET',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to fetch shared voices: ${response.status} - ${errorText}`);
        throw new Error(`Failed to fetch voices: ${response.status}`);
      }

      const data: SharedVoicesResponse = await response.json();
      
      if (data.voices && data.voices.length > 0) {
        allVoices.push(...data.voices);
        console.log(`Fetched ${data.voices.length} voices (total: ${allVoices.length})`);
      }
      
      hasMore = data.has_more === true;
      if (hasMore && data.next_page) {
        // The next_page might be a full URL or just a cursor
        if (data.next_page.startsWith('http')) {
          pageUrl = data.next_page;
        } else {
          pageUrl = `https://api.elevenlabs.io/v1/shared-voices?page_size=100&category=professional&page=${data.next_page}`;
        }
      } else {
        hasMore = false;
      }
      
      pageCount++;
    }
    
    console.log(`Total voices fetched: ${allVoices.length}`);
    
    // Sort by name for consistent ordering
    allVoices.sort((a, b) => a.name.localeCompare(b.name));

    return new Response(
      JSON.stringify({ voices: allVoices }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error fetching voices:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch voices';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
