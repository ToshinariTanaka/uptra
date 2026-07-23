import test from "node:test";
import assert from "node:assert/strict";

import { onRequest } from "../functions/_middleware.js";

const env = { AUTH_API_ORIGIN: "https://auth.internal.example" };
const activeSession = {
  ok: true,
  account: { memberId: "UP000001" },
  csrfToken: "csrf-value",
  expiresAt: "2999-01-01T00:00:00.000Z",
};

function middleware(path, next, init) {
  return onRequest({
    request: new Request(`https://uptra.example${path}`, init),
    env,
    next,
  });
}

test("middleware protects dashboard server-side and fails closed", async (t) => {
  let nextCalls = 0;
  const next = () => {
    nextCalls += 1;
    return new Response("protected dashboard");
  };
  t.mock.method(globalThis, "fetch", async () => new Response(null, { status: 401 }));

  for (const path of ["/dashboard", "/dashboard.html"]) {
    const response = await middleware(path, next);
    assert.equal(response.status, 302);
    assert.equal(response.headers.get("Location"), "https://uptra.example/login.html");
    assert.equal(response.headers.get("Cache-Control"), "no-store");
  }
  assert.equal(nextCalls, 0);
});

test("middleware serves dashboard only after a valid member session", async (t) => {
  let upstreamRequest;
  let nextCalls = 0;
  t.mock.method(globalThis, "fetch", async (url, init) => {
    upstreamRequest = { url: url.toString(), init };
    return Response.json(activeSession);
  });
  const response = await middleware(
    "/dashboard.html",
    () => {
      nextCalls += 1;
      return new Response("protected dashboard");
    },
    { headers: { Cookie: "ewg_member_session=abc", "CF-Connecting-IP": "203.0.113.10" } },
  );

  assert.equal(response.status, 200);
  assert.equal(await response.text(), "protected dashboard");
  assert.equal(nextCalls, 1);
  assert.equal(upstreamRequest.url, "https://auth.internal.example/api/auth/session?accountType=member");
  assert.equal(upstreamRequest.init.headers.get("Cookie"), "ewg_member_session=abc");
  assert.equal(upstreamRequest.init.headers.get("X-Forwarded-For"), "203.0.113.10");
});

test("middleware leaves public pages and API routes unchanged", async () => {
  let nextCalls = 0;
  for (const path of ["/", "/login.html", "/api/auth/session?accountType=member"]) {
    const response = await middleware(path, () => {
      nextCalls += 1;
      return new Response("next");
    });
    assert.equal(await response.text(), "next");
  }
  assert.equal(nextCalls, 3);
});
