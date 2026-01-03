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
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          console.log("Attempting to authenticate user:", credentials.username);
          // Find user in database
          const user = await db.sale.findUnique({
            where: { CodeG: credentials.username }
          });
          console.log("Found user:", user);
          if (!user || !user.Password) {
            console.log("Not Found user");
            return null;
          }

          // For migration: Check if password is hashed
          let isValid = false;
          
          
          if (user.Password.startsWith("$2")) {
            // Password is hashed with bcrypt
            isValid = await bcrypt.compare(credentials.password, user.Password);
          } else {
            // Legacy: Plain text password (temporary for migration)
            isValid = user.Password === credentials.password;
            
            // TODO: Auto-hash on successful login
            // if (isValid) {
            //   const hashedPassword = await bcrypt.hash(credentials.password, 10);
            //   await db.sale.update({
            //     where: { CodeG: user.CodeG },
            //     data: { Password: hashedPassword }
            //   });
            // }
          }

          if (!isValid) {
            return null;
          }

          // Check if user is active
          if (user.ST !== "1") {
            return null;
          }

          return {
            id: user.CodeG,
            codeG: user.CodeG,
            name: user.Name || "",
            surname: user.Surname || "",
            nameG: user.NameG || "",
            isAdmin: user.CodeG === "jeab" // Admin user
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
    maxAge: 24 * 60 * 60 // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET
};

/**
 * Hash password utility
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Compare password utility
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
