import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
	try {
		// Direct query to check if form_steps table has data
		const { data: steps, error: stepsError } = await supabaseAdmin
			.from('form_steps')
			.select('*');

		console.log('Direct steps query:', { steps, stepsError });

		// Also check forms table
		const { data: forms, error: formsError } = await supabaseAdmin
			.from('forms')
			.select('id, title, form_type')
			.limit(5);

		console.log('Forms query:', { forms, formsError });

		// Check form_fields table
		const { data: fields, error: fieldsError } = await supabaseAdmin
			.from('form_fields')
			.select('id, form_id, step_id, label')
			.limit(10);

		console.log('Fields query:', { fields, fieldsError });

		return NextResponse.json({
			steps: steps || [],
			stepsError: stepsError,
			forms: forms || [],
			formsError: formsError,
			fields: fields || [],
			fieldsError: fieldsError,
			summary: {
				totalSteps: steps?.length || 0,
				totalForms: forms?.length || 0,
				totalFields: fields?.length || 0,
				fieldsWithSteps: fields?.filter(f => f.step_id)?.length || 0
			}
		});
	} catch (error) {
		console.error('Error in check steps direct:', error);
		return NextResponse.json({ 
			error: 'Internal server error',
			details: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
}
