import { supabase, isSupabaseConfigured } from './supabase';
import { FormWithFields, FormResponseWithData } from '@/types/database';

export class FormsService {
	static async getForms(companyId: string): Promise<FormWithFields[]> {
		if (!isSupabaseConfigured) {
			console.warn('Supabase is not configured. Returning empty array.');
			return [];
		}

		// Get forms first
		const { data: forms, error: formsError } = await supabase
			.from('forms')
			.select('*')
			.eq('company_id', companyId)
			.eq('is_active', true)
			.order('order_index', { ascending: true });

		if (formsError) {
			console.error('Error fetching forms:', formsError);
			throw new Error('Failed to fetch forms');
		}

		// For each form, get steps and fields
		const formsWithData = await Promise.all(
			(forms || []).map(async (form) => {
				// Get steps if form is multi-step
				let steps = [];
				if (form.form_type === 'multi-step') {
					const { data: stepsData, error: stepsError } = await supabase
						.from('form_steps')
						.select('*')
						.eq('form_id', form.id)
						.order('order_index', { ascending: true });

					if (!stepsError) {
						steps = stepsData || [];
					}
				}

				// Get fields
				const { data: fields, error: fieldsError } = await supabase
					.from('form_fields')
					.select('*')
					.eq('form_id', form.id)
					.order('order_index', { ascending: true });

				return {
					...form,
					fields: fields || [],
					steps: steps
				};
			})
		);

		return formsWithData;
	}

	static async getForm(formId: string): Promise<FormWithFields | null> {
		if (!isSupabaseConfigured) {
			console.warn('Supabase is not configured. Returning null.');
			return null;
		}

		// First get the form
		const { data: form, error: formError } = await supabase
			.from('forms')
			.select('*')
			.eq('id', formId)
			.single();

		if (formError) {
			console.error('Error fetching form:', formError);
			return null;
		}

		// Get steps if form is multi-step
		let steps = [];
		if (form.form_type === 'multi-step') {
			const { data: stepsData, error: stepsError } = await supabase
				.from('form_steps')
				.select('*')
				.eq('form_id', formId)
				.order('order_index', { ascending: true });

			if (!stepsError) {
				steps = stepsData || [];
			}
		}

		// Get fields
		const { data: fields, error: fieldsError } = await supabase
			.from('form_fields')
			.select('*')
			.eq('form_id', formId)
			.order('order_index', { ascending: true });

		if (fieldsError) {
			console.error('Error fetching fields:', fieldsError);
			return null;
		}

		// Transform the data to match the expected interface
		const transformedData = {
			...form,
			fields: fields || [],
			steps: steps
		};

		return transformedData;
	}

	static async createForm(formData: {
		title: string;
		description?: string;
		company_id: string;
		fields?: any[];
	}): Promise<FormWithFields> {
		const response = await fetch('/api/forms', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(formData),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Failed to create form');
		}

		const result = await response.json();
		return result.form;
	}

	static async updateForm(formId: string, formData: {
		title: string;
		description?: string;
		fields?: any[];
	}): Promise<FormWithFields> {
		const response = await fetch(`/api/forms/${formId}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(formData),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Failed to update form');
		}

		const result = await response.json();
		return result.form;
	}

	static async deleteForm(formId: string): Promise<void> {
		const response = await fetch(`/api/forms/${formId}`, {
			method: 'DELETE',
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Failed to delete form');
		}
	}

	static async submitForm(formId: string, responses: any[], submittedBy?: string): Promise<string> {
		const response = await fetch(`/api/forms/${formId}/submit`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				responses,
				submitted_by: submittedBy,
			}),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Failed to submit form');
		}

		const result = await response.json();
		return result.response_id;
	}

	static async getFormResponses(formId: string): Promise<FormResponseWithData[]> {
		const response = await fetch(`/api/forms/${formId}/responses`);

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Failed to fetch responses');
		}

		const result = await response.json();
		return result.responses;
	}

	static async toggleFormActivity(formId: string): Promise<FormWithFields> {
		const response = await fetch(`/api/forms/${formId}/toggle-activity`, {
			method: 'POST',
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || 'Failed to toggle form activity');
		}

		const result = await response.json();
		return result.form;
	}

	static async getFormsForAdmin(companyId: string): Promise<FormWithFields[]> {
		if (!isSupabaseConfigured) {
			console.warn('Supabase is not configured. Returning empty array.');
			return [];
		}

		// Get all forms (including inactive ones) for admin view
		const { data: forms, error: formsError } = await supabase
			.from('forms')
			.select('*')
			.eq('company_id', companyId)
			.order('order_index', { ascending: true });

		if (formsError) {
			console.error('Error fetching forms:', formsError);
			throw new Error('Failed to fetch forms');
		}

		// For each form, get steps and fields
		const formsWithData = await Promise.all(
			(forms || []).map(async (form) => {
				// Get steps if form is multi-step
				let steps = [];
				if (form.form_type === 'multi-step') {
					const { data: stepsData, error: stepsError } = await supabase
						.from('form_steps')
						.select('*')
						.eq('form_id', form.id)
						.order('order_index', { ascending: true });

					if (!stepsError) {
						steps = stepsData || [];
					}
				}

				// Get fields
				const { data: fields, error: fieldsError } = await supabase
					.from('form_fields')
					.select('*')
					.eq('form_id', form.id)
					.order('order_index', { ascending: true });

				return {
					...form,
					fields: fields || [],
					steps: steps
				};
			})
		);

		return formsWithData;
	}

	static async reorderForms(formIds: string[], companyId: string): Promise<void> {
		const response = await fetch('/api/forms/reorder', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ formIds, companyId }),
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(error || 'Failed to reorder forms');
		}
	}
}
