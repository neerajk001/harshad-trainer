import type { NextAuthResult } from "next-auth";

declare module "next-auth" {
  interface User {
    role?: "trainer" | "client";
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: "trainer" | "client";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    role?: "trainer" | "client";
  }
}

export type { NextAuthResult };
