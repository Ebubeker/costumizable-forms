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
			.order('submitted_at', { ascending: false });

		if (error) {
			console.error('Error fetching form responses:', error);
			return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 });
		}

		// Transform the data to a more usable format
		const transformedResponses = responses.map(response => ({
			id: response.id,
			form_id: response.form_id,
			submitted_by: response.submitted_by,
			submitted_at: response.submitted_at,
			ip_address: response.ip_address,
			user_agent: response.user_agent,
			responses: response.form_response_data.map((item: any) => ({
				field_id: item.field_id,
				field_label: item.form_fields?.label || 'Unlabeled Field',
				field_type: item.form_fields?.type || 'unknown',
				value: item.value
			}))
		}));

		return NextResponse.json({ responses: transformedResponses });
	} catch (error) {
		console.error('Error in GET /api/forms/[id]/responses:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
