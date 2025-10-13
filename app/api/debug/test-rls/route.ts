import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
	try {
		// Test 1: Check if we can read form_steps with admin client
		const { data: adminSteps, error: adminError } = await supabaseAdmin
			.from('form_steps')
			.select('*')
			.limit(5);

		console.log('Admin client steps:', { adminSteps, adminError });

		// Test 2: Check if form_steps table exists and has data
		const { data: tableInfo, error: tableError } = await supabaseAdmin
			.from('information_schema.tables')
			.select('table_name')
			.eq('table_schema', 'public')
			.eq('table_name', 'form_steps');

		console.log('Table info:', { tableInfo, tableError });

		// Test 3: Check RLS policies
		const { data: policies, error: policiesError } = await supabaseAdmin
			.from('pg_policies')
			.select('*')
			.eq('tablename', 'form_steps');

		console.log('RLS policies:', { policies, policiesError });

		// Test 4: Check if there are any steps in the table
		const { data: allSteps, error: allStepsError } = await supabaseAdmin
			.from('form_steps')
			.select('*');

		console.log('All steps:', { allSteps, allStepsError });

		return NextResponse.json({
			adminSteps: adminSteps || [],
			adminError: adminError,
			tableExists: tableInfo && tableInfo.length > 0,
			policies: policies || [],
			allSteps: allSteps || [],
			allStepsError: allStepsError
		});
	} catch (error) {
		console.error('Error in test RLS:', error);
		return NextResponse.json({ 
			error: 'Internal server error',
			details: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
}
