import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header className="border-b border-slate-100 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-800">
              <span className="text-sm font-bold text-white">E</span>
            </div>
            <h1 className="text-2xl font-bold text-blue-900">EPAD</h1>
          </div>
          <Link
            href="/login"
            className="rounded-lg bg-blue-800 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Entrar
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Gestão de Atendimento Domiciliar
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            Plataforma centralizada para gerenciar plantões, cuidadores e
            acompanhamento de pacientes em tempo real.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-block rounded-lg bg-blue-800 px-8 py-3 text-base font-medium text-white transition hover:bg-blue-700"
          >
            Acessar o sistema
          </Link>
        </div>

        {/* Roles cards */}
        <div className="mx-auto mt-16 grid max-w-4xl gap-6 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 p-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-800 text-lg font-bold">
              A
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              Administrador
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Gerencia pacientes, profissionais e plantões. Controle total da
              operação com dashboard e auditoria completa.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 p-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 text-lg font-bold">
              P
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              Profissional
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Cuidadores e enfermeiros visualizam plantões disponíveis, aceitam
              atendimentos e registram ocorrências.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 p-6">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-700 text-lg font-bold">
              F
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              Familiar
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Acompanhe os atendimentos dos seus pacientes em tempo real e
              avalie a qualidade do serviço prestado.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-6 text-center text-sm text-slate-500">
        EPAD &copy; {new Date().getFullYear()} — Sistema de Gestão de Atendimento Domiciliar
      </footer>
    </div>
  );
}
