"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Shield, Clock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        setError("Email ou senha inválidos.");
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
      {/* Left panel - branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-white/5" />
        <div className="absolute top-1/2 -right-32 h-[500px] w-[500px] rounded-full bg-white/5" />
        <div className="absolute -bottom-16 left-1/3 h-72 w-72 rounded-full bg-white/5" />

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
              <span className="text-xl font-bold text-white">E</span>
            </div>
            <div>
              <span className="text-2xl font-bold tracking-tight text-white">EPAD</span>
              <p className="text-xs text-blue-200/70">Gestão de Atendimento Domiciliar</p>
            </div>
          </div>

          {/* Main content */}
          <div className="max-w-md">
            <h1 className="text-4xl font-bold leading-tight text-white xl:text-5xl">
              Cuidado profissional,{" "}
              <span className="text-blue-300">acompanhamento inteligente</span>
            </h1>
            <p className="mt-4 text-lg text-blue-100/80">
              Gerencie plantões, profissionais e pacientes em um só lugar.
            </p>

            {/* Feature cards */}
            <div className="mt-10 space-y-4">
              <div className="flex items-center gap-4 rounded-xl bg-white/10 p-4 backdrop-blur-sm">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-400/20">
                  <Heart className="h-5 w-5 text-blue-300" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Pacientes em primeiro lugar</p>
                  <p className="text-xs text-blue-200/70">Acompanhamento completo de saúde e medicações</p>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-xl bg-white/10 p-4 backdrop-blur-sm">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-400/20">
                  <Clock className="h-5 w-5 text-blue-300" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Gestão de plantões</p>
                  <p className="text-xs text-blue-200/70">Agendamento, atribuição e acompanhamento em tempo real</p>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-xl bg-white/10 p-4 backdrop-blur-sm">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-400/20">
                  <Shield className="h-5 w-5 text-blue-300" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Seguro e auditável</p>
                  <p className="text-xs text-blue-200/70">Rastreamento completo de todas as ações</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-xs text-blue-200/40">
            EPAD v0.1.0
          </p>
        </div>
      </div>

      {/* Right panel - login form */}
      <div className="flex w-full items-center justify-center bg-slate-50 px-6 lg:w-1/2 xl:w-[45%]">
        <div className="w-full max-w-sm">
          {/* Mobile-only logo */}
          <div className="mb-10 text-center lg:hidden">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-800 to-indigo-900 shadow-lg shadow-blue-900/30">
              <span className="text-2xl font-bold text-white">E</span>
            </div>
            <h1 className="mt-4 text-2xl font-bold text-slate-900">EPAD</h1>
            <p className="mt-1 text-sm text-slate-500">Gestão de Atendimento Domiciliar</p>
          </div>

          {/* Desktop heading */}
          <div className="mb-8 hidden lg:block">
            <h2 className="text-2xl font-bold text-slate-900">Bem-vindo de volta</h2>
            <p className="mt-1 text-sm text-slate-500">
              Entre com suas credenciais para acessar o sistema.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/50"
          >
            <div className="space-y-4">
              <Input
                id="email"
                label="Email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                id="password"
                label="Senha"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-100">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="mt-6 w-full"
              loading={loading}
            >
              Entrar
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            Contas são criadas pelo administrador da EPAD.
          </p>
        </div>
      </div>
    </div>
  );
}
