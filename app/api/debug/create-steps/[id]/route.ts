import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// @ts-ignore - Next.js 15 params type issue
export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		const body = await request.json();
		const { steps } = body;

		console.log('Creating steps for form:', id, steps);

		// First, check if steps already exist
		const { data: existingSteps, error: checkError } = await supabaseAdmin
			.from('form_steps')
			.select('*')
			.eq('form_id', id);

		if (checkError) {
			console.error('Error checking existing steps:', checkError);
			return NextResponse.json({ error: 'Failed to check existing steps' }, { status: 500 });
		}

		if (existingSteps && existingSteps.length > 0) {
			return NextResponse.json({
				message: 'Steps already exist',
				existingSteps: existingSteps.length
			});
		}

		// Create steps
		const createdSteps = [];
		for (let i = 0; i < steps.length; i++) {
			const step = steps[i];
			const { data: createdStep, error: stepError } = await supabaseAdmin
				.from('form_steps')
				.insert({
					form_id: id,
					title: step.title,
					description: step.description,
					order_index: i
				})
				.select()
				.single();

			if (stepError) {
				console.error('Error creating step:', stepError);
				return NextResponse.json({ error: 'Failed to create step' }, { status: 500 });
			}

			createdSteps.push(createdStep);
		}

		// Now update fields to assign them to steps
		const { data: fields, error: fieldsError } = await supabaseAdmin
			.from('form_fields')
			.select('*')
			.eq('form_id', id)
			.order('order_index', { ascending: true });

		if (fieldsError) {
			console.error('Error fetching fields:', fieldsError);
			return NextResponse.json({ error: 'Failed to fetch fields' }, { status: 500 });
		}

		// Assign fields to steps
		const updatedFields = [];
		for (let i = 0; i < fields.length; i++) {
			const field = fields[i];
			const stepIndex = Math.floor(i / 2); // 2 fields per step
			const stepId = createdSteps[stepIndex]?.id;

			if (stepId) {
				const { data: updatedField, error: updateError } = await supabaseAdmin
					.from('form_fields')
					.update({ step_id: stepId })
					.eq('id', field.id)
					.select()
					.single();

				if (updateError) {
					console.error('Error updating field:', updateError);
				} else {
					updatedFields.push(updatedField);
				}
			}
		}

		return NextResponse.json({
			success: true,
			createdSteps: createdSteps.length,
			updatedFields: updatedFields.length,
			steps: createdSteps,
			fields: updatedFields
		});
	} catch (error) {
		console.error('Error in create steps:', error);
		return NextResponse.json({
			error: 'Internal server error',
			details: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
}
