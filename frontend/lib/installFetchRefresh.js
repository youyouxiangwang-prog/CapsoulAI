// frontend/lib/installFetchRefresh.js
(() => {
  // 防重复安装
  if (window.__fetchRefreshInstalled) return;
  window.__fetchRefreshInstalled = true;

  const origFetch = window.fetch.bind(window);

  const apiPort = import.meta.env.VITE_API_PORT || 5840;
  const API_BASE = (import.meta.env.VITE_API_BASE || `http://localhost:${apiPort}`).replace(/\/+$/, "");
  const API_PREFIX = "/api/";

  const isApiUrl = (u) => {
    if (!u) return false;
    return u.startsWith(API_PREFIX) || u.startsWith(`${API_BASE}${API_PREFIX}`);
  };

  const isRefreshUrl = (u) => u && (u.endsWith("/auth/refresh") || u.includes("/auth/refresh?"));

  window.fetch = async (input, init = {}) => {
    const rawUrl = typeof input === "string" ? input : input?.url || "";

    // 只拦截打到你后端 API 的请求；刷新接口自身不拦
    if (!isApiUrl(rawUrl) || isRefreshUrl(rawUrl)) {
      return origFetch(input, init);
    }

    // 绝对化 URL（兼容传 "/api/..." 或 "http://.../api/..."）
    const url = rawUrl.startsWith("http") ? rawUrl : `${API_BASE}${rawUrl}`;

    // 附带 Authorization
    const headers = new Headers(init.headers || {});
    const token = localStorage.getItem("access_token");
    if (token && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    // 默认带上 Cookie（用于 /auth/refresh）
    let res = await origFetch(url, { ...init, headers, credentials: "include" });
    if (res.status !== 401) return res;

    // 401：尝试静默刷新
    const refreshRes = await origFetch(`${API_BASE}/api/v1/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (!refreshRes.ok) {
      localStorage.removeItem("access_token");
      return res; // 交给你的守卫逻辑处理
    }

    let data = null;
    try {
      data = await refreshRes.json();
    } catch (_) {}

    if (!data?.access_token) {
      localStorage.removeItem("access_token");
      return res;
    }

    // 刷新成功：更新 token 并重试原请求
    localStorage.setItem("access_token", data.access_token);
    headers.set("Authorization", `Bearer ${data.access_token}`);
    return origFetch(url, { ...init, headers, credentials: "include" });
  };
})();
