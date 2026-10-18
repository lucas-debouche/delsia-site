// Auth web = même Supabase Auth que l’app (email + mot de passe).
// La table public.users = profil ; le mot de passe est dans auth.users.

window.DELSIA_SUPABASE_URL = "https://gsyqfgwgrkonnnkethwd.supabase.co";
window.DELSIA_SUPABASE_ANON_KEY =
  window.DELSIA_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzeXFmZ3dncmtvbm5ua2V0aHdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMzUwODgsImV4cCI6MjA4MzcxMTA4OH0.rPLUPiSZShSCw24jbFAsEhmGt4Gt7wknT2KeW5Vr8Xw";

window.delsiaCreateSupabase = function delsiaCreateSupabase() {
  if (!window.supabase) {
    throw new Error("supabase-js manquant");
  }
  return window.supabase.createClient(
    window.DELSIA_SUPABASE_URL,
    window.DELSIA_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
    },
  );
};

window.delsiaAuthMessage = function delsiaAuthMessage(err) {
  if (!err) return "";
  const m = (err.message || String(err)).toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid credentials")) {
    return "E-mail ou mot de passe incorrect.";
  }
  if (m.includes("email not confirmed")) {
    return "Confirmez d’abord votre e-mail (lien reçu à l’inscription), puis reconnectez-vous.";
  }
  if (m.includes("already registered") || m.includes("already been registered")) {
    return "Ce compte existe déjà. Connectez-vous avec votre mot de passe.";
  }
  if (m.includes("password") && m.includes("6")) {
    return "Mot de passe trop court (6 caractères minimum).";
  }
  if (m.includes("signup is disabled")) {
    return "Les inscriptions sont fermées pour le moment. Écrivez-nous à contact@delsia.fr.";
  }
  return err.message || "Erreur de connexion.";
};

/** Branche login / signup / forgot sur un formulaire #authBox */
window.delsiaBindPasswordAuth = function delsiaBindPasswordAuth(client, opts) {
  const emailInput = document.getElementById("emailInput");
  const passwordInput = document.getElementById("passwordInput");
  const authMsg = document.getElementById("authMsg");
  const loginBtn = document.getElementById("loginBtn");
  const signupBtn = document.getElementById("signupBtn");
  const forgotBtn = document.getElementById("forgotBtn");
  const modeLoginBtn = document.getElementById("modeLogin");
  const modeSignupBtn = document.getElementById("modeSignup");
  const authTitle = document.getElementById("authTitle");
  const authHint = document.getElementById("authHint");

  let mode = "login"; // login | signup

  function setMsg(text, isError) {
    if (!authMsg) return;
    authMsg.hidden = !text;
    authMsg.textContent = text || "";
    authMsg.style.color = isError ? "#b42318" : "";
  }

  function setMode(next) {
    mode = next;
    const isLogin = mode === "login";
    if (authTitle) authTitle.textContent = isLogin ? "Connexion" : "Créer un compte";
    if (authHint) {
      authHint.textContent = isLogin
        ? "Même e-mail et mot de passe que dans l’app Delsia."
        : "Vous pourrez utiliser ce compte dans l’app ensuite.";
    }
    if (loginBtn) loginBtn.hidden = !isLogin;
    if (signupBtn) signupBtn.hidden = isLogin;
    if (modeLoginBtn) modeLoginBtn.classList.toggle("is-active", isLogin);
    if (modeSignupBtn) modeSignupBtn.classList.toggle("is-active", !isLogin);
    setMsg("");
  }

  modeLoginBtn?.addEventListener("click", () => setMode("login"));
  modeSignupBtn?.addEventListener("click", () => setMode("signup"));
  setMode("login");

  loginBtn?.addEventListener("click", async () => {
    const email = (emailInput?.value || "").trim();
    const password = passwordInput?.value || "";
    if (!email || !password) {
      setMsg("Indiquez votre e-mail et votre mot de passe.", true);
      return;
    }
    loginBtn.disabled = true;
    const { error } = await client.auth.signInWithPassword({ email, password });
    loginBtn.disabled = false;
    if (error) {
      setMsg(window.delsiaAuthMessage(error), true);
      return;
    }
    setMsg("");
    if (typeof opts?.onSignedIn === "function") opts.onSignedIn();
  });

  signupBtn?.addEventListener("click", async () => {
    const email = (emailInput?.value || "").trim();
    const password = passwordInput?.value || "";
    if (!email || !password) {
      setMsg("Indiquez votre e-mail et votre mot de passe.", true);
      return;
    }
    if (password.length < 6) {
      setMsg("Mot de passe trop court (6 caractères minimum).", true);
      return;
    }
    signupBtn.disabled = true;
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/compte.html`,
      },
    });
    signupBtn.disabled = false;
    if (error) {
      setMsg(window.delsiaAuthMessage(error), true);
      return;
    }
    // Si confirmation e-mail exigée, pas de session tout de suite
    if (!data.session) {
      setMsg(
        "Compte créé. Vérifiez votre boîte mail pour le confirmer, puis connectez-vous ici (et dans l’app).",
        false,
      );
      setMode("login");
      return;
    }
    setMsg("");
    if (typeof opts?.onSignedIn === "function") opts.onSignedIn();
  });

  forgotBtn?.addEventListener("click", async () => {
    const email = (emailInput?.value || "").trim();
    if (!email) {
      setMsg("Indiquez votre e-mail pour réinitialiser le mot de passe.", true);
      return;
    }
    forgotBtn.disabled = true;
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/compte.html`,
    });
    forgotBtn.disabled = false;
    if (error) {
      setMsg(window.delsiaAuthMessage(error), true);
      return;
    }
    setMsg(
      "E-mail de réinitialisation envoyé. Ouvrez le lien dans votre navigateur (Safari ou Chrome), pas dans l’app.",
      false,
    );
  });

  // Entrée = login ou signup selon le mode
  [emailInput, passwordInput].forEach((el) => {
    el?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (mode === "login") loginBtn?.click();
        else signupBtn?.click();
      }
    });
  });
};

window.DELSIA_AUTH_INPUT_STYLE = `
  width: 100%;
  max-width: 360px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid #d0d5dd;
  margin-bottom: 12px;
  font: inherit;
  display: block;
`;
