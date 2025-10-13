"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { FormsService } from "@/lib/forms";
import { FormWithFields } from "@/types/database";
import { Plus, Edit, Trash2, Loader2, Eye, BarChart3 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";

interface AdminFormsViewProps {
	companyId: string;
	userId: string;
}

export function AdminFormsView({ companyId, userId }: AdminFormsViewProps) {
	const [forms, setForms] = useState<FormWithFields[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { toast } = useToast();
	const { resolvedTheme } = useTheme();

	useEffect(() => {
		loadForms();
	}, [companyId]);

	const loadForms = async () => {
		try {
			setIsLoading(true);
			const formsData = await FormsService.getFormsForAdmin(companyId);
			setForms(formsData);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to load forms');
		} finally {
			setIsLoading(false);
		}
	};

	const deleteForm = async (formId: string) => {
		if (!confirm('Are you sure you want to delete this form?')) {
			return;
		}

		try {
			await FormsService.deleteForm(formId);
			setForms(forms.filter(form => form.id !== formId));
		} catch (err) {
			toast({
				variant: "destructive",
				title: "Delete Failed",
				description: "Failed to delete form. Please try again.",
			});
		}
	};

	const toggleFormActivity = async (formId: string) => {
		try {
			const updatedForm = await FormsService.toggleFormActivity(formId);
			setForms(forms.map(form =>
				form.id === formId ? updatedForm : form
			));
		} catch (err) {
			toast({
				variant: "destructive",
				title: "Toggle Failed",
				description: "Failed to toggle form activity. Please try again.",
			});
		}
	};

	if (isLoading) {
		return (
			<div className="flex justify-center items-center py-12">
				<div className="text-center">
					<Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
					<p className="text-muted-foreground">Loading forms...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="text-center py-12">
				<p className="text-destructive mb-4">{error}</p>
				<Button
					onClick={loadForms}
					className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white shadow hover:shadow-lg bg-gradient-to-r from-indigo-500 to-violet-500"
				>
					Try Again
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-8">
			{/* Create Form Button */}
			<div className="flex justify-between items-center">
				<div>
					<h2 className="text-2xl font-bold text-foreground tracking-tight">Forms</h2>
					<p className="text-muted-foreground mt-2 text-lg">
						Create and manage forms for your community
					</p>
				</div>
				<Button asChild className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium text-white shadow hover:shadow-lg bg-gradient-to-r from-indigo-500 to-violet-500">
					<Link href={`/dashboard/${companyId}/forms/create`}>
						<Plus className="h-5 w-5" />
						Create Form
					</Link>
				</Button>
			</div>

			{/* Forms List */}
			{forms.length === 0 ? (
				<Card className="text-center py-16 border shadow-lg bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50 border-slate-200/50 dark:border-slate-700/50">
					<CardContent>
						<div className="max-w-md mx-auto">
							<div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-6">
								<Plus className="h-10 w-10 text-muted-foreground" />
							</div>
							<h3 className="text-xl font-semibold mb-3 text-foreground">No Forms Yet</h3>
							<p className="text-muted-foreground mb-8 text-lg">
								Create your first form to get started with form management.
							</p>
							<Button asChild className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium text-white shadow hover:shadow-lg bg-gradient-to-r from-indigo-500 to-violet-500">
								<Link href={`/dashboard/${companyId}/forms/create`}>
									<Plus className="h-5 w-5" />
									Create Your First Form
								</Link>
							</Button>
						</div>
					</CardContent>
				</Card>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{forms.map((form) => (
						<Card key={form.id} className={`h-full min-h-[240px] flex flex-col border shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50 border-slate-200/50 dark:border-slate-700/50 ${!form.is_active ? 'opacity-60' : ''}`}>
							<CardHeader className="pb-4">
								<div className="flex justify-between items-start">
									<div className="flex-1">
										<div className="flex items-center justify-between">
											<CardTitle className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
												{form.title}
											</CardTitle>
											<div className="flex items-center gap-2 ml-4">
												<span className="text-xs text-muted-foreground">
													{form.is_active ? 'Active' : 'Inactive'}
												</span>
												<Switch
													checked={form.is_active}
													onCheckedChange={() => toggleFormActivity(form.id)}
													className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-300"
												/>
											</div>
										</div>
										{form.description && (
											<p className="text-muted-foreground mt-2 line-clamp-2 text-sm">
												{form.description}
											</p>
										)}
									</div>
								</div>
							</CardHeader>
							<CardContent className="pt-0 flex flex-col justify-between h-full">
								<div className="flex-1"></div>
								<div className="space-y-3">
									<div className="text-xs text-muted-foreground">
										Created {new Date(form.created_at).toLocaleDateString()}
									</div>
									<div className="form-card-buttons">
										<div className="form-card-buttons-group">
											<Button
												size="sm"
												variant="outline"
												asChild
												className="form-card-button"
												style={resolvedTheme === 'dark' ? {
													borderColor: '#9ca3af',
													color: '#f3f4f6',
													backgroundColor: 'transparent'
												} : {
													borderColor: '#6b7280',
													color: '#374151',
													backgroundColor: 'transparent'
												}}
											>
												<Link href={`/dashboard/${companyId}/forms/${form.id}/edit`}>
													<Edit className="form-card-button-icon" />
													<span className="form-card-button-text">Edit</span>
												</Link>
											</Button>
											<Button
												size="sm"
												variant="outline"
												asChild
												className="form-card-button"
												style={resolvedTheme === 'dark' ? {
													borderColor: '#9ca3af',
													color: '#f3f4f6',
													backgroundColor: 'transparent'
												} : {
													borderColor: '#6b7280',
													color: '#374151',
													backgroundColor: 'transparent'
												}}
											>
												<Link href={`/dashboard/${companyId}/forms/${form.id}`}>
													<Eye className="form-card-button-icon" />
													<span className="form-card-button-text">View</span>
												</Link>
											</Button>
											<Button
												size="sm"
												variant="outline"
												asChild
												className="form-card-button"
												style={resolvedTheme === 'dark' ? {
													borderColor: '#9ca3af',
													color: '#f3f4f6',
													backgroundColor: 'transparent'
												} : {
													borderColor: '#6b7280',
													color: '#374151',
													backgroundColor: 'transparent'
												}}
											>
												<Link href={`/dashboard/${companyId}/forms/${form.id}/responses`}>
													<BarChart3 className="form-card-button-icon" />
													<span className="form-card-button-text">Responses</span>
												</Link>
											</Button>
										</div>
										<Button
											size="sm"
											onClick={() => deleteForm(form.id)}
											className="form-card-delete-button"
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
