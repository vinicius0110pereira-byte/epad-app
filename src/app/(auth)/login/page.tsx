"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, AlertCircle, Heart, Clock, Shield, Activity } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email ou senha inválidos. Verifique seus dados e tente novamente.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Erro ao fazer login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* ── Painel esquerdo ── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[58%] relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900">
        {/* Círculos decorativos */}
        <div className="absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-white/5" />
        <div className="absolute top-1/3 -right-40 h-[600px] w-[600px] rounded-full bg-white/5" />
        <div className="absolute -bottom-20 left-1/4 h-80 w-80 rounded-full bg-white/5" />
        <div className="absolute top-20 right-1/4 h-32 w-32 rounded-full bg-blue-400/10" />

        {/* Linha de pulso (decoração) */}
        <svg
          className="absolute bottom-0 left-0 right-0 w-full opacity-10"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M0 60 L150 60 L200 20 L250 100 L300 10 L360 90 L400 60 L1200 60"
            fill="none"
            stroke="white"
            strokeWidth="2"
          />
        </svg>

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400/30 to-indigo-400/20 backdrop-blur-sm ring-1 ring-white/20">
              <span className="text-xl font-extrabold text-white tracking-tighter">E</span>
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-blue-400 ring-2 ring-blue-900" />
            </div>
            <div>
              <span className="text-2xl font-extrabold tracking-tight text-white">EPAD</span>
              <p className="text-xs text-blue-300/60">Gestão de Atendimento Domiciliar</p>
            </div>
          </div>

          {/* Conteúdo central */}
          <div className="max-w-md">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-blue-200 ring-1 ring-white/10">
              <Activity className="h-3.5 w-3.5 text-blue-300" />
              Plataforma integrada de cuidado domiciliar
            </div>
            <h1 className="text-4xl font-bold leading-tight text-white xl:text-[2.75rem]">
              Cuidado profissional,{" "}
              <span className="bg-gradient-to-r from-blue-300 to-indigo-300 bg-clip-text text-transparent">
                acompanhamento inteligente
              </span>
            </h1>
            <p className="mt-4 text-base text-blue-100/70 leading-relaxed">
              Gerencie plantões, profissionais e pacientes com total controle e rastreabilidade.
            </p>

            {/* Cards de funcionalidade */}
            <div className="mt-10 space-y-3">
              {[
                {
                  icon: Heart,
                  title: "Pacientes em primeiro lugar",
                  desc: "Acompanhamento completo de saúde e medicações",
                },
                {
                  icon: Clock,
                  title: "Gestão de plantões",
                  desc: "Agendamento, atribuição e acompanhamento em tempo real",
                },
                {
                  icon: Shield,
                  title: "Seguro e auditável",
                  desc: "Rastreamento completo de todas as ações do sistema",
                },
              ].map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="flex items-center gap-4 rounded-xl bg-white/8 p-4 backdrop-blur-sm ring-1 ring-white/10 transition-all hover:bg-white/12"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-400/25 to-indigo-400/15">
                    <Icon className="h-5 w-5 text-blue-300" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="text-xs text-blue-200/60">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rodapé */}
          <p className="text-xs text-blue-300/30">© 2025 EPAD · v1.0</p>
        </div>
      </div>

      {/* ── Painel direito (formulário) ── */}
      <div className="flex w-full flex-col items-center justify-center bg-slate-50 px-6 lg:w-1/2 xl:w-[42%]">
        <div className="w-full max-w-sm">
          {/* Logo mobile */}
          <div className="mb-10 text-center lg:hidden">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-800 to-indigo-900 shadow-xl shadow-blue-900/30">
              <span className="text-2xl font-extrabold text-white">E</span>
            </div>
            <h1 className="mt-3 text-2xl font-bold text-slate-900">EPAD</h1>
            <p className="mt-1 text-sm text-slate-500">Gestão de Atendimento Domiciliar</p>
          </div>

          {/* Título desktop */}
          <div className="mb-8 hidden lg:block">
            <h2 className="text-2xl font-bold text-slate-900">Bem-vindo de volta</h2>
            <p className="mt-1.5 text-sm text-slate-500">
              Entre com suas credenciais para acessar o sistema.
            </p>
          </div>

          {/* Card do formulário */}
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-7 shadow-lg shadow-slate-200/60">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-3 focus:ring-blue-500/15"
                />
              </div>

              {/* Senha */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Senha
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-4 py-2.5 pr-11 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-3 focus:ring-blue-500/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:text-slate-600"
                    tabIndex={-1}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Erro */}
              {error && (
                <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Botão */}
              <button
                type="submit"
                disabled={loading}
                className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-700 to-blue-800 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-800/25 transition-all hover:from-blue-600 hover:to-blue-700 hover:shadow-lg hover:shadow-blue-700/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    Entrando...
                  </span>
                ) : (
                  "Entrar"
                )}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            Acesso restrito · Contas criadas pelo administrador
          </p>
        </div>
      </div>
    </div>
  );
}
