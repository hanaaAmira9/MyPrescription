const API_URL = "http://localhost:4000";

// ---------- Toast ----------
const toastArea = document.getElementById("toastArea");

function toast(message, type = "success", title = "") {
    if (!toastArea) return;

    const el = document.createElement("div");
    el.className = `toast toast--${type}`;

    const dot = document.createElement("div");
    dot.className = "toast__dot";

    const body = document.createElement("div");

    const t = document.createElement("div");
    t.className = "toast__title";
    t.textContent = title || (type === "error" ? "Erreur" : type === "warning" ? "Attention" : "OK");

    const msg = document.createElement("div");
    msg.className = "toast__msg";
    msg.textContent = message;

    const close = document.createElement("button");
    close.className = "toast__close";
    close.type = "button";
    close.textContent = "×";
    close.addEventListener("click", () => el.remove());

    body.appendChild(t);
    body.appendChild(msg);

    el.appendChild(dot);
    el.appendChild(body);
    el.appendChild(close);

    toastArea.appendChild(el);
    setTimeout(() => el.remove(), 3500);
}

function escapeHtml(s) {
    return String(s ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

async function readErrorMessage(res) {
    const text = await res.text().catch(() => "");
    if (!text) return `Erreur (${res.status})`;
    try {
        const json = JSON.parse(text);
        return json.message || json.error || text;
    } catch {
        return text;
    }
}

// ---------- API helper ----------
async function apiFetch(path, options = {}) {
    const res = await fetch(`${API_URL}${path}`, {
        ...options,
        credentials: "include",
        headers: {
            Accept: "application/json",
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...(options.headers || {}),
        },
    });

    if (res.status === 429) {
        const msg = await readErrorMessage(res);
        toast(msg, "warning", "Rate limit");
        throw new Error("RATE_LIMIT");
    }

    if (res.status === 401) {
        toast("Session expirée. Veuillez vous reconnecter.", "warning", "Auth");
        setTimeout(() => (window.location.href = "/index.html"), 700);
        throw new Error("UNAUTHORIZED");
    }

    if (res.status === 403) {
        const msg = await readErrorMessage(res);
        toast(msg || "Accès interdit", "error", "RBAC");
        throw new Error("FORBIDDEN");
    }

    if (!res.ok) {
        const msg = await readErrorMessage(res);
        toast(msg, "error");
        throw new Error(msg);
    }

    // on accepte JSON
    return await res.json().catch(() => ({}));
}

// ---------- State ----------
const state = {
    page: 1,
    limit: 20,
    q: "",
    result: "",
    action: "",
    items: [],
};

// ---------- Elements ----------
const meName = document.getElementById("meName");
const meRole = document.getElementById("meRole");
const tbody = document.getElementById("tbody");
const statsText = document.getElementById("statsText");

const qInput = document.getElementById("q");
const resultSelect = document.getElementById("result");
const actionSelect = document.getElementById("action");
const limitSelect = document.getElementById("limit");

const btnRefresh = document.getElementById("btnRefresh");
const btnExport = document.getElementById("btnExport");
const btnPrev = document.getElementById("btnPrev");
const btnNext = document.getElementById("btnNext");
const pageEl = document.getElementById("page");
const btnLogout = document.getElementById("btnLogout");

// ---------- RBAC: check admin ----------
async function loadMeAndGuardAdmin() {
    const data = await apiFetch("/users/me", { method: "GET" });

    const me = data.user ?? data;
    const fullName = `${me.firstname ?? me.firstName ?? ""} ${me.lastname ?? me.lastName ?? ""}`.trim();
    const role = me.role || "—";

    if (meName) meName.textContent = fullName || "Compte";
    if (meRole) meRole.textContent = role;

    if (role !== "ADMIN") {
        toast("Accès réservé aux administrateurs.", "error", "Accès interdit");
        // on reste un peu pour afficher le toast puis retour dashboard
        setTimeout(() => (window.location.href = "/dashbord.html"), 900);
        throw new Error("NOT_ADMIN");
    }
}

// ---------- Fetch logs ----------
function buildQuery() {
    const params = new URLSearchParams();
    params.set("page", String(state.page));
    params.set("limit", String(state.limit));
    if (state.q) params.set("q", state.q);
    if (state.result) params.set("result", state.result);
    if (state.action) params.set("action", state.action);
    return params.toString();
}

/**
 * IMPORTANT:
 * Le backend minimal que je t’ai donné renvoie: { page, limit, items }
 * Si tu ajoutes des filtres serveur, lis req.query (q, result, action) côté backend.
 */
async function loadLogs() {
    // Si ton backend n’a pas encore de filtres, ça marchera quand même (il ignore q/result/action).
    const qs = buildQuery();
    const data = await apiFetch(`/audit?${qs}`, { method: "GET" });

    const items = data.items || [];
    state.items = items;

    if (statsText) {
        const hint = [
            state.result ? `Result=${state.result}` : null,
            state.action ? `Action=${state.action}` : null,
            state.q ? `Recherche="${state.q}"` : null,
        ].filter(Boolean).join(" • ");

        statsText.textContent = `${items.length} log(s) affichés${hint ? " • " + hint : ""}`;
    }

    renderTable();
    if (pageEl) pageEl.textContent = String(state.page);
}

function badge(result) {
    if (result === "SUCCESS")
        return `<span class="badge badge-success">SUCCESS</span>`;
    if (result === "FAIL")
        return `<span class="badge badge-fail">FAIL</span>`;
    return `<span class="badge badge-deny">DENY</span>`;
}


function renderTable() {
    if (!tbody) return;

    if (!state.items.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="muted">Aucun log.</td></tr>`;
        return;
    }

    tbody.innerHTML = state.items.map((row) => {
        const date = row.ts ? new Date(row.ts).toLocaleString("fr-FR") : "—";
        const actor = row.actor_user_id
            ? `${row.actor_user_id}${row.actor_role ? " (" + row.actor_role + ")" : ""}`
            : "—";

        const event = escapeHtml(row.event);
        const action = `<span class="mono">${escapeHtml(row.action)}</span>`;
        const result = badge(row.result);
        const route = `<span class="mono">${escapeHtml(row.route)}</span>`;
        const requestId = `<span class="mono">${escapeHtml(row.request_id)}</span>`;

        return `
      <tr>
        <td>${escapeHtml(date)}</td>
        <td>${event}</td>
        <td>${action}</td>
        <td>${result}</td>
        <td><span class="mono">${escapeHtml(actor)}</span></td>
        <td>${route}</td>
        <td>${requestId}</td>
      </tr>
    `;
    }).join("");
}

// ---------- Export CSV ----------
function exportCSV() {
    const headers = ["ts", "event", "action", "result", "actor_user_id", "actor_role", "ip", "ua", "request_id", "route"];
    const rows = state.items;

    const csv = [
        headers.join(","),
        ...rows.map(r => headers.map(h => `"${String(r[h] ?? "").replaceAll('"', '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit_logs_page_${state.page}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast("Export CSV ✅", "success", "Export");
}

// ---------- Events ----------
qInput?.addEventListener("input", (e) => {
    state.q = e.target.value.trim();
    state.page = 1;
    // filtre côté serveur si tu l’implémentes, sinon c’est juste “préparé”
    loadLogs().catch(() => { });
});

resultSelect?.addEventListener("change", (e) => {
    state.result = e.target.value;
    state.page = 1;
    loadLogs().catch(() => { });
});

actionSelect?.addEventListener("change", (e) => {
    state.action = e.target.value;
    state.page = 1;
    loadLogs().catch(() => { });
});

limitSelect?.addEventListener("change", (e) => {
    state.limit = Number(e.target.value || 20);
    state.page = 1;
    loadLogs().catch(() => { });
});

btnRefresh?.addEventListener("click", () => loadLogs().catch(() => { }));
btnExport?.addEventListener("click", exportCSV);

btnPrev?.addEventListener("click", () => {
    state.page = Math.max(1, state.page - 1);
    loadLogs().catch(() => { });
});

btnNext?.addEventListener("click", () => {
    state.page = state.page + 1;
    loadLogs().catch(() => { });
});

btnLogout?.addEventListener("click", async () => {
    try {
        await apiFetch("/auth/logout", { method: "POST" });
    } finally {
        window.location.href = "/index.html";
    }
});

// ---------- Init ----------
document.addEventListener("DOMContentLoaded", async () => {
    try {
        await loadMeAndGuardAdmin();
        await loadLogs();
        toast("Audit Logs prêts ✅", "success", "MyPrescription");
    } catch (e) {
        // toast déjà affiché
    }
});
