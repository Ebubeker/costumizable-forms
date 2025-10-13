import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
	try {
		// Check if form_steps table exists
		const { data: tables, error: tablesError } = await supabaseAdmin
			.from('information_schema.tables')
			.select('table_name')
			.eq('table_schema', 'public')
			.in('table_name', ['forms', 'form_fields', 'form_steps']);

		if (tablesError) {
			console.error('Error checking tables:', tablesError);
			return NextResponse.json({ error: 'Failed to check tables' }, { status: 500 });
		}

		// Check if form_type column exists in forms table
		const { data: columns, error: columnsError } = await supabaseAdmin
			.from('information_schema.columns')
			.select('column_name, data_type')
			.eq('table_name', 'forms')
			.eq('table_schema', 'public')
			.in('column_name', ['form_type', 'step_id']);

		if (columnsError) {
			console.error('Error checking columns:', columnsError);
			return NextResponse.json({ error: 'Failed to check columns' }, { status: 500 });
		}

		// Check if step_id column exists in form_fields table
		const { data: fieldColumns, error: fieldColumnsError } = await supabaseAdmin
			.from('information_schema.columns')
			.select('column_name, data_type')
			.eq('table_name', 'form_fields')
			.eq('table_schema', 'public')
			.eq('column_name', 'step_id');

		if (fieldColumnsError) {
			console.error('Error checking form_fields columns:', fieldColumnsError);
			return NextResponse.json({ error: 'Failed to check form_fields columns' }, { status: 500 });
		}

		return NextResponse.json({
			tables: tables?.map(t => t.table_name) || [],
			formsColumns: columns?.map(c => ({ name: c.column_name, type: c.data_type })) || [],
			formFieldsColumns: fieldColumns?.map(c => ({ name: c.column_name, type: c.data_type })) || [],
			migrationNeeded: {
				formStepsTable: !tables?.some(t => t.table_name === 'form_steps'),
				formTypeColumn: !columns?.some(c => c.column_name === 'form_type'),
				stepIdColumn: !fieldColumns?.some(c => c.column_name === 'step_id')
			}
		});
	} catch (error) {
		console.error('Error in schema check:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
