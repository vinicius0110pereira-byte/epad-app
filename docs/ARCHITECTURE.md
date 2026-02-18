# Arquitetura EPAD - Sistema de Gestao de Atendimento Domiciliar

## 1. VISAO GERAL DO PRODUTO

A EPAD e uma empresa de atendimento domiciliar que atualmente gerencia plantoes de cuidadores e enfermeiros via WhatsApp, resultando em falta de rastreabilidade, processos caoticos de substituicao e risco de bypass. Este sistema web centraliza toda a operacao: o Admin cria pacientes e plantoes, profissionais pre-aprovados aceitam e executam os atendimentos com registro de eventos, e familias acompanham o status em tempo real - tudo com controle total pela empresa e auditoria completa.

---

## 2. TIPOS DE USUARIOS E PERMISSOES

### 2.1 ADMIN (Empresa)
**Quem e:** Funcionarios da EPAD com acesso total ao sistema.

| Acao | Permitido |
|------|-----------|
| CRUD de pacientes | Sim |
| CRUD de profissionais (criar contas) | Sim |
| CRUD de plantoes | Sim |
| Ver agenda geral | Sim |
| Gerenciar ocorrencias/medicamentos | Sim |
| Ver todos os dados | Sim |
| Ativar/desativar usuarios | Sim |

### 2.2 PROFESSIONAL (Cuidador/Enfermeiro)
**Quem e:** Prestador de servico pre-aprovado pela EPAD.

| Acao | Permitido |
|------|-----------|
| Ver plantoes OPEN do seu tipo | Sim |
| Aceitar plantao | Sim |
| Iniciar/finalizar plantao | Sim |
| Registrar ocorrencias | Sim |
| Solicitar medicamentos | Sim |
| Preencher feedback | Sim |
| Ver dados do paciente (limitado) | Apenas do plantao atribuido |
| Se cadastrar sozinho | NAO |
| Ver dados de outros profissionais | NAO |
| Criar/editar plantoes | NAO |
| Ver valores cobrados ao cliente | NAO |

### 2.3 CLIENT (Familiar)
**Quem e:** Responsavel pelo paciente que contrata os servicos.

| Acao | Permitido |
|------|-----------|
| Ver pacientes vinculados | Sim (apenas os seus) |
| Ver agenda de plantoes | Sim (apenas dos seus pacientes) |
| Ver profissional escalado | Sim (nome e funcao) |
| Ver status em tempo real | Sim |
| Avaliar atendimento | Sim |
| Ver valores do plantao | NAO |
| Contatar profissional direto | NAO |
| Criar/modificar plantoes | NAO |

---

## 3. FLUXOS PASSO A PASSO (MVP)

### 3.1 Fluxo do Admin
```
1. Faz login com email/senha
2. Acessa dashboard com metricas do dia
3. Cadastra paciente com dados basicos
4. Cria plantao vinculado ao paciente
5. Define tipo de profissional necessario
6. Plantao fica com status OPEN
7. Acompanha aceitacao pelo dashboard
8. Recebe alertas de ocorrencias
9. Visualiza historico e eventos
```

### 3.2 Fluxo do Profissional
```
1. Recebe conta criada pelo Admin
2. Faz login com email/senha
3. Acessa feed de plantoes disponiveis (filtrado por tipo)
4. Visualiza detalhes: paciente, horario, endereco, necessidades
5. Clica em "Aceitar" -> status vira ACCEPTED
6. No dia do plantao:
   6.1. Clica "Iniciar" -> status IN_PROGRESS
   6.2. Se necessario: registra ocorrencia ou solicita medicamento
   6.3. Clica "Finalizar" -> status COMPLETED
7. Preenche feedback obrigatorio
8. Visualiza historico de plantoes realizados
```

### 3.3 Fluxo do Cliente
```
1. Recebe conta criada pelo Admin (vinculada ao paciente)
2. Faz login com email/senha
3. Ve proximo atendimento na home
4. Ve nome do profissional escalado
5. Acompanha status: Agendado -> Em andamento -> Finalizado
6. Apos finalizacao: avalia com 1-5 estrelas
7. Consulta historico de atendimentos
```

### 3.4 Maquina de Estados do Plantao
```
OPEN ──────────> ACCEPTED ──────────> CONFIRMED ──────────> IN_PROGRESS ──────────> COMPLETED
  │                  │                     │                     │
  │                  │                     │                     │
  └──> CANCELLED <───┴─────────────────────┴─────────────────────┘
           │
           v
      URGENT_OPEN (se cancelado < X horas do inicio)
```

---

## 4. FUNCIONALIDADES IN/OUT (FASE 1)

### IN - MVP
- [x] Login com email/senha por role
- [x] Protecao de rotas por permissao
- [x] CRUD de Pacientes (Admin)
- [x] CRUD de Profissionais (Admin)
- [x] CRUD de Plantoes (Admin)
- [x] Feed de ofertas (Profissional)
- [x] Aceitar plantao
- [x] Iniciar/finalizar plantao
- [x] Registrar ocorrencias
- [x] Solicitar medicamentos
- [x] Feedback pos-plantao
- [x] Home com proximo atendimento (Cliente)
- [x] Historico de atendimentos (Cliente)
- [x] Avaliacao 1-5 estrelas (Cliente)
- [x] Eventos de auditoria (ShiftEvent)
- [x] Dashboard Admin basico
- [x] Layout responsivo

### OUT - Fases Futuras
- [ ] Multi-tenant (multiplas empresas)
- [ ] Chat interno real-time
- [ ] Notificacoes push/WhatsApp/SMS
- [ ] PWA com offline
- [ ] Geolocalizacao/distancia
- [ ] Relatorios avancados
- [ ] Gestao financeira completa
- [ ] Integracao calendario externo
- [ ] Upload de documentos/fotos
- [ ] Turnos recorrentes automaticos
- [ ] Confirmacao obrigatoria X horas antes

---

## 5. ARQUITETURA TECNICA

### 5.1 Stack
| Camada | Tecnologia | Motivo |
|--------|------------|--------|
| Frontend | Next.js 14 (App Router) | SSR, API routes integradas, moderno |
| Estilizacao | Tailwind CSS | Rapido, responsivo, customizavel |
| Banco (dev) | SQLite | Simplicidade local, zero config |
| Banco (prod) | PostgreSQL | Escalabilidade, recursos avancados |
| ORM | Prisma | Type-safe, migrations, excelente DX |
| Autenticacao | NextAuth v5 | Padrao do ecossistema Next.js |
| Hash senhas | bcrypt | Padrao da industria, seguro |
| State | React hooks + Context | Simplicidade no MVP |

### 5.2 Fluxo de Requisicoes
```
Browser -> Next.js (SSR/CSR) -> API Routes -> Prisma -> SQLite/PostgreSQL
                                    |
                                    v
                              NextAuth (session)
```

---

## 6. ESTRUTURA DE PASTAS

```
epad-app/
├── prisma/
│   ├── schema.prisma      # Modelos de dados
│   └── seed.ts            # Dados iniciais para teste
│
├── src/
│   ├── app/                        # APENAS ROTAS (App Router)
│   │   ├── (auth)/
│   │   │   └── login/page.tsx      # Tela de login
│   │   ├── (dashboard)/
│   │   │   ├── admin/              # Rotas do admin
│   │   │   ├── professional/       # Rotas do profissional
│   │   │   └── client/             # Rotas do cliente
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/ # NextAuth
│   │   │   ├── patients/           # CRUD pacientes
│   │   │   ├── shifts/             # CRUD plantoes
│   │   │   └── events/             # Eventos
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/         # Componentes reutilizaveis
│   │   ├── ui/            # Button, Input, Card, Modal...
│   │   ├── layouts/       # Sidebar, Topbar
│   │   ├── forms/         # Formularios especificos
│   │   ├── cards/         # Cards de plantao, paciente
│   │   └── modals/        # Modais
│   │
│   ├── lib/               # Configuracoes e utilitarios
│   │   ├── prisma.ts      # Cliente Prisma singleton
│   │   ├── auth.ts        # Configuracao NextAuth
│   │   ├── auth-helpers.ts # Helpers de autorizacao
│   │   └── utils.ts       # Funcoes utilitarias
│   │
│   ├── services/          # Logica de negocio
│   │   ├── patient.service.ts
│   │   ├── shift.service.ts
│   │   └── event.service.ts
│   │
│   ├── hooks/             # Custom hooks React
│   │   ├── useAuth.ts
│   │   └── useShifts.ts
│   │
│   ├── types/             # TypeScript types
│   │   ├── index.ts
│   │   └── next-auth.d.ts
│   │
│   └── middleware.ts      # Protecao de rotas
│
├── docs/
│   └── ARCHITECTURE.md    # Este documento
│
├── .env                   # Variaveis de ambiente
├── package.json
└── README.md
```

---

## 7. SEGURANCA & LGPD (MVP)

### 7.1 Principio do Menor Privilegio
| Role | Acesso |
|------|--------|
| ADMIN | Tudo. Unico que cria/edita usuarios. |
| PROFESSIONAL | Apenas plantoes onde `professionalId = seu id` ou status OPEN do seu tipo. |
| CLIENT | Apenas pacientes onde existe relacao `ClientProfile.patients`. |

### 7.2 Controle de Acesso Baseado em Relacionamento (Ownership)
- **Patient**: Client so acessa se `patient.clientId = user.clientProfile.id`
- **Shift**: Professional so acessa se `shift.professionalId = user.professionalProfile.id` OU shift esta OPEN
- **Shift (Client)**: Client so acessa se `shift.patient.clientId = user.clientProfile.id`

Implementado via helpers:
```typescript
assertClientCanAccessPatient(userId, patientId)
assertProfessionalCanAccessShift(userId, shiftId)
```

### 7.3 Protecao Contra Enumeracao de IDs
- Usar UUIDs em vez de IDs sequenciais
- Sempre validar ownership antes de retornar dados
- Retornar 404 (nao 403) quando recurso nao pertence ao usuario

### 7.4 Auditoria Obrigatoria
Todo evento sensivel gera um `ShiftEvent`:
- CREATED: Plantao criado
- ACCEPTED: Profissional aceitou
- STARTED: Plantao iniciado
- FINISHED: Plantao finalizado
- CANCELLED: Cancelamento (com motivo)
- OCCURRENCE: Ocorrencia registrada
- MED_REQUEST: Medicamento solicitado

Campos obrigatorios:
- `actorUserId`: Quem executou
- `shiftId`: Plantao relacionado
- `type`: Tipo do evento
- `metadata`: Dados adicionais (JSON)
- `createdAt`: Timestamp

### 7.5 Dados do Paciente por Role
| Campo | ADMIN | PROFESSIONAL | CLIENT |
|-------|-------|--------------|--------|
| Nome completo | Sim | Sim | Sim |
| Idade | Sim | Sim | Sim |
| Endereco | Sim | Sim (plantao aceito) | Sim |
| Notas medicas | Sim | Sim (plantao aceito) | NAO |
| Medicamentos | Sim | Sim (plantao aceito) | NAO |
| Historico completo | Sim | NAO | Parcial |

### 7.6 Politica de Retencao
- ShiftEvents: Manter indefinidamente (auditoria legal)
- Shifts finalizados: Manter 5 anos (trabalhista)
- Logs de acesso: Manter 1 ano
- Soft-delete para usuarios (nunca hard-delete)

### 7.7 Dados Sensiveis
- **NAO** armazenar: CID, diagnosticos detalhados, laudos medicos
- **Armazenar com cuidado**: Notas medicas (texto livre, sem identificadores)
- **Criptografar em producao**: Senhas (bcrypt ja faz), dados de endereco
- Campo `Patient.medicalNotes` deve conter apenas informacoes relevantes ao cuidado diario

---

## 8. DECISOES TECNICAS

| Decisao | Escolha | Motivo |
|---------|---------|--------|
| IDs | UUID v4 | Seguranca contra enumeracao |
| Senhas | bcrypt (10 rounds) | Padrao seguro da industria |
| Sessao | JWT via NextAuth | Stateless, escalavel |
| DB dev | SQLite | Zero config, arquivo local |
| DB prod | PostgreSQL | Escala, JSON nativo, indices |
| Soft delete | Campo `active` | Preservar auditoria |
| Timestamps | UTC sempre | Consistencia global |

---

## 9. VARIAVEIS DE AMBIENTE

```env
# Banco de dados
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_SECRET="gerar-com-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# Producao (exemplo)
# DATABASE_URL="postgresql://user:pass@host:5432/epad?schema=public"
```

---

## 10. PROXIMOS PASSOS

### Fase 1 - Fundacao (atual)
1. [x] ARCHITECTURE.md
2. [ ] Schema Prisma completo
3. [ ] Migration inicial
4. [ ] Seed com dados de teste
5. [ ] NextAuth configurado
6. [ ] Middleware de protecao
7. [ ] Helpers de autorizacao
8. [ ] APIs basicas

### Fase 2 - UI
1. [ ] Layout base (sidebar/topbar)
2. [ ] Componentes UI
3. [ ] Tela de login
4. [ ] Telas Admin
5. [ ] Telas Profissional
6. [ ] Telas Cliente

---

*Documento atualizado em: Fevereiro/2026*
*Versao: 1.0 - MVP*
