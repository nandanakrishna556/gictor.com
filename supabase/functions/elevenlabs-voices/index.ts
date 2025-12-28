import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Curated voice IDs with pre-fetched metadata
// Since ElevenLabs doesn't allow fetching individual public voices by ID,
// we include the essential metadata here
const CURATED_VOICES = [
  // American Female
  { voice_id: "56AoDkrOh6qfVPDXZ7Pt", name: "Cassidy", accent: "american", gender: "female", age: "middle_aged", descriptive: "confident", use_case: "conversational" },
  { voice_id: "l4Coq6695JDX9xtLqXDE", name: "Charlotte", accent: "american", gender: "female", age: "middle_aged", descriptive: "warm", use_case: "narrative_story" },
  { voice_id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", accent: "american", gender: "female", age: "young", descriptive: "soft", use_case: "news" },
  { voice_id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura", accent: "american", gender: "female", age: "young", descriptive: "upbeat", use_case: "social_media" },
  { voice_id: "Xb7hH8MSUJpSbSDYk0k2", name: "Alice", accent: "american", gender: "female", age: "middle_aged", descriptive: "confident", use_case: "news" },
  { voice_id: "XrExE9yKIg1WjnnlVkGX", name: "Matilda", accent: "american", gender: "female", age: "young", descriptive: "warm", use_case: "audiobook" },
  { voice_id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily", accent: "american", gender: "female", age: "middle_aged", descriptive: "warm", use_case: "narration" },
  { voice_id: "cgSgspJ2msm6clMCkdW9", name: "Jessica", accent: "american", gender: "female", age: "young", descriptive: "expressive", use_case: "conversational" },
  { voice_id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", accent: "american", gender: "female", age: "young", descriptive: "calm", use_case: "narration" },
  { voice_id: "ThT5KcBeYPX3keUQqHPh", name: "Dorothy", accent: "american", gender: "female", age: "young", descriptive: "pleasant", use_case: "children_stories" },
  { voice_id: "AZnzlk1XvdvUeBnXmlld", name: "Domi", accent: "american", gender: "female", age: "young", descriptive: "strong", use_case: "narration" },
  { voice_id: "MF3mGyEYCl7XYWbV9V6O", name: "Elli", accent: "american", gender: "female", age: "young", descriptive: "emotional", use_case: "narration" },
  { voice_id: "jBpfuIE2acCO8z3wKNLl", name: "Gigi", accent: "american", gender: "female", age: "young", descriptive: "childlish", use_case: "animation" },
  { voice_id: "oWAxZDx7w5VEj9dCyTzz", name: "Grace", accent: "american", gender: "female", age: "young", descriptive: "gentle", use_case: "audiobook" },
  { voice_id: "jsCqWAovK2LkecY7zXl4", name: "Freya", accent: "american", gender: "female", age: "young", descriptive: "expressive", use_case: "characters" },
  
  // American Male
  { voice_id: "CwhRBWXzGAHq8TQ4Fs17", name: "Roger", accent: "american", gender: "male", age: "middle_aged", descriptive: "confident", use_case: "news" },
  { voice_id: "IKne3meq5aSn9XLyUdCD", name: "Charlie", accent: "american", gender: "male", age: "middle_aged", descriptive: "conversational", use_case: "conversational" },
  { voice_id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam", accent: "american", gender: "male", age: "young", descriptive: "articulate", use_case: "narration" },
  { voice_id: "cjVigY5qzO86Huf0OWal", name: "Eric", accent: "american", gender: "male", age: "middle_aged", descriptive: "friendly", use_case: "conversational" },
  { voice_id: "iP95p4xoKVk53GoZ742B", name: "Chris", accent: "american", gender: "male", age: "middle_aged", descriptive: "casual", use_case: "conversational" },
  { voice_id: "nPczCjzI2devNBz1zQrb", name: "Brian", accent: "american", gender: "male", age: "middle_aged", descriptive: "deep", use_case: "narration" },
  { voice_id: "pqHfZKP75CvOlQylNhV4", name: "Bill", accent: "american", gender: "male", age: "old", descriptive: "trustworthy", use_case: "documentary" },
  { voice_id: "N2lVS1w4EtoT3dr4eOWO", name: "Callum", accent: "american", gender: "male", age: "middle_aged", descriptive: "intense", use_case: "characters" },
  { voice_id: "ErXwobaYiN019PkySvjV", name: "Antoni", accent: "american", gender: "male", age: "young", descriptive: "well_rounded", use_case: "narration" },
  { voice_id: "VR6AewLTigWG4xSOukaG", name: "Arnold", accent: "american", gender: "male", age: "middle_aged", descriptive: "crisp", use_case: "narration" },
  { voice_id: "pNInz6obpgDQGcFmaJgB", name: "Adam", accent: "american", gender: "male", age: "middle_aged", descriptive: "deep", use_case: "narration" },
  { voice_id: "yoZ06aMxZJJ28mfd3POQ", name: "Sam", accent: "american", gender: "male", age: "young", descriptive: "raspy", use_case: "narration" },
  { voice_id: "5Q0t7uMcjvnagumLfvZi", name: "Paul", accent: "american", gender: "male", age: "middle_aged", descriptive: "authoritative", use_case: "news" },
  { voice_id: "SOYHLrjzK2X1ezoPC6cr", name: "Harry", accent: "american", gender: "male", age: "young", descriptive: "anxious", use_case: "characters" },
  { voice_id: "2EiwWnXFnvU5JabPnv8n", name: "Clyde", accent: "american", gender: "male", age: "middle_aged", descriptive: "war_veteran", use_case: "characters" },
  { voice_id: "ZQe5CZNOzWyzPSCn5a3c", name: "James", accent: "american", gender: "male", age: "old", descriptive: "calm", use_case: "news" },
  { voice_id: "bVMeCyTHy58xNoL34h3p", name: "Jeremy", accent: "american", gender: "male", age: "middle_aged", descriptive: "excited", use_case: "narration" },
  
  // British Female
  { voice_id: "ZF6FPAbjXT4488VcRRnw", name: "Amelia", accent: "british", gender: "female", age: "young", descriptive: "upbeat", use_case: "narrative_story" },
  { voice_id: "pMsXgVXv3BLzUgSXRplE", name: "Serena", accent: "british", gender: "female", age: "middle_aged", descriptive: "pleasant", use_case: "interactive" },
  { voice_id: "z9fAnlkpzviPz146aGWa", name: "Glinda", accent: "british", gender: "female", age: "middle_aged", descriptive: "witch", use_case: "characters" },
  { voice_id: "XB0fDUnXU5powFXDhCwa", name: "Charlotte", accent: "british", gender: "female", age: "young", descriptive: "seductive", use_case: "characters" },
  
  // British Male  
  { voice_id: "JBFqnCBsd6RMkjVDRZzb", name: "George", accent: "british", gender: "male", age: "middle_aged", descriptive: "raspy", use_case: "narration" },
  { voice_id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel", accent: "british", gender: "male", age: "middle_aged", descriptive: "authoritative", use_case: "news" },
  { voice_id: "bIHbv24MWmeRgasZH58o", name: "Will", accent: "british", gender: "male", age: "young", descriptive: "friendly", use_case: "podcasts" },
  { voice_id: "g5CIjZEefAph4nQFvHAz", name: "Ethan", accent: "british", gender: "male", age: "young", descriptive: "storyteller", use_case: "ASMR" },
  { voice_id: "ODq5zmih8GrVes37Dizd", name: "Patrick", accent: "british", gender: "male", age: "middle_aged", descriptive: "articulate", use_case: "narration" },
  { voice_id: "GBv7mTt0atIp3Br8iCZE", name: "Thomas", accent: "british", gender: "male", age: "young", descriptive: "calm", use_case: "meditation" },
  { voice_id: "Yko7PKHZNXotIFUBG7I9", name: "Marcus", accent: "british", gender: "male", age: "middle_aged", descriptive: "authoritative", use_case: "news" },
  { voice_id: "t0jbNlBVZ17f02VDIeMI", name: "Fin", accent: "british", gender: "male", age: "old", descriptive: "sailor", use_case: "characters" },
  { voice_id: "D38z5RcWu1voky8WS1ja", name: "Callum", accent: "british", gender: "male", age: "young", descriptive: "intense", use_case: "characters" },
  
  // Australian
  { voice_id: "SAz9YHcvj6GT2YYXdXww", name: "River", accent: "australian", gender: "non-binary", age: "young", descriptive: "confident", use_case: "social_media" },
  
  // Irish
  { voice_id: "zrHiDhphv9ZnVXBqCLjz", name: "Mimi", accent: "irish", gender: "female", age: "young", descriptive: "childish", use_case: "animation" },
  
  // Indian
  { voice_id: "zcAOhNBS3c14rBihAFp1", name: "Giovanni", accent: "indian", gender: "male", age: "young", descriptive: "foreigner", use_case: "audiobook" },
  { voice_id: "flq6f7yk4E4fJM5XTYuZ", name: "Michael", accent: "indian", gender: "male", age: "old", descriptive: "orotund", use_case: "audiobook" },
  
  // Swedish
  { voice_id: "LcfcDJNUP1GQjkzn1xUU", name: "Emily", accent: "swedish", gender: "female", age: "young", descriptive: "calm", use_case: "meditation" },
  
  // Holiday/Character voices
  { voice_id: "MDLAMJ0jxkpYkjXbmG4t", name: "Santa", accent: "american", gender: "male", age: "old", descriptive: "jolly", use_case: "characters" },
  { voice_id: "SAhdygBsjizE9aIj39dz", name: "Mrs Claus", accent: "american", gender: "female", age: "old", descriptive: "warm", use_case: "characters" },
  { voice_id: "h6u4tPKmcPlxUdZOaVpH", name: "The Reindeer", accent: "american", gender: "male", age: "young", descriptive: "playful", use_case: "characters" },
  { voice_id: "e79twtVS2278lVZZQiAD", name: "The Elf", accent: "american", gender: "male", age: "young", descriptive: "cheerful", use_case: "characters" },
  { voice_id: "kPtEHAvRnjUJFv7SK9WI", name: "Glitch", accent: "american", gender: "male", age: "young", descriptive: "robotic", use_case: "characters" },
];

// Build preview URLs for voices (ElevenLabs standard format)
function getPreviewUrl(voiceId: string): string {
  // Use ElevenLabs standard preview format
  return `https://api.elevenlabs.io/v1/voices/${voiceId}/preview`;
}

interface Voice {
  voice_id: string;
  name: string;
  preview_url?: string;
  labels?: Record<string, string>;
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

    console.log('Building curated voice list...');
    
    // Step 1: Fetch user's library voices (for preview URLs and any custom voices)
    const libraryResponse = await fetch('https://api.elevenlabs.io/v1/voices', {
      method: 'GET',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    const libraryVoicesMap = new Map<string, Voice>();
    if (libraryResponse.ok) {
      const libraryData = await libraryResponse.json();
      const libraryVoices = libraryData.voices || [];
      console.log(`Fetched ${libraryVoices.length} library voices`);
      
      // Map library voices by ID for quick lookup
      for (const voice of libraryVoices) {
        libraryVoicesMap.set(voice.voice_id, voice);
      }
    }

    // Step 2: Build final voice list from curated data
    const allVoices: Voice[] = [];
    
    for (const curatedVoice of CURATED_VOICES) {
      // Check if we have this voice in library (with preview URL)
      const libraryVoice = libraryVoicesMap.get(curatedVoice.voice_id);
      
      if (libraryVoice) {
        // Use library version with real preview URL
        allVoices.push(libraryVoice);
      } else {
        // Use curated data with constructed preview URL
        allVoices.push({
          voice_id: curatedVoice.voice_id,
          name: curatedVoice.name,
          preview_url: getPreviewUrl(curatedVoice.voice_id),
          labels: {
            accent: curatedVoice.accent,
            gender: curatedVoice.gender,
            age: curatedVoice.age,
            descriptive: curatedVoice.descriptive,
            use_case: curatedVoice.use_case,
          },
        });
      }
    }
    
    // Also add any library voices that aren't in curated list (user's custom voices)
    for (const [voiceId, voice] of libraryVoicesMap) {
      const isInCurated = CURATED_VOICES.some(cv => cv.voice_id === voiceId);
      if (!isInCurated) {
        allVoices.push(voice);
      }
    }
    
    // Sort by name for consistent ordering
    allVoices.sort((a, b) => a.name.localeCompare(b.name));
    
    console.log(`Returning ${allVoices.length} total voices`);

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
