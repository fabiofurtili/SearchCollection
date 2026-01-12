let loginCaptchaValue = 0;

function generateLoginCaptcha() {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  loginCaptchaValue = a + b;
  const el = document.getElementById("loginCaptchaText");
  if (el) el.textContent = `Quanto e ${a} + ${b}?`;
}

document.getElementById("btnLoginNewCaptcha").addEventListener("click", generateLoginCaptcha);
const forgotModal = document.getElementById("forgotModal");
const forgotMsg = document.getElementById("forgotMsg");

function showForgotMsg(text, isError) {
  forgotMsg.textContent = text;
  forgotMsg.className = isError
    ? "mt-3 text-danger"
    : "mt-3 text-success";
}

document.getElementById("loginForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value.trim();
  const captcha = document.getElementById("loginCaptchaAnswer").value.trim();
  const errorEl = document.getElementById("loginError");

  errorEl.classList.add("d-none");
  if (Number(captcha) !== loginCaptchaValue) {
    errorEl.textContent = "Captcha incorreto";
    errorEl.classList.remove("d-none");
    generateLoginCaptcha();
    return;
  }

  try {
    const res = await fetch(apiUrl("auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user, password: pass })
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const msg = data?.error || "Credenciais invalidas";
      throw new Error(msg);
    }

    const data = await res.json();
    if (!data?.token) throw new Error("Token ausente");

    localStorage.setItem("token", data.token);
    if (data?.access_until) {
      localStorage.setItem("access_until", data.access_until);
    }

    // redirect consistente
    window.location.replace(frontendUrl("dashboard.html"));
  } catch (err) {
    errorEl.textContent = err?.message || "Credenciais invalidas";
    errorEl.classList.remove("d-none");
  }
});

generateLoginCaptcha();

document.getElementById("btnForgotPass").addEventListener("click", () => {
  const modal = new bootstrap.Modal(forgotModal);
  document.getElementById("forgotEmail").value = "";
  forgotMsg.className = "mt-3 d-none";
  modal.show();
});

document.getElementById("btnForgotSend").addEventListener("click", async () => {
  const email = document.getElementById("forgotEmail").value.trim();
  if (!email) {
    showForgotMsg("Informe o email.", true);
    return;
  }

  try {
    const res = await fetch(apiUrl("auth/forgot"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      showForgotMsg(data?.error || "Erro ao enviar.", true);
      return;
    }

    showForgotMsg("Se o email estiver cadastrado, voce recebera a senha temporaria.", false);
  } catch {
    showForgotMsg("Erro ao enviar.", true);
  }
});
