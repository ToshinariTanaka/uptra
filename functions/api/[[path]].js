const ROUTES = new Map([
  ["/api/auth/member/login", "POST"],
  ["/api/auth/session", "GET"],
  ["/api/auth/logout", "POST"],
]);

export const MAX_AUTH_BODY_BYTES = 4096;

export function stripCookieDomain(cookie) {
  return cookie
    .split(";")
    .filter((part) => !/^\s*domain\s*=/i.test(part))
    .join(";");
}

export function jsonError(status, error) {
  return new Response(JSON.stringify({ ok: false, error }), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export function parseAuthApiOrigin(value) {
  if (typeof value !== "string" || value.length === 0) return null;
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:"
      || url.username
      || url.password
      || url.pathname !== "/"
      || url.search
      || url.hash
    ) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

function hasJsonContentType(request) {
  return request.headers.get("Content-Type")?.split(";", 1)[0].trim().toLowerCase() === "application/json";
}

async function readJsonWithLimit(request) {
  const contentLength = request.headers.get("Content-Length");
  if (contentLength !== null) {
    const declaredLength = Number(contentLength);
    if (Number.isFinite(declaredLength) && declaredLength > MAX_AUTH_BODY_BYTES) {
      return { error: "request_too_large", status: 413 };
    }
  }

  if (!request.body) return { error: "invalid_json", status: 400 };
  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_AUTH_BODY_BYTES) {
      await reader.cancel();
      return { error: "request_too_large", status: 413 };
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return { value: JSON.parse(new TextDecoder().decode(bytes)) };
  } catch {
    return { error: "invalid_json", status: 400 };
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

async function validatedPostBody(request, path) {
  if (!hasJsonContentType(request)) return { error: "json_content_type_required", status: 415 };
  const parsed = await readJsonWithLimit(request);
  if (parsed.error) return parsed;
  if (!isPlainObject(parsed.value)) return { error: "invalid_request", status: 400 };

  if (path === "/api/auth/member/login") {
    const { memberId, password } = parsed.value;
    if (
      typeof memberId !== "string"
      || !/^UP\d{6,}$/i.test(memberId)
      || memberId.length > 16
      || typeof password !== "string"
      || password.length < 1
      || password.length > 128
    ) {
      return { error: "invalid_credentials_format", status: 400 };
    }
    return { body: JSON.stringify({ memberId: memberId.toUpperCase(), password }) };
  }

  if (parsed.value.accountType !== "member") {
    return { error: "invalid_account_type", status: 400 };
  }
  return { body: JSON.stringify({ accountType: "member" }) };
}

export function createUpstreamHeaders(request) {
  const headers = new Headers();
  for (const name of ["Accept", "Cookie", "X-CSRF-Token", "Origin", "Sec-Fetch-Site", "User-Agent"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const publicUrl = new URL(request.url);
  headers.set("X-Forwarded-Host", publicUrl.host);
  headers.set("X-Forwarded-Proto", publicUrl.protocol.slice(0, -1));
  const clientIp = request.headers.get("CF-Connecting-IP");
  if (clientIp) headers.set("X-Forwarded-For", clientIp);
  return headers;
}

export function getSetCookieValues(headers) {
  if (typeof headers.getAll === "function") {
    const values = headers.getAll("Set-Cookie");
    if (Array.isArray(values)) return values;
  }
  if (typeof headers.getSetCookie === "function") return headers.getSetCookie();
  if (headers.get("Set-Cookie")) {
    throw new Error("set_cookie_api_unavailable");
  }
  return [];
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const allowedMethod = ROUTES.get(url.pathname);
  if (!allowedMethod) return jsonError(404, "not_found");
  if (request.method !== allowedMethod) {
    return new Response(JSON.stringify({ ok: false, error: "method_not_allowed" }), {
      status: 405,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        Allow: allowedMethod,
      },
    });
  }
  if (url.pathname === "/api/auth/session" && url.search !== "?accountType=member") {
    return jsonError(400, "invalid_account_type");
  }
  if (url.pathname === "/api/auth/logout" && !request.headers.get("X-CSRF-Token")) {
    return jsonError(403, "csrf_token_required");
  }

  const authApiOrigin = parseAuthApiOrigin(env.AUTH_API_ORIGIN);
  if (!authApiOrigin) return jsonError(503, "auth_api_invalid_configuration");

  let body;
  if (request.method === "POST") {
    const validated = await validatedPostBody(request, url.pathname);
    if (validated.error) return jsonError(validated.status, validated.error);
    body = validated.body;
  }

  const upstreamUrl = new URL(`${url.pathname}${url.search}`, authApiOrigin);
  const headers = createUpstreamHeaders(request);
  if (body !== undefined) headers.set("Content-Type", "application/json");

  let upstreamResponse;
  try {
    upstreamResponse = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body,
      redirect: "manual",
    });
  } catch {
    return jsonError(502, "auth_api_unavailable");
  }

  const responseHeaders = new Headers();
  const contentType = upstreamResponse.headers.get("Content-Type");
  if (contentType) responseHeaders.set("Content-Type", contentType);
  try {
    for (const cookie of getSetCookieValues(upstreamResponse.headers)) {
      responseHeaders.append("Set-Cookie", stripCookieDomain(cookie));
    }
  } catch {
    return jsonError(502, "auth_api_invalid_response");
  }
  responseHeaders.set("Cache-Control", "no-store");

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: responseHeaders,
  });
}
