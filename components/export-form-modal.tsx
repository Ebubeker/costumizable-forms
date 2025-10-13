"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FormWithFields } from "@/types/database";
import { Download, FileText, FileSpreadsheet, FileJson, X } from "lucide-react";

interface ExportFormModalProps {
	forms: FormWithFields[];
	isOpen: boolean;
	onClose: () => void;
	onExport: (formId: string, format: 'csv' | 'excel' | 'json') => void;
}

export default function ExportFormModal({ forms, isOpen, onClose, onExport }: ExportFormModalProps) {
	const [selectedForm, setSelectedForm] = useState<string>("");
	const [selectedFormat, setSelectedFormat] = useState<'csv' | 'excel' | 'json'>('csv');

	if (!isOpen) return null;

	const handleExport = () => {
		if (selectedForm) {
			onExport(selectedForm, selectedFormat);
			onClose();
		}
	};

	const formatOptions = [
		{ value: 'csv', label: 'CSV', icon: FileText, description: 'Comma-separated values' },
		{ value: 'excel', label: 'Excel', icon: FileSpreadsheet, description: 'Microsoft Excel format' },
		{ value: 'json', label: 'JSON', icon: FileJson, description: 'JavaScript Object Notation' }
	];

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
					<div>
						<CardTitle className="text-2xl font-bold">Export Form Data</CardTitle>
						<CardDescription>
							Select a form and export format to download the form responses
						</CardDescription>
					</div>
					<Button
						variant="ghost"
						size="sm"
						onClick={onClose}
						className="h-8 w-8 p-0"
					>
						<X className="h-4 w-4" />
					</Button>
				</CardHeader>

				<CardContent className="space-y-6">
					{/* Form Selection */}
					<div className="space-y-3">
						<label className="text-sm font-medium text-foreground">
							Select Form
						</label>
						<Select value={selectedForm} onValueChange={setSelectedForm}>
							<SelectTrigger className="w-full">
								<SelectValue placeholder="Choose a form to export..." />
							</SelectTrigger>
							<SelectContent>
								{forms.map((form) => (
									<SelectItem key={form.id} value={form.id}>
										<div className="flex items-center justify-between w-full">
											<span>{form.title}</span>
											<Badge variant="secondary" className="ml-2">
												{form.fields.length} fields
											</Badge>
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Format Selection */}
					<div className="space-y-3">
						<label className="text-sm font-medium text-foreground">
							Export Format
						</label>
						<div className="grid grid-cols-1 gap-3">
							{formatOptions.map((option) => {
								const Icon = option.icon;
								return (
									<div
										key={option.value}
										className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${selectedFormat === option.value
												? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
												: 'border-border hover:border-indigo-300 hover:bg-muted/50'
											}`}
										onClick={() => setSelectedFormat(option.value as 'csv' | 'excel' | 'json')}
									>
										<div className="flex items-center space-x-3">
											<div className={`p-2 rounded-lg ${selectedFormat === option.value
													? 'bg-indigo-500 text-white'
													: 'bg-muted text-muted-foreground'
												}`}>
												<Icon className="h-4 w-4" />
											</div>
											<div className="flex-1">
												<div className="flex items-center space-x-2">
													<span className="font-medium">{option.label}</span>
													{selectedFormat === option.value && (
														<Badge variant="default" className="text-xs">
															Selected
														</Badge>
													)}
												</div>
												<p className="text-sm text-muted-foreground">
													{option.description}
												</p>
											</div>
										</div>
									</div>
								);
							})}
						</div>
					</div>

					{/* Selected Form Preview */}
					{selectedForm && (
						<div className="space-y-3">
							<label className="text-sm font-medium text-foreground">
								Form Preview
							</label>
							<div className="p-4 bg-muted/50 rounded-lg">
								{(() => {
									const form = forms.find(f => f.id === selectedForm);
									if (!form) return null;

									return (
										<div className="space-y-2">
											<h4 className="font-medium">{form.title}</h4>
											<p className="text-sm text-muted-foreground">
												{form.description || 'No description available'}
											</p>
											<div className="flex flex-wrap gap-2 mt-3">
												{form.fields.slice(0, 5).map((field) => (
													<Badge key={field.id} variant="outline" className="text-xs">
														{field.label}
													</Badge>
												))}
												{form.fields.length > 5 && (
													<Badge variant="outline" className="text-xs">
														+{form.fields.length - 5} more
													</Badge>
												)}
											</div>
										</div>
									);
								})()}
							</div>
						</div>
					)}

					{/* Action Buttons */}
					<div className="flex justify-end space-x-3 pt-4 border-t">
						<Button variant="outline" onClick={onClose}>
							Cancel
						</Button>
						<Button
							onClick={handleExport}
							disabled={!selectedForm}
							className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600"
						>
							<Download className="h-4 w-4" />
							Export Data
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
