import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
	try {
		console.log('Running migration...');

		// Add form_type column to forms table
		const { error: formTypeError } = await supabaseAdmin.rpc('exec_sql', {
			sql: `
				ALTER TABLE forms ADD COLUMN IF NOT EXISTS form_type VARCHAR(20) DEFAULT 'single' CHECK (form_type IN ('single', 'multi-step'));
			`
		});

		if (formTypeError) {
			console.error('Error adding form_type column:', formTypeError);
			// Try alternative approach
			const { error: altError } = await supabaseAdmin
				.from('forms')
				.select('id')
				.limit(1);

			if (altError && altError.message.includes('column "form_type" does not exist')) {
				// Column doesn't exist, we need to add it
				return NextResponse.json({
					error: 'Migration needed - form_type column does not exist',
					details: 'Please run the migration manually in your Supabase dashboard'
				}, { status: 400 });
			}
		}

		// Create form_steps table
		const { error: stepsTableError } = await supabaseAdmin.rpc('exec_sql', {
			sql: `
				CREATE TABLE IF NOT EXISTS form_steps (
					id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
					form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
					title VARCHAR(255) NOT NULL,
					description TEXT,
					order_index INTEGER NOT NULL,
					created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
					updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
				);
			`
		});

		if (stepsTableError) {
			console.error('Error creating form_steps table:', stepsTableError);
		}

		// Add step_id column to form_fields table
		const { error: stepIdError } = await supabaseAdmin.rpc('exec_sql', {
			sql: `
				ALTER TABLE form_fields ADD COLUMN IF NOT EXISTS step_id UUID REFERENCES form_steps(id) ON DELETE CASCADE;
			`
		});

		if (stepIdError) {
			console.error('Error adding step_id column:', stepIdError);
		}

		// Create indexes
		const { error: indexError } = await supabaseAdmin.rpc('exec_sql', {
			sql: `
				CREATE INDEX IF NOT EXISTS idx_form_steps_form_id ON form_steps(form_id);
				CREATE INDEX IF NOT EXISTS idx_form_steps_order ON form_steps(form_id, order_index);
				CREATE INDEX IF NOT EXISTS idx_form_fields_step_id ON form_fields(step_id);
			`
		});

		if (indexError) {
			console.error('Error creating indexes:', indexError);
		}

		return NextResponse.json({
			success: true,
			message: 'Migration completed (some steps may have failed - check logs)'
		});
	} catch (error) {
		console.error('Error in migration:', error);
		return NextResponse.json({
			error: 'Migration failed',
			details: error instanceof Error ? error.message : 'Unknown error'
		}, { status: 500 });
	}
}
