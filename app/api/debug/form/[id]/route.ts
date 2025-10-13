import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// @ts-ignore - Next.js 15 params type issue
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		// Get the form with all related data
		const { data: form, error: formError } = await supabaseAdmin
			.from('forms')
			.select(`
				*,
				form_fields(*),
				form_steps(*)
			`)
			.eq('id', id)
			.single();

		if (formError) {
			console.error('Error fetching form:', formError);
			return NextResponse.json({ error: 'Form not found' }, { status: 404 });
		}

		// Check if form_type column exists
		const hasFormType = 'form_type' in form;

		// Check if form_steps table exists by trying to query it
		let stepsExist = false;
		try {
			const { data: steps, error: stepsError } = await supabaseAdmin
				.from('form_steps')
				.select('id')
				.eq('form_id', id)
				.limit(1);

			stepsExist = !stepsError;
		} catch (e) {
			stepsExist = false;
		}

		return NextResponse.json({
			form: {
				id: form.id,
				title: form.title,
				form_type: form.form_type || 'not_set',
				hasFormType,
				stepsExist,
				stepsCount: form.form_steps?.length || 0,
				fieldsCount: form.form_fields?.length || 0,
				fieldsWithSteps: form.form_fields?.filter((f: any) => f.step_id)?.length || 0,
				fieldsWithoutSteps: form.form_fields?.filter((f: any) => !f.step_id)?.length || 0
			},
			steps: form.form_steps || [],
			fields: form.form_fields || []
		});
	} catch (error) {
		console.error('Error in form debug:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

// @ts-ignore - Next.js 15 params type issue
export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		const body = await request.json();
		const { action } = body;

		if (action === 'fix_form_type') {
			// Update form_type to 'single' if it's not set
			const { error } = await supabaseAdmin
				.from('forms')
				.update({ form_type: 'single' })
				.eq('id', id);

			if (error) {
				console.error('Error updating form_type:', error);
				return NextResponse.json({ error: 'Failed to update form_type' }, { status: 500 });
			}

			return NextResponse.json({ success: true, message: 'Form type updated to single' });
		}

		return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
	} catch (error) {
		console.error('Error in form fix:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
