import { type UserRole } from ".";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      role: UserRole;
      professionalProfileId?: string | null;
      clientProfileId?: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string | null;
    role: UserRole;
    professionalProfileId?: string | null;
    clientProfileId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    professionalProfileId?: string | null;
    clientProfileId?: string | null;
  }
}
