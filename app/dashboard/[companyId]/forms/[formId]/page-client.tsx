"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormsService } from "@/lib/forms";
import { FormWithFields } from "@/types/database";
import { SimplifiedFormViewer } from "@/components/form-builder/simplified-form-viewer";
import { Loader2, ArrowLeft, Edit } from "lucide-react";
import Link from "next/link";

interface FormViewPageClientProps {
	formId: string;
	companyId: string;
}

export default function FormViewPageClient({ formId, companyId }: FormViewPageClientProps) {
	const [form, setForm] = useState<FormWithFields | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { theme, resolvedTheme } = useTheme();

	// Get branding settings from form
	const settings = form?.settings || {};
	const logoUrl = settings.logoUrl || '';
	const useDefaultColors = form?.use_default_colors !== false; // Default to true if not specified

	// For header, always use theme colors (users won't see custom colors in header)
	const primaryColor = 'hsl(var(--primary))';
	const backgroundColor = 'hsl(var(--background))';

	useEffect(() => {
		const loadForm = async () => {
			try {
				setIsLoading(true);
				const formData = await FormsService.getForm(formId);
				if (formData) {
					setForm(formData);
				} else {
					setError('Form not found');
				}
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Failed to load form');
			} finally {
				setIsLoading(false);
			}
		};

		loadForm();
	}, [formId]);

	// Set document title
	useEffect(() => {
		if (form) {
			document.title = `WhopForm | ${form.title}`;
		}
	}, [form]);

	if (isLoading) {
		return (
			<div
				className="min-h-screen flex justify-center items-center bg-background"
			>
				<div className="text-center">
					<Loader2
						className="h-8 w-8 animate-spin mx-auto mb-4 text-primary"
					/>
					<p
						className="text-sm text-muted-foreground"
					>
						Loading form...
					</p>
				</div>
			</div>
		);
	}

	if (error || !form) {
		return (
			<div
				className="min-h-screen flex justify-center items-center bg-background"
			>
				<div className="text-center">
					<p
						className="mb-4 text-sm text-destructive"
					>
						{error || 'Form not found'}
					</p>
					<Button
						asChild
						className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium shadow hover:shadow-lg transition-all duration-200 bg-primary text-primary-foreground hover:bg-primary/90"
					>
						<Link href={`/dashboard/${companyId}`}>
							<ArrowLeft className="h-4 w-4" />
							Back to Forms
						</Link>
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div
			className="min-h-screen bg-background"
		>
			{/* Header */}
			<div
				className="border-b bg-card border-border"
			>
				<div className="max-w-2xl mx-auto">
					<div className="flex justify-between items-center py-6">
						<div className="absolute left-8 flex items-center space-x-4">
							<Button
								variant="outline"
								size="sm"
								asChild
								className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium shadow hover:shadow-lg transition-all duration-200"
							>
								<Link href={`/dashboard/${companyId}`}>
									<ArrowLeft className="h-4 w-4" />
									Back to Forms
								</Link>
							</Button>
						</div>
						<div className="flex-1">
							<h1
								className="text-2xl font-bold text-foreground"
							>
								{form.title}
							</h1>
							{form.description && (
								<p
									className="text-sm mt-1 text-muted-foreground"
								>
									{form.description}
								</p>
							)}
						</div>
						<div className="flex items-center space-x-4">
							<Badge
								variant="outline"
								className="text-foreground"
							>
								{form.form_type === 'multi-step' ? 'Multi-Step' : 'Single'} Form
							</Badge>
							<Badge
								variant="outline"
								className="text-foreground"
							>
								{form.fields?.length || 0} {(form.fields?.length || 0) === 1 ? 'Field' : 'Fields'}
							</Badge>
							{form.form_type === 'multi-step' && form.steps && form.steps.length > 0 && (
								<Badge
									variant="outline"
									className="text-foreground"
								>
									{form.steps.length} {(form.steps.length === 1 ? 'Step' : 'Steps')}
								</Badge>
							)}
							<Button
								asChild
								className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white shadow hover:shadow-lg transition-all duration-200"
								style={{
									background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
									borderColor: primaryColor,
									boxShadow: `0 4px 14px 0 ${primaryColor}40`
								}}
							>
								<Link href={`/dashboard/${companyId}/forms/${form.id}/edit`}>
									<Edit className="h-4 w-4" />
									Edit Form
								</Link>
							</Button>
						</div>
					</div>
				</div>
			</div>

			{/* Form Content */}
			<SimplifiedFormViewer form={form} />
		</div>
	);
}
