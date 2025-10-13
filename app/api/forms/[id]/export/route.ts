import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		const { searchParams } = new URL(request.url);
		const format = searchParams.get('format') || 'json';

		// Get form details
		const { data: form, error: formError } = await supabaseAdmin
			.from('forms')
			.select('*')
			.eq('id', id)
			.single();

		if (formError || !form) {
			return NextResponse.json({ error: 'Form not found' }, { status: 404 });
		}

		// Get form fields
		const { data: fields, error: fieldsError } = await supabaseAdmin
			.from('form_fields')
			.select('*')
			.eq('form_id', id)
			.order('order_index', { ascending: true });

		if (fieldsError) {
			console.error('Error fetching form fields:', fieldsError);
			return NextResponse.json({ error: 'Failed to fetch form fields' }, { status: 500 });
		}

		// Get form responses with response data
		const { data: responses, error: responsesError } = await supabaseAdmin
			.from('form_responses')
			.select(`
				*,
				form_response_data(
					*,
					form_fields(
						label,
						type,
						order_index
					)
				)
			`)
			.eq('form_id', id)
			.order('submitted_at', { ascending: false });

		if (responsesError) {
			console.error('Error fetching form responses:', responsesError);
			return NextResponse.json({ error: 'Failed to fetch form responses' }, { status: 500 });
		}

		// Transform data for export
		const exportData = {
			form: {
				id: form.id,
				title: form.title,
				description: form.description,
				created_at: form.created_at,
				fields: fields?.map(field => ({
					id: field.id,
					label: field.label,
					type: field.type,
					required: field.required,
					order_index: field.order_index
				})) || []
			},
			responses: responses?.map(response => {
				// Create a map of field values for easy access
				const fieldValues: Record<string, string> = {};
				response.form_response_data?.forEach((data: any) => {
					if (data.form_fields) {
						fieldValues[data.form_fields.label] = data.value || '';
					}
				});

				// Create the response object with field values as direct properties
				const responseObj = {
					id: response.id,
					submitted_by: response.submitted_by,
					submitted_at: response.submitted_at,
					user_agent: response.user_agent,
					// Include all field values as direct properties
					...fieldValues,
					// Also include the raw response data
					raw_responses: response.form_response_data?.map((data: any) => ({
						field_id: data.field_id,
						field_label: data.form_fields?.label || 'Unknown Field',
						field_type: data.form_fields?.type || 'unknown',
						value: data.value
					})) || []
				};

				return responseObj;
			}) || []
		};

		// Return data in requested format
		if (format === 'json') {
			return NextResponse.json(exportData, {
				headers: {
					'Content-Type': 'application/json',
					'Content-Disposition': `attachment; filename="${form.title.replace(/[^a-zA-Z0-9]/g, '_')}_export.json"`
				}
			});
		}

		// For CSV and Excel, we'll return the data and let the client handle the formatting
		return NextResponse.json(exportData);

	} catch (error) {
		console.error('Error in GET /api/forms/[id]/export:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
