

const API_URL = "http://localhost:4000";

const ENDPOINTS = {
    patients: "/patients",
    doctors: "/users/doctors",
    appointments: "/appointments",
};

const $ = (id) => document.getElementById(id);
const toastArea = $("toastArea");

const form = $("apptForm");
const formTitle = $("formTitle");
const editHint = $("editHint");

const idEl = $("id");
const patientSelect = $("patient_id");
const doctorSelect = $("doctor_id");
const dateTimeEl = $("date_time");
const statusEl = $("status");
const reasonEl = $("reason");

const saveBtn = $("saveBtn");
const resetBtn = $("resetBtn");
const deleteBtn = $("deleteBtn");

const qEl = $("q");
const filterStatusEl = $("filterStatus");
const sortByEl = $("sortBy");
const tbody = $("tbody");
const countInfo = $("countInfo");

const btnLogout = $("btnLogout");

let patients = [];
let doctors = [];
let appointments = [];
let editingId = null;

// ---------- API ----------
async function apiFetch(path, options = {}) {
    const res = await fetch(`${API_URL}${path}`, {
        ...options,
        credentials: "include",
        headers: {
            ...(options.headers || {}),
            "Content-Type": "application/json",
        },
    });

    if (res.status === 401) {
        toast("Session expirée. Reconnecte-toi.", "error");
        setTimeout(() => (window.location.href = "index.html"), 900);
        return null;
    }

    if (!res.ok) {
        let msg = `Erreur API (${res.status})`;
        try {
            const data = await res.json();
            msg = data?.message || data?.error || msg;
        } catch {
            const txt = await res.text();
            if (txt) msg = txt;
        }
        throw new Error(msg);
    }

    if (res.status === 204) return null;
    return res.json();
}

// ---------- TOAST ----------
function toast(message, type = "success") {
    if (!toastArea) return alert(message);

    const el = document.createElement("div");
    el.className = "card";
    el.style.padding = "12px 14px";
    el.style.borderRadius = "14px";
    el.style.border = "1px solid rgba(255,255,255,.14)";
    el.style.boxShadow = "0 12px 25px rgba(0,0,0,.10)";
    el.style.background = "#fff";
    el.style.display = "flex";
    el.style.gap = "10px";
    el.style.alignItems = "center";
    el.style.maxWidth = "420px";

    const dot = document.createElement("span");
    dot.style.width = "10px";
    dot.style.height = "10px";
    dot.style.borderRadius = "999px";
    dot.style.background =
        type === "error" ? "#ef4444" : type === "warn" ? "#f59e0b" : "#22c55e";

    const txt = document.createElement("div");
    txt.innerHTML = `<strong style="display:block; margin-bottom:2px">${type === "error" ? "Erreur" : type === "warn" ? "Attention" : "OK"
        }</strong><span>${escapeHtml(message)}</span>`;

    el.appendChild(dot);
    el.appendChild(txt);

    toastArea.appendChild(el);

    setTimeout(() => {
        el.style.opacity = "0";
        el.style.transform = "translateY(-6px)";
        el.style.transition = "all .25s ease";
    }, 2600);

    setTimeout(() => el.remove(), 2950);
}

function escapeHtml(str) {
    return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

// ---------- SELECT HELPERS ----------
function fillSelect(selectEl, items, getValue, getLabel, placeholder) {
    selectEl.innerHTML = `<option value="">${placeholder}</option>`;
    items.forEach((item) => {
        const opt = document.createElement("option");
        opt.value = String(getValue(item)); // ✅ value = id
        opt.textContent = getLabel(item);   // ✅ affichage = nom
        selectEl.appendChild(opt);
    });
}

// === Adapte aux champs de ton backend ===
// Doctors: { id, firstname, lastname, ... }
function doctorFullName(d) {
    const full = `${d?.firstname ?? ""} ${d?.lastname ?? ""}`.trim();
    return full || `Docteur #${d?.id ?? ""}`;
}

// Patients: essaie firstname/lastname puis name/lastName
function patientFullName(p) {
    const full1 = `${p?.firstname ?? ""} ${p?.lastname ?? ""}`.trim();
    if (full1) return full1;

    const full2 = `${p?.name ?? ""} ${p?.lastName ?? ""}`.trim();
    if (full2) return full2;

    return `Patient #${p?.id ?? ""}`;
}

// ID -> label (pour tableau)
function getPatientLabelById(id) {
    const p = patients.find((x) => String(x.id) === String(id));
    return p ? patientFullName(p) : String(id);
}

function getDoctorLabelById(id) {
    const d = doctors.find((x) => String(x.id) === String(id));
    return d ? `Dr. ${doctorFullName(d)}` : String(id);
}

// ---------- LOAD DATA ----------
async function loadPatients() {
    const data = await apiFetch(ENDPOINTS.patients);
    patients = Array.isArray(data) ? data : data?.data || [];
    console.log(patients);
    fillSelect(
        patientSelect,
        patients,
        (p) => p.id,
        (p) => `${patientFullName(p)} (ID: ${p.id})`,
        "-- Sélectionner un patient --"
    );
}

async function loadDoctors() {
    const data = await apiFetch(ENDPOINTS.doctors);
    console.log(data);
    doctors = Array.isArray(data) ? data : data?.data || [];
    console.log(doctors);
    fillSelect(
        doctorSelect,
        doctors,
        (d) => d.id,
        (d) => `Dr. ${doctorFullName(d)} (ID: ${d.id})`,
        "-- Sélectionner un docteur --"
    );
}

async function loadAppointments() {
    const data = await apiFetch(ENDPOINTS.appointments);
    appointments = Array.isArray(data) ? data : data?.data || [];
    renderAppointments();
}

// ---------- FILTER / SORT / SEARCH ----------
function getFilteredAppointments() {
    const q = (qEl?.value || "").trim().toLowerCase();
    const st = filterStatusEl?.value || "";

    let list = [...appointments];

    if (st) list = list.filter((a) => a.status === st);

    if (q) {
        list = list.filter((a) => {
            const pName = getPatientLabelById(a.patient_id).toLowerCase();
            const dName = getDoctorLabelById(a.doctor_id).toLowerCase();
            const pack = [
                a.patient_id,
                a.doctor_id,
                a.status,
                a.reason,
                a.date_time,
                pName,
                dName,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
            return pack.includes(q);
        });
    }

    const sortBy = sortByEl?.value || "";
    list.sort((a, b) => {
        const da = new Date(a.date_time).getTime();
        const db = new Date(b.date_time).getTime();
        const ca = new Date(a.createdAt || a.created_at || 0).getTime();
        const cb = new Date(b.createdAt || b.created_at || 0).getTime();

        if (sortBy === "date_asc") return da - db;
        if (sortBy === "date_desc") return db - da;
        if (sortBy === "created_asc") return ca - cb;
        if (sortBy === "created_desc") return cb - ca;
        return 0;
    });

    return list;
}

// ---------- RENDER TABLE ----------
function badge(status) {
    const s = String(status || "");
    const bg =
        s === "DONE"
            ? "rgba(34,197,94,.15)"
            : s === "CANCELLED"
                ? "rgba(239,68,68,.15)"
                : "rgba(0,212,255,.15)";
    const bd =
        s === "DONE"
            ? "rgba(34,197,94,.35)"
            : s === "CANCELLED"
                ? "rgba(239,68,68,.35)"
                : "rgba(0,168,204,.35)";

    return `<span style="padding:6px 10px;border-radius:999px;border:1px solid ${bd};background:${bg};font-weight:600">${escapeHtml(
        s
    )}</span>`;
}

function formatDate(dt) {
    if (!dt) return "";
    const d = new Date(dt);
    if (Number.isNaN(d.getTime())) return String(dt);
    return d.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" });
}

function renderAppointments() {
    const list = getFilteredAppointments();
    if (countInfo) countInfo.textContent = String(list.length);

    if (!tbody) return;
    tbody.innerHTML = "";

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="muted">Aucun rendez-vous</td></tr>`;
        return;
    }

    list.forEach((a) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
      <td>${escapeHtml(formatDate(a.date_time))}</td>
      <td>${escapeHtml(getPatientLabelById(a.patient_id))}</td>
      <td>${escapeHtml(getDoctorLabelById(a.doctor_id))}</td>
      <td>${badge(a.status)}</td>
      <td>${escapeHtml(a.reason || "")}</td>
      <td style="white-space:nowrap; display:flex; gap:8px; align-items:center">
        <button class="btn btn-ghost" data-action="edit" data-id="${escapeHtml(
            a.id
        )}">Éditer</button>
        <button class="btn btn-danger" data-action="del" data-id="${escapeHtml(
            a.id
        )}">Suppr</button>
      </td>
    `;
        tbody.appendChild(tr);
    });
}

// ---------- FORM MODE ----------
function setCreateMode() {
    editingId = null;
    if (formTitle) formTitle.textContent = "Nouveau rendez-vous";
    if (editHint) editHint.textContent = "";
    if (deleteBtn) deleteBtn.style.display = "none";
    if (saveBtn) saveBtn.textContent = "Enregistrer";

    if (idEl) idEl.value = "";
    if (form) form.reset();

    if (patientSelect && !patientSelect.value) patientSelect.value = "";
    if (doctorSelect && !doctorSelect.value) doctorSelect.value = "";
}

function setEditMode(appt) {
    editingId = appt.id;
    if (formTitle) formTitle.textContent = "Modifier rendez-vous";
    if (editHint) editHint.textContent = `ID: ${appt.id}`;
    if (deleteBtn) deleteBtn.style.display = "inline-flex";
    if (saveBtn) saveBtn.textContent = "Mettre à jour";

    if (idEl) idEl.value = appt.id;
    if (patientSelect) patientSelect.value = String(appt.patient_id);
    if (doctorSelect) doctorSelect.value = String(appt.doctor_id);

    // datetime-local: YYYY-MM-DDTHH:mm
    if (dateTimeEl && appt.date_time) {
        const d = new Date(appt.date_time);
        if (!Number.isNaN(d.getTime())) {
            const pad = (n) => String(n).padStart(2, "0");
            dateTimeEl.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
                d.getDate()
            )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        } else {
            dateTimeEl.value = appt.date_time;
        }
    }

    if (statusEl) statusEl.value = appt.status || "SCHEDULED";
    if (reasonEl) reasonEl.value = appt.reason || "";
}

// ---------- CRUD API ----------
async function createAppointment(payload) {
    return apiFetch(ENDPOINTS.appointments, {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

async function updateAppointment(id, payload) {
    return apiFetch(`${ENDPOINTS.appointments}/${encodeURIComponent(id)}`, {
        method: "PUT", // adapte si ton backend utilise PATCH
        body: JSON.stringify(payload),
    });
}

async function deleteAppointment(id) {
    return apiFetch(`${ENDPOINTS.appointments}/${encodeURIComponent(id)}`, {
        method: "DELETE",
    });
}

// ---------- EVENTS ----------
if (form) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const payload = {
            // ✅ on envoie les IDs (value des selects)
            patient_id: String(patientSelect.value),
            doctor_id: String(doctorSelect.value),
            date_time: dateTimeEl.value,
            status: statusEl.value,
            reason: reasonEl.value?.trim() || null,
        };
        console.log(payload);
        if (
            !payload.patient_id ||
            !payload.doctor_id ||
            !payload.date_time ||
            !payload.status
        ) {
            toast("Remplis tous les champs obligatoires.", "warn");
            return;
        }

        try {
            if (!editingId) {
                await createAppointment(payload);
                toast("Rendez-vous créé ✅", "success");
            } else {
                await updateAppointment(editingId, payload);
                toast("Rendez-vous mis à jour ✅", "success");
            }

            setCreateMode();
            await loadAppointments();
        } catch (err) {
            toast(err.message || "Erreur sauvegarde", "error");
        }
    });
}

if (resetBtn) resetBtn.addEventListener("click", () => setCreateMode());

if (deleteBtn) {
    deleteBtn.addEventListener("click", async () => {
        if (!editingId) return;

        const ok = confirm("Supprimer ce rendez-vous ?");
        if (!ok) return;

        try {
            await deleteAppointment(editingId);
            toast("Rendez-vous supprimé ✅", "success");
            setCreateMode();
            await loadAppointments();
        } catch (err) {
            toast(err.message || "Erreur suppression", "error");
        }
    });
}

if (tbody) {
    tbody.addEventListener("click", async (e) => {
        const btn = e.target.closest("button[data-action]");
        if (!btn) return;

        const action = btn.dataset.action;
        const id = btn.dataset.id;

        const appt = appointments.find((x) => String(x.id) === String(id));
        if (!appt) return;

        if (action === "edit") setEditMode(appt);

        if (action === "del") {
            const ok = confirm("Supprimer ce rendez-vous ?");
            if (!ok) return;
            try {
                await deleteAppointment(id);
                toast("Rendez-vous supprimé ✅", "success");
                setCreateMode();
                await loadAppointments();
            } catch (err) {
                toast(err.message || "Erreur suppression", "error");
            }
        }
    });
}

[qEl, filterStatusEl, sortByEl].forEach((el) => {
    if (!el) return;
    el.addEventListener("input", renderAppointments);
    el.addEventListener("change", renderAppointments);
});

// ---------- LOGOUT (cookie) ----------
if (btnLogout) {
    btnLogout.addEventListener("click", async () => {
        try {
            await apiFetch("/auth/logout", { method: "POST" });
        } catch { }
        toast("Déconnexion ✅", "success");
        setTimeout(() => (window.location.href = "index.html"), 700);
    });
}
async function loadRole() {
    const data = await apiFetch("/users/me", { method: "GET" });


    const u = data;



    return u.role;
}

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


// ---------- INIT ----------
document.addEventListener("DOMContentLoaded", async () => {
    try {
        await Promise.all([loadPatients(), loadDoctors()]);
        await loadAppointments();
        setCreateMode();
    } catch (err) {
        console.error(err);
        toast(err.message || "Erreur chargement", "error");
    }
});
