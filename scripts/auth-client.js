const DEFAULT_PATHS = Object.freeze({
  login: "/login",
  signup: "/signup",
  session: "/api/auth/session",
  logout: "/api/auth/logout",
});

function readMeta(name, documentRef = document) {
  return documentRef.querySelector(`meta[name="${name}"]`)?.content.trim() ?? "";
}

export function readAuthConfig(documentRef = document) {
  return {
    baseUrl: readMeta("uptra-auth-base-url", documentRef),
    ...DEFAULT_PATHS,
  };
}

export function authUrl(config, path, returnTo, locationRef = window.location) {
  if (!config.baseUrl) {
    throw new Error("会員認証基盤のURLが設定されていません。");
  }

  const url = new URL(path, config.baseUrl);
  if (url.protocol !== "https:" && url.hostname !== "localhost") {
    throw new Error("会員認証基盤にはHTTPSのURLを設定してください。");
  }
  if (returnTo) {
    url.searchParams.set("return_to", new URL(returnTo, locationRef.href).href);
  }
  return url;
}

export function redirectToAuth(path, returnTo, dependencies = {}) {
  const documentRef = dependencies.documentRef ?? document;
  const locationRef = dependencies.locationRef ?? window.location;
  const config = dependencies.config ?? readAuthConfig(documentRef);
  locationRef.assign(authUrl(config, path, returnTo, locationRef).href);
}

export async function requireMember(dependencies = {}) {
  const documentRef = dependencies.documentRef ?? document;
  const locationRef = dependencies.locationRef ?? window.location;
  const fetchRef = dependencies.fetchRef ?? fetch;
  const config = dependencies.config ?? readAuthConfig(documentRef);

  try {
    const response = await fetchRef(authUrl(config, config.session, null, locationRef), {
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    if (response.ok) {
      const session = await response.json();
      if (session.authenticated === true) return true;
    }
  } catch {
    // 認証基盤が未設定・到達不能の場合は、保護ページを表示せず必ずログインへ戻す。
  }

  try {
    redirectToAuth(config.login, locationRef.href, {
      config,
      documentRef,
      locationRef,
    });
  } catch {
    locationRef.assign(new URL("login.html?auth_error=config", locationRef.href).href);
  }
  return false;
}

export async function logout(dependencies = {}) {
  const documentRef = dependencies.documentRef ?? document;
  const locationRef = dependencies.locationRef ?? window.location;
  const fetchRef = dependencies.fetchRef ?? fetch;
  const config = dependencies.config ?? readAuthConfig(documentRef);

  await fetchRef(authUrl(config, config.logout, null, locationRef), {
    method: "POST",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  redirectToAuth(config.login, locationRef.origin, {
    config,
    documentRef,
    locationRef,
  });
}

export { DEFAULT_PATHS };
