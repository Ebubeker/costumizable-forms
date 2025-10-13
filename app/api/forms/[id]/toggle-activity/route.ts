import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		// First get the current form to check its current activity status
		const { data: currentForm, error: fetchError } = await supabaseAdmin
			.from('forms')
			.select('is_active')
			.eq('id', id)
			.single();

		if (fetchError) {
			console.error('Error fetching form:', fetchError);
			return NextResponse.json({ error: 'Form not found' }, { status: 404 });
		}

		// Toggle the activity status
		const newActivityStatus = !currentForm.is_active;

		// Update the form's activity status
		const { data: updatedForm, error: updateError } = await supabaseAdmin
			.from('forms')
			.update({
				is_active: newActivityStatus,
				updated_at: new Date().toISOString()
			})
			.eq('id', id)
			.select()
			.single();

		if (updateError) {
			console.error('Error updating form activity:', updateError);
			return NextResponse.json({ error: 'Failed to update form activity' }, { status: 500 });
		}

		// Get steps if form is multi-step
		let steps = [];
		if (updatedForm.form_type === 'multi-step') {
			const { data: stepsData, error: stepsError } = await supabaseAdmin
				.from('form_steps')
				.select('*')
				.eq('form_id', id)
				.order('order_index', { ascending: true });

			if (!stepsError) {
				steps = stepsData || [];
			}
		}

		// Get fields
		const { data: fields, error: fieldsError } = await supabaseAdmin
			.from('form_fields')
			.select('*')
			.eq('form_id', params.id)
			.order('order_index', { ascending: true });

		if (fieldsError) {
			console.error('Error fetching fields:', fieldsError);
			return NextResponse.json({ error: 'Failed to fetch fields' }, { status: 500 });
		}

		// Transform the data to match the expected interface
		const transformedForm = {
			...updatedForm,
			fields: fields || [],
			steps: steps
		};

		return NextResponse.json({
			form: transformedForm,
			message: `Form ${newActivityStatus ? 'activated' : 'deactivated'} successfully`
		});
	} catch (error) {
		console.error('Error in POST /api/forms/[id]/toggle-activity:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
