import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
	try {
		// Get all forms without filtering by company_id
		const { data: allForms, error: allFormsError } = await supabaseAdmin
			.from('forms')
			.select('*')
			.order('created_at', { ascending: false });

		if (allFormsError) {
			console.error('Error fetching all forms:', allFormsError);
			return NextResponse.json({ error: 'Failed to fetch forms' }, { status: 500 });
		}

		// Get forms with fields
		const { data: formsWithFields, error: formsWithFieldsError } = await supabaseAdmin
			.from('forms')
			.select(`
        *,
        form_fields(*)
      `)
			.order('created_at', { ascending: false });

		if (formsWithFieldsError) {
			console.error('Error fetching forms with fields:', formsWithFieldsError);
			return NextResponse.json({ error: 'Failed to fetch forms with fields' }, { status: 500 });
		}

		return NextResponse.json({
			allForms,
			formsWithFields,
			totalForms: allForms?.length || 0
		});
	} catch (error) {
		console.error('Error in debug forms API:', error);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
