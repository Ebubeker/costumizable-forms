import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params;
		const { data: responses, error } = await supabaseAdmin
			.from('form_responses')
			.select(`
        *,
        form_response_data(
          *,
          form_fields(
            label,
            type
          )
        )
      `)
			.eq('form_id', id)
			.order('submitted_at', { ascending: false })
			.limit(10000); // Explicitly set a high limit to ensure all responses are fetched

		if (error) {
			console.error('Error fetching form responses:', error);
			return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 });
		}

		// Log the number of responses fetched for debugging
		console.log(`Fetched ${responses?.length || 0} responses for form ${id}`);

		// Transform the data to a more usable format
		const transformedResponses = responses.map(response => ({
			id: response.id,
			form_id: response.form_id,
			submitted_by: response.submitted_by,
			submitted_at: response.submitted_at,
			ip_address: response.ip_address,
			user_agent: response.user_agent,
			username: response.username || null,
			data: response.form_response_data.map((item: any) => ({
				field_id: item.field_id,
				field_label: item.form_fields?.label || 'Unlabeled Field',
				value: item.value
			}))
		}));

		return NextResponse.json({ responses: transformedResponses });
	} catch (error) {
		console.error('Error in GET /api/forms/[id]/responses:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
