import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Mail, UserRound } from "lucide-react";
import logoV from "@/assets/logo-v.png";
import { useStore } from "@/context/StoreContext";
import { loginCustomer, registerCustomer } from "@/lib/auth";
import { storeConfig } from "@/lib/store";

const Login = () => {
  const navigate = useNavigate();
  const { customerUser, refreshCustomerUser } = useStore();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (customerUser) navigate("/conta", { replace: true });
  }, [customerUser, navigate]);

  const submit = () => {
    setError("");
    if (!email.trim() || !password.trim() || (mode === "register" && !fullName.trim())) {
      setError("Preencha os campos obrigatórios.");
      return;
    }

    const result = mode === "login"
      ? loginCustomer({ email, password })
      : registerCustomer({ fullName, email, password });

    if (!result.ok) {
      setError(result.message);
      return;
    }

    refreshCustomerUser();
    navigate("/conta", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto max-w-md rounded-[28px] border border-border bg-card p-8">
        <Link to="/" className="mb-8 inline-block text-sm text-muted-foreground hover:text-foreground">← Voltar para a loja</Link>
        <div className="mb-6 flex items-center gap-3">
          <img src={logoV} alt="Logo" className="h-12 w-12 rounded-2xl" />
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-primary">Conta do cliente</p>
            <h1 className="text-2xl font-bold">{storeConfig.name}</h1>
          </div>
        </div>

        <div className="mb-6 flex rounded-2xl border border-border bg-secondary p-1 text-sm">
          <button onClick={() => setMode("login")} className={`flex-1 rounded-xl px-3 py-2 ${mode === "login" ? "bg-background text-foreground" : "text-muted-foreground"}`}>Entrar</button>
          <button onClick={() => setMode("register")} className={`flex-1 rounded-xl px-3 py-2 ${mode === "register" ? "bg-background text-foreground" : "text-muted-foreground"}`}>Criar conta</button>
        </div>

        <div className="space-y-3">
          {mode === "register" ? (
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">Nome completo</label>
              <div className="flex items-center gap-3 rounded-2xl border border-border bg-secondary px-4">
                <UserRound size={16} className="text-muted-foreground" />
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-12 w-full bg-transparent outline-none" placeholder="Seu nome" />
              </div>
            </div>
          ) : null}

          <div>
            <label className="mb-2 block text-sm text-muted-foreground">E-mail</label>
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-secondary px-4">
              <Mail size={16} className="text-muted-foreground" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="h-12 w-full bg-transparent outline-none" placeholder="voce@email.com" />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm text-muted-foreground">Senha</label>
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-secondary px-4">
              <Lock size={16} className="text-muted-foreground" />
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="h-12 w-full bg-transparent outline-none" placeholder="Digite sua senha" />
            </div>
          </div>

          <button onClick={submit} className="w-full rounded-2xl bg-primary px-4 py-3 font-semibold text-primary-foreground transition hover:brightness-110">
            {mode === "login" ? "Entrar na conta" : "Criar conta"}
          </button>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      </div>
    </div>
  );
};

export default Login;
