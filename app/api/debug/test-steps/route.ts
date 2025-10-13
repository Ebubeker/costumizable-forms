import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { formId, steps, fields } = body;

		console.log('Testing step creation:', { formId, steps, fields });

		// Create steps
		const stepIdMap: { [key: string]: string } = {};
		if (steps && steps.length > 0) {
			for (let stepIndex = 0; stepIndex < steps.length; stepIndex++) {
				const step = steps[stepIndex];
				const { data: createdStep, error: stepError } = await supabaseAdmin
					.from('form_steps')
					.insert({
						form_id: formId,
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
				const tempStepId = step.id || `step_${stepIndex}`;
				stepIdMap[tempStepId] = createdStep.id;
			}
		}

		console.log('Step ID mapping:', stepIdMap);

		// Create fields with step mapping
		const createdFields = [];
		if (fields && fields.length > 0) {
			for (let fieldIndex = 0; fieldIndex < fields.length; fieldIndex++) {
				const field = fields[fieldIndex];

				// Map step_id if it exists
				let mappedStepId = null;
				if (field.step_id && stepIdMap[field.step_id]) {
					mappedStepId = stepIdMap[field.step_id];
				}

				const { data: createdField, error: fieldError } = await supabaseAdmin
					.from('form_fields')
					.insert({
						form_id: formId,
						type: field.type,
						label: field.label,
						placeholder: field.placeholder,
						content: field.content,
						required: field.required || false,
						options: field.options || [],
						order_index: fieldIndex,
						step_id: mappedStepId
					})
					.select()
					.single();

				if (fieldError) {
					console.error('Error creating field:', fieldError);
					return NextResponse.json({ error: 'Failed to create field' }, { status: 500 });
				}

				createdFields.push({
					...createdField,
					originalStepId: field.step_id,
					mappedStepId: mappedStepId
				});
			}
		}

		return NextResponse.json({
			success: true,
			stepIdMap,
			createdFields,
			message: 'Steps and fields created successfully'
		});
	} catch (error) {
		console.error('Error in test steps:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
