import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
	try {
		console.log('Checking if order_index column exists...');

		// Try to select order_index to see if it exists
		const { data, error } = await supabaseAdmin
			.from('forms')
			.select('id, title, order_index, created_at')
			.limit(5);

		if (error) {
			console.error('Database error:', error);
			return NextResponse.json({
				success: false,
				columnExists: false,
				error: error.message,
				needsMigration: true,
				sqlToRun: `
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
				`.trim()
			}, { status: 400 });
		}

		// Check if any forms have order_index set
		const formsWithOrder = data?.filter(form => form.order_index && form.order_index > 0) || [];
		const formsWithoutOrder = data?.filter(form => !form.order_index || form.order_index === 0) || [];

		return NextResponse.json({
			success: true,
			columnExists: true,
			totalForms: data?.length || 0,
			formsWithOrder: formsWithOrder.length,
			formsWithoutOrder: formsWithoutOrder.length,
			sampleData: data?.map(form => ({
				title: form.title,
				order_index: form.order_index,
				created_at: form.created_at
			})),
			message: formsWithoutOrder.length > 0
				? `Column exists but ${formsWithoutOrder.length} forms need order_index initialized`
				: 'Column exists and all forms have order_index set'
		});

	} catch (error) {
		console.error('Error checking column:', error);
		return NextResponse.json({
			success: false,
			error: 'Failed to check database status',
			details: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
}
