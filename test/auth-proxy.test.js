import test from "node:test";
import assert from "node:assert/strict";

import {
  MAX_AUTH_BODY_BYTES,
  getSetCookieValues,
  onRequest,
  parseAuthApiOrigin,
  stripCookieDomain,
} from "../functions/api/[[path]].js";

const env = { AUTH_API_ORIGIN: "https://auth.internal.example" };

function request(path, init, requestEnv = env) {
  return onRequest({ request: new Request(`https://uptra.example${path}`, init), env: requestEnv });
}

test("proxy rejects paths outside the three authentication endpoints", async () => {
  for (const path of ["/api/auth/csrf", "/api/auth/login", "/api/auth/me", "/api/other"]) {
    const response = await request(path);
    assert.equal(response.status, 404, path);
  }
});

test("proxy rejects invalid methods and exposes the allowed method", async () => {
  const loginGet = await request("/api/auth/member/login");
  assert.equal(loginGet.status, 405);
  assert.equal(loginGet.headers.get("Allow"), "POST");
  const sessionPost = await request("/api/auth/session?accountType=member", { method: "POST" });
  assert.equal(sessionPost.status, 405);
});

test("proxy requires the exact member session query and logout CSRF token", async () => {
  assert.equal((await request("/api/auth/session")).status, 400);
  assert.equal((await request("/api/auth/session?accountType=admin")).status, 400);
  assert.equal((await request("/api/auth/logout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accountType: "member" }),
  })).status, 403);
});

test("proxy validates and fixes member-only POST bodies", async (t) => {
  let upstream;
  t.mock.method(globalThis, "fetch", async (url, init) => {
    upstream = { url: url.toString(), init };
    return Response.json({ ok: true });
  });

  const invalidLogout = await request("/api/auth/logout", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-CSRF-Token": "csrf-value" },
    body: JSON.stringify({ accountType: "administrator" }),
  });
  assert.equal(invalidLogout.status, 400);
  assert.equal(upstream, undefined);

  const invalidLogin = await request("/api/auth/member/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ memberId: "not-a-member", password: "secret" }),
  });
  assert.equal(invalidLogin.status, 400);
  assert.equal(upstream, undefined);

  const response = await request("/api/auth/logout", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-CSRF-Token": "csrf-value" },
    body: JSON.stringify({ accountType: "member", ignored: "value" }),
  });
  assert.equal(response.status, 200);
  assert.equal(upstream.url, "https://auth.internal.example/api/auth/logout");
  assert.deepEqual(JSON.parse(upstream.init.body), { accountType: "member" });
});

test("proxy rejects non-JSON and oversized bodies before forwarding", async (t) => {
  let fetchCalls = 0;
  t.mock.method(globalThis, "fetch", async () => {
    fetchCalls += 1;
    return Response.json({ ok: true });
  });

  const wrongContentType = await request("/api/auth/member/login", {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: "UP000001:password",
  });
  assert.equal(wrongContentType.status, 415);

  const oversized = await request("/api/auth/member/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ memberId: "UP000001", password: "x".repeat(MAX_AUTH_BODY_BYTES) }),
  });
  assert.equal(oversized.status, 413);
  assert.equal(fetchCalls, 0);
});

test("proxy forwards controlled origin and audit metadata", async (t) => {
  let headers;
  t.mock.method(globalThis, "fetch", async (_url, init) => {
    headers = init.headers;
    return Response.json({ ok: true });
  });

  await request("/api/auth/member/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "CF-Connecting-IP": "203.0.113.10",
      "X-Forwarded-For": "198.51.100.99",
      Origin: "https://uptra.example",
      "Sec-Fetch-Site": "same-origin",
      "User-Agent": "Uptra test browser",
    },
    body: JSON.stringify({ memberId: "up000001", password: "secret" }),
  });

  assert.equal(headers.get("X-Forwarded-Host"), "uptra.example");
  assert.equal(headers.get("X-Forwarded-Proto"), "https");
  assert.equal(headers.get("X-Forwarded-For"), "203.0.113.10");
  assert.equal(headers.get("Origin"), "https://uptra.example");
  assert.equal(headers.get("Sec-Fetch-Site"), "same-origin");
  assert.equal(headers.get("User-Agent"), "Uptra test browser");
});

test("proxy keeps two Set-Cookie values separate while removing only Domain", async (t) => {
  t.mock.method(globalThis, "fetch", async () => {
    const headers = new Headers({ "Content-Type": "application/json" });
    headers.append(
      "Set-Cookie",
      "ewg_member_session=abc; Domain=.internal.example; Path=/; Expires=Wed, 21 Oct 2030 07:28:00 GMT; Secure; HttpOnly; SameSite=Lax",
    );
    headers.append(
      "Set-Cookie",
      "ewg_member_csrf=def; Domain=.internal.example; Path=/; Expires=Wed, 21 Oct 2030 07:28:00 GMT; Secure; SameSite=Lax",
    );
    return new Response(JSON.stringify({ ok: true }), { headers });
  });

  const response = await request("/api/auth/member/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ memberId: "UP000001", password: "secret" }),
  });
  assert.equal(response.status, 200);
  const cookies = getSetCookieValues(response.headers);
  assert.equal(cookies.length, 2);
  assert.match(cookies[0], /ewg_member_session=abc/);
  assert.match(cookies[1], /ewg_member_csrf=def/);
  for (const cookie of cookies) {
    assert.doesNotMatch(cookie, /Domain=/i);
    assert.match(cookie, /Expires=Wed, 21 Oct 2030 07:28:00 GMT/);
    assert.match(cookie, /Secure/);
    assert.match(cookie, /SameSite=Lax/);
  }
  assert.match(cookies[0], /HttpOnly/);
});

test("AUTH_API_ORIGIN accepts HTTPS origins only", async () => {
  assert.equal(parseAuthApiOrigin("https://auth.example"), "https://auth.example");
  assert.equal(parseAuthApiOrigin("https://auth.example/"), "https://auth.example");
  for (const value of [
    "http://auth.example",
    "https://user:secret@auth.example",
    "https://auth.example/path",
    "https://auth.example?secret=value",
    "https://auth.example#fragment",
    "not-a-url",
    "",
  ]) {
    assert.equal(parseAuthApiOrigin(value), null, value);
    const response = await request("/api/auth/session?accountType=member", undefined, { AUTH_API_ORIGIN: value });
    assert.equal(response.status, 503, value);
    assert.deepEqual(await response.json(), { ok: false, error: "auth_api_invalid_configuration" });
  }
});

test("upstream failures return safe 502 JSON", async (t) => {
  t.mock.method(globalThis, "fetch", async () => {
    throw new Error("secret upstream details");
  });
  const response = await request("/api/auth/session?accountType=member");
  assert.equal(response.status, 502);
  const text = await response.text();
  assert.deepEqual(JSON.parse(text), { ok: false, error: "auth_api_unavailable" });
  assert.doesNotMatch(text, /secret upstream details/);
});

test("cookie rewriting only removes Domain", () => {
  assert.equal(
    stripCookieDomain("sid=1; Path=/; Domain=example.com; Secure; HttpOnly; SameSite=Strict"),
    "sid=1; Path=/; Secure; HttpOnly; SameSite=Strict",
  );
});
