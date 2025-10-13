import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// @ts-ignore - Next.js 15 params type issue
export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		// Get the form to check its current state
		const { data: form, error: formError } = await supabaseAdmin
			.from('forms')
			.select(`
				*,
				form_steps(*)
			`)
			.eq('id', id)
			.single();

		if (formError) {
			console.error('Error fetching form:', formError);
			return NextResponse.json({ error: 'Form not found' }, { status: 404 });
		}

		// If form is marked as multi-step but has no steps, fix it
		if (form.form_type === 'multi-step' && (!form.form_steps || form.form_steps.length === 0)) {
			const { error: updateError } = await supabaseAdmin
				.from('forms')
				.update({ form_type: 'single' })
				.eq('id', id);

			if (updateError) {
				console.error('Error updating form type:', updateError);
				return NextResponse.json({ error: 'Failed to update form type' }, { status: 500 });
			}

			return NextResponse.json({
				success: true,
				message: 'Form type updated from multi-step to single (no steps found)',
				form: {
					id: form.id,
					title: form.title,
					old_type: 'multi-step',
					new_type: 'single'
				}
			});
		}

		return NextResponse.json({
			success: true,
			message: 'Form type is correct',
			form: {
				id: form.id,
				title: form.title,
				form_type: form.form_type,
				steps_count: form.form_steps?.length || 0
			}
		});
	} catch (error) {
		console.error('Error in form fix:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
