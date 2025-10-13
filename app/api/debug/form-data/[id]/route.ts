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

		// Get steps separately to ensure we have them
		const { data: steps, error: stepsError } = await supabaseAdmin
			.from('form_steps')
			.select('*')
			.eq('form_id', id)
			.order('order_index', { ascending: true });

		if (stepsError) {
			console.error('Error fetching steps:', stepsError);
		}

		// Get fields separately to ensure we have them
		const { data: fields, error: fieldsError } = await supabaseAdmin
			.from('form_fields')
			.select('*')
			.eq('form_id', id)
			.order('order_index', { ascending: true });

		if (fieldsError) {
			console.error('Error fetching fields:', fieldsError);
		}

		return NextResponse.json({
			form: {
				id: form.id,
				title: form.title,
				description: form.description,
				form_type: form.form_type,
				company_id: form.company_id,
				created_by: form.created_by,
				created_at: form.created_at,
				updated_at: form.updated_at,
				is_active: form.is_active,
				settings: form.settings
			},
			steps: steps || [],
			fields: fields || [],
			formWithSteps: {
				...form,
				steps: steps || [],
				fields: fields || []
			}
		});
	} catch (error) {
		console.error('Error in form data debug:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
