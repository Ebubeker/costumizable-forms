"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormsService } from "@/lib/forms";
import { FormWithFields } from "@/types/database";
import { Eye, Loader2 } from "lucide-react";
import Link from "next/link";

interface MemberFormsViewProps {
	companyId: string;
	userId: string;
}

export default function MemberFormsView({ companyId, userId }: MemberFormsViewProps) {
	const [forms, setForms] = useState<FormWithFields[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { resolvedTheme } = useTheme();

	useEffect(() => {
		loadForms();
	}, [companyId]);

	const loadForms = async () => {
		try {
			setIsLoading(true);
			const formsData = await FormsService.getForms(companyId);
			setForms(formsData);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to load forms');
		} finally {
			setIsLoading(false);
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
			<div className="flex justify-center items-center py-12">
				<div className="text-center">
					<p className="text-destructive mb-4">{error}</p>
					<Button
						onClick={loadForms}
						className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white shadow hover:shadow-lg bg-gradient-to-r from-indigo-500 to-violet-500"
					>
						Try Again
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-8">
			<div className="flex justify-between items-center">
				<div>
					<h2 className="text-2xl font-bold text-foreground tracking-tight">Available Forms</h2>
					<p className="text-muted-foreground mt-2 text-lg">
						Fill out the forms below to submit your responses
					</p>
				</div>
				<Badge variant="outline" className="px-4 py-2 bg-muted/50 text-muted-foreground">
					{forms.length} {forms.length === 1 ? 'Form' : 'Forms'} Available
				</Badge>
			</div>

			{/* Forms List */}
			{forms.length === 0 ? (
				<Card className="text-center py-16 border shadow-lg bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50 border-slate-200/50 dark:border-slate-700/50">
					<CardContent>
						<div className="max-w-md mx-auto">
							<div className="w-20 h-20 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-6">
								<Eye className="h-10 w-10 text-muted-foreground" />
							</div>
							<h3 className="text-xl font-semibold mb-3 text-foreground">No Forms Available</h3>
							<p className="text-muted-foreground text-lg">
								There are no forms available for you to fill out at this time.
							</p>
						</div>
					</CardContent>
				</Card>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{forms.map((form) => (
						<Card key={form.id} className="h-full min-h-[240px] flex flex-col border shadow-lg hover:shadow-xl transition-all duration-300 group bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50 border-slate-200/50 dark:border-slate-700/50">
							<CardHeader className="pb-4">
								<div className="flex justify-between items-start">
									<div className="flex-1">
										<CardTitle className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
											{form.title}
										</CardTitle>
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
									<Button
										variant="outline"
										asChild
										className="w-full inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium shadow hover:shadow-lg transition-all duration-200"
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
										<Link href={`/dashboard/${companyId}/forms/${form.id}/submit`}>
											<Eye className="h-5 w-5" />
											Fill Out Form
										</Link>
									</Button>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}
