import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    console.log('Fetching voices from ElevenLabs shared voices library...');

    // Fetch shared voices with pagination to get a good selection
    const allVoices: any[] = [];
    let pageSize = 100;
    let page = 0;
    let hasMore = true;

    while (hasMore && page < 5) { // Fetch up to 500 voices
      const url = `https://api.elevenlabs.io/v1/shared-voices?page_size=${pageSize}&page=${page}`;
      console.log(`Fetching page ${page + 1}...`);
      
      const response = await fetch(url, {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`ElevenLabs API error: ${response.status} - ${errorText}`);
        break;
      }

      const data = await response.json();
      const voices = data.voices || [];
      console.log(`Page ${page + 1}: Got ${voices.length} voices`);
      
      allVoices.push(...voices);
      
      hasMore = data.has_more === true && voices.length === pageSize;
      page++;
      
      // Small delay between pages
      if (hasMore) {
        await new Promise(r => setTimeout(r, 100));
      }
    }

    console.log(`Total voices fetched: ${allVoices.length}`);

    // Map shared voices to our expected format
    const formattedVoices = allVoices.map((voice: any) => ({
      voice_id: voice.voice_id,
      name: voice.name,
      preview_url: voice.preview_url,
      gender: voice.gender || voice.labels?.gender || 'unknown',
      age: voice.age || voice.labels?.age || 'unknown',
      accent: voice.accent || voice.labels?.accent || 'unknown',
      description: voice.description || null,
      use_case: voice.use_case || voice.labels?.use_case || null,
    }));

    // Sort by name for consistent ordering
    formattedVoices.sort((a: any, b: any) => a.name.localeCompare(b.name));

    console.log(`Returning ${formattedVoices.length} formatted voices`);

    return new Response(
      JSON.stringify({ voices: formattedVoices }),
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
