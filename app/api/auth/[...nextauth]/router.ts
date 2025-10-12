import NextAuth from "next-auth"
import { WhopServerSdk } from "@whop/api"

const whopApi = WhopServerSdk({
  appApiKey: process.env.WHOP_API_KEY!,
  appId: process.env.NEXT_PUBLIC_WHOP_APP_ID!,
});

const WhopProvider = whopApi.oauth.authJsProvider({
  scope: ["read_user"],
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [WhopProvider],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.access_token = account.access_token
        
        // Fetch user data from Whop API to determine role
        try {
          const res = await fetch("https://api.whop.com/api/v2/me", {
            headers: { Authorization: `Bearer ${account.access_token}` },
          });
          
          if (res.ok) {
            const userData = await res.json();
            token.whopUser = userData;
            
            // Determine user role based on Whop user data
            // You can customize this logic based on your requirements
            token.role = userData.role || 'user'; // Default to 'user' if no role specified
            
            // Example: Check if user is admin based on specific criteria
            // token.role = userData.is_admin ? 'admin' : 'user';
            // Or check for specific permissions/company roles
            // token.role = userData.company?.role === 'owner' ? 'admin' : 'user';
          }
        } catch (error) {
          console.error('Error fetching Whop user data:', error);
          token.role = 'user'; // Default role on error
        }
      }
      return token
    },
    async session({ session, token }) {
      session.access_token = token.access_token as string
      session.user.role = token.role as string
      session.user.whopData = token.whopUser
      return session
    },
  },
})

export const { GET, POST } = handlers
