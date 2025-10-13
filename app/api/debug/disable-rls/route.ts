import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
	try {
		// Temporarily disable RLS for form_steps table
		const { data, error } = await supabaseAdmin
			.rpc('exec_sql', {
				sql: 'ALTER TABLE form_steps DISABLE ROW LEVEL SECURITY;'
			});

		if (error) {
			console.error('Error disabling RLS:', error);
			return NextResponse.json({ error: 'Failed to disable RLS' }, { status: 500 });
		}

		return NextResponse.json({ 
			success: true, 
			message: 'RLS disabled for form_steps table',
			data 
		});
	} catch (error) {
		console.error('Error in disable RLS:', error);
		return NextResponse.json({ 
			error: 'Internal server error',
			details: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
}
