import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const ALLOWED_ORIGINS = [
  "https://gictor.com",
  "https://www.gictor.com",
  "https://promptgeist-studio.lovable.app",
  "https://lovable.dev",
  "https://lovableproject.com",
  Deno.env.get("ALLOWED_ORIGIN") || "",
].filter(Boolean);

const corsHeadersFor = (req: Request) => {
  const origin = req.headers.get("Origin") || "";
  const isAllowed = ALLOWED_ORIGINS.some((allowed) =>
    origin === allowed ||
    origin.endsWith(".lovable.app") ||
    origin.endsWith(".lovable.dev") ||
    origin.endsWith(".lovableproject.com")
  );

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Credentials": "true",
  };
};

const DownloadSchema = z.object({
  url: z.string().url(),
  filename: z.string().min(1).max(255).optional(),
});

const EXACT_ALLOWED_HOSTS = new Set([
  "cdn.doculator.org",
  "d2p7pge43lyniu.cloudfront.net",
  "tempfile.aiquickdraw.com",
  "upload.apimart.ai",
]);

const ALLOWED_HOST_SUFFIXES = [
  ".r2.dev",
  ".fal.media",
  ".cloudfront.net",
];

const CONTENT_TYPE_EXTENSIONS: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/mp4": "m4a",
  "text/plain": "txt",
};

function isAllowedUrl(rawUrl: string) {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "https:") return false;

    const hostname = parsed.hostname.toLowerCase();
    return EXACT_ALLOWED_HOSTS.has(hostname) || ALLOWED_HOST_SUFFIXES.some((suffix) => hostname.endsWith(suffix));
  } catch {
    return false;
  }
}

function sanitizeFilename(value: string) {
  return value
    .replace(/[\\/]+/g, "_")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/[^a-zA-Z0-9._()\- ]+/g, "")
    .trim()
    .slice(0, 255) || "download";
}

function getExtensionFromPath(url: string) {
  try {
    const pathname = new URL(url).pathname;
    const lastSegment = pathname.split("/").pop() || "";
    const match = lastSegment.match(/\.([a-zA-Z0-9]+)$/);
    return match?.[1]?.toLowerCase() || "";
  } catch {
    return "";
  }
}

function getExtensionFromContentType(contentType: string | null) {
  if (!contentType) return "";
  const normalized = contentType.split(";")[0].trim().toLowerCase();
  return CONTENT_TYPE_EXTENSIONS[normalized] || "";
}

function resolveFilename(requested: string | undefined, url: string, contentType: string | null) {
  const safeRequested = requested ? sanitizeFilename(requested) : "";
  const hasExtension = /\.[a-zA-Z0-9]+$/.test(safeRequested);

  if (safeRequested && hasExtension) return safeRequested;

  const ext = getExtensionFromPath(url) || getExtensionFromContentType(contentType);
  if (safeRequested) return ext ? `${safeRequested}.${ext}` : safeRequested;

  const fromPath = (() => {
    try {
      const lastSegment = decodeURIComponent(new URL(url).pathname.split("/").pop() || "download");
      return sanitizeFilename(lastSegment);
    } catch {
      return "download";
    }
  })();

  if (/\.[a-zA-Z0-9]+$/.test(fromPath)) return fromPath;
  return ext ? `${fromPath}.${ext}` : fromPath;
}

serve(async (req) => {
  const corsHeaders = corsHeadersFor(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false },
      }
    );

    const { data: userData, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = DownloadSchema.parse(await req.json());
    if (!isAllowedUrl(body.url)) {
      return new Response(JSON.stringify({ error: "URL not allowed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const upstream = await fetch(body.url, {
      headers: {
        "User-Agent": "Lovable-Download-Proxy/1.0",
      },
      redirect: "follow",
    });

    if (!upstream.ok || !upstream.body) {
      return new Response(JSON.stringify({ error: "Failed to fetch file" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contentType = upstream.headers.get("Content-Type");
    const contentLength = upstream.headers.get("Content-Length");
    const filename = resolveFilename(body.filename, body.url, contentType);

    const responseHeaders = new Headers(corsHeaders);
    responseHeaders.set("Content-Type", contentType || "application/octet-stream");
    responseHeaders.set("Content-Disposition", `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
    responseHeaders.set("Cache-Control", "private, no-store");

    if (contentLength) {
      responseHeaders.set("Content-Length", contentLength);
    }

    return new Response(upstream.body, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    const message = error instanceof z.ZodError ? "Invalid request" : "Internal server error";
    console.error("[download-file]", error);

    return new Response(JSON.stringify({ error: message }), {
      status: error instanceof z.ZodError ? 400 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
