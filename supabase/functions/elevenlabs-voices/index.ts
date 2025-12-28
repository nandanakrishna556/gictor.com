import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Curated list of 163 voice IDs
const CURATED_VOICE_IDS = [
  "yj30vwTGJxSHezdAGsv9", "hA4zGnmTwX2NQiTRMt7o", "xctasy8XvGp2cVO9HL9k", "XcXEQzuLXRU9RcfWzEJt",
  "yM93hbw8Qtvdma2wCnJG", "t1myskmYQbiTpxXcDfBx", "PoHUWWWMHFrA8z7Q88pu", "WtA85syCrJwasGeHGH2p",
  "qBDvhofpxp92JgXJxDjB", "uYXf8XasLslADfZ2MB4u", "kPzsL2i3teMYv0FxEYQ6", "zGjIP4SZlMnY9m93k97r",
  "4tRn1lSkEn13EVTuqb0g", "vr5WKaGvRWsoaX5LCVax", "gJx1vCzNCD1EQHT212Ls", "54Cze5LrTSyLgbO6Fhlc",
  "EST9Ui6982FZPSi7gCHi", "aTxZrSrp47xsP6Ot4Kgd", "lxYfHSkYm1EzQzGhdbfc", "56AoDkrOh6qfVPDXZ7Pt",
  "y3H6zY6KvCH2pEuQjmv8", "RaFzMbMIfqBcIurH6XF9", "NHRgOEwqx5WZNClv5sat", "l4Coq6695JDX9xtLqXDE",
  "rSZFtT0J8GtnLqoDoFAp", "aMSt68OGf4xUZAnLpTU8", "FUfBrNit0NNZAwb58KWH", "C3x1TEM7scV4p2AXJyrp",
  "dMyQqiVXTU80dDl2eNK8", "rhKGiHCLeAC5KPBEZiUq", "0i0eaL5A0pznTa4q5uxk", "iMYQLhTbF3s1uBPqD8ss",
  "PT4nqlKZfc06VW1BuClj", "P7x743VjyZEOihNNygQ9", "CRugt7r6KLDJbifthghJ", "x9leqCOAXOcmC5jtkq65",
  "pvxGJdhknm00gMyYHtET", "kdnRe2koJdOK4Ovxn2DI", "MHPwHxLx0nmGIb5Jnbly", "n3yMmKmTfVCEM13Kk2lp",
  "pBZVCk298iJlHAcHQwLr", "ZF6FPAbjXT4488VcRRnw", "19STyYD15bswVz51nqLf", "NtSmOMyr386gAQrqbQcB",
  "NFFZBoF6tNodi008z7VH", "CpGtoGY8SdJ5zkY4HAjX", "lUCNYQh2kqW2wiie85Qk", "h91eQmD8oL4DYYdNax7e",
  "RILOU7YmBhvwJGDGjNmP", "65dhNaIr3Y4ovumVtdy0", "6OzrBCQf8cjERkYgzSg8", "UgBBYS2sOqTuMpoF3BR0",
  "nzFihrBIvB34imQBuxub", "s3TPKV1kjDlVtZbl4Ksh", "8IbUB2LiiCZ85IJAHNnZ", "XA2bIQ92TabjGbpO2xRr",
  "ZEBslWM12xCQWILoQtiP", "A41HRDgOrF1mgUtjuSGM", "kdVjFjOXaqExaDvXZECX", "ZauUyVXAz5znrgRuElJ5",
  "3XOBzXhnDY98yeWQ3GdM", "TtRFBnwQdH1k01vR0hMz", "mUfWEBhcigm8YlCDbmGP", "S9GPGBaMND8XWwwzxQXp",
  "Rn9Yq7uum9irZ6RwppDN", "4e32WqNVWRquDa1OcRYZ", "vBKc2FfBKJfcZNyEt1n6", "8fcyCHOzlKDlxh1InJSf",
  "5e3JKXK83vvgQqBcdUol", "q0IMILNRPxOgtBTS4taI", "Mtmp3KhFIjYpWYRycDe3", "WNPU2f2Gr5PpDLI9wPbq",
  "e5WNhrdI30aXpS2RSGm1", "MFZUKuGQUsGJPQjTS4wC", "iiidtqDt9FBdT1vfBluA", "BtWabtumIemAotTjP5sk",
  "IRHApOXLvnW57QJPQH2P", "SA7eD52NRr8WAehitVt1", "repzAAjoKlgcT2oOAIWt", "8Es4wFxsDlHBmFWAOWRS",
  "FYZl5JbWOAm6O1fPKAOu", "gUABw7pXQjhjt0kNFBTF", "wevlkhfRsG0ND2D2pQHq", "uju3wxzG5OhpWcoi3SMy",
  "jB108zg64sTcu1kCbN9L", "Dslrhjl3ZpzrctukrQSN", "gnPxliFHTp6OK6tcoA6i", "dXtC3XhB9GtPusIpNtQx",
  "6xPz2opT0y5qtoRh1U1Y", "4YYIPFl9wE5c4L2eu2Gb", "c6SfcYrb2t09NHXiT80T", "1SM7GgM6IMuvQlz2BwM3",
  "8Ln42OXYupYsag45MAUy", "v32airczvHKOKNkTzmTI", "qA5SHJ9UjGlW2QwXWR7w", "hKUnzqLzU3P9IVhYHREu",
  "bTEswxYhpv7UDkQg5VRu", "1t1EeRixsJrKbiF1zwM6", "gfRt6Z3Z8aTbpLfexQ7N", "fvVBPXuE7f1iX3dZLKFy",
  "RexqLjNzkCjWogguKyff", "My7odpuMrttByivyQayf", "pVnrL6sighQX7hVz89cp", "DwwuoY7Uz8AP8zrY5TAo",
  "IHw7aBJxrIo1SxkG9px5", "7EzWGsX10sAS4c9m9cPf", "tgfcQY9SGvn3GfmnNWIi", "R13lt9tQ5Z8CcM2SDB1K",
  "Rmv8zCb2IRE895dK1qWB", "MYiFAKeVwcvm4z9VsFAR", "dn9HtxgDwCH96MVX9iAO", "JlPfrZoXeAKnNaogINHc",
  "WWr4C8ld745zI3BiA8n7", "zCgijgIKIMkFHnzXcCva", "gOkFV1JMCt0G0n9xmBwV", "Zv7P8CISODgj9wDHyyI9",
  "UQoLnPXvf18gaKpLzfb8", "ApsbCjXt5HguctE80a0i", "apqgWHkh7foVKMqZECss", "wAGzRVkxKEs8La0lmdrE",
  "qAZH0aMXY8tw1QufPN0D", "NOpBlnGInO9m6vDvFkFC", "B52raBK48m23qWYbwchQ", "mKoqwDP2laxTdq1gEgU6",
  "cPoqAvGWCPfCfyPMwe4z", "YXpFCvM1S3JbWEJhoskW", "YjlcD3XHztjJEo2wNszv", "9IzcwKmvwJcw58h3KnlH",
  "Sq93GQT4X1lKDXsQcixO", "8JVbfL6oEdmuxKn5DK2C", "qxjGnozOAtD4eqNuXms4", "G7ILShrCNLfmS0A37SXS",
  "4u5cJuSmHP9d6YRolsOu", "wo6udizrrtpIxWGp2qJk", "UaYTS0wayjmO9KD1LR4R", "lF0PpOQjCl3K89rt0U83",
  "kmSVBPu7loj4ayNinwWM", "sa2z6gEuOalzawBHvrCV", "MKHH3pSZhHPPzypDhMoU", "ogSj7jM4rppgY9TgZMqW",
  "PgrxtC09o2q2Q7YXfVHy", "37frHvUllvzviJDpT2Qa", "pzxut4zZz4GImZNlqQ3H", "bajNon13EdhNMndG3z05",
  "hmMWXCj9K7N5mCPcRkfC", "77aEIu0qStu8Jwv1EdhX", "sgk995upfe3tYLvoGcBN", "iLVmqjzCGGvqtMCk6vVQ",
  "G17SuINrv2H9FC6nvetn", "NYC9WEgkq1u4jiqBseQ9", "Wq15xSaY3gWvazBRaGEU", "jRAAK67SEFE9m7ci5DhD",
  "7S3KNdLDL7aRgBVRQb1z", "L0Dsvb3SLTyegXwtm47J", "lnIpQcZuikKim3oNdYlP", "tJhWDBTSAveEOucKUtO0",
  "UEKYgullGqaF0keqT8Bu", "IpAl1PXsEDWxYzenL51s", "qxePw1S1QmBgjlU3GIy5", "yvKg3CwzCYDTwyHnWQLg",
  "zNsotODqUhvbJ5wMG7Ei", "GsfuR3Wo2BACoxELWyEF", "JGzTGubAVbbgG0SsLIlg"
];

interface VoiceResponse {
  voice_id: string;
  name: string;
  preview_url?: string;
  labels?: {
    gender?: string;
    age?: string;
    accent?: string;
    description?: string;
    use_case?: string;
  };
}

// Normalize voice data to consistent format
function normalizeVoice(voice: VoiceResponse) {
  return {
    voice_id: voice.voice_id,
    name: voice.name,
    preview_url: voice.preview_url,
    gender: voice.labels?.gender || null,
    age: voice.labels?.age || null,
    accent: voice.labels?.accent || null,
    description: voice.labels?.description || null,
    use_case: voice.labels?.use_case || null,
  };
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

    console.log(`Fetching ${CURATED_VOICE_IDS.length} curated voices individually...`);
    
    const voices: ReturnType<typeof normalizeVoice>[] = [];
    const batchSize = 10;
    let successCount = 0;
    let errorCount = 0;
    
    // Fetch voices in batches to avoid rate limits
    for (let i = 0; i < CURATED_VOICE_IDS.length; i += batchSize) {
      const batch = CURATED_VOICE_IDS.slice(i, i + batchSize);
      console.log(`Fetching batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(CURATED_VOICE_IDS.length / batchSize)}...`);
      
      const batchResults = await Promise.all(
        batch.map(async (voiceId) => {
          try {
            const response = await fetch(`https://api.elevenlabs.io/v1/voices/${voiceId}`, {
              method: 'GET',
              headers: {
                'xi-api-key': ELEVENLABS_API_KEY,
                'Content-Type': 'application/json',
              },
            });
            
            if (response.ok) {
              const data: VoiceResponse = await response.json();
              successCount++;
              return normalizeVoice(data);
            } else {
              console.error(`Failed to fetch voice ${voiceId}: ${response.status}`);
              errorCount++;
              return null;
            }
          } catch (e) {
            console.error(`Error fetching voice ${voiceId}:`, e);
            errorCount++;
            return null;
          }
        })
      );
      
      voices.push(...batchResults.filter((v): v is ReturnType<typeof normalizeVoice> => v !== null));
      
      // Small delay between batches to avoid rate limits
      if (i + batchSize < CURATED_VOICE_IDS.length) {
        await new Promise(r => setTimeout(r, 100));
      }
    }
    
    console.log(`Fetched ${successCount} voices successfully, ${errorCount} errors`);
    
    // Sort by name for consistent ordering
    voices.sort((a, b) => a.name.localeCompare(b.name));

    return new Response(
      JSON.stringify({ voices }),
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
