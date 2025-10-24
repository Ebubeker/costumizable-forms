import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
	try {
		const { formIds, companyId } = await request.json();

		if (!formIds || !Array.isArray(formIds) || !companyId) {
			return NextResponse.json(
				{ error: 'formIds array and companyId are required' },
				{ status: 400 }
			);
		}

		// Update order_index for each form
		const updates = formIds.map((formId: string, index: number) => ({
			id: formId,
			order_index: index + 1,
			updated_at: new Date().toISOString()
		}));

		// Perform batch update
		for (const update of updates) {
			const { error } = await supabaseAdmin
				.from('forms')
				.update({
					order_index: update.order_index,
					updated_at: update.updated_at
				})
				.eq('id', update.id)
				.eq('company_id', companyId); // Security: ensure only forms from the company can be updated

			if (error) {
				console.error('Error updating form order:', error);
				return NextResponse.json(
					{ error: 'Failed to update form order' },
					{ status: 500 }
				);
			}
		}

		return NextResponse.json({
			success: true,
			message: 'Forms reordered successfully'
		});
	} catch (error) {
		console.error('Error in reorder endpoint:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
