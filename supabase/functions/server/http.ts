/**
 * Small HTTP helpers shared by every route: CORS (the Vercel frontend lives
 * on a different origin), JSON responses, and a typed error that the router
 * converts into a status code.
 */

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Telegram-Init-Data, X-Referral-Code, X-Admin-Token",
};

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

export function empty(status = 200): Response {
  return new Response(null, { status, headers: corsHeaders });
}

export function fail(status: number, message: string): Response {
  return json({ error: message }, status);
}
