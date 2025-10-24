import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
	try {
		console.log('Checking if order_index field exists...');

		// First, let's check if the column already exists by trying to query it
		const { data: testData, error: testError } = await supabaseAdmin
			.from('forms')
			.select('id, order_index')
			.limit(1);

		if (!testError) {
			// Column exists, let's initialize order_index for forms that don't have it set
			console.log('order_index column already exists, initializing values...');

			// Get all forms that need order_index initialized (where it's null or 0)
			const { data: formsToUpdate, error: fetchError } = await supabaseAdmin
				.from('forms')
				.select('id, company_id, created_at')
				.or('order_index.is.null,order_index.eq.0')
				.order('created_at', { ascending: false });

			if (fetchError) {
				console.error('Error fetching forms:', fetchError);
				return NextResponse.json({
					error: 'Failed to fetch forms for initialization',
					details: fetchError.message
				}, { status: 500 });
			}

			// Group forms by company and assign order_index
			const companiesForms = formsToUpdate?.reduce((acc: any, form) => {
				if (!acc[form.company_id]) acc[form.company_id] = [];
				acc[form.company_id].push(form);
				return acc;
			}, {}) || {};

			let updateCount = 0;
			for (const [companyId, forms] of Object.entries(companiesForms)) {
				const sortedForms = (forms as any[]).sort((a, b) =>
					new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
				);

				for (let i = 0; i < sortedForms.length; i++) {
					const { error: updateError } = await supabaseAdmin
						.from('forms')
						.update({ order_index: i + 1 })
						.eq('id', sortedForms[i].id);

					if (!updateError) {
						updateCount++;
					}
				}
			}

			return NextResponse.json({
				success: true,
				message: `order_index column already exists. Initialized ${updateCount} forms.`,
				columnExists: true
			});
		}

		// Column doesn't exist, provide manual instructions
		const sqlInstructions = `
-- Run this SQL in your Supabase SQL Editor:

-- 1. Add the order_index column
ALTER TABLE forms ADD COLUMN order_index INTEGER DEFAULT 0;

-- 2. Initialize order_index for existing forms (newest first within each company)
WITH ordered_forms AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY company_id ORDER BY created_at DESC) as row_number
  FROM forms
)
UPDATE forms 
SET order_index = ordered_forms.row_number
FROM ordered_forms
WHERE forms.id = ordered_forms.id;

-- 3. Create index for better performance
CREATE INDEX idx_forms_order ON forms(company_id, order_index);

-- 4. Verify the migration
SELECT company_id, title, order_index, created_at 
FROM forms 
ORDER BY company_id, order_index;
		`.trim();

		return NextResponse.json({
			success: false,
			message: 'order_index column does not exist. Please run the SQL manually.',
			columnExists: false,
			sqlInstructions,
			error: 'Column migration required'
		}, { status: 400 });

	} catch (error) {
		console.error('Error in migration:', error);
		return NextResponse.json({
			error: 'Migration check failed',
			details: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
}
