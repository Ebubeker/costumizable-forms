import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { formId, responses, submittedBy } = body;

		if (!formId || !responses || !submittedBy) {
			return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
		}

		// Get client IP and user agent
		const ipAddress = request.headers.get('x-forwarded-for') ||
			request.headers.get('x-real-ip') ||
			'127.0.0.1';
		const userAgent = request.headers.get('user-agent') || '';

		// Create the form response record
		const { data: formResponse, error: responseError } = await supabaseAdmin
			.from('form_responses')
			.insert({
				form_id: formId,
				submitted_by: submittedBy,
				ip_address: ipAddress,
				user_agent: userAgent
			})
			.select()
			.single();

		if (responseError) {
			console.error('Error creating form response:', responseError);
			return NextResponse.json({ error: 'Failed to create form response' }, { status: 500 });
		}

		// Create form response data records for each field
		const responseDataEntries = Object.entries(responses).map(([fieldId, value]) => ({
			response_id: formResponse.id,
			field_id: fieldId,
			value: String(value)
		}));

		if (responseDataEntries.length > 0) {
			const { data: insertedData, error: dataError } = await supabaseAdmin
				.from('form_response_data')
				.insert(responseDataEntries)
				.select();

			if (dataError) {
				console.error('Error creating form response data:', dataError);
				return NextResponse.json({ error: 'Failed to save form responses' }, { status: 500 });
			}
		}

		return NextResponse.json({
			success: true,
			responseId: formResponse.id,
			message: 'Form submitted successfully'
		});

	} catch (error) {
		console.error('Error in POST /api/forms/submit:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
