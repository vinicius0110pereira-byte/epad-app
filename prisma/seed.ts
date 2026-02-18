import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// Same algorithm as src/lib/password.ts — bcryptjs, 10 rounds.
// Duplicated here because seed runs outside Next.js bundler (via tsx).
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log("🌱 Seeding database...");

  // Limpar dados existentes (ordem importa por FK)
  await prisma.feedback.deleteMany();
  await prisma.shiftEvent.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.shiftRequest.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.professionalProfile.deleteMany();
  await prisma.clientProfile.deleteMany();
  await prisma.user.deleteMany();

  // ========== USERS ==========
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@epad.test",
      passwordHash: await hashPassword("Admin123!"),
      name: "Ana Administradora",
      role: "ADMIN",
      active: true,
    },
  });
  console.log(`  ✅ Admin: ${adminUser.email}`);

  const prof1User = await prisma.user.create({
    data: {
      email: "professional1@epad.test",
      passwordHash: await hashPassword("Prof123!"),
      name: "Carlos Cuidador",
      role: "PROFESSIONAL",
      active: true,
    },
  });

  const prof1Profile = await prisma.professionalProfile.create({
    data: {
      userId: prof1User.id,
      professionalType: "CAREGIVER",
      approved: true,
      phone: "(11) 99999-0001",
      document: "111.222.333-44",
      internalScore: 85,
    },
  });
  console.log(`  ✅ Professional 1: ${prof1User.email}`);

  const prof2User = await prisma.user.create({
    data: {
      email: "professional2@epad.test",
      passwordHash: await hashPassword("Prof123!"),
      name: "Natália Enfermeira",
      role: "PROFESSIONAL",
      active: true,
    },
  });

  const prof2Profile = await prisma.professionalProfile.create({
    data: {
      userId: prof2User.id,
      professionalType: "NURSE",
      approved: true,
      phone: "(11) 99999-0002",
      document: "555.666.777-88",
      internalScore: 92,
    },
  });
  console.log(`  ✅ Professional 2: ${prof2User.email}`);

  const client1User = await prisma.user.create({
    data: {
      email: "client1@epad.test",
      passwordHash: await hashPassword("Client123!"),
      name: "Maria Familiar",
      role: "CLIENT",
      active: true,
    },
  });

  const client1Profile = await prisma.clientProfile.create({
    data: {
      userId: client1User.id,
      phone: "(11) 98888-0001",
      document: "123.456.789-00",
    },
  });
  console.log(`  ✅ Client 1: ${client1User.email}`);

  const client2User = await prisma.user.create({
    data: {
      email: "client2@epad.test",
      passwordHash: await hashPassword("Client123!"),
      name: "João Familiar",
      role: "CLIENT",
      active: true,
    },
  });

  const client2Profile = await prisma.clientProfile.create({
    data: {
      userId: client2User.id,
      phone: "(11) 98888-0002",
      document: "987.654.321-00",
    },
  });
  console.log(`  ✅ Client 2: ${client2User.email}`);

  // ========== PATIENTS ==========
  const patient1 = await prisma.patient.create({
    data: {
      fullName: "Dona Rosa Silva",
      birthDate: new Date("1940-03-15"),
      address: "Rua das Flores, 123",
      neighborhood: "Jardim Paulista",
      city: "São Paulo",
      state: "SP",
      zipCode: "01234-000",
      medicalNotes: "Hipertensão controlada. Necessita auxílio para locomoção.",
      medications: JSON.stringify([
        { name: "Losartana", dose: "50mg", frequency: "12h" },
        { name: "AAS", dose: "100mg", frequency: "24h" },
      ]),
      allergies: "Dipirona",
      clientId: client1Profile.id,
    },
  });
  console.log(`  ✅ Patient 1: ${patient1.fullName}`);

  const patient2 = await prisma.patient.create({
    data: {
      fullName: "Sr. Pedro Santos",
      birthDate: new Date("1935-07-22"),
      address: "Av. Brasil, 456",
      neighborhood: "Vila Mariana",
      city: "São Paulo",
      state: "SP",
      zipCode: "04321-000",
      medicalNotes: "Pós-operatório de fratura de fêmur. Repouso absoluto.",
      medications: JSON.stringify([
        { name: "Paracetamol", dose: "750mg", frequency: "6h" },
        { name: "Enoxaparina", dose: "40mg", frequency: "24h" },
      ]),
      allergies: null,
      clientId: client1Profile.id,
    },
  });
  console.log(`  ✅ Patient 2: ${patient2.fullName}`);

  const patient3 = await prisma.patient.create({
    data: {
      fullName: "Dona Lúcia Oliveira",
      birthDate: new Date("1945-11-08"),
      address: "Rua Augusta, 789",
      neighborhood: "Consolação",
      city: "São Paulo",
      state: "SP",
      zipCode: "01305-000",
      medicalNotes: "Alzheimer estágio inicial. Necessita supervisão constante.",
      medications: JSON.stringify([
        { name: "Donepezila", dose: "10mg", frequency: "24h" },
      ]),
      allergies: "Penicilina",
      clientId: client2Profile.id,
    },
  });
  console.log(`  ✅ Patient 3: ${patient3.fullName}`);

  // ========== SHIFTS ==========
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(now);
  dayAfter.setDate(dayAfter.getDate() + 2);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  // Shift 1: COMPLETED (passado)
  const shift1 = await prisma.shift.create({
    data: {
      startDateTime: new Date(twoDaysAgo.setHours(8, 0, 0, 0)),
      endDateTime: new Date(twoDaysAgo.setHours(20, 0, 0, 0)),
      requiredProfessionalType: "CAREGIVER",
      address: patient1.address,
      neighborhood: patient1.neighborhood,
      city: patient1.city,
      needs: "Auxílio com alimentação e higiene pessoal",
      value: 25000, // R$ 250,00
      status: "COMPLETED",
      patientId: patient1.id,
      professionalId: prof1Profile.id,
      createdByAdminId: adminUser.id,
      acceptedAt: new Date(twoDaysAgo.setHours(6, 0, 0, 0)),
      startedAt: new Date(twoDaysAgo.setHours(8, 0, 0, 0)),
      finishedAt: new Date(twoDaysAgo.setHours(20, 0, 0, 0)),
    },
  });
  console.log(`  ✅ Shift 1: COMPLETED`);

  // Shift 2: IN_PROGRESS (hoje)
  const shift2 = await prisma.shift.create({
    data: {
      startDateTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 0, 0),
      endDateTime: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 19, 0, 0),
      requiredProfessionalType: "NURSE",
      address: patient2.address,
      neighborhood: patient2.neighborhood,
      city: patient2.city,
      needs: "Curativo e administração de medicação injetável",
      value: 35000, // R$ 350,00
      status: "IN_PROGRESS",
      patientId: patient2.id,
      professionalId: prof2Profile.id,
      createdByAdminId: adminUser.id,
      acceptedAt: new Date(yesterday.setHours(18, 0, 0, 0)),
      startedAt: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 5, 0),
    },
  });
  console.log(`  ✅ Shift 2: IN_PROGRESS`);

  // Shift 3: OPEN (amanhã)
  const shift3 = await prisma.shift.create({
    data: {
      startDateTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 8, 0, 0),
      endDateTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 20, 0, 0),
      requiredProfessionalType: "CAREGIVER",
      address: patient3.address,
      neighborhood: patient3.neighborhood,
      city: patient3.city,
      needs: "Companhia e supervisão. Paciente com tendência a sair de casa.",
      value: 22000, // R$ 220,00
      status: "OPEN",
      patientId: patient3.id,
      createdByAdminId: adminUser.id,
    },
  });
  console.log(`  ✅ Shift 3: OPEN`);

  // Shift 4: ACCEPTED (depois de amanhã)
  const shift4 = await prisma.shift.create({
    data: {
      startDateTime: new Date(dayAfter.getFullYear(), dayAfter.getMonth(), dayAfter.getDate(), 8, 0, 0),
      endDateTime: new Date(dayAfter.getFullYear(), dayAfter.getMonth(), dayAfter.getDate(), 20, 0, 0),
      requiredProfessionalType: "CAREGIVER",
      address: patient1.address,
      neighborhood: patient1.neighborhood,
      city: patient1.city,
      needs: "Auxílio geral e fisioterapia passiva",
      value: 25000,
      status: "ACCEPTED",
      patientId: patient1.id,
      professionalId: prof1Profile.id,
      createdByAdminId: adminUser.id,
      acceptedAt: new Date(),
    },
  });
  console.log(`  ✅ Shift 4: ACCEPTED`);

  // Shift 5: OPEN urgente (amanhã)
  const shift5 = await prisma.shift.create({
    data: {
      startDateTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 20, 0, 0),
      endDateTime: new Date(dayAfter.getFullYear(), dayAfter.getMonth(), dayAfter.getDate(), 8, 0, 0),
      requiredProfessionalType: "NURSE",
      address: patient2.address,
      neighborhood: patient2.neighborhood,
      city: patient2.city,
      needs: "Plantão noturno. Monitorar sinais vitais.",
      value: 40000, // R$ 400,00
      status: "OPEN",
      isUrgent: true,
      patientId: patient2.id,
      createdByAdminId: adminUser.id,
    },
  });
  console.log(`  ✅ Shift 5: OPEN (urgente)`);

  // ========== SHIFT EVENTS ==========
  // Events para shift1 (COMPLETED)
  await prisma.shiftEvent.createMany({
    data: [
      {
        shiftId: shift1.id,
        actorUserId: adminUser.id,
        type: "CREATED",
        description: "Plantão criado pelo administrador",
      },
      {
        shiftId: shift1.id,
        actorUserId: prof1User.id,
        type: "ACCEPTED",
        description: "Profissional aceitou o plantão",
      },
      {
        shiftId: shift1.id,
        actorUserId: prof1User.id,
        type: "STARTED",
        description: "Plantão iniciado",
      },
      {
        shiftId: shift1.id,
        actorUserId: prof1User.id,
        type: "OCCURRENCE",
        description: "Paciente reclamou de dor no joelho",
        metadata: JSON.stringify({ severity: "low", action: "Aplicou compressa fria" }),
      },
      {
        shiftId: shift1.id,
        actorUserId: prof1User.id,
        type: "MED_REQUEST",
        description: "Solicitação de Paracetamol 500mg",
        metadata: JSON.stringify({ medication: "Paracetamol", dose: "500mg", reason: "Dor no joelho" }),
      },
      {
        shiftId: shift1.id,
        actorUserId: prof1User.id,
        type: "FINISHED",
        description: "Plantão finalizado normalmente",
      },
    ],
  });
  console.log(`  ✅ 6 events para Shift 1`);

  // Events para shift2 (IN_PROGRESS)
  await prisma.shiftEvent.createMany({
    data: [
      {
        shiftId: shift2.id,
        actorUserId: adminUser.id,
        type: "CREATED",
        description: "Plantão criado pelo administrador",
      },
      {
        shiftId: shift2.id,
        actorUserId: prof2User.id,
        type: "ACCEPTED",
        description: "Profissional aceitou o plantão",
      },
      {
        shiftId: shift2.id,
        actorUserId: prof2User.id,
        type: "STARTED",
        description: "Plantão iniciado",
      },
      {
        shiftId: shift2.id,
        actorUserId: prof2User.id,
        type: "OCCURRENCE",
        description: "Curativo realizado com sucesso",
        metadata: JSON.stringify({ type: "curativo", location: "perna direita" }),
      },
    ],
  });
  console.log(`  ✅ 4 events para Shift 2`);

  // ========== FEEDBACKS ==========
  await prisma.feedback.create({
    data: {
      shiftId: shift1.id,
      userId: client1User.id,
      fromRole: "CLIENT",
      rating: 5,
      notes: "Excelente profissional! Muito atencioso e cuidadoso com minha mãe.",
    },
  });

  await prisma.feedback.create({
    data: {
      shiftId: shift1.id,
      userId: prof1User.id,
      fromRole: "PROFESSIONAL",
      rating: 4,
      notes: "Paciente colaborativa. Família presente e atenciosa.",
    },
  });
  console.log(`  ✅ 2 feedbacks criados`);

  console.log("\n✅ Seed concluído com sucesso!");
  console.log("\n📋 Usuários de teste:");
  console.log("   ADMIN:        admin@epad.test / Admin123!");
  console.log("   PROFESSIONAL: professional1@epad.test / Prof123!");
  console.log("   PROFESSIONAL: professional2@epad.test / Prof123!");
  console.log("   CLIENT:       client1@epad.test / Client123!");
  console.log("   CLIENT:       client2@epad.test / Client123!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
