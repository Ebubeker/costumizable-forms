import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// @ts-ignore - Next.js 15 params type issue
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		console.log('Checking steps for form:', id);

		// Check if form_steps table exists
		const { data: tableCheck, error: tableError } = await supabaseAdmin
			.from('information_schema.tables')
			.select('table_name')
			.eq('table_schema', 'public')
			.eq('table_name', 'form_steps');

		console.log('Table check:', { tableCheck, tableError });

		// Get the form
		const { data: form, error: formError } = await supabaseAdmin
			.from('forms')
			.select('*')
			.eq('id', id)
			.single();

		console.log('Form:', { form, formError });

		// Try to get steps directly
		const { data: steps, error: stepsError } = await supabaseAdmin
			.from('form_steps')
			.select('*')
			.eq('form_id', id);

		console.log('Steps:', { steps, stepsError });

		// Try to get fields
		const { data: fields, error: fieldsError } = await supabaseAdmin
			.from('form_fields')
			.select('*')
			.eq('form_id', id);

		console.log('Fields:', { fields, fieldsError });

		return NextResponse.json({
			formId: id,
			tableExists: tableCheck && tableCheck.length > 0,
			form: form,
			formType: form?.form_type,
			steps: steps || [],
			stepsCount: steps?.length || 0,
			fields: fields || [],
			fieldsCount: fields?.length || 0,
			fieldsWithSteps: fields?.filter(f => f.step_id)?.length || 0,
			errors: {
				tableError,
				formError,
				stepsError,
				fieldsError
			}
		});
	} catch (error) {
		console.error('Error in check steps:', error);
		return NextResponse.json({
			error: 'Internal server error',
			details: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
}
