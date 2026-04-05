const API_URL = "http://localhost:4000";

const $ = (id) => document.getElementById(id);
const toastArea = $("toastArea");


function toast(message, type = "success") {
    if (!toastArea) return alert(message);

    const el = document.createElement("div");
    el.className = "card";
    el.style.padding = "12px 14px";
    el.style.borderRadius = "14px";
    el.style.border = "1px solid var(--border-light)";
    el.style.boxShadow = "0 12px 25px rgba(0,0,0,.08)";
    el.style.background = "#fff";
    el.style.display = "flex";
    el.style.gap = "10px";
    el.style.alignItems = "center";
    el.style.maxWidth = "360px";

    const dot = document.createElement("span");
    dot.style.width = "10px";
    dot.style.height = "10px";
    dot.style.borderRadius = "999px";
    dot.style.background =
        type === "error" ? "#b91c1c" : type === "warning" ? "#f59e0b" : "#10b981";

    const txt = document.createElement("div");
    txt.style.fontWeight = "800";
    txt.style.color = "var(--text-dark)";
    txt.textContent = message;

    el.appendChild(dot);
    el.appendChild(txt);
    toastArea.appendChild(el);

    setTimeout(() => el.remove(), 3000);
}

function formatDate(d) {
    if (!d) return "—";
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

function formErrorShow(msg) {
    const formError = $("formError");
    if (!formError) return;
    formError.textContent = msg;
    formError.style.display = "block";
}
function formErrorHide() {
    const formError = $("formError");
    if (!formError) return;
    formError.textContent = "";
    formError.style.display = "none";
}

// ===================== API CLIENT =====================
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


    if (res.status === 401) {
        window.location.href = "/index.html";
        return Promise.reject(new Error("Non autorisé"));
    }
    if (res.status === 429) {
        const data = await res.json();
        toast(data.message, "error");
        throw new Error("Rate limited");
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new Error(data.message || data.error || `Erreur API (${res.status})`);
    }

    return data;
}


const state = {
    patients: [],
    query: "",
    sort: "NAME_ASC",
    page: 1,
    pageSize: 7,
    selected: new Set(),
};

const patientsTbody = $("patientsTbody");
const patientRowTpl = $("patientRowTpl");

const searchInput = $("searchInput");
const sortBy = $("sortBy");

const resultsInfo = $("resultsInfo");
const pageNumber = $("pageNumber");
const pageTotal = $("pageTotal");
const btnPrevPage = $("btnPrevPage");
const btnNextPage = $("btnNextPage");

const selectAllPatients = $("selectAllPatients");
const btnBulkArchive = $("btnBulkArchive");

const btnRefresh = $("btnRefresh");
const btnExport = $("btnExport");
const btnNewPatient = $("btnNewPatient");
const btnNewPatient2 = $("btnNewPatient2");

const btnNewConsult = $("btnNewConsult");
const btnNewRx = $("btnNewRx");
const btnNewAppt = $("btnNewAppt");
const btnDanger = $("btnDanger");

const patientModal = $("patientModal");
const btnClosePatientModal = $("btnClosePatientModal");
const patientForm = $("patientForm");

const patientId = $("patientId");
const firstName = $("firstName");
const lastName = $("lastName");
const dateOfBirth = $("dateOfBirth");
const phone = $("phone");

const btnDeletePatient = $("btnDeletePatient");
const patientModalTitle = $("patientModalTitle");

const btnSecurity = $("btnSecurity");
const securityModal = $("securityModal");
const btnCloseSecurityModal = $("btnCloseSecurityModal");
const qrCodeImg = $("qrCodeImg");
const totpCodeInput = $("totpCodeInput");
const btnEnable2FA = $("btnEnable2FA");


const statPatients = $("statPatients");
const statPatientsMeta = $("statPatientsMeta");
const statAppointments = $("statAppointments");
const statConsults = $("statConsults");
const statRx = $("statRx");


async function loadMe() {
    const data = await apiFetch("/users/me", { method: "GET" });


    const u = data;

    $("doctorName").textContent = `Dr. ${u.firstname ?? u.firstName ?? ""} ${u.lastname ?? u.lastName ?? ""}`;
}

async function loadRole() {
    const data = await apiFetch("/users/me", { method: "GET" });


    const u = data;
    $("apiStatusText").textContent = `${u.role ?? ""}`;

    return u.role;
}
$("btnLogout")?.addEventListener("click", async () => {
    try {
        await apiFetch("/auth/logout", { method: "POST" });
    } finally {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = "/index.html";
    }
});

btnSecurity?.addEventListener("click", async () => {
    if (!securityModal) return;
    securityModal.style.display = "flex";
    if (totpCodeInput) totpCodeInput.value = "";
    if (qrCodeImg) qrCodeImg.style.display = "none";
    
    try {
        const data = await apiFetch("/users/2fa/generate", { method: "POST" });
        if(data.qrCode && qrCodeImg) {
           qrCodeImg.src = data.qrCode;
           qrCodeImg.style.display = "block";
        }
    } catch(e) {
        toast("Erreur lors de la génération du QR Code", "error");
    }
});

btnCloseSecurityModal?.addEventListener("click", () => {
    if (securityModal) securityModal.style.display = "none";
});

btnEnable2FA?.addEventListener("click", async () => {
    if (!totpCodeInput) return;
    const code = totpCodeInput.value.trim();
    if (code.length !== 6) return toast("Le code doit contenir 6 chiffres", "error");
    
    try {
        await apiFetch("/users/2fa/enable", { 
            method: "POST", 
            body: JSON.stringify({ token: code })
        });
        toast("Google Authenticator activé avec succès ! ✅", "success");
        if (securityModal) securityModal.style.display = "none";
    } catch(e) {
        toast("Code incorrect ou expiré. Réessayez.", "error");
    }
});

async function loadPatients() {
    const data = await apiFetch("/patients", { method: "GET" });

    const list = data;

    state.patients = Array.isArray(list) ? list : [];
}

async function createPatientAPI(payload) {
    const created = await apiFetch("/patients", {
        method: "POST",
        body: JSON.stringify(payload),
    });


    if (created && (created.id || created._id)) {
        state.patients.unshift(created);
    } else {
        await loadPatients();
    }

    toast("Patient créé ");
    state.page = 1;
    renderTable();
}

async function updatePatientAPI(id, payload) {
    const updated = await apiFetch(`/patients/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify(payload),
    });

    if (updated && (updated.id || updated._id)) {
        const idx = state.patients.findIndex((p) => p.id === id || p._id === id);
        if (idx !== -1) state.patients[idx] = updated;
    } else {
        await loadPatients();
    }

    toast("Patient mis à jour ");
    renderTable();
}

async function deletePatientAPI(id) {
    await apiFetch(`/patients/${encodeURIComponent(id)}`, { method: "DELETE" });

    state.patients = state.patients.filter((p) => p.id !== id && p._id !== id);
    state.selected.delete(id);

    toast("Patient supprimé ", "warning");
    renderTable();
}


function openModal(mode, patient = null) {
    if (!patientModal) return;

    formErrorHide();

    if (mode === "create") {
        patientModalTitle.textContent = "Nouveau patient";
        patientId.value = "";
        firstName.value = "";
        lastName.value = "";
        dateOfBirth.value = "";
        phone.value = "";
        btnDeletePatient.style.display = "none";
    } else if (mode === "edit" && patient) {
        patientModalTitle.textContent = "Éditer patient";
        patientId.value = patient.id ?? patient._id ?? "";
        firstName.value = patient.firstName ?? "";
        lastName.value = patient.lastName ?? "";
        dateOfBirth.value = patient.dateOfBirth ?? "";
        phone.value = patient.phone ?? "";
        btnDeletePatient.style.display = "inline-flex";
    }

    patientModal.style.display = "block";
    patientModal.setAttribute("aria-hidden", "false");

    setTimeout(() => firstName?.focus(), 0);
}

function closeModal() {
    if (!patientModal) return;
    patientModal.style.display = "none";
    patientModal.setAttribute("aria-hidden", "true");
}


patientModal?.addEventListener("click", (e) => {
    if (e.target === patientModal) closeModal();
});
btnClosePatientModal?.addEventListener("click", closeModal);
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && patientModal?.style.display === "block") closeModal();
});

// ===================== FILTER / SORT / PAGING =====================
function applyQuery(list) {
    const q = state.query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((p) => {
        const hay = [
            p.id ?? p._id ?? "",
            p.firstName ?? "",
            p.lastName ?? "",
            p.phone ?? "",
        ]
            .join(" ")
            .toLowerCase();
        return hay.includes(q);
    });
}

function applySort(list) {
    const arr = [...list];
    switch (state.sort) {
        case "NAME_DESC":
            arr.sort((a, b) =>
                `${b.lastName ?? ""} ${b.firstName ?? ""}`.localeCompare(
                    `${a.lastName ?? ""} ${a.firstName ?? ""}`
                )
            );
            break;
        case "CREATED_DESC":
            arr.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            break;
        case "CREATED_ASC":
            arr.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
            break;
        case "NAME_ASC":
        default:
            arr.sort((a, b) =>
                `${a.lastName ?? ""} ${a.firstName ?? ""}`.localeCompare(
                    `${b.lastName ?? ""} ${b.firstName ?? ""}`
                )
            );
    }
    return arr;
}

function getFiltered() {
    let list = state.patients;
    list = applyQuery(list);
    list = applySort(list);
    return list;
}

function getPaged(list) {
    const total = list.length;
    const totalPages = Math.max(1, Math.ceil(total / state.pageSize));
    if (state.page > totalPages) state.page = totalPages;
    const start = (state.page - 1) * state.pageSize;
    const pageItems = list.slice(start, start + state.pageSize);
    return { pageItems, total, totalPages };
}

// ===================== RENDER =====================
function syncSelectAllCheckbox() {
    if (!selectAllPatients) return;
    const filtered = getFiltered();
    const { pageItems } = getPaged(filtered);

    if (pageItems.length === 0) {
        selectAllPatients.checked = false;
        selectAllPatients.indeterminate = false;
        return;
    }

    const selectedOnPage = pageItems.filter((p) => state.selected.has(p.id ?? p._id)).length;
    selectAllPatients.checked = selectedOnPage === pageItems.length;
    selectAllPatients.indeterminate = selectedOnPage > 0 && selectedOnPage < pageItems.length;
}

function renderStats() {
    if (statPatients) statPatients.textContent = String(state.patients.length);

    // Tu peux remplacer ces stats par ton API plus tard
    if (statConsults) statConsults.textContent = "—";
    if (statAppointments) statAppointments.textContent = "—";
    if (statRx) statRx.textContent = "—";
    if (statPatientsMeta) statPatientsMeta.textContent = "Données API";
}

function renderTable() {
    if (!patientsTbody || !patientRowTpl) return;

    const filtered = getFiltered();
    const { pageItems, total, totalPages } = getPaged(filtered);

    if (resultsInfo) resultsInfo.textContent = `${total} résultat(s)`;
    if (pageNumber) pageNumber.textContent = String(state.page);
    if (pageTotal) pageTotal.textContent = String(totalPages);

    if (btnPrevPage) btnPrevPage.disabled = state.page <= 1;
    if (btnNextPage) btnNextPage.disabled = state.page >= totalPages;

    patientsTbody.innerHTML = "";

    if (pageItems.length === 0) {
        patientsTbody.innerHTML = `
      <tr>
        <td colspan="8" style="padding:1rem;color:var(--text-gray);">Aucun patient trouvé.</td>
      </tr>`;
        renderStats();
        return;
    }

    pageItems.forEach((p) => {
        const node = patientRowTpl.content.cloneNode(true);

        const cb = node.querySelector(".rowSelect");
        const tdId = node.querySelector(".tdId");
        const tdPatient = node.querySelector(".tdPatient");
        const tdDob = node.querySelector(".tdDob");
        const tdPhone = node.querySelector(".tdPhone");
        const tdCreated = node.querySelector(".tdCreated");

        const btnView = node.querySelector(".btnView");
        const btnEdit = node.querySelector(".btnEdit");
        const btnDelete = node.querySelector(".btnDelete");

        const pid = p.id ?? p._id;

        cb.checked = state.selected.has(pid);
        cb.addEventListener("change", () => {
            if (cb.checked) state.selected.add(pid);
            else state.selected.delete(pid);
            syncSelectAllCheckbox();
        });

        tdId.textContent = String(pid ?? "").slice(0, 8) + "...";
        tdPatient.innerHTML = `<strong>${p.firstName ?? ""} ${p.lastName ?? ""}</strong>`;
        tdDob.textContent = p.dateOfBirth ? formatDate(p.dateOfBirth) : "—";
        tdPhone.textContent = p.phone ?? "—";
        tdCreated.textContent = formatDate(p.createdAt);

        btnView.addEventListener("click", () => openModal("edit", p));
        btnEdit.addEventListener("click", () => openModal("edit", p));

        btnDelete.addEventListener("click", () => {
            if (confirm(`Supprimer ${p.firstName ?? ""} ${p.lastName ?? ""} ?`)) {
                deletePatientAPI(pid);
            }
        });

        patientsTbody.appendChild(node);
    });

    syncSelectAllCheckbox();
    renderStats();
}

// ===================== EVENTS =====================
searchInput?.addEventListener("input", (e) => {
    state.query = e.target.value;
    state.page = 1;
    renderTable();
});

sortBy?.addEventListener("change", (e) => {
    state.sort = e.target.value;
    state.page = 1;
    renderTable();
});

btnPrevPage?.addEventListener("click", () => {
    state.page = Math.max(1, state.page - 1);
    renderTable();
});

btnNextPage?.addEventListener("click", () => {
    state.page = state.page + 1;
    renderTable();
});

selectAllPatients?.addEventListener("change", () => {
    const filtered = getFiltered();
    const { pageItems } = getPaged(filtered);

    if (selectAllPatients.checked) pageItems.forEach((p) => state.selected.add(p.id ?? p._id));
    else pageItems.forEach((p) => state.selected.delete(p.id ?? p._id));

    renderTable();
});

// Bulk archive (pas d’API ici pour l’instant)
btnBulkArchive?.addEventListener("click", () => {
    if (state.selected.size === 0) return toast("Aucun patient sélectionné", "warning");
    toast("Archive non implémentée côté API ⚠️", "warning");
});

// Open create modal
btnNewPatient?.addEventListener("click", () => openModal("create"));
btnNewPatient2?.addEventListener("click", () => openModal("create"));

// Refresh => reload API
btnRefresh?.addEventListener("click", async () => {
    try {
        await loadPatients();
        renderTable();
        toast("Actualisé ✅");
    } catch (e) {
        console.error(e);
        toast(e.message || "Erreur refresh", "error");
    }
});


btnExport?.addEventListener("click", () => {
    const rows = getFiltered();
    const headers = ["id", "firstName", "lastName", "dateOfBirth", "phone", "createdAt"];
    const csv = [
        headers.join(","),
        ...rows.map((p) =>
            headers
                .map((h) => `"${String(p[h] ?? p._id ?? "").replaceAll('"', '""')}"`)
                .join(",")
        ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "patients.csv";
    a.click();
    URL.revokeObjectURL(url);

    toast("Export CSV ✅");
});


btnNewConsult?.addEventListener("click", () => toast("Nouvelle consultation (demo) 🩺"));
btnNewRx?.addEventListener("click", () => toast("Nouvelle ordonnance (demo) 💊"));
btnNewAppt?.addEventListener("click", () => toast("Prendre RDV (demo) 📅"));
btnDanger?.addEventListener("click", () => toast("Action non disponible ⚠️", "warning"));


patientForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    formErrorHide();

    const payload = {
        firstName: firstName.value.trim(),
        lastName: lastName.value.trim(),
        dateOfBirth: dateOfBirth.value,
        phone: phone.value.trim(),
    };

    if (!payload.firstName || !payload.lastName) {
        formErrorShow("Remplis: prénom, nom.");
        return;
    }

    try {
        if (patientId.value) {
            await updatePatientAPI(patientId.value, payload);
        } else {
            await createPatientAPI(payload);
        }
        closeModal();
    } catch (e2) {
        console.error(e2);
        formErrorShow(e2.message || "Erreur enregistrement");
    }
});


btnDeletePatient?.addEventListener("click", async () => {
    if (!patientId.value) return;
    if (!confirm("Supprimer ce patient ?")) return;

    try {
        await deletePatientAPI(patientId.value);
        closeModal();
    } catch (e) {
        console.error(e);
        toast(e.message || "Erreur suppression", "error");
    }
});

document.addEventListener("DOMContentLoaded", async () => {
    try {
        await loadMe();
        await loadPatients();
        renderTable();
        toast("Dashboard prêt ");
    } catch (e) {
        console.error(e);
        toast(e.message || "Erreur init dashboard", "error");
    }
});

const btnAudit = document.getElementById("navAudit");

async function checkRole() {
    const role = await loadRole();

    console.log(role);

    if (role === "ADMIN") {
        btnAudit.style.display = "block";
    } else {
        btnAudit.style.display = "none";
    }
    
}

checkRole();


async function fetchAppointmentsByStatusDone() {
    const res = await fetch(`${API_URL}/appointments/status/done`, {
        method: "GET",
        credentials: "include", 
        headers: {
            "Content-Type": "application/json",
        },
    });

  
    const contentType = res.headers.get("content-type") || "";
    const raw = await res.text();

    if (!res.ok) {
        throw new Error(`Erreur API ${status}: ${res.status} | ${raw}`);
    }

    if (!contentType.includes("application/json")) {
        throw new Error(`Réponse non JSON (${contentType}). Vérifie la route / CORS. Body: ${raw.slice(0, 200)}`);
    }

    return JSON.parse(raw);
}

async function fetchAppointmentsByStatusCANCELLED() {
    const res = await fetch(`${API_URL}/appointments/status/cancelled`, {
        method: "GET",
        credentials: "include", 
        headers: {
            "Content-Type": "application/json",
        },
    });

  
    const contentType = res.headers.get("content-type") || "";
    const raw = await res.text();

    if (!res.ok) {
        throw new Error(`Erreur API ${status}: ${res.status} | ${raw}`);
    }

    if (!contentType.includes("application/json")) {
        throw new Error(`Réponse non JSON (${contentType}). Vérifie la route / CORS. Body: ${raw.slice(0, 200)}`);
    }

    return JSON.parse(raw);
}

async function fetchAppointmentsByStatusSCHEDULED() {
    const res = await fetch(`${API_URL}/appointments/status/scheduled`, {
        method: "GET",
        credentials: "include", 
        headers: {
            "Content-Type": "application/json",
        },
    });

  
    const contentType = res.headers.get("content-type") || "";
    const raw = await res.text();

    if (!res.ok) {
        throw new Error(`Erreur API ${status}: ${res.status} | ${raw}`);
    }

    if (!contentType.includes("application/json")) {
        throw new Error(`Réponse non JSON (${contentType}). Vérifie la route / CORS. Body: ${raw.slice(0, 200)}`);
    }

    return JSON.parse(raw);
}

function pct(x, total) {
    if (!total) return 0;
    return Math.round((x / total) * 100);
}

function updateRing(selector, value) {
    const el = document.querySelector(selector);
    if (!el) {
        console.warn("Ring introuvable:", selector);
        return;
    }
    el.style.setProperty("--value", value);
    const percentEl = el.querySelector(".percent");
    if (percentEl) percentEl.textContent = `${value}%`;
}

async function loadAppointmentsStats() {
    try {
        const [doneRows, cancelledRows, scheduledRows] = await Promise.all([
            fetchAppointmentsByStatusDone(),
            fetchAppointmentsByStatusCANCELLED(),
            fetchAppointmentsByStatusSCHEDULED(),
        ]);

        const done = Array.isArray(doneRows) ? doneRows.length : 0;
        const canceled = Array.isArray(cancelledRows) ? cancelledRows.length : 0;
        const scheduled = Array.isArray(scheduledRows) ? scheduledRows.length : 0;
        const total = done + canceled + scheduled;

        const setText = (id, v) => {
            const el = document.getElementById(id);
            if (el) el.textContent = String(v);
            else console.warn("ID manquant:", id);
        };

        setText("doneCount", done);
        setText("cancelCount", canceled);
        setText("schedCount", scheduled);

        setText("totalCount1", total);
        setText("totalCount2", total);
        setText("totalCount3", total);

        updateRing(".ring.done", pct(done, total));
        updateRing(".ring.cancel", pct(canceled, total));
        updateRing(".ring.sched", pct(scheduled, total));

        console.log("Stats RDV OK:", { done, canceled, scheduled, total });
    } catch (err) {
        console.error(err);
        alert(err.message || "Impossible de charger les stats RDV");
    }
}

document.addEventListener("DOMContentLoaded", loadAppointmentsStats);
