# Supabase Setup Guide

The form builder requires Supabase to be configured to store and manage forms. Follow these steps to set up Supabase:

## 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - **Name**: `customizable-forms` (or your preferred name)
   - **Database Password**: Choose a strong password
   - **Region**: Choose the closest region to your users
6. Click "Create new project"

## 2. Get Your Project Credentials

Once your project is created:

1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **anon public** key (starts with `eyJ...`)
   - **service_role** key (starts with `eyJ...`)

## 3. Set Up Environment Variables

Create a `.env.local` file in your project root with the following content:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Whop Configuration (if needed)
WHOP_API_KEY=your-whop-api-key
NEXT_PUBLIC_WHOP_APP_ID=your-whop-app-id
WHOP_CLIENT_ID=your-whop-client-id
WHOP_CLIENT_SECRET=your-whop-client-secret
```

Replace the placeholder values with your actual Supabase credentials.

## 4. Set Up the Database Schema

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `supabase/schema.sql` from this project
5. Paste it into the SQL editor
6. Click **Run** to execute the schema

This will create all the necessary tables:
- `forms` - Stores form metadata
- `form_blocks` - Stores session blocks (input, text, text-and-input)
- `form_fields` - Stores individual input fields
- `form_responses` - Stores form submissions
- `form_response_data` - Stores individual field responses

## 5. Configure Row Level Security

The schema includes Row Level Security (RLS) policies that:
- Allow users to view/edit forms from their company only
- Allow anyone to submit form responses
- Prevent unauthorized access to other companies' data

## 6. Test the Setup

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/forms` to test the form builder
3. Try creating a form and saving it
4. Check your Supabase dashboard to see if the data is being stored

## 7. Troubleshooting

### Error: "supabaseKey is required"
- Make sure your `.env.local` file exists and has the correct values
- Restart your development server after adding environment variables
- Check that the environment variable names match exactly

### Error: "Failed to fetch forms"
- Verify your Supabase URL and keys are correct
- Check that the database schema has been applied
- Ensure your Supabase project is active (not paused)

### Forms not saving
- Check the browser console for error messages
- Verify the service role key has the correct permissions
- Make sure the database tables exist

## 8. Production Deployment

For production deployment:

1. Add the same environment variables to your hosting platform
2. Make sure to use the production Supabase project (not the development one)
3. Update the RLS policies if needed for your specific use case
4. Consider setting up database backups

## 9. Optional: Enable Email Authentication

If you want to add user authentication:

1. Go to **Authentication** → **Settings** in your Supabase dashboard
2. Configure your site URL
3. Set up email templates
4. Enable the providers you want to use

## 10. Optional: Set Up Real-time Subscriptions

For real-time form updates:

1. Enable real-time for the `forms` table
2. Use Supabase's real-time features in your application
3. Subscribe to form changes for live updates

---

## Quick Start (Minimal Setup)

If you just want to test the form builder without full Supabase setup:

1. The application will work in "demo mode" with placeholder values
2. Forms won't be saved to a database
3. You can still test the form builder interface
4. To enable full functionality, complete the Supabase setup above

---

Need help? Check the [Supabase Documentation](https://supabase.com/docs) or create an issue in this repository.
