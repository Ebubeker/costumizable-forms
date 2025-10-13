import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export async function GET() {
	try {
		console.log('isSupabaseConfigured:', isSupabaseConfigured);
		console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
		console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
		console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

		if (!isSupabaseConfigured) {
			return NextResponse.json({
				error: 'Supabase not configured',
				env: {
					url: process.env.NEXT_PUBLIC_SUPABASE_URL,
					anonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
					serviceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
				}
			});
		}

		// Test a simple query
		const { data, error } = await supabaseAdmin
			.from('forms')
			.select('*')
			.limit(5);

		return NextResponse.json({
			success: true,
			isSupabaseConfigured,
			formsCount: data?.length || 0,
			forms: data,
			error: error?.message
		});
	} catch (error) {
		console.error('Test Supabase error:', error);
		return NextResponse.json({
			error: 'Test failed',
			message: error instanceof Error ? error.message : 'Unknown error'
		});
	}
}
