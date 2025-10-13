import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
	try {
		const supabase = createClient();

		// Test data with color settings
		const testFormData = {
			title: 'Test Form with Color Settings',
			description: 'Testing if color settings are saved properly',
			company_id: 'test-company',
			created_by: 'test-user',
			form_type: 'single',
			use_default_colors: false,
			settings: {
				logoUrl: 'https://example.com/logo.png',
				primaryColor: '#FF6B6B',
				backgroundColor: '#2C3E50'
			},
			fields: [
				{
					type: 'text',
					label: 'Test Field',
					placeholder: 'Enter something',
					required: true
				}
			]
		};

		// Create the form
		const { data: form, error } = await supabase
			.from('forms')
			.insert(testFormData)
			.select()
			.single();

		if (error) {
			console.error('Error creating test form:', error);
			return NextResponse.json({
				error: error.message,
				details: error
			}, { status: 500 });
		}

		// Fetch the form back to verify settings were saved
		const { data: fetchedForm, error: fetchError } = await supabase
			.from('forms')
			.select('*')
			.eq('id', form.id)
			.single();

		if (fetchError) {
			console.error('Error fetching test form:', fetchError);
			return NextResponse.json({
				error: fetchError.message,
				details: fetchError
			}, { status: 500 });
		}

		return NextResponse.json({
			message: 'Test form created successfully',
			originalData: testFormData,
			savedForm: {
				id: fetchedForm.id,
				title: fetchedForm.title,
				use_default_colors: fetchedForm.use_default_colors,
				settings: fetchedForm.settings
			},
			success: JSON.stringify(fetchedForm.settings) === JSON.stringify(testFormData.settings)
		});

	} catch (error) {
		console.error('Unexpected error:', error);
		return NextResponse.json(
			{ error: 'Internal server error', details: error },
			{ status: 500 }
		);
	}
}

export async function GET() {
	try {
		const supabase = createClient();

		// Get all forms to check their settings
		const { data: forms, error } = await supabase
			.from('forms')
			.select('id, title, settings, use_default_colors')
			.order('created_at', { ascending: false })
			.limit(10);

		if (error) {
			console.error('Error fetching forms:', error);
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		return NextResponse.json({
			forms: forms || [],
			count: forms?.length || 0,
			formsWithSettings: forms?.filter(f => f.settings && Object.keys(f.settings).length > 0).length || 0
		});

	} catch (error) {
		console.error('Unexpected error:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
