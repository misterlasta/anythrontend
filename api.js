/* Thin REST client for the FastAPI backend. Replaces localStorage as source of truth.
 * Uses same-origin by default; override via <meta name="api-base"> or window.API_BASE. */
(function () {
  function base() {
    if (window.API_BASE) return String(window.API_BASE).replace(/\/$/, "");
    const meta = document.querySelector('meta[name="api-base"]');
    if (meta && meta.content) return meta.content.replace(/\/$/, "");
    // file:// or static preview without backend -> try localhost
    if (["localhost", "127.0.0.1"].includes(location.hostname) && location.port !== "8000") {
      return "http://localhost:8000";
    }
    return ""; // same origin (backend serves frontend/)
  }

  function headers(json) {
    const h = {};
    if (json) h["Content-Type"] = "application/json";
    try {
      const initData = window.Telegram?.WebApp?.initData;
      if (initData) h["X-Telegram-Init-Data"] = initData;
      else if (window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
        h["X-Telegram-Id"] = String(window.Telegram.WebApp.initDataUnsafe.user.id);
      }
    } catch (_) {}
    return h;
  }

  async function req(path, opts) {
    const r = await fetch(base() + path, opts);
    if (!r.ok) {
      let detail = r.statusText;
      try { detail = (await r.json()).detail || detail; } catch (_) {}
      throw new Error("API " + r.status + ": " + detail);
    }
    return r.json();
  }

  window.Backend = {
    get base() { return base(); },
    get enabled() { return true; },
    lots: () => req("/api/lots"),
    adminLots: () => req("/api/admin/lots", { headers: headers() }),
    createLot: (lot) =>
      req("/api/lots", { method: "POST", headers: headers(true), body: JSON.stringify(lot) }),
    vote: (lot_id, milestone_index, vote_type) =>
      req("/api/vote", {
        method: "POST",
        headers: headers(true),
        body: JSON.stringify({ lot_id, milestone_index, vote_type }),
      }),
    invest: (lot_id, txHash) =>
      req("/api/invest", {
        method: "POST",
        headers: headers(true),
        body: JSON.stringify({ lot_id, txHash }),
      }),
    verify: (id) => req(`/api/admin/lots/${id}/verify`, { method: "POST", headers: headers() }),
    approve: (id) => req(`/api/admin/lots/${id}/approve`, { method: "POST", headers: headers() }),
    remove: (id) => req(`/api/admin/lots/${id}`, { method: "DELETE", headers: headers() }),
    multisig: (id, role) =>
      req(`/api/admin/multisig/${id}/${role}`, { method: "POST", headers: headers() }),
    payInvoice: (id) =>
      req(`/api/admin/invoices/${id}/pay`, { method: "POST", headers: headers() }),
    proposeInvoice: (id) =>
      req(`/api/admin/invoices/${id}/propose`, { method: "POST", headers: headers() }),
    veto: (invoice_id) =>
      req("/api/veto", { method: "POST", headers: headers(true), body: JSON.stringify({ invoice_id }) }),
    market: (lot_id) => req("/api/market" + (lot_id ? "?lot_id=" + encodeURIComponent(lot_id) : "")),
    sellShare: (lot_id, price_nano) =>
      req("/api/market", { method: "POST", headers: headers(true), body: JSON.stringify({ lot_id, price_nano }) }),
    buyShare: (id) => req(`/api/market/${id}/buy`, { method: "POST", headers: headers() }),
    portfolio: () => req("/api/portfolio", { headers: headers() }),
    auditReport: (lot_id, text, photo, approved_release) =>
      req("/api/auditor/reports", {
        method: "POST",
        headers: headers(true),
        body: JSON.stringify({ lot_id, text, photo, approved_release }),
      }),
  };
})();
