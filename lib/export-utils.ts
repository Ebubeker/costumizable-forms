import * as XLSX from 'xlsx';

export interface ExportData {
	form: {
		id: string;
		title: string;
		description: string;
		created_at: string;
		fields: Array<{
			id: string;
			label: string;
			type: string;
			required: boolean;
			order_index: number;
		}>;
	};
	responses: Array<{
		id: string;
		submitted_by: string;
		submitted_at: string;
		ip_address: string;
		user_agent: string;
		raw_responses: Array<{
			field_id: string;
			field_label: string;
			field_type: string;
			value: string;
		}>;
		[key: string]: any; // For dynamic field values
	}>;
}

export function exportToCSV(data: ExportData): void {
	if (data.responses.length === 0) {
		alert('No data to export');
		return;
	}


	// Create headers from form fields
	const headers = [
		'Response ID',
		'Submitted By',
		'Submitted At',
		'IP Address',
		...data.form.fields.map(field => field.label)
	];

	// Create rows
	const rows = data.responses.map(response => {
		const row = [
			response.id,
			response.submitted_by,
			new Date(response.submitted_at).toLocaleString(),
			response.ip_address
		];

		// Add field values in the same order as headers
		data.form.fields.forEach(field => {
			const value = response[field.label] || '';
			// Escape CSV values that contain commas, quotes, or newlines
			const escapedValue = typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))
				? `"${value.replace(/"/g, '""')}"`
				: value;
			row.push(escapedValue);
		});

		return row;
	});

	// Create CSV content
	const csvContent = [
		headers.join(','),
		...rows.map(row => row.join(','))
	].join('\n');

	// Download file
	const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
	const url = window.URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `${data.form.title.replace(/[^a-zA-Z0-9]/g, '_')}_export.csv`;
	a.click();
	window.URL.revokeObjectURL(url);
}

export function exportToExcel(data: ExportData): void {
	if (data.responses.length === 0) {
		alert('No data to export');
		return;
	}


	// Create headers
	const headers = [
		'Response ID',
		'Submitted By',
		'Submitted At',
		'IP Address',
		...data.form.fields.map(field => field.label)
	];

	// Create data rows
	const rows = data.responses.map(response => {
		const row = [
			response.id,
			response.submitted_by,
			new Date(response.submitted_at).toLocaleString(),
			response.ip_address
		];

		// Add field values - ensure proper alignment
		data.form.fields.forEach(field => {
			const value = response[field.label] || '';
			row.push(value);
		});

		return row;
	});

	// Create workbook and worksheet
	const wb = XLSX.utils.book_new();
	const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

	// Set column widths
	const colWidths = headers.map((header, index) => {
		if (index === 0) return { wch: 15 }; // Response ID
		if (index === 1) return { wch: 20 }; // Submitted By
		if (index === 2) return { wch: 20 }; // Submitted At
		if (index === 3) return { wch: 15 }; // IP Address
		return { wch: Math.max(header.length, 15) }; // Field columns
	});
	ws['!cols'] = colWidths;

	// Add worksheet to workbook
	XLSX.utils.book_append_sheet(wb, ws, 'Form Responses');

	// Create metadata sheet
	const metadataWs = XLSX.utils.aoa_to_sheet([
		['Form Information'],
		['Form ID', data.form.id],
		['Form Title', data.form.title],
		['Description', data.form.description || 'No description'],
		['Created At', new Date(data.form.created_at).toLocaleString()],
		['Total Responses', data.responses.length.toString()],
		[''],
		['Form Fields'],
		['Field Label', 'Field Type', 'Required', 'Order'],
		...data.form.fields.map(field => [
			field.label,
			field.type,
			field.required ? 'Yes' : 'No',
			field.order_index
		])
	]);
	XLSX.utils.book_append_sheet(wb, metadataWs, 'Form Info');

	// Download file
	XLSX.writeFile(wb, `${data.form.title.replace(/[^a-zA-Z0-9]/g, '_')}_export.xlsx`);
}

export function exportToJSON(data: ExportData): void {
	const jsonContent = JSON.stringify(data, null, 2);
	const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
	const url = window.URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `${data.form.title.replace(/[^a-zA-Z0-9]/g, '_')}_export.json`;
	a.click();
	window.URL.revokeObjectURL(url);
}

export async function fetchFormExportData(formId: string): Promise<ExportData> {
	const response = await fetch(`/api/forms/${formId}/export`);
	if (!response.ok) {
		throw new Error('Failed to fetch form data');
	}
	return response.json();
}
