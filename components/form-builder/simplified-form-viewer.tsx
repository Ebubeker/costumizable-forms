'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { FormWithFields } from '@/types/database';

interface SimplifiedFormViewerProps {
	form: FormWithFields;
	onSubmit?: (responses: any[]) => void;
}

export function SimplifiedFormViewer({ form, onSubmit }: SimplifiedFormViewerProps) {
	const [responses, setResponses] = useState<Record<string, any>>({});
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [currentStep, setCurrentStep] = useState(0);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [touched, setTouched] = useState<Record<string, boolean>>({});
	const { theme, resolvedTheme } = useTheme();

	// Get branding settings from form
	const settings = form.settings || {};
	const logoUrl = settings.logoUrl || '';
	const fontFamily = settings.fontFamily || 'Arial';
	const useDefaultColors = form.use_default_colors !== false; // Default to true if not specified

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

	// Use theme colors if use_default_colors is true, otherwise use custom colors
	const primaryColor = useDefaultColors ? 'hsl(var(--primary))' : (settings.primaryColor || '#645EFF');
	const backgroundColor = useDefaultColors ? 'hsl(var(--background))' : (settings.backgroundColor || 'transparent');

	// Determine if we're in dark mode for theme-aware styling
	const isDarkMode = useDefaultColors ? (resolvedTheme === 'dark') : (backgroundColor === '#0A0A0A' || backgroundColor === 'transparent');

	// Always use the actual theme for form cards, regardless of custom colors
	const actualThemeIsDark = resolvedTheme === 'dark';

	// Enhanced colors for both light and dark modes
	const getThemeColors = () => {
		// Always use theme colors for form cards regardless of custom colors
		const themeCardBgColor = actualThemeIsDark ? '#1a1a1a' : '#ffffff';

		if (useDefaultColors) {
			return {
				textColor: 'hsl(var(--foreground))',
				mutedTextColor: 'hsl(var(--muted-foreground))',
				borderColor: 'hsl(var(--border))',
				inputBgColor: 'transparent', // Make inputs transparent
				cardBgColor: themeCardBgColor, // Always use theme colors for cards
				hoverBgColor: 'hsl(var(--muted))'
			};
		} else {
			return {
				textColor: actualThemeIsDark ? '#f8fafc' : '#1a1a1a',
				mutedTextColor: actualThemeIsDark ? '#cbd5e1' : '#6b7280',
				borderColor: actualThemeIsDark ? '#475569' : '#d1d5db',
				inputBgColor: 'transparent', // Make inputs transparent
				cardBgColor: themeCardBgColor, // Always use theme colors for cards
				hoverBgColor: actualThemeIsDark ? '#1e293b' : '#f8fafc'
			};
		}
	};

	const colors = getThemeColors();

	// Validation functions
	const validateField = (fieldId: string, value: any, field: any) => {
		if (field.required) {
			if (field.type === 'checkbox') {
				if (!value) {
					return 'This field is required';
				}
			} else if (field.type === 'select') {
				if (!value || value === '') {
					return 'Please select an option';
				}
			} else {
				if (!value || value.toString().trim() === '') {
					return 'This field is required';
				}
			}
		}

		// Email validation
		if (field.type === 'email' && value) {
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(value)) {
				return 'Please enter a valid email address';
			}
		}

		// Phone validation (basic)
		if (field.type === 'phone' && value) {
			const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
			if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
				return 'Please enter a valid phone number';
			}
		}

		return '';
	};

	const validateForm = () => {
		const newErrors: Record<string, string> = {};
		let isValid = true;

		// Get current step fields or all fields for single-step forms
		const fieldsToValidate = form.form_type === 'multi-step'
			? form.fields.filter(field => field.step_id === form.steps?.[currentStep]?.id)
			: form.fields.filter(field => !field.step_id);

		fieldsToValidate.forEach(field => {
			const error = validateField(field.id, responses[field.id], field);
			if (error) {
				newErrors[field.id] = error;
				isValid = false;
			}
		});

		setErrors(newErrors);
		return isValid;
	};

	const handleFieldChange = (fieldId: string, value: any) => {
		setResponses(prev => ({ ...prev, [fieldId]: value }));

		// Mark field as touched
		setTouched(prev => ({ ...prev, [fieldId]: true }));

		// Clear error when user starts typing
		if (errors[fieldId]) {
			setErrors(prev => ({ ...prev, [fieldId]: '' }));
		}
	};

	const handleFieldBlur = (fieldId: string, field: any) => {
		setTouched(prev => ({ ...prev, [fieldId]: true }));

		// Validate field on blur
		const error = validateField(fieldId, responses[fieldId], field);
		if (error) {
			setErrors(prev => ({ ...prev, [fieldId]: error }));
		}
	};

	// Logo contrast detection
	const [logoNeedsBackground, setLogoNeedsBackground] = useState(false);

	const detectLogoContrast = (imageUrl: string) => {
		if (!imageUrl) return;

		const img = new Image();
		img.crossOrigin = 'anonymous';

		img.onload = () => {
			try {
				const canvas = document.createElement('canvas');
				const ctx = canvas.getContext('2d');
				if (!ctx) return;

				canvas.width = img.width;
				canvas.height = img.height;
				ctx.drawImage(img, 0, 0);

				// Sample pixels from the image to determine if it's mostly light
				const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
				const data = imageData.data;

				let lightPixels = 0;
				let totalPixels = 0;

				// Sample every 10th pixel for performance
				for (let i = 0; i < data.length; i += 40) {
					const r = data[i];
					const g = data[i + 1];
					const b = data[i + 2];
					const a = data[i + 3];

					// Skip transparent pixels
					if (a < 128) continue;

					// Calculate brightness (0-255)
					const brightness = (r * 299 + g * 587 + b * 114) / 1000;

					// Consider pixels with brightness > 200 as "light"
					if (brightness > 200) {
						lightPixels++;
					}
					totalPixels++;
				}

				// If more than 60% of pixels are light, add background
				const lightRatio = totalPixels > 0 ? lightPixels / totalPixels : 0;
				setLogoNeedsBackground(lightRatio > 0.6);
			} catch (error) {
				// If analysis fails, assume it needs background for safety
				setLogoNeedsBackground(true);
			}
		};

		img.onerror = () => {
			// If image fails to load, assume it needs background
			setLogoNeedsBackground(true);
		};

		img.src = imageUrl;
	};

	// Detect logo contrast when logoUrl changes
	useEffect(() => {
		if (logoUrl) {
			detectLogoContrast(logoUrl);
		} else {
			setLogoNeedsBackground(false);
		}
	}, [logoUrl]);


	const nextStep = (e?: React.MouseEvent) => {
		if (e) {
			e.preventDefault();
			e.stopPropagation();
		}

		// Validate current step before proceeding
		if (!validateForm()) {
			return;
		}

		if (form.form_type === 'multi-step' && form.steps && currentStep < form.steps.length - 1) {
			setCurrentStep(currentStep + 1);
		}
	};

	const prevStep = (e?: React.MouseEvent) => {
		if (e) {
			e.preventDefault();
			e.stopPropagation();
		}
		if (currentStep > 0) {
			setCurrentStep(currentStep - 1);
		}
	};

	const isLastStep = () => {
		// If form_type is not set or is 'single', treat as single form
		if (!form.form_type || form.form_type === 'single') {
			return true;
		}
		// If no steps or empty steps array, treat as single form
		if (!form.steps || form.steps.length === 0) {
			return true;
		}
		// For multi-step forms, check if we're on the last step
		const isLast = currentStep === form.steps.length - 1;
		console.log('isLastStep check:', {
			formType: form.form_type,
			stepsLength: form.steps?.length,
			currentStep: currentStep,
			isLast: isLast
		});
		return isLast;
	};

	const getCurrentStepFields = () => {
		// If form_type is not set or is 'single', show all fields without step_id
		if (!form.form_type || form.form_type === 'single') {
			return (form.fields || []).filter(field => !field.step_id);
		}

		// If no steps or empty steps array, show all fields
		if (!form.steps || form.steps.length === 0) {
			return (form.fields || []);
		}

		// For multi-step forms with steps, show fields for current step
		if (form.steps[currentStep]) {
			const currentStepId = form.steps[currentStep].id;
			const stepFields = (form.fields || []).filter(field => field.step_id === currentStepId);
			return stepFields;
		}

		return [];
	};


	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		// Validate form before submitting
		if (!validateForm()) {
			// Mark all fields as touched to show errors
			const allFields = form.fields.filter(field => !field.step_id);
			const touchedFields: Record<string, boolean> = {};
			allFields.forEach(field => {
				touchedFields[field.id] = true;
			});
			setTouched(touchedFields);
			return;
		}

		if (onSubmit) {
			setIsSubmitting(true);
			try {
				const responseData = Object.entries(responses).map(([fieldId, value]) => ({
					field_id: fieldId,
					value: value
				}));
				await onSubmit(responseData);
			} catch (error) {
				console.error('Error submitting form:', error);
			} finally {
				setIsSubmitting(false);
			}
		}
	};

	const renderField = (field: FormWithFields['fields'][0]) => {
		// Use enhanced colors for better dark mode support
		const { textColor, mutedTextColor, borderColor, inputBgColor } = colors;

		switch (field.type) {
			case 'heading':
				return (
					<h3
						key={field.id}
						className="text-lg font-semibold mt-6 mb-2"
						style={{ color: textColor }}
					>
						{field.content}
					</h3>
				);

			case 'paragraph':
				return (
					<p
						key={field.id}
						className="mb-4"
						style={{ color: mutedTextColor }}
					>
						{field.content}
					</p>
				);

			case 'text':
				const hasError = touched[field.id] && errors[field.id];
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
							value={responses[field.id] || ''}
							onChange={(e) => handleFieldChange(field.id, e.target.value)}
							onBlur={() => handleFieldBlur(field.id, field)}
							required={field.required}
							className={`border-2 focus:border-opacity-100 transition-all duration-200 hover:border-opacity-80 ${hasError ? 'border-red-500 focus:border-red-500' : ''}`}
							style={{
								backgroundColor: inputBgColor,
								borderColor: hasError ? '#ef4444' : borderColor,
								color: textColor,
								'--tw-ring-color': hasError ? '#ef4444' : primaryColor,
								boxShadow: actualThemeIsDark
									? '0 1px 3px 0 rgba(0, 0, 0, 0.3)'
									: '0 1px 2px 0 rgba(0, 0, 0, 0.1), inset 0 1px 2px 0 rgba(0, 0, 0, 0.05)'
							} as React.CSSProperties}
						/>
						{hasError && (
							<p className="text-sm text-red-500 mt-1">{errors[field.id]}</p>
						)}
					</div>
				);

			case 'email':
				const emailHasError = touched[field.id] && errors[field.id];
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
							value={responses[field.id] || ''}
							onChange={(e) => handleFieldChange(field.id, e.target.value)}
							onBlur={() => handleFieldBlur(field.id, field)}
							required={field.required}
							className={`border-2 focus:border-opacity-100 transition-all duration-200 hover:border-opacity-80 ${emailHasError ? 'border-red-500 focus:border-red-500' : ''}`}
							style={{
								backgroundColor: inputBgColor,
								borderColor: emailHasError ? '#ef4444' : borderColor,
								color: textColor,
								'--tw-ring-color': emailHasError ? '#ef4444' : primaryColor,
								boxShadow: actualThemeIsDark
									? '0 1px 3px 0 rgba(0, 0, 0, 0.3)'
									: '0 1px 2px 0 rgba(0, 0, 0, 0.1), inset 0 1px 2px 0 rgba(0, 0, 0, 0.05)'
							} as React.CSSProperties}
						/>
						{emailHasError && (
							<p className="text-sm text-red-500 mt-1">{errors[field.id]}</p>
						)}
					</div>
				);

			case 'phone':
				const phoneHasError = touched[field.id] && errors[field.id];
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
							value={responses[field.id] || ''}
							onChange={(e) => handleFieldChange(field.id, e.target.value)}
							onBlur={() => handleFieldBlur(field.id, field)}
							required={field.required}
							className={`border-2 focus:border-opacity-100 transition-all duration-200 hover:border-opacity-80 ${phoneHasError ? 'border-red-500 focus:border-red-500' : ''}`}
							style={{
								backgroundColor: inputBgColor,
								borderColor: phoneHasError ? '#ef4444' : borderColor,
								color: textColor,
								'--tw-ring-color': phoneHasError ? '#ef4444' : primaryColor,
								boxShadow: actualThemeIsDark
									? '0 1px 3px 0 rgba(0, 0, 0, 0.3)'
									: '0 1px 2px 0 rgba(0, 0, 0, 0.1), inset 0 1px 2px 0 rgba(0, 0, 0, 0.05)'
							} as React.CSSProperties}
						/>
						{phoneHasError && (
							<p className="text-sm text-red-500 mt-1">{errors[field.id]}</p>
						)}
					</div>
				);

			case 'textarea':
				const textareaHasError = touched[field.id] && errors[field.id];
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
							value={responses[field.id] || ''}
							onChange={(e) => handleFieldChange(field.id, e.target.value)}
							onBlur={() => handleFieldBlur(field.id, field)}
							required={field.required}
							className={`border-2 focus:border-opacity-100 transition-all duration-200 hover:border-opacity-80 ${textareaHasError ? 'border-red-500 focus:border-red-500' : ''}`}
							style={{
								backgroundColor: inputBgColor,
								borderColor: textareaHasError ? '#ef4444' : borderColor,
								color: textColor,
								'--tw-ring-color': textareaHasError ? '#ef4444' : primaryColor,
								boxShadow: actualThemeIsDark
									? '0 1px 3px 0 rgba(0, 0, 0, 0.3)'
									: '0 1px 2px 0 rgba(0, 0, 0, 0.1), inset 0 1px 2px 0 rgba(0, 0, 0, 0.05)'
							} as React.CSSProperties}
						/>
						{textareaHasError && (
							<p className="text-sm text-red-500 mt-1">{errors[field.id]}</p>
						)}
					</div>
				);

			case 'select':
				const selectHasError = touched[field.id] && errors[field.id];
				return (
					<div key={field.id} className="space-y-2">
						<Label
							htmlFor={field.id}
							style={{ color: textColor }}
						>
							{field.label}
							{field.required && <span style={{ color: '#ef4444' }}> *</span>}
						</Label>
						<Select
							value={responses[field.id] || ''}
							onValueChange={(value) => handleFieldChange(field.id, value)}
							required={field.required}
						>
							<SelectTrigger
								className={`border-2 focus:border-opacity-100 transition-all duration-200 hover:border-opacity-80 ${selectHasError ? 'border-red-500 focus:border-red-500' : ''}`}
								style={{
									backgroundColor: inputBgColor,
									borderColor: selectHasError ? '#ef4444' : borderColor,
									color: textColor,
									'--tw-ring-color': selectHasError ? '#ef4444' : primaryColor,
									boxShadow: actualThemeIsDark
										? '0 1px 3px 0 rgba(0, 0, 0, 0.3)'
										: '0 1px 2px 0 rgba(0, 0, 0, 0.1), inset 0 1px 2px 0 rgba(0, 0, 0, 0.05)'
								} as React.CSSProperties}
							>
								<SelectValue placeholder={field.placeholder || 'Select an option'} />
							</SelectTrigger>
							<SelectContent
								className="border border-gray-200 dark:border-gray-700"
								style={{
									backgroundColor: colors.cardBgColor,
									borderColor: borderColor,
									boxShadow: isDarkMode ? '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.2)' : '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
								}}
							>
								{field.options?.map((option, index) => (
									<SelectItem
										key={index}
										value={option}
										className="transition-colors cursor-pointer hover:bg-opacity-10"
										style={{
											color: textColor,
											'--tw-ring-color': primaryColor,
											'--hover-bg': colors.hoverBgColor
										} as React.CSSProperties}
									>
										{option}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{selectHasError && (
							<p className="text-sm text-red-500 mt-1">{errors[field.id]}</p>
						)}
					</div>
				);

			case 'checkbox':
				const checkboxHasError = touched[field.id] && errors[field.id];
				return (
					<div key={field.id} className="space-y-2">
						<div className="flex items-center space-x-2">
							<Checkbox
								id={field.id}
								checked={responses[field.id] || false}
								onCheckedChange={(checked) => handleFieldChange(field.id, checked)}
								required={field.required}
								style={{
									'--tw-ring-color': checkboxHasError ? '#ef4444' : primaryColor
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
						{checkboxHasError && (
							<p className="text-sm text-red-500 mt-1">{errors[field.id]}</p>
						)}
					</div>
				);

			default:
				return null;
		}
	};

	console.log('backgroundColor', backgroundColor);

	return (
		<div
			className={`p-6 min-h-screen ${getFontClass(fontFamily)}`}
			style={{ backgroundColor }}
		>
			{/* Header Card with Logo */}
			<Card
				className="max-w-2xl mx-auto mb-6 p-4 shadow-lg border-0"
				style={{
					backgroundColor: colors.cardBgColor,
					borderColor: useDefaultColors ? 'hsl(var(--border))' : (primaryColor + '20'),
					boxShadow: actualThemeIsDark ? '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)' : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
				}}
			>
				<div className="flex items-center justify-between">
					<div className="flex-1">
						<h1
							className={`text-xl font-semibold ${useDefaultColors ? 'text-foreground' : ''}`}
							style={{ color: useDefaultColors ? undefined : colors.textColor }}
						>
							{form.title}
						</h1>
						{form.description && (
							<p
								className={`text-sm mt-1 ${useDefaultColors ? 'text-muted-foreground' : ''}`}
								style={{ color: useDefaultColors ? undefined : colors.mutedTextColor }}
							>
								{form.description}
							</p>
						)}
					</div>
					{logoUrl && (
						<div className="ml-4">
							<div
								className="h-16 w-16 rounded-lg overflow-hidden"
								style={{
									backgroundColor: '#d1d5db' // Darker gray background for better contrast
								}}
							>
								<img
									src={logoUrl}
									alt="Organization Logo"
									className="h-full w-full object-cover rounded-lg"
									onError={(e) => {
										// Hide logo if it fails to load
										e.currentTarget.style.display = 'none';
									}}
								/>
							</div>
						</div>
					)}
				</div>
			</Card>

			<Card
				className="max-w-2xl mx-auto p-6 shadow-xl border-0"
				style={{
					backgroundColor: colors.cardBgColor,
					borderColor: useDefaultColors ? 'hsl(var(--border))' : (primaryColor + '20'),
					boxShadow: actualThemeIsDark ? '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)' : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
				}}
			>
				<form onSubmit={handleSubmit} className="space-y-6">

					{/* Step Progress Indicator */}
					{form.form_type === 'multi-step' && form.steps && form.steps.length > 0 && (
						<div className="mb-6">
							<div className="flex items-center justify-between mb-2">
								<span
									className={`text-sm font-medium ${useDefaultColors ? 'text-foreground' : ''}`}
									style={{ color: useDefaultColors ? undefined : (backgroundColor === '#0A0A0A' ? '#ffffff' : '#374151') }}
								>
									Step {currentStep + 1} of {form.steps.length}
								</span>
								<span
									className={`text-sm ${useDefaultColors ? 'text-muted-foreground' : ''}`}
									style={{ color: useDefaultColors ? undefined : (backgroundColor === '#0A0A0A' ? '#9ca3af' : '#6b7280') }}
								>
									{Math.round(((currentStep + 1) / form.steps.length) * 100)}% Complete
								</span>
							</div>
							<div
								className={`w-full rounded-full h-2 ${useDefaultColors ? 'bg-muted' : ''}`}
								style={{ backgroundColor: useDefaultColors ? undefined : (backgroundColor === '#0A0A0A' ? '#374151' : '#e5e7eb') }}
							>
								<div
									className={`h-2 rounded-full transition-all duration-300 ${useDefaultColors ? 'bg-primary' : ''
										}`}
									style={{
										width: `${((currentStep + 1) / form.steps.length) * 100}%`,
										background: useDefaultColors ? undefined : `linear-gradient(to right, ${primaryColor}, ${primaryColor}dd)`
									}}
								></div>
							</div>
						</div>
					)}


					{/* Current Step Title and Description */}
					{form.form_type === 'multi-step' && form.steps && form.steps.length > 0 && form.steps[currentStep] && (
						<div className="text-center space-y-2 mb-6">
							<h2
								className={`text-xl font-semibold ${useDefaultColors ? 'text-foreground' : ''}`}
								style={{ color: useDefaultColors ? undefined : (backgroundColor === '#0A0A0A' ? '#ffffff' : '#1a1a1a') }}
							>
								{form.steps[currentStep].title}
							</h2>
							{form.steps[currentStep].description && (
								<p
									className={`text-sm ${useDefaultColors ? 'text-muted-foreground' : ''}`}
									style={{ color: useDefaultColors ? undefined : (backgroundColor === '#0A0A0A' ? '#a0a0a0' : '#6b7280') }}
								>
									{form.steps[currentStep].description}
								</p>
							)}
						</div>
					)}

					<div className="space-y-4">
						{getCurrentStepFields()
							.sort((a, b) => a.order_index - b.order_index)
							.map(field => renderField(field))}
					</div>

					{/* Navigation Buttons */}
					{onSubmit && (
						<div className="flex justify-between pt-6">
							{form.form_type === 'multi-step' && form.steps && form.steps.length > 0 && currentStep > 0 ? (
								<Button
									type="button"
									variant="outline"
									onClick={prevStep}
									className={`inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium shadow hover:shadow-lg transition-all duration-200 ${useDefaultColors ? '' : ''
										}`}
									style={{
										borderColor: useDefaultColors ? undefined : primaryColor,
										color: useDefaultColors ? undefined : primaryColor,
										backgroundColor: useDefaultColors ? undefined : 'transparent'
									}}
								>
									← Previous
								</Button>
							) : (
								<div></div>
							)}

							{isLastStep() ? (
								<Button
									type="submit"
									disabled={isSubmitting}
									className={`inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium shadow hover:shadow-lg transition-all duration-200 disabled:opacity-50 ${useDefaultColors ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'text-white'
										}`}
									style={{
										background: useDefaultColors ? undefined : `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
										borderColor: useDefaultColors ? undefined : primaryColor,
										boxShadow: useDefaultColors ? undefined : `0 4px 14px 0 ${primaryColor}40`
									}}
								>
									{isSubmitting ? '⏳ Submitting...' : '✓ Submit Form'}
								</Button>
							) : (
								<Button
									type="button"
									onClick={nextStep}
									className={`inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium shadow hover:shadow-lg transition-all duration-200 ${useDefaultColors ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'text-white'
										}`}
									style={{
										background: useDefaultColors ? undefined : `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
										borderColor: useDefaultColors ? undefined : primaryColor,
										boxShadow: useDefaultColors ? undefined : `0 4px 14px 0 ${primaryColor}40`
									}}
								>
									Next →
								</Button>
							)}
						</div>
					)}
				</form>
			</Card>
		</div>
	);
}
