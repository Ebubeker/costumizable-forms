export interface Database {
	public: {
		Tables: {
			forms: {
				Row: {
					id: string;
					title: string;
					description: string | null;
					company_id: string;
					created_by: string;
					created_at: string;
					updated_at: string;
					is_active: boolean;
					settings: Record<string, any>;
					form_type: 'single' | 'multi-step';
					use_default_colors: boolean | null;
				};
				Insert: {
					id?: string;
					title: string;
					description?: string | null;
					company_id: string;
					created_by: string;
					created_at?: string;
					updated_at?: string;
					is_active?: boolean;
					settings?: Record<string, any>;
					form_type?: 'single' | 'multi-step';
					use_default_colors?: boolean | null;
				};
				Update: {
					id?: string;
					title?: string;
					description?: string | null;
					company_id?: string;
					created_by?: string;
					created_at?: string;
					updated_at?: string;
					is_active?: boolean;
					settings?: Record<string, any>;
					form_type?: 'single' | 'multi-step';
					use_default_colors?: boolean | null;
				};
			};
			form_fields: {
				Row: {
					id: string;
					form_id: string;
					type: 'text' | 'email' | 'phone' | 'select' | 'checkbox' | 'textarea' | 'heading' | 'paragraph';
					label: string | null;
					placeholder: string | null;
					content: string | null;
					required: boolean;
					options: string[];
					order_index: number;
					step_id: string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					form_id: string;
					type: 'text' | 'email' | 'phone' | 'select' | 'checkbox' | 'textarea' | 'heading' | 'paragraph';
					label?: string | null;
					placeholder?: string | null;
					content?: string | null;
					required?: boolean;
					options?: string[];
					order_index: number;
					step_id?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					form_id?: string;
					type?: 'text' | 'email' | 'phone' | 'select' | 'checkbox' | 'textarea' | 'heading' | 'paragraph';
					label?: string | null;
					placeholder?: string | null;
					content?: string | null;
					required?: boolean;
					options?: string[];
					order_index?: number;
					step_id?: string | null;
					created_at?: string;
					updated_at?: string;
				};
			};
			form_steps: {
				Row: {
					id: string;
					form_id: string;
					title: string;
					description: string | null;
					order_index: number;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					form_id: string;
					title: string;
					description?: string | null;
					order_index: number;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					form_id?: string;
					title?: string;
					description?: string | null;
					order_index?: number;
					created_at?: string;
					updated_at?: string;
				};
			};
			form_responses: {
				Row: {
					id: string;
					form_id: string;
					submitted_by: string | null;
					submitted_at: string;
					ip_address: string | null;
					user_agent: string | null;
				};
				Insert: {
					id?: string;
					form_id: string;
					submitted_by?: string | null;
					submitted_at?: string;
					ip_address?: string | null;
					user_agent?: string | null;
				};
				Update: {
					id?: string;
					form_id?: string;
					submitted_by?: string | null;
					submitted_at?: string;
					ip_address?: string | null;
					user_agent?: string | null;
				};
			};
			form_response_data: {
				Row: {
					id: string;
					response_id: string;
					field_id: string;
					value: string | null;
					created_at: string;
				};
				Insert: {
					id?: string;
					response_id: string;
					field_id: string;
					value?: string | null;
					created_at?: string;
				};
				Update: {
					id?: string;
					response_id?: string;
					field_id?: string;
					value?: string | null;
					created_at?: string;
				};
			};
		};
	};
}

// Extended types for form builder
export interface FormWithFields {
	id: string;
	title: string;
	description: string | null;
	company_id: string;
	created_by: string;
	created_at: string;
	updated_at: string;
	is_active: boolean;
	settings: Record<string, any>;
	form_type: 'single' | 'multi-step';
	use_default_colors: boolean | null;
	fields: Database['public']['Tables']['form_fields']['Row'][];
	steps?: Database['public']['Tables']['form_steps']['Row'][];
}

// Keep the old interface for backward compatibility during migration
export interface FormWithBlocks extends FormWithFields {
	blocks: FormBlockWithFields[];
}

export interface FormBlockWithFields {
	id: string;
	form_id: string;
	type: 'input' | 'text' | 'text-and-input';
	title: string | null;
	text: string | null;
	order_index: number;
	created_at: string;
	updated_at: string;
	fields: Database['public']['Tables']['form_fields']['Row'][];
}

export interface FormResponseWithData {
	id: string;
	form_id: string;
	submitted_by: string | null;
	submitted_at: string;
	ip_address: string | null;
	user_agent: string | null;
	data: {
		field_id: string;
		field_label: string;
		value: string | null;
	}[];
}
