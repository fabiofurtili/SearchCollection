let captchaValue = 0;

function generateCaptcha() {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  captchaValue = a + b;
  const el = document.getElementById("captchaText");
  if (el) el.textContent = `Quanto e ${a} + ${b}?`;
}

function showError(msg) {
  const err = document.getElementById("registerError");
  const ok = document.getElementById("registerOk");
  ok.classList.add("d-none");
  err.textContent = msg;
  err.classList.remove("d-none");
}

function showOk(msg) {
  const err = document.getElementById("registerError");
  const ok = document.getElementById("registerOk");
  err.classList.add("d-none");
  ok.textContent = msg;
  ok.classList.remove("d-none");
}

document.getElementById("btnNewCaptcha").addEventListener("click", generateCaptcha);

document.getElementById("registerForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const user = document.getElementById("regUsername").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const pass = document.getElementById("regPassword").value.trim();
  const pass2 = document.getElementById("regPassword2").value.trim();
  const captcha = document.getElementById("captchaAnswer").value.trim();
  const accepted = document.getElementById("acceptTerms").checked;

  if (!user || !pass || !email) {
    showError("Preencha usuario, email e senha.");
    return;
  }

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk) {
    showError("Email invalido.");
    return;
  }

  if (pass !== pass2) {
    showError("As senhas nao conferem.");
    return;
  }

  if (Number(captcha) !== captchaValue) {
    showError("Captcha incorreto.");
    generateCaptcha();
    return;
  }

  if (!accepted) {
    showError("Aceite os termos de uso.");
    return;
  }

  try {
    let deviceId = localStorage.getItem("device_id");
    if (!deviceId) {
      deviceId = "dev_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("device_id", deviceId);
    }

    const res = await fetch(apiUrl("auth/register"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: user, email, password: pass, device_id: deviceId })
    });

    if (res.status === 409) {
      const data = await res.json().catch(() => ({}));
      showError(data?.error || "Usuario ja existe.");
      return;
    }

    if (res.status === 403) {
      const data = await res.json().catch(() => ({}));
      showError(data?.error || "Acesso teste indisponivel para este dispositivo.");
      return;
    }

    if (!res.ok) throw new Error("Falha ao cadastrar");

    showOk("Conta criada. Redirecionando...");
    setTimeout(() => window.location.replace(frontendUrl("index.html")), 1200);
  } catch {
    showError("Erro ao cadastrar.");
  }
});

generateCaptcha();
