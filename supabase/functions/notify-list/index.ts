// Supabase Edge Function: notify-list
// Forwards email captures to a Google Apps Script Web App URL
// Set secret before deploy: supabase secrets set GOOGLE_SHEETS_WEBAPP_URL="https://script.google.com/.../exec"

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

// Allow anonymous (no JWT) since this is a public email capture endpoint
export const config = { verifyJWT: false } as const;

const WEBAPP_URL = Deno.env.get("GOOGLE_SHEETS_WEBAPP_URL");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  if (!WEBAPP_URL) {
    return new Response(JSON.stringify({ error: "Missing GOOGLE_SHEETS_WEBAPP_URL secret" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const email: string | undefined = body?.email;
    const source: string = body?.source ?? "unknown";
    const ts: string = body?.ts ?? new Date().toISOString();

    if (!email || !isValidEmail(email)) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Enrich with request metadata
    const headers = req.headers;
    const ip = headers.get("x-forwarded-for") ?? headers.get("cf-connecting-ip") ?? null;
    const ua = headers.get("user-agent") ?? null;

    // Forward to Google Apps Script Web App
    const forwardRes = await fetch(WEBAPP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, source, ts, ip, ua }),
    });

    if (!forwardRes.ok) {
      const text = await forwardRes.text().catch(() => "");
      return new Response(JSON.stringify({ error: "Sheets forward failed", status: forwardRes.status, text }), {
        status: 502,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (err) {
    console.error("notify-list error", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
