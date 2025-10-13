import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		const body = await request.json();
		const { responses, submitted_by } = body;

		if (!responses || !Array.isArray(responses)) {
			return NextResponse.json({ error: 'Invalid responses data' }, { status: 400 });
		}

		// Get client IP and user agent
		const forwarded = request.headers.get('x-forwarded-for');
		const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
		const userAgent = request.headers.get('user-agent') || 'unknown';

		// Create form response
		const { data: formResponse, error: responseError } = await supabaseAdmin
			.from('form_responses')
			.insert({
				form_id: id,
				submitted_by: submitted_by || null,
				ip_address: ip,
				user_agent: userAgent
			})
			.select()
			.single();

		if (responseError) {
			console.error('Error creating form response:', responseError);
			return NextResponse.json({ error: 'Failed to submit form' }, { status: 500 });
		}

		// Create response data entries
		const responseData = responses.map((response: any) => ({
			response_id: formResponse.id,
			field_id: response.field_id,
			value: response.value || null
		}));

		const { error: dataError } = await supabaseAdmin
			.from('form_response_data')
			.insert(responseData);

		if (dataError) {
			console.error('Error creating response data:', dataError);
			return NextResponse.json({ error: 'Failed to save response data' }, { status: 500 });
		}

		return NextResponse.json({
			success: true,
			response_id: formResponse.id
		});
	} catch (error) {
		console.error('Error in POST /api/forms/[id]/submit:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
