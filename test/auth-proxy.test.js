import test from "node:test";
import assert from "node:assert/strict";

import { onRequest, stripCookieDomain } from "../functions/api/[[path]].js";

const env = { AUTH_API_ORIGIN: "https://auth.internal.example" };

function request(path, init) {
  return onRequest({ request: new Request(`https://uptra.example${path}`, init), env });
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

test("proxy forwards a valid logout contract and preserves safe cookie attributes", async (t) => {
  let upstream;
  t.mock.method(globalThis, "fetch", async (url, init) => {
    upstream = { url: url.toString(), init };
    return new Response(JSON.stringify({ ok: true }), {
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": "session=abc; Domain=.internal.example; Path=/; Secure; HttpOnly; SameSite=Lax",
      },
    });
  });
  const response = await request("/api/auth/logout", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-CSRF-Token": "csrf-value" },
    body: JSON.stringify({ accountType: "member" }),
  });
  assert.equal(response.status, 200);
  assert.equal(upstream.url, "https://auth.internal.example/api/auth/logout");
  assert.equal(upstream.init.headers.get("X-CSRF-Token"), "csrf-value");
  assert.deepEqual(JSON.parse(new TextDecoder().decode(upstream.init.body)), { accountType: "member" });
  const cookie = response.headers.get("Set-Cookie");
  assert.equal(cookie.includes("Domain="), false);
  assert.match(cookie, /Secure/);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
});

test("cookie rewriting only removes Domain", () => {
  assert.equal(
    stripCookieDomain("sid=1; Path=/; Domain=example.com; Secure; HttpOnly; SameSite=Strict"),
    "sid=1; Path=/; Secure; HttpOnly; SameSite=Strict",
  );
});
