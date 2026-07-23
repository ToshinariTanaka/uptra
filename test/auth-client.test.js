import test from "node:test";
import assert from "node:assert/strict";

import { getMemberSession, isActiveSession, login, logout } from "../scripts/auth-client.js";

const activeSession = {
  ok: true,
  account: { memberId: "member-1" },
  csrfToken: "csrf-value",
  expiresAt: "2999-01-01T00:00:00.000Z",
};

test("login sends the member login API contract", async () => {
  let call;
  const result = await login("member-1", "secret", async (...args) => {
    call = args;
    return Response.json(activeSession);
  });
  assert.deepEqual(result, activeSession);
  assert.equal(call[0], "/api/auth/member/login");
  assert.equal(call[1].method, "POST");
  assert.equal(call[1].credentials, "include");
  assert.deepEqual(JSON.parse(call[1].body), { memberId: "member-1", password: "secret" });
});

test("session check uses the member account type and rejects an expired session", async () => {
  let requestedUrl;
  await assert.rejects(
    getMemberSession(async (url) => {
      requestedUrl = url;
      return Response.json({ ...activeSession, expiresAt: "2000-01-01T00:00:00.000Z" });
    }),
    /セッションが無効/,
  );
  assert.equal(requestedUrl, "/api/auth/session?accountType=member");
  assert.equal(isActiveSession({ ...activeSession, expiresAt: "invalid" }), false);
});

test("logout sends member account type and CSRF header", async () => {
  let call;
  await logout("csrf-value", async (...args) => {
    call = args;
    return new Response(null, { status: 204 });
  });
  assert.equal(call[0], "/api/auth/logout");
  assert.equal(call[1].headers["X-CSRF-Token"], "csrf-value");
  assert.deepEqual(JSON.parse(call[1].body), { accountType: "member" });
  await assert.rejects(logout("", async () => new Response()), /CSRF/);
});
