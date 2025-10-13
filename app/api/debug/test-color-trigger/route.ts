import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
	try {
		const supabase = createClient();

		// Test creating a form with default colors enabled
		const { data: formWithDefaults, error: error1 } = await supabase
			.from('forms')
			.insert({
				title: 'Test Form with Default Colors',
				description: 'This form should have default color settings applied',
				company_id: 'test-company',
				created_by: 'test-user',
				use_default_colors: true
			})
			.select()
			.single();

		if (error1) {
			console.error('Error creating form with defaults:', error1);
			return NextResponse.json({ error: error1.message }, { status: 500 });
		}

		// Test creating a form with default colors disabled
		const { data: formWithoutDefaults, error: error2 } = await supabase
			.from('forms')
			.insert({
				title: 'Test Form without Default Colors',
				description: 'This form should have empty settings',
				company_id: 'test-company',
				created_by: 'test-user',
				use_default_colors: false
			})
			.select()
			.single();

		if (error2) {
			console.error('Error creating form without defaults:', error2);
			return NextResponse.json({ error: error2.message }, { status: 500 });
		}

		// Test the toggle function
		const { error: toggleError } = await supabase.rpc('toggle_form_default_colors', {
			form_id_param: formWithoutDefaults.id,
			enable_defaults: true
		});

		if (toggleError) {
			console.error('Error toggling default colors:', toggleError);
		}

		// Get the updated form
		const { data: updatedForm, error: fetchError } = await supabase
			.from('forms')
			.select('*')
			.eq('id', formWithoutDefaults.id)
			.single();

		return NextResponse.json({
			message: 'Color trigger test completed',
			results: {
				formWithDefaults: {
					id: formWithDefaults.id,
					title: formWithDefaults.title,
					use_default_colors: formWithDefaults.use_default_colors,
					settings: formWithDefaults.settings
				},
				formWithoutDefaults: {
					id: formWithoutDefaults.id,
					title: formWithoutDefaults.title,
					use_default_colors: formWithoutDefaults.use_default_colors,
					settings: formWithoutDefaults.settings
				},
				updatedForm: updatedForm ? {
					id: updatedForm.id,
					title: updatedForm.title,
					use_default_colors: updatedForm.use_default_colors,
					settings: updatedForm.settings
				} : null,
				toggleError: toggleError?.message
			}
		});

	} catch (error) {
		console.error('Unexpected error:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

export async function GET() {
	try {
		const supabase = createClient();

		// Get forms that need default settings
		const { data: formsNeedingDefaults, error } = await supabase
			.rpc('get_forms_needing_default_settings');

		if (error) {
			console.error('Error getting forms needing defaults:', error);
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		// Get default settings
		const { data: defaultSettings, error: defaultError } = await supabase
			.rpc('get_default_form_settings');

		if (defaultError) {
			console.error('Error getting default settings:', defaultError);
		}

		return NextResponse.json({
			formsNeedingDefaults,
			defaultSettings,
			count: formsNeedingDefaults?.length || 0
		});

	} catch (error) {
		console.error('Unexpected error:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}
