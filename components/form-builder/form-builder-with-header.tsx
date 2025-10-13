"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { SimplifiedFormBuilder } from "./simplified-form-builder";
import { TemplateSelector } from "./template-selector";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { FormsService } from "@/lib/forms";
import { FormWithFields } from "@/types/database";

interface FormBuilderWithHeaderProps {
	companyId: string;
	formId?: string;
	title: string;
	backUrl: string;
}

export function FormBuilderWithHeader({
	companyId,
	formId,
	title,
	backUrl
}: FormBuilderWithHeaderProps) {
	const [form, setForm] = useState<FormWithFields | null>(null);
	const [showTemplateSelector, setShowTemplateSelector] = useState(!formId); // Show template selector only for new forms
	const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
	const { theme, resolvedTheme } = useTheme();

	// Get branding settings from form (if editing existing form)
	const settings = form?.settings || {};
	const useDefaultColors = form?.use_default_colors !== false; // Default to true if not specified

	// For header, always use theme colors (users won't see custom colors in header)
	const primaryColor = 'hsl(var(--primary))';
	const backgroundColor = 'hsl(var(--background))';

	useEffect(() => {
		if (formId) {
			const loadForm = async () => {
				try {
					const formData = await FormsService.getForm(formId);
					if (formData) {
						setForm(formData);
					}
				} catch (error) {
					console.error('Error loading form for theming:', error);
				}
			};
			loadForm();
		}
	}, [formId]);

	// Set document title
	useEffect(() => {
		document.title = `Form Builder | ${title}`;
	}, [title]);

	const handleTemplateSelect = (template: any) => {
		setSelectedTemplate(template);
		setShowTemplateSelector(false);
	};

	const handleSkipTemplate = () => {
		setShowTemplateSelector(false);
	};

	return (
		<div
			className="min-h-screen bg-background"
		>
			{/* Fixed Header */}
			<div
				className="fixed top-0 left-0 right-0 z-50 border-b bg-card border-border"
			>
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center py-6">
						<Button
							variant="outline"
							size="sm"
							asChild
							className="mr-4 inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium shadow hover:shadow-lg transition-all duration-200"
						>
							<Link href={backUrl}>
								<ArrowLeft className="h-4 w-4" />
								Back
							</Link>
						</Button>
						<h1
							className="text-2xl font-bold text-foreground"
						>
							{title}
						</h1>
					</div>
				</div>
			</div>

			{/* Form Builder Content with top padding */}
			<div className="pt-[100px]">
				{showTemplateSelector ? (
					<TemplateSelector
						onTemplateSelect={handleTemplateSelect}
						onSkip={handleSkipTemplate}
					/>
				) : (
					<SimplifiedFormBuilder
						companyId={companyId}
						formId={formId}
						initialTemplate={selectedTemplate}
					/>
				)}
			</div>
		</div>
	);
}
