"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormsService } from "@/lib/forms";
import { FormWithFields } from "@/types/database";
import { Loader2, ArrowLeft, User, Calendar, Globe, Monitor } from "lucide-react";
import Link from "next/link";

interface FormResponse {
	id: string;
	form_id: string;
	submitted_by: string;
	submitted_at: string;
	ip_address: string;
	user_agent: string;
	username: string | null;
	responses: {
		field_id: string;
		field_label: string;
		field_type: string;
		value: string;
	}[];
}

interface FormResponsesPageClientProps {
	formId: string;
	companyId: string;
}

export default function FormResponsesPageClient({ formId, companyId }: FormResponsesPageClientProps) {
	const [form, setForm] = useState<FormWithFields | null>(null);
	const [responses, setResponses] = useState<FormResponse[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const loadData = async () => {
			try {
				setIsLoading(true);

				// Load form details
				const formData = await FormsService.getForm(formId);
				if (!formData) {
					setError('Form not found');
					return;
				}
				setForm(formData);

				// Load form responses
				const response = await fetch(`/api/forms/${formId}/responses`);
				if (!response.ok) {
					throw new Error('Failed to load responses');
				}
				const responsesData = await response.json();
				// Map 'data' field to 'responses' for compatibility
				const mappedResponses = (responsesData.responses || []).map((resp: any) => ({
					...resp,
					responses: resp.data || resp.responses || []
				}));
				setResponses(mappedResponses);
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Failed to load data');
			} finally {
				setIsLoading(false);
			}
		};

		loadData();
	}, [formId]);

	// Set document title
	useEffect(() => {
		if (form) {
			document.title = `Form Builder | ${form.title} - Responses`;
		}
	}, [form]);

	if (isLoading) {
		return (
			<div className="min-h-screen bg-background flex justify-center items-center">
				<div className="text-center">
					<Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
					<p className="text-muted-foreground">Loading responses...</p>
				</div>
			</div>
		);
	}

	if (error || !form) {
		return (
			<div className="min-h-screen bg-background flex justify-center items-center">
				<div className="text-center">
					<p className="text-destructive mb-4">{error || 'Form not found'}</p>
					<Button
						asChild
						className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white shadow hover:shadow-lg bg-gradient-to-r from-indigo-500 to-violet-500"
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
		<div className="min-h-screen bg-background">
			{/* Header */}
			<div className="border-b bg-card">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center py-6">
						<div className="flex items-center space-x-4">
							<Button
								variant="outline"
								size="sm"
								asChild
								className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium text-white shadow hover:shadow-lg bg-gradient-to-r from-indigo-500 to-violet-500"
							>
								<Link href={`/dashboard/${companyId}`}>
									<ArrowLeft className="h-4 w-4" />
									Back to Forms
								</Link>
							</Button>
							<div>
								<h1 className="text-2xl font-bold text-foreground">Form Responses</h1>
								<p className="text-sm text-muted-foreground mt-1">
									{form.title} - {responses.length} {responses.length === 1 ? 'Response' : 'Responses'}
								</p>
							</div>
						</div>
						<div className="flex items-center space-x-4">
							<Badge variant="outline">
								{responses.length} {responses.length === 1 ? 'Response' : 'Responses'}
							</Badge>
						</div>
					</div>
				</div>
			</div>

			{/* Content */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{responses.length === 0 ? (
					<Card className="text-center py-12">
						<CardContent>
							<div className="max-w-md mx-auto">
								<div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
									<User className="h-8 w-8 text-muted-foreground" />
								</div>
								<h3 className="text-lg font-semibold mb-2">No Responses Yet</h3>
								<p className="text-muted-foreground">
									This form hasn't received any responses yet.
								</p>
							</div>
						</CardContent>
					</Card>
				) : (
					<div className="space-y-6">
						{responses.map((response, index) => (
							<Card key={response.id} className="hover:shadow-lg transition-shadow">
								<CardHeader>
									<div className="flex justify-between items-start">
										<div>
											<CardTitle className="text-lg">
												Response #{index + 1}
											</CardTitle>
											<div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
												<div className="flex items-center space-x-1">
													<User className="h-4 w-4" />
													<span>{response.username || response.submitted_by}</span>
												</div>
												<div className="flex items-center space-x-1">
													<Calendar className="h-4 w-4" />
													<span>{new Date(response.submitted_at).toLocaleString()}</span>
												</div>
												<div className="flex items-center space-x-1">
													<Globe className="h-4 w-4" />
													<span>{response.ip_address}</span>
												</div>
											</div>
										</div>
										<Badge variant="secondary">
											{response.responses.length} {response.responses.length === 1 ? 'Field' : 'Fields'}
										</Badge>
									</div>
								</CardHeader>
								<CardContent>
									<div className="space-y-4">
										{response.responses.map((fieldResponse) => (
											<div key={fieldResponse.field_id} className="border-l-4 border-primary/20 pl-4">
												<div className="flex justify-between items-start mb-1">
													<h4 className="font-medium text-foreground">
														{fieldResponse.field_label || 'Unlabeled Field'}
													</h4>
													<Badge variant="outline" className="text-xs">
														{fieldResponse.field_type}
													</Badge>
												</div>
												<p className="text-sm text-muted-foreground">
													{fieldResponse.value || <em>No response</em>}
												</p>
											</div>
										))}
									</div>
									{response.user_agent && (
										<div className="mt-4 pt-4 border-t">
											<div className="flex items-center space-x-1 text-xs text-muted-foreground">
												<Monitor className="h-3 w-3" />
												<span className="truncate">{response.user_agent}</span>
											</div>
										</div>
									)}
								</CardContent>
							</Card>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
