const ROUTES = new Map([
  ["/api/auth/member/login", "POST"],
  ["/api/auth/session", "GET"],
  ["/api/auth/logout", "POST"],
]);

export function stripCookieDomain(cookie) {
  return cookie
    .split(";")
    .filter((part) => !/^\s*domain\s*=/i.test(part))
    .join(";");
}

function jsonError(status, error) {
  return new Response(JSON.stringify({ ok: false, error }), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const allowedMethod = ROUTES.get(url.pathname);
  if (!allowedMethod) return jsonError(404, "not_found");
  if (request.method !== allowedMethod) {
    return new Response(JSON.stringify({ ok: false, error: "method_not_allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json; charset=utf-8", Allow: allowedMethod },
    });
  }
  if (url.pathname === "/api/auth/session" && url.search !== "?accountType=member") {
    return jsonError(400, "invalid_account_type");
  }
  if (url.pathname === "/api/auth/logout" && !request.headers.get("X-CSRF-Token")) {
    return jsonError(403, "csrf_token_required");
  }
  if (!env.AUTH_API_ORIGIN) return jsonError(503, "auth_api_not_configured");

  const upstreamUrl = new URL(`${url.pathname}${url.search}`, env.AUTH_API_ORIGIN);
  const headers = new Headers();
  for (const name of ["Accept", "Content-Type", "Cookie", "X-CSRF-Token"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const upstreamResponse = await fetch(upstreamUrl, {
    method: request.method,
    headers,
    body: request.method === "GET" ? undefined : await request.arrayBuffer(),
    redirect: "manual",
  });

  const responseHeaders = new Headers();
  const contentType = upstreamResponse.headers.get("Content-Type");
  if (contentType) responseHeaders.set("Content-Type", contentType);
  const cookies = upstreamResponse.headers.getSetCookie?.()
    ?? (upstreamResponse.headers.get("Set-Cookie") ? [upstreamResponse.headers.get("Set-Cookie")] : []);
  for (const cookie of cookies) responseHeaders.append("Set-Cookie", stripCookieDomain(cookie));
  responseHeaders.set("Cache-Control", "no-store");

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: responseHeaders,
  });
}
