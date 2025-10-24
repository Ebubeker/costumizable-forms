import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
	try {
		const { formIds, companyId } = await request.json();

		console.log('Reorder request received:', { formIds, companyId });

		if (!formIds || !Array.isArray(formIds) || !companyId) {
			console.error('Invalid request data:', { formIds: !!formIds, isArray: Array.isArray(formIds), companyId: !!companyId });
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

		console.log('Performing updates:', updates);

		// Perform batch update
		let successCount = 0;
		for (const update of updates) {
			const { data, error } = await supabaseAdmin
				.from('forms')
				.update({
					order_index: update.order_index,
					updated_at: update.updated_at
				})
				.eq('id', update.id)
				.eq('company_id', companyId) // Security: ensure only forms from the company can be updated
				.select('id, title, order_index');

			if (error) {
				console.error('Error updating form order:', error);
				return NextResponse.json(
					{
						error: 'Failed to update form order',
						details: error.message,
						failedAt: update.id,
						successCount
					},
					{ status: 500 }
				);
			}

			console.log('Updated form:', data);
			successCount++;
		}

		// Verify the final order
		const { data: verificationData, error: verifyError } = await supabaseAdmin
			.from('forms')
			.select('id, title, order_index')
			.eq('company_id', companyId)
			.order('order_index', { ascending: true });

		if (verifyError) {
			console.error('Error verifying order:', verifyError);
		} else {
			console.log('Final order verification:', verificationData?.map(f => ({ title: f.title, order: f.order_index })));
		}

		return NextResponse.json({
			success: true,
			message: 'Forms reordered successfully',
			updatedCount: successCount,
			finalOrder: verificationData?.map(f => ({ id: f.id, order: f.order_index }))
		});
	} catch (error) {
		console.error('Error in reorder endpoint:', error);
		return NextResponse.json(
			{
				error: 'Internal server error',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
}
