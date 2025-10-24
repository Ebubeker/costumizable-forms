import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { whopSdk } from '@/lib/whop-sdk';
import { headers } from 'next/headers';
import { Database } from '@/types/database';

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const companyId = searchParams.get('company_id');

		if (!companyId) {
			return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
		}

		// Get forms first
		const { data: forms, error: formsError } = await supabaseAdmin
			.from('forms')
			.select('*')
			.eq('company_id', companyId)
			.eq('is_active', true)
			.order('order_index', { ascending: true });

		if (formsError) {
			console.error('Error fetching forms:', formsError);
			return NextResponse.json({ error: 'Failed to fetch forms' }, { status: 500 });
		}

		// For each form, get steps and fields
		const formsWithData = await Promise.all(
			(forms || []).map(async (form) => {
				// Get steps if form is multi-step
				let steps = [];
				if (form.form_type === 'multi-step') {
					const { data: stepsData, error: stepsError } = await supabaseAdmin
						.from('form_steps')
						.select('*')
						.eq('form_id', form.id)
						.order('order_index', { ascending: true });

					if (!stepsError) {
						steps = stepsData || [];
					}
				}

				// Get fields
				const { data: fields, error: fieldsError } = await supabaseAdmin
					.from('form_fields')
					.select('*')
					.eq('form_id', form.id)
					.order('order_index', { ascending: true });

				return {
					...form,
					form_fields: fields || [],
					form_steps: steps
				};
			})
		);

		// Transform the data to match the expected interface
		const transformedForms = formsWithData.map(form => ({
			...form,
			fields: form.form_fields || [],
			steps: form.form_steps || []
		}));

		return NextResponse.json({ forms: transformedForms });
	} catch (error) {
		console.error('Error in GET /api/forms:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const {
			title,
			description,
			company_id,
			form_type = 'single',
			steps = [],
			fields = [],
			settings = {},
			use_default_colors = true
		} = body;

		// Get the active Whop user from the request headers
		const headersList = await headers();
		const { userId } = await whopSdk.verifyUserToken(headersList);

		if (!title || !company_id) {
			return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
		}

		// Create the form
		const { data: form, error: formError } = await supabaseAdmin
			.from('forms')
			.insert({
				title,
				description,
				company_id,
				created_by: userId, // Use the active Whop user
				form_type,
				settings,
				use_default_colors
			})
			.select()
			.single();

		if (formError) {
			console.error('Error creating form:', formError);
			return NextResponse.json({ error: 'Failed to create form' }, { status: 500 });
		}

		// Create steps if provided (for multi-step forms)
		const stepIdMap: { [key: string]: string } = {};
		if (form_type === 'multi-step' && steps.length > 0) {
			for (let stepIndex = 0; stepIndex < steps.length; stepIndex++) {
				const step = steps[stepIndex];
				const { data: createdStep, error: stepError } = await supabaseAdmin
					.from('form_steps')
					.insert({
						form_id: form.id,
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

		// Create fields if provided
		if (fields && fields.length > 0) {
			for (let fieldIndex = 0; fieldIndex < fields.length; fieldIndex++) {
				const field = fields[fieldIndex];

				// Map step_id if it exists
				let mappedStepId = null;
				if (field.step_id && stepIdMap[field.step_id]) {
					mappedStepId = stepIdMap[field.step_id];
				}

				console.log('Creating field:', {
					fieldId: field.id || 'new',
					stepId: field.step_id,
					mappedStepId: mappedStepId,
					stepIdMap: stepIdMap
				});

				await supabaseAdmin
					.from('form_fields')
					.insert({
						form_id: form.id,
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

		// Fetch the complete form with fields and steps
		const { data: completeForm, error: fetchError } = await supabaseAdmin
			.from('forms')
			.select(`
        *,
        form_fields(*),
        form_steps(*)
      `)
			.eq('id', form.id)
			.single();

		if (fetchError) {
			console.error('Error fetching complete form:', fetchError);
			return NextResponse.json({ error: 'Failed to fetch complete form' }, { status: 500 });
		}

		// Transform the data to match the expected interface
		const transformedForm = {
			...completeForm,
			fields: completeForm.form_fields || [],
			steps: completeForm.form_steps || []
		};

		return NextResponse.json({ form: transformedForm });
	} catch (error) {
		console.error('Error in POST /api/forms:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
