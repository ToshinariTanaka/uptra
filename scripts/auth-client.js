const MEMBER_ACCOUNT_TYPE = "member";

export function isActiveSession(payload) {
  if (!payload || payload.ok !== true || !payload.account || !payload.csrfToken || !payload.expiresAt) {
    return false;
  }

  const expiresAt = Date.parse(payload.expiresAt);
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function login(memberId, password, fetchImpl = fetch) {
const response = await fetchImpl(
  "/api/auth/member/login",
  {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ memberId, password }),
  }
);
  const payload = await readJson(response);
  if (!response.ok || !isActiveSession(payload)) {
    throw new Error("ログインに失敗しました。会員IDとパスワードを確認してください。");
  }
  return payload;
}

export async function getMemberSession(fetchImpl = fetch) {
  const response = await fetchImpl(`/api/auth/session?accountType=${MEMBER_ACCOUNT_TYPE}`, {
    method: "GET",
    credentials: "include",
  });
  const payload = await readJson(response);
  if (!response.ok || !isActiveSession(payload)) {
    throw new Error("セッションが無効です。");
  }
  return payload;
}

export async function logout(csrfToken, fetchImpl = fetch) {
  if (!csrfToken) throw new Error("CSRFトークンがありません。");
  const response = await fetchImpl("/api/auth/logout", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify({ accountType: MEMBER_ACCOUNT_TYPE }),
  });
  if (!response.ok) throw new Error("ログアウトに失敗しました。");
}
