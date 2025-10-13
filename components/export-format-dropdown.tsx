"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, FileSpreadsheet, FileJson, ChevronDown } from "lucide-react";

interface ExportFormatDropdownProps {
	formId: string;
	formTitle: string;
	onExport: (formId: string, format: 'csv' | 'excel' | 'json') => void;
	isExporting?: boolean;
}

export default function ExportFormatDropdown({
	formId,
	formTitle,
	onExport,
	isExporting = false
}: ExportFormatDropdownProps) {
	const [selectedFormat, setSelectedFormat] = useState<'csv' | 'excel' | 'json'>('csv');

	const formatOptions = [
		{
			value: 'csv',
			label: 'CSV',
			icon: FileText,
			description: 'Comma-separated values'
		},
		{
			value: 'excel',
			label: 'Excel',
			icon: FileSpreadsheet,
			description: 'Microsoft Excel format'
		},
		{
			value: 'json',
			label: 'JSON',
			icon: FileJson,
			description: 'JavaScript Object Notation'
		}
	];

	const handleExport = () => {
		onExport(formId, selectedFormat);
	};

	const selectedOption = formatOptions.find(option => option.value === selectedFormat);

	return (
		<div className="flex items-center gap-2">
			{/* Format Selector */}
			<Select value={selectedFormat} onValueChange={(value: 'csv' | 'excel' | 'json') => setSelectedFormat(value)}>
				<SelectTrigger className="w-32 bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 rounded-xl shadow-sm focus:shadow-md transition-all duration-200">
					<SelectValue>
						<div className="flex items-center gap-2">
							{selectedOption && <selectedOption.icon className="h-4 w-4" />}
							<span>{selectedOption?.label}</span>
						</div>
					</SelectValue>
				</SelectTrigger>
				<SelectContent>
					{formatOptions.map((option) => {
						const Icon = option.icon;
						return (
							<SelectItem key={option.value} value={option.value}>
								<div className="flex items-center gap-2">
									<Icon className="h-4 w-4" />
									<div>
										<div className="font-medium">{option.label}</div>
										<div className="text-xs text-muted-foreground">{option.description}</div>
									</div>
								</div>
							</SelectItem>
						);
					})}
				</SelectContent>
			</Select>

			{/* Export Button */}
			<Button
				onClick={handleExport}
				disabled={isExporting}
				className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium text-white shadow-lg hover:shadow-xl bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 transition-all duration-200"
			>
				<Download className="h-5 w-5" />
				{isExporting ? 'Exporting...' : 'Export'}
			</Button>
		</div>
	);
}
