import { onRequest as proxyAuthenticationRequest } from "./api/[[path]].js";

const PROTECTED_PATHS = new Set(["/dashboard", "/dashboard.html"]);

function loginRedirect(request) {
  return new Response(null, {
    status: 302,
    headers: {
      Location: new URL("/login.html", request.url).toString(),
      "Cache-Control": "no-store",
    },
  });
}

function isActiveMemberSession(payload) {
  if (!payload || payload.ok !== true || !payload.account || !payload.csrfToken || !payload.expiresAt) {
    return false;
  }
  const expiresAt = Date.parse(payload.expiresAt);
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  if (!PROTECTED_PATHS.has(url.pathname)) return next();

  const sessionUrl = new URL("/api/auth/session?accountType=member", request.url);
  const sessionRequest = new Request(sessionUrl, {
    method: "GET",
    headers: request.headers,
  });

  try {
    const response = await proxyAuthenticationRequest({ request: sessionRequest, env });
    if (!response.ok || !isActiveMemberSession(await response.json())) return loginRedirect(request);
  } catch {
    return loginRedirect(request);
  }
  return next();
}
