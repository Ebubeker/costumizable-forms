"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Eye, Download, BarChart3 } from "lucide-react";
import { useTheme } from 'next-themes';

interface FormPreviewModalProps {
	isOpen: boolean;
	onClose: () => void;
	formData: {
		title: string;
		description: string;
		formType?: 'single' | 'multi-step';
		fields: Array<{
			id: string;
			type: string;
			label: string;
			placeholder?: string;
			content?: string;
			required: boolean;
			options?: string[];
			step_id?: string;
			order_index?: number;
		}>;
		steps?: Array<{
			id: string;
			title: string;
			description?: string;
			order_index: number;
		}>;
		primaryColor: string;
		backgroundColor: string;
		fontFamily: string;
		logoUrl: string;
		useDefaultColors: boolean;
	};
}

export default function FormPreviewModal({ isOpen, onClose, formData }: FormPreviewModalProps) {
	if (!isOpen) return null;

	const { theme, resolvedTheme } = useTheme();

	// Helper function to get CSS class for font
	const getFontClass = (fontName: string) => {
		const fontMap: Record<string, string> = {
			'Inter': 'font-inter',
			'Roboto': 'font-roboto',
			'Open Sans': 'font-open-sans',
			'Lato': 'font-lato',
			'Montserrat': 'font-montserrat',
			'Poppins': 'font-poppins',
			'Source Sans Pro': 'font-source-sans',
			'Nunito': 'font-nunito',
			'Raleway': 'font-raleway',
			'Ubuntu': 'font-ubuntu',
			'Playfair Display': 'font-playfair-display',
			'Merriweather': 'font-merriweather'
		};
		return fontMap[fontName] || '';
	};

	// Use colors based on the useDefaultColors setting
	const useDefaultColors = formData.useDefaultColors;
	const primaryColor = useDefaultColors ? '#645EFF' : (formData.primaryColor || '#645EFF');
	const backgroundColor = useDefaultColors ? 'transparent' : (formData.backgroundColor || 'transparent');

	// Handle transparent background - use theme-based background
	const actualBackgroundColor = backgroundColor === 'transparent'
		? (resolvedTheme === 'dark' ? '#0a0a0a' : '#ffffff')
		: backgroundColor;

	// Determine if we're in dark mode for theme-aware styling
	const isDarkMode = actualBackgroundColor === '#0A0A0A' || actualBackgroundColor === '#0a0a0a';

	// Enhanced colors for both light and dark modes
	const getThemeColors = () => {
		const themeCardBgColor = isDarkMode ? '#1a1a1a' : '#ffffff';

		return {
			textColor: isDarkMode ? '#f8fafc' : '#1a1a1a',
			mutedTextColor: isDarkMode ? '#cbd5e1' : '#6b7280',
			borderColor: isDarkMode ? '#475569' : '#d1d5db',
			inputBgColor: 'transparent',
			cardBgColor: themeCardBgColor,
			hoverBgColor: isDarkMode ? '#1e293b' : '#f8fafc'
		};
	};

	const colors = getThemeColors();

	const renderField = (field: any) => {
		const { textColor, mutedTextColor, borderColor, inputBgColor } = colors;

		switch (field.type) {
			case 'heading':
				return (
					<h3
						key={field.id}
						className="text-lg font-semibold mt-6 mb-2"
						style={{ color: textColor }}
					>
						{field.content || 'Heading'}
					</h3>
				);

			case 'paragraph':
				return (
					<p
						key={field.id}
						className="mb-4"
						style={{ color: mutedTextColor }}
					>
						{field.content || 'Paragraph text goes here...'}
					</p>
				);

			case 'text':
				return (
					<div key={field.id} className="space-y-2">
						<Label
							htmlFor={field.id}
							style={{ color: textColor }}
						>
							{field.label}
							{field.required && <span style={{ color: '#ef4444' }}> *</span>}
						</Label>
						<Input
							id={field.id}
							placeholder={field.placeholder || ''}
							disabled
							className="border-2 focus:border-opacity-100 transition-all duration-200 hover:border-opacity-80"
							style={{
								backgroundColor: inputBgColor,
								borderColor: borderColor,
								color: textColor,
								'--tw-ring-color': primaryColor,
								boxShadow: isDarkMode
									? '0 1px 3px 0 rgba(0, 0, 0, 0.3)'
									: '0 1px 2px 0 rgba(0, 0, 0, 0.1), inset 0 1px 2px 0 rgba(0, 0, 0, 0.05)'
							} as React.CSSProperties}
						/>
					</div>
				);

			case 'email':
				return (
					<div key={field.id} className="space-y-2">
						<Label
							htmlFor={field.id}
							style={{ color: textColor }}
						>
							{field.label}
							{field.required && <span style={{ color: '#ef4444' }}> *</span>}
						</Label>
						<Input
							id={field.id}
							type="email"
							placeholder={field.placeholder || ''}
							disabled
							className="border-2 focus:border-opacity-100 transition-all duration-200 hover:border-opacity-80"
							style={{
								backgroundColor: inputBgColor,
								borderColor: borderColor,
								color: textColor,
								'--tw-ring-color': primaryColor,
								boxShadow: isDarkMode
									? '0 1px 3px 0 rgba(0, 0, 0, 0.3)'
									: '0 1px 2px 0 rgba(0, 0, 0, 0.1), inset 0 1px 2px 0 rgba(0, 0, 0, 0.05)'
							} as React.CSSProperties}
						/>
					</div>
				);

			case 'phone':
				return (
					<div key={field.id} className="space-y-2">
						<Label
							htmlFor={field.id}
							style={{ color: textColor }}
						>
							{field.label}
							{field.required && <span style={{ color: '#ef4444' }}> *</span>}
						</Label>
						<Input
							id={field.id}
							type="tel"
							placeholder={field.placeholder || ''}
							disabled
							className="border-2 focus:border-opacity-100 transition-all duration-200 hover:border-opacity-80"
							style={{
								backgroundColor: inputBgColor,
								borderColor: borderColor,
								color: textColor,
								'--tw-ring-color': primaryColor,
								boxShadow: isDarkMode
									? '0 1px 3px 0 rgba(0, 0, 0, 0.3)'
									: '0 1px 2px 0 rgba(0, 0, 0, 0.1), inset 0 1px 2px 0 rgba(0, 0, 0, 0.05)'
							} as React.CSSProperties}
						/>
					</div>
				);

			case 'textarea':
				return (
					<div key={field.id} className="space-y-2">
						<Label
							htmlFor={field.id}
							style={{ color: textColor }}
						>
							{field.label}
							{field.required && <span style={{ color: '#ef4444' }}> *</span>}
						</Label>
						<Textarea
							id={field.id}
							placeholder={field.placeholder || ''}
							disabled
							className="border-2 focus:border-opacity-100 transition-all duration-200 hover:border-opacity-80"
							style={{
								backgroundColor: inputBgColor,
								borderColor: borderColor,
								color: textColor,
								'--tw-ring-color': primaryColor,
								boxShadow: isDarkMode
									? '0 1px 3px 0 rgba(0, 0, 0, 0.3)'
									: '0 1px 2px 0 rgba(0, 0, 0, 0.1), inset 0 1px 2px 0 rgba(0, 0, 0, 0.05)'
							} as React.CSSProperties}
						/>
					</div>
				);

			case 'select':
				return (
					<div key={field.id} className="space-y-2">
						<Label
							htmlFor={field.id}
							style={{ color: textColor }}
						>
							{field.label}
							{field.required && <span style={{ color: '#ef4444' }}> *</span>}
						</Label>
						<Select disabled>
							<SelectTrigger
								className="border-2 focus:border-opacity-100 transition-all duration-200 hover:border-opacity-80"
								style={{
									backgroundColor: inputBgColor,
									borderColor: borderColor,
									color: textColor,
									'--tw-ring-color': primaryColor,
									boxShadow: isDarkMode
										? '0 1px 3px 0 rgba(0, 0, 0, 0.3)'
										: '0 1px 2px 0 rgba(0, 0, 0, 0.1), inset 0 1px 2px 0 rgba(0, 0, 0, 0.05)'
								} as React.CSSProperties}
							>
								<SelectValue placeholder={field.placeholder || 'Select an option'} />
							</SelectTrigger>
							<SelectContent
								style={{
									backgroundColor: inputBgColor,
									borderColor: borderColor,
									boxShadow: isDarkMode ? '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.2)' : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
								}}
							>
								{field.options?.map((option, index) => (
									<SelectItem
										key={index}
										value={option}
										className="hover:bg-opacity-10 transition-colors"
										style={{
											color: textColor,
											'--tw-ring-color': primaryColor
										} as React.CSSProperties}
									>
										{option}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				);

			case 'checkbox':
				return (
					<div key={field.id} className="space-y-2">
						<div className="flex items-center space-x-2">
							<Checkbox
								id={field.id}
								disabled
								style={{
									'--tw-ring-color': primaryColor
								} as React.CSSProperties}
							/>
							<Label
								htmlFor={field.id}
								style={{ color: textColor }}
							>
								{field.label}
								{field.required && <span style={{ color: '#ef4444' }}> *</span>}
							</Label>
						</div>
					</div>
				);

			default:
				return null;
		}
	};

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<div className="w-full max-w-6xl max-h-[95vh] overflow-y-auto">
				{/* Modal Header */}
				<div className="bg-white dark:bg-gray-800 rounded-t-lg p-4 border-b">
					<div className="flex items-center justify-between">
						<div>
							<h2 className="text-2xl font-bold flex items-center gap-2">
								<Eye className="h-6 w-6" />
								Form Preview
							</h2>
							<p className="text-muted-foreground mt-1">
								Preview how your form will look to users
							</p>
						</div>
						<Button
							variant="ghost"
							size="sm"
							onClick={onClose}
							className="h-8 w-8 p-0"
						>
							<X className="h-4 w-4" />
						</Button>
					</div>
				</div>

				{/* Form Preview - Matching SimplifiedFormViewer */}
				<div
					className={`p-6 min-h-screen ${getFontClass(formData.fontFamily)}`}
					style={{ backgroundColor: actualBackgroundColor }}
				>
					{/* Header Card with Logo */}
					<Card
						className="max-w-2xl mx-auto mb-6 p-4 shadow-lg border-0"
						style={{
							backgroundColor: colors.cardBgColor,
							borderColor: primaryColor + '20',
							boxShadow: isDarkMode ? '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)' : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
						}}
					>
						<div className="flex items-center justify-between">
							<div className="flex-1">
								<h1
									className="text-xl font-semibold"
									style={{ color: colors.textColor }}
								>
									{formData.title || 'Untitled Form'}
								</h1>
								{formData.description && (
									<p
										className="text-sm mt-1"
										style={{ color: colors.mutedTextColor }}
									>
										{formData.description}
									</p>
								)}
							</div>
							{formData.logoUrl && (
								<div className="ml-4">
									<div
										className="h-16 w-16 rounded-lg overflow-hidden"
										style={{
											backgroundColor: '#d1d5db'
										}}
									>
										<img
											src={formData.logoUrl}
											alt="Organization Logo"
											className="h-full w-full object-cover rounded-lg"
											onError={(e) => {
												e.currentTarget.style.display = 'none';
											}}
										/>
									</div>
								</div>
							)}
						</div>
					</Card>

					{/* Multi-step Form Preview */}
					{formData.formType === 'multi-step' && formData.steps && formData.steps.length > 0 ? (
						<div className="space-y-6">
							{formData.steps
								.sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
								.map((step, stepIndex) => {
									const stepFields = formData.fields
										.filter(field => field.step_id === step.id)
										.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

									return (
										<Card
											key={step.id}
											className="max-w-2xl mx-auto p-6 shadow-xl border-0"
											style={{
												backgroundColor: colors.cardBgColor,
												borderColor: primaryColor + '20',
												boxShadow: isDarkMode ? '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)' : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
											}}
										>
											<div className="space-y-6">
												{/* Step Header */}
												<div className="text-center pb-4 border-b" style={{ borderColor: primaryColor + '20' }}>
													<h2 className="text-lg font-semibold" style={{ color: colors.textColor }}>
														Step {stepIndex + 1}: {step.title}
													</h2>
													{step.description && (
														<p className="text-sm mt-1" style={{ color: colors.mutedTextColor }}>
															{step.description}
														</p>
													)}
												</div>

												{/* Step Fields */}
												<div className="space-y-4">
													{stepFields.length === 0 ? (
														<div className="text-center py-8" style={{ color: colors.mutedTextColor }}>
															<BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
															<p className="text-sm">No fields in this step yet.</p>
														</div>
													) : (
														stepFields.map(field => renderField(field))
													)}
												</div>

												{/* Step Navigation (Preview Only) */}
												<div className="flex justify-between items-center pt-4 border-t" style={{ borderColor: primaryColor + '20' }}>
													<Button
														variant="outline"
														disabled
														className="px-4 py-2"
														style={{
															borderColor: primaryColor + '40',
															color: colors.mutedTextColor
														}}
													>
														{stepIndex === 0 ? '← Previous' : '← Previous'}
													</Button>
													<span className="text-sm" style={{ color: colors.mutedTextColor }}>
														{stepIndex + 1} of {formData.steps.length}
													</span>
													<Button
														disabled
														className="px-4 py-2"
														style={{
															background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
															borderColor: primaryColor
														}}
													>
														{stepIndex === formData.steps.length - 1 ? 'Submit →' : 'Next →'}
													</Button>
												</div>
											</div>
										</Card>
									);
								})}
						</div>
					) : (
						/* Single Form Preview */
						<Card
							className="max-w-2xl mx-auto p-6 shadow-xl border-0"
							style={{
								backgroundColor: colors.cardBgColor,
								borderColor: primaryColor + '20',
								boxShadow: isDarkMode ? '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)' : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
							}}
						>
							<div className="space-y-6">
								{/* Form Fields */}
								<div className="space-y-4">
									{formData.fields.length === 0 ? (
										<div className="text-center py-8" style={{ color: colors.mutedTextColor }}>
											<BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
											<p>No fields added yet. Add some fields to see the preview.</p>
										</div>
									) : (
										formData.fields
											.filter(field => !field.step_id) // Only show fields not assigned to steps
											.sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
											.map(field => renderField(field))
									)}
								</div>

								{/* Submit Button */}
								{formData.fields.length > 0 && (
									<div className="pt-6">
										<Button
											className="w-full inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium shadow hover:shadow-lg transition-all duration-200 text-white"
											style={{
												background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
												borderColor: primaryColor,
												boxShadow: `0 4px 14px 0 ${primaryColor}40`
											}}
											disabled
										>
											✓ Submit Form
										</Button>
									</div>
								)}
							</div>
						</Card>
					)}
				</div>

				{/* Form Info Footer */}
				<div className="bg-white dark:bg-gray-800 rounded-b-lg p-4 border-t">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="space-y-2">
							<h4 className="font-semibold">Form Details</h4>
							<div className="space-y-1 text-sm text-muted-foreground">
								<p><strong>Title:</strong> {formData.title || 'Untitled Form'}</p>
								<p><strong>Type:</strong> {formData.formType === 'multi-step' ? 'Multi-step' : 'Single'}</p>
								<p><strong>Fields:</strong> {formData.fields.length}</p>
								{formData.formType === 'multi-step' && formData.steps && (
									<p><strong>Steps:</strong> {formData.steps.length}</p>
								)}
								<p><strong>Font:</strong> {formData.fontFamily}</p>
							</div>
						</div>

						<div className="space-y-2">
							<h4 className="font-semibold">Colors</h4>
							<div className="space-y-1 text-sm text-muted-foreground">
								<div className="flex items-center gap-2">
									<span>Primary:</span>
									<div
										className="w-4 h-4 rounded border"
										style={{ backgroundColor: formData.primaryColor }}
									/>
									<span>{formData.primaryColor}</span>
								</div>
								<div className="flex items-center gap-2">
									<span>Background:</span>
									<div
										className="w-4 h-4 rounded border"
										style={{ backgroundColor: actualBackgroundColor }}
									/>
									<span>{formData.backgroundColor === 'transparent' ? `transparent (${resolvedTheme})` : formData.backgroundColor}</span>
								</div>
							</div>
						</div>

						<div className="space-y-2">
							<h4 className="font-semibold">Field Types</h4>
							<div className="flex flex-wrap gap-1">
								{Array.from(new Set(formData.fields.map(f => f.type))).map(type => (
									<Badge key={type} variant="secondary" className="text-xs">
										{type}
									</Badge>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
