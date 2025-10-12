import NextAuth from "next-auth"

declare module "next-auth" {
  interface Session {
    access_token?: string
    user: {
      role?: string
      whopData?: any
    } & DefaultSession["user"]
  }

  interface JWT {
    access_token?: string
    role?: string
    whopUser?: any
  }
}
