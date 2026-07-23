import assert from "node:assert/strict";
import test from "node:test";

import { authUrl, requireMember } from "../scripts/auth-client.js";

const config = {
  baseUrl: "https://members.example.com",
  login: "/login",
  session: "/api/auth/session",
};
const locationRef = {
  href: "https://uptra.example.com/dashboard.html",
  assign(value) { this.assigned = value; },
};

test("認証URLへ安全なreturn_toを付ける", () => {
  const url = authUrl(config, config.login, "dashboard.html", locationRef);
  assert.equal(url.origin, "https://members.example.com");
  assert.equal(url.searchParams.get("return_to"), "https://uptra.example.com/dashboard.html");
});

test("HTTPS以外の認証基盤を拒否する", () => {
  assert.throws(
    () => authUrl({ ...config, baseUrl: "http://members.example.com" }, "/login", null, locationRef),
    /HTTPS/,
  );
});

test("有効な会員セッションでは保護ページを表示できる", async () => {
  const result = await requireMember({
    config,
    locationRef: { ...locationRef },
    documentRef: {},
    fetchRef: async () => ({ ok: true, json: async () => ({ authenticated: true }) }),
  });
  assert.equal(result, true);
});

test("無効な会員セッションはログインへ戻す", async () => {
  const redirectedLocation = { ...locationRef };
  const result = await requireMember({
    config,
    locationRef: redirectedLocation,
    documentRef: {},
    fetchRef: async () => ({ ok: false }),
  });
  assert.equal(result, false);
  assert.match(redirectedLocation.assigned, /^https:\/\/members\.example\.com\/login\?/);
});

test("認証基盤が未設定ならローカルログインへ閉じる", async () => {
  const redirectedLocation = { ...locationRef };
  const result = await requireMember({
    config: { ...config, baseUrl: "" },
    locationRef: redirectedLocation,
    documentRef: {},
    fetchRef: async () => assert.fail("未設定の認証基盤へリクエストしてはならない"),
  });
  assert.equal(result, false);
  assert.equal(
    redirectedLocation.assigned,
    "https://uptra.example.com/login.html?auth_error=config",
  );
});
