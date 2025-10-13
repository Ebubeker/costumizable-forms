import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		// First get the form
		const { data: form, error: formError } = await supabaseAdmin
			.from('forms')
			.select('*')
			.eq('id', id)
			.single();

		if (formError) {
			console.error('Error fetching form:', formError);
			return NextResponse.json({ error: 'Form not found' }, { status: 404 });
		}

		// Get steps for all forms (for debugging)
		let steps = [];
		const { data: stepsData, error: stepsError } = await supabaseAdmin
			.from('form_steps')
			.select('*')
			.eq('form_id', id)
			.order('order_index', { ascending: true });

		if (stepsError) {
			console.error('Error fetching steps:', stepsError);
		} else {
			steps = stepsData || [];
		}

		// Get fields
		const { data: fields, error: fieldsError } = await supabaseAdmin
			.from('form_fields')
			.select('*')
			.eq('form_id', id)
			.order('order_index', { ascending: true });

		if (fieldsError) {
			console.error('Error fetching fields:', fieldsError);
			return NextResponse.json({ error: 'Failed to fetch fields' }, { status: 500 });
		}

		// Combine the data
		const formWithData = {
			...form,
			form_fields: fields || [],
			form_steps: steps
		};

		// Transform the data to match the expected interface
		const transformedForm = {
			...formWithData,
			fields: formWithData.form_fields || [],
			steps: formWithData.form_steps || []
		};

		console.log('Form data fetched:', {
			formId: id,
			formType: form.form_type,
			stepsCount: steps.length,
			fieldsCount: fields?.length || 0,
			steps: steps.map(s => ({ id: s.id, title: s.title, order: s.order_index })),
			fieldsWithSteps: fields?.filter(f => f.step_id)?.length || 0,
			rawSteps: steps,
			rawFields: fields
		});

		return NextResponse.json({ form: transformedForm });
	} catch (error) {
		console.error('Error in GET /api/forms/[id]:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

export async function PUT(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		const body = await request.json();
		const {
			title,
			description,
			form_type = 'single',
			steps = [],
			fields = [],
			settings = {},
			use_default_colors = true
		} = body;

		// Update the form
		const { data: form, error: formError } = await supabaseAdmin
			.from('forms')
			.update({
				title,
				description,
				form_type,
				settings,
				use_default_colors,
				updated_at: new Date().toISOString()
			})
			.eq('id', id)
			.select()
			.single();

		if (formError) {
			console.error('Error updating form:', formError);
			return NextResponse.json({ error: 'Failed to update form' }, { status: 500 });
		}

		// Delete existing steps and fields
		await supabaseAdmin
			.from('form_steps')
			.delete()
			.eq('form_id', id);

		await supabaseAdmin
			.from('form_fields')
			.delete()
			.eq('form_id', id);

		// Create new steps if provided (for multi-step forms)
		const stepIdMap: { [key: string]: string } = {};
		if (form_type === 'multi-step' && steps.length > 0) {
			for (let stepIndex = 0; stepIndex < steps.length; stepIndex++) {
				const step = steps[stepIndex];
				const { data: createdStep, error: stepError } = await supabaseAdmin
					.from('form_steps')
					.insert({
						form_id: id,
						title: step.title,
						description: step.description,
						order_index: stepIndex
					})
					.select()
					.single();

				if (stepError) {
					console.error('Error creating step:', stepError);
					return NextResponse.json({ error: 'Failed to create step' }, { status: 500 });
				}

				// Map the temporary step ID to the real database ID
				// Use the step.id if it exists (from form builder), otherwise use the step index
				const tempStepId = step.id || `step_${stepIndex}`;
				stepIdMap[tempStepId] = createdStep.id;
			}
		}

		// Create new fields
		if (fields && fields.length > 0) {
			for (let fieldIndex = 0; fieldIndex < fields.length; fieldIndex++) {
				const field = fields[fieldIndex];

				// Map step_id if it exists
				let mappedStepId = null;
				if (field.step_id && stepIdMap[field.step_id]) {
					mappedStepId = stepIdMap[field.step_id];
				}

				console.log('Updating field:', {
					fieldId: field.id || 'new',
					stepId: field.step_id,
					mappedStepId: mappedStepId,
					stepIdMap: stepIdMap
				});

				await supabaseAdmin
					.from('form_fields')
					.insert({
						form_id: id,
						type: field.type,
						label: field.label,
						placeholder: field.placeholder,
						content: field.content,
						required: field.required || false,
						options: field.options || [],
						order_index: fieldIndex,
						step_id: mappedStepId
					});
			}
		}

		// Fetch the complete updated form
		const { data: completeForm, error: fetchError } = await supabaseAdmin
			.from('forms')
			.select(`
        *,
        form_fields(*),
        form_steps(*)
      `)
			.eq('id', id)
			.single();

		if (fetchError) {
			console.error('Error fetching updated form:', fetchError);
			return NextResponse.json({ error: 'Failed to fetch updated form' }, { status: 500 });
		}

		// Transform the data to match the expected interface
		const transformedForm = {
			...completeForm,
			fields: completeForm.form_fields || [],
			steps: completeForm.form_steps || []
		};

		return NextResponse.json({ form: transformedForm });
	} catch (error) {
		console.error('Error in PUT /api/forms/[id]:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;

		// Delete form responses first (if any)
		await supabaseAdmin
			.from('form_responses')
			.delete()
			.eq('form_id', id);

		// Delete form fields
		await supabaseAdmin
			.from('form_fields')
			.delete()
			.eq('form_id', id);

		// Delete form steps
		await supabaseAdmin
			.from('form_steps')
			.delete()
			.eq('form_id', id);

		// Finally delete the form itself
		const { error } = await supabaseAdmin
			.from('forms')
			.delete()
			.eq('id', id);

		if (error) {
			console.error('Error deleting form:', error);
			return NextResponse.json({ error: 'Failed to delete form' }, { status: 500 });
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error('Error in DELETE /api/forms/[id]:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
