
const API_URL = "http://localhost:4000";

const toastArea = document.getElementById("toastArea");

function toast(message, type = "success") {
  if (!toastArea) return;

  const el = document.createElement("div");
  el.className = "toast";
  el.style.padding = "12px 14px";
  el.style.borderRadius = "14px";
  el.style.border = "1px solid rgba(0,0,0,.08)";
  el.style.boxShadow = "0 12px 25px rgba(0,0,0,.10)";
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
  txt.style.color = "#111827";
  txt.textContent = message;

  el.appendChild(dot);
  el.appendChild(txt);
  toastArea.appendChild(el);

  setTimeout(() => el.remove(), 3200);
}


const heroContent = document.getElementById("heroContent");
const authSection = document.getElementById("authSection");
const backHome = document.getElementById("navHome");

const btnLogin = document.getElementById("btnLogin");
const btnSignup = document.getElementById("btnSignup");
const btnReserver = document.getElementById("btnReserver");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const successModal = document.getElementById("successModal");
const modalTitle = document.getElementById("modalTitle");
const modalMessage = document.getElementById("modalMessage");
const closeModal = document.getElementById("closeModal");

const mobileMenuBtn = document.getElementById("mobileMenuBtn");

const registerPassword = document.getElementById("registerPassword");
const strengthFill = document.getElementById("strengthFill");
const strengthText = document.getElementById("strengthText");


function showAuth(mode = "login") {
    if (!heroContent || !authSection || !loginForm || !registerForm) return;

    heroContent.classList.add("hidden");
    authSection.classList.add("active");

    if (mode === "register") {
        registerForm.classList.add("active");
        loginForm.classList.remove("active");
    } else {
        loginForm.classList.add("active");
        registerForm.classList.remove("active");
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
}

function showHome() {
    if (!heroContent || !authSection) return;

    heroContent.classList.remove("hidden");
    authSection.classList.remove("active");
}

if (btnLogin) {
    btnLogin.addEventListener("click", () => showAuth("login"));
}

if (btnSignup) {
    btnSignup.addEventListener("click", () => showAuth("register"));
}

if (btnReserver) {
    btnReserver.addEventListener("click", (e) => {
        e.preventDefault();
        showAuth("register");
    });
}

if (backHome) {
    backHome.addEventListener("click", (e) => {
        e.preventDefault();
        showHome();
    });
}


document.querySelectorAll(".toggle-password").forEach((button) => {
    button.addEventListener("click", () => {
        const targetId = button.getAttribute("data-target");
        const input = document.getElementById(targetId);
        const icon = button.querySelector(".eye-icon");

        if (!input || !icon) return;

        if (input.type === "password") {
            input.type = "text";
            icon.innerHTML = `
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
      `;
        } else {
            input.type = "password";
            icon.innerHTML = `
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      `;
        }
    });
});


function checkPasswordStrength(password) {
    let categories = 0;

    if (/[a-z]/.test(password)) categories++;
    if (/[A-Z]/.test(password)) categories++;
    if (/[0-9]/.test(password)) categories++;
    if (/[^A-Za-z0-9]/.test(password)) categories++;

    return {
        categories,
        length: password.length,
        isRepeated: /(.)\1{2,}/.test(password)
    };
}


if (registerPassword && strengthFill && strengthText) {
    registerPassword.addEventListener("input", (e) => {
        const password = e.target.value;
        const result = checkPasswordStrength(password);

        strengthFill.className = "strength-fill";

        if (password.length === 0) {
            strengthFill.style.width = "0%";
            strengthText.textContent = "Force du mot de passe";
            return;
        }

        if (result.categories <= 1 || result.isRepeated || result.length < 6) {
            strengthFill.classList.add("weak");
            strengthText.textContent = "Faible";
            strengthFill.style.width = "25%";
            return;
        }

        if (result.categories === 2) {
            strengthFill.classList.add("fair");
            strengthText.textContent = "Moyen";
            strengthFill.style.width = "50%";
            return;
        }

        if (result.categories === 3 && result.length >= 8) {
            strengthFill.classList.add("good");
            strengthText.textContent = "Bon";
            strengthFill.style.width = "75%";
            return;
        }


        if (result.categories === 4 && result.length >= 11) {
            strengthFill.classList.add("strong");
            strengthText.textContent = "Excellent";
            strengthFill.style.width = "100%";
            return;
        }
    });
}
if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const btn = e.target.querySelector(".btn-submit");
        if (btn) btn.classList.add("loading");

        const emailInput = document.getElementById("loginEmail");
        const passwordInput = document.getElementById("loginPassword");

        const email = emailInput ? emailInput.value : "";
        const password = passwordInput ? passwordInput.value : "";

      try {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

    
  if (response.status === 429) {
    const text = await response.text(); 
    toast(text, "warning");
    return;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    toast(data.message || data.error || "Erreur de connexion", "error");
    return;
  }

  toast("Connexion réussie ✅", "success");

  loginForm.reset();

  showSuccessModal(
    "Connexion réussie !",
    "Bienvenue ! Vous allez être redirigé vers votre tableau de bord."
  );

  setTimeout(() => {
    window.location.href = "/dashbord";
  }, 800);

} catch (error) {
  console.error(error);
  toast("Erreur réseau, réessayez plus tard.", "error");
} finally {
  if (btn) btn.classList.remove("loading");
}


    });
}



if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();


        const firstNameInput = document.getElementById("firstName");
        const lastNameInput = document.getElementById("lastName");
        const emailInput = document.getElementById("registerEmail");
        const passwordInput = document.getElementById("registerPassword");
        const roleSelect = document.getElementById("registerRole");



        const firstName = firstNameInput ? firstNameInput.value : "";
        const lastName = lastNameInput ? lastNameInput.value : "";
        const email = emailInput ? emailInput.value : "";
        const password = passwordInput ? passwordInput.value : "";
        const role = roleSelect ? roleSelect.value : "DOCTOR";

        const btn = e.target.querySelector(".btn-submit");
        if (btn) btn.classList.add("loading");

        const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ\s-]+$/;

        if (!nameRegex.test(firstName)) {
            alert("Le prénom doit contenir uniquement des lettres.");
            if (btn) btn.classList.remove("loading");
            return;
        }

        if (!nameRegex.test(lastName)) {
            alert("Le nom doit contenir uniquement des lettres.");
            if (btn) btn.classList.remove("loading");
            return;
        }
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/;



        if (!passwordRegex.test(password) || password.length < 8) {
            alert(
                "Le mot de passe doit contenir :\n- une majuscule\n- une minuscule\n- un chiffre\n- un symbole (@$!%*?&)\n- et au moins 8 caractères."
            );
            if (btn) btn.classList.remove("loading");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/users`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    // plus tard si route protégée :
                    // Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({
                    email,
                    password,
                    firstname: firstName,
                    lastName,
                    role,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                console.error("Erreur backend inscription:", data);

                if (data.details && Array.isArray(data.details)) {
                    // Erreurs Zod formatées par ton middleware
                    const messages = data.details
                        .map((d) => `${d.champ || d.field}: ${d.message}`)
                        .join("\n");
                    alert("Erreur de validation :\n" + messages);
                } else {
                    alert(data.message || data.error || "Erreur lors de la création du compte");
                }
            } else {
                registerForm.reset();

                if (strengthFill && strengthText) {
                    strengthFill.className = "strength-fill";
                    strengthFill.style.width = "0%";
                    strengthText.textContent = "Force du mot de passe";
                }

                showSuccessModal(
                    "Compte créé !",
                    `Bienvenue ${firstName || ""} ! Votre compte a été créé avec succès.`
                );
            }
        } catch (error) {
            console.error("Erreur réseau inscription:", error);
            alert("Erreur réseau, réessayez plus tard.");
        } finally {
            if (btn) btn.classList.remove("loading");
        }
    });
}

function showSuccessModal(title, message) {
    if (!successModal || !modalTitle || !modalMessage) return;

    modalTitle.textContent = title;
    modalMessage.textContent = message;
    successModal.classList.add("active");
    document.body.style.overflow = "hidden";
}

function hideSuccessModal() {
    if (!successModal) return;

    successModal.classList.remove("active");
    document.body.style.overflow = "";
}

if (closeModal) {
    closeModal.addEventListener("click", hideSuccessModal);
}

if (successModal) {
    successModal.addEventListener("click", (e) => {
        if (e.target === successModal) {
            hideSuccessModal();
        }
    });
}

document.addEventListener("keydown", (e) => {
    if (
        e.key === "Escape" &&
        successModal &&
        successModal.classList.contains("active")
    ) {
        hideSuccessModal();
    }
});

// =============================
// Menu mobile
// =============================
if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener("click", () => {
        mobileMenuBtn.classList.toggle("active");
        // Ici tu pourras aussi ouvrir/fermer ton menu mobile plus tard
    });
}


document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", (e) => {
        const href = link.getAttribute("href");
        if (!href || !href.startsWith("#")) return;

        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
            target.scrollIntoView({ behavior: "smooth" });
        }

        document
            .querySelectorAll(".nav-link")
            .forEach((l) => l.classList.remove("active"));
        link.classList.add("active");
    });
});
