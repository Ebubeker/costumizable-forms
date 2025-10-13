"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FormsService } from "@/lib/forms";
import { FormWithFields } from "@/types/database";
import { Eye, Download, Search, Calendar, User, Mail, TrendingUp, BarChart3, Clock, Filter } from "lucide-react";
import Link from "next/link";
import ExportFormModal from "@/components/export-form-modal";
import ExportFormatDropdown from "@/components/export-format-dropdown";
import { fetchFormExportData, exportToCSV, exportToExcel, exportToJSON } from "@/lib/export-utils";

interface FormResponse {
	id: string;
	form_id: string;
	form_title: string;
	submitted_by: string;
	submitted_at: string;
	ip_address: string;
	user_agent: string;
	responses: {
		field_id: string;
		field_label: string;
		field_type: string;
		value: string;
	}[];
}

interface AllLeadsViewProps {
	companyId: string;
	userId: string;
}

export default function AllLeadsView({ companyId, userId }: AllLeadsViewProps) {
	const [forms, setForms] = useState<FormWithFields[]>([]);
	const [allResponses, setAllResponses] = useState<FormResponse[]>([]);
	const [filteredResponses, setFilteredResponses] = useState<FormResponse[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedForm, setSelectedForm] = useState("all");
	const [isExportModalOpen, setIsExportModalOpen] = useState(false);
	const [isExporting, setIsExporting] = useState(false);
	const { resolvedTheme } = useTheme();

	useEffect(() => {
		loadData();
	}, [companyId]);

	useEffect(() => {
		filterResponses();
	}, [allResponses, searchTerm, selectedForm]);

	const loadData = async () => {
		try {
			setIsLoading(true);

			// Load all forms
			const formsData = await FormsService.getForms(companyId);
			setForms(formsData);

			// Load all responses from all forms
			const allResponsesData: FormResponse[] = [];
			for (const form of formsData) {
				try {
					const response = await fetch(`/api/forms/${form.id}/responses`);
					if (response.ok) {
						const data = await response.json();
						const formResponses = data.responses.map((resp: any) => ({
							...resp,
							form_title: form.title
						}));
						allResponsesData.push(...formResponses);
					}
				} catch (err) {
					console.error(`Error loading responses for form ${form.id}:`, err);
				}
			}

			setAllResponses(allResponsesData);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to load data');
		} finally {
			setIsLoading(false);
		}
	};

	const filterResponses = () => {
		let filtered = allResponses;

		// Filter by form
		if (selectedForm !== "all") {
			filtered = filtered.filter(response => response.form_id === selectedForm);
		}

		// Filter by search term
		if (searchTerm) {
			filtered = filtered.filter(response => {
				const searchLower = searchTerm.toLowerCase();
				return (
					response.submitted_by.toLowerCase().includes(searchLower) ||
					response.form_title.toLowerCase().includes(searchLower)
				);
			});
		}

		setFilteredResponses(filtered);
	};


	const handleExport = async (formId: string, format: 'csv' | 'excel' | 'json') => {
		try {
			setIsExporting(true);

			// Fetch the form data
			const exportData = await fetchFormExportData(formId);

			// Export based on format
			switch (format) {
				case 'csv':
					exportToCSV(exportData);
					break;
				case 'excel':
					exportToExcel(exportData);
					break;
				case 'json':
					exportToJSON(exportData);
					break;
				default:
					throw new Error('Unsupported export format');
			}
		} catch (error) {
			console.error('Export failed:', error);
			alert('Export failed. Please try again.');
		} finally {
			setIsExporting(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex justify-center items-center py-12">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
					<p className="text-muted-foreground">Loading submissions...</p>
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
						onClick={loadData}
						className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white shadow hover:shadow-lg bg-gradient-to-r from-indigo-500 to-violet-500"
					>
						Try Again
					</Button>
				</div>
			</div>
		);
	}

	return (
		<TooltipProvider>
			<div className="space-y-8">
				{/* Header with gradient background */}
				<div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/30 dark:via-purple-950/30 dark:to-pink-950/30 p-8 border border-indigo-100/50 dark:border-indigo-800/30">
					<div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
					<div className="relative flex justify-between items-center">
						<div>
							<div className="flex items-center gap-3 mb-3">
								<div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
									<BarChart3 className="h-5 w-5 text-white" />
								</div>
								<h2 className="text-3xl font-bold text-foreground tracking-tight">Lead Analytics</h2>
							</div>
							<p className="text-muted-foreground text-lg">
								Track and analyze all form submissions across your community
							</p>
						</div>
						{/* Conditional Export UI */}
						{selectedForm !== "all" ? (
							<Tooltip>
								<TooltipTrigger asChild>
									<ExportFormatDropdown
										formId={selectedForm}
										formTitle={forms.find(f => f.id === selectedForm)?.title || 'Selected Form'}
										onExport={handleExport}
										isExporting={isExporting}
									/>
								</TooltipTrigger>
								<TooltipContent>
									<p>Export data from "{forms.find(f => f.id === selectedForm)?.title}"</p>
								</TooltipContent>
							</Tooltip>
						) : (
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										onClick={() => setIsExportModalOpen(true)}
										className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium text-white shadow-lg hover:shadow-xl bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 transition-all duration-200"
										disabled={forms.length === 0 || isExporting}
									>
										<Download className="h-5 w-5" />
										{isExporting ? 'Exporting...' : 'Export Data'}
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									<p>Choose a form to export data from</p>
								</TooltipContent>
							</Tooltip>
						)}
					</div>
				</div>

				{/* Statistics Cards with improved dark mode */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-indigo-50 to-violet-100 dark:from-slate-800/90 dark:to-slate-700/90 dark:border-slate-600/30">
						<div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-indigo-400/20 to-violet-500/20 dark:from-indigo-400/30 dark:to-violet-500/30 rounded-full -translate-y-10 translate-x-10"></div>
						<CardContent className="p-6 relative">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-semibold text-indigo-600 dark:text-indigo-300 mb-1">Total Leads</p>
									<p className="text-4xl font-bold text-indigo-700 dark:text-indigo-200">{allResponses.length}</p>
									<p className="text-xs text-indigo-500 dark:text-indigo-300/80 mt-1">All time submissions</p>
								</div>
								<div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-600 dark:from-indigo-400 dark:to-violet-500 rounded-2xl flex items-center justify-center shadow-lg">
									<TrendingUp className="h-7 w-7 text-white" />
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-indigo-50 to-violet-100 dark:from-slate-800/90 dark:to-slate-700/90 dark:border-slate-600/30">
						<div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-indigo-400/20 to-violet-500/20 dark:from-indigo-400/30 dark:to-violet-500/30 rounded-full -translate-y-10 translate-x-10"></div>
						<CardContent className="p-6 relative">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-semibold text-indigo-600 dark:text-indigo-300 mb-1">Active Forms</p>
									<p className="text-4xl font-bold text-indigo-700 dark:text-indigo-200">{forms.length}</p>
									<p className="text-xs text-indigo-500 dark:text-indigo-300/80 mt-1">Currently collecting</p>
								</div>
								<div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-600 dark:from-indigo-400 dark:to-violet-500 rounded-2xl flex items-center justify-center shadow-lg">
									<Mail className="h-7 w-7 text-white" />
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-indigo-50 to-violet-100 dark:from-slate-800/90 dark:to-slate-700/90 dark:border-slate-600/30">
						<div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-indigo-400/20 to-violet-500/20 dark:from-indigo-400/30 dark:to-violet-500/30 rounded-full -translate-y-10 translate-x-10"></div>
						<CardContent className="p-6 relative">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-sm font-semibold text-indigo-600 dark:text-indigo-300 mb-1">Filtered Results</p>
									<p className="text-4xl font-bold text-indigo-700 dark:text-indigo-200">{filteredResponses.length}</p>
									<p className="text-xs text-indigo-500 dark:text-indigo-300/80 mt-1">Matching criteria</p>
								</div>
								<div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-600 dark:from-indigo-400 dark:to-violet-500 rounded-2xl flex items-center justify-center shadow-lg">
									<Filter className="h-7 w-7 text-white" />
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Enhanced Filters Section */}
				<div className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50">
					<div className="flex items-center gap-2 mb-4">
						<div className="w-8 h-8 bg-gradient-to-br from-slate-500 to-gray-600 rounded-lg flex items-center justify-center">
							<Search className="h-4 w-4 text-white" />
						</div>
						<h3 className="text-lg font-semibold text-foreground">Search & Filter</h3>
					</div>
					<div className="flex flex-col sm:flex-row gap-4">
						<div className="relative flex-1">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Search by form name or submitter..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-10 bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 rounded-xl shadow-sm focus:shadow-md transition-all duration-200"
							/>
						</div>
						<Select value={selectedForm} onValueChange={setSelectedForm}>
							<SelectTrigger className="w-full sm:w-56 bg-white/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 rounded-xl shadow-sm focus:shadow-md transition-all duration-200">
								<SelectValue placeholder="Filter by form" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All Forms</SelectItem>
								{forms.map((form) => (
									<SelectItem key={form.id} value={form.id}>
										{form.title}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				{/* Enhanced Submissions Table */}
				{filteredResponses.length === 0 ? (
					<Card className="text-center py-16 border-0 shadow-lg bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900/50 dark:to-gray-900/50">
						<CardContent>
							<div className="max-w-md mx-auto">
								<div className="w-24 h-24 bg-gradient-to-br from-slate-200 to-gray-300 dark:from-slate-700 dark:to-gray-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
									<Search className="h-12 w-12 text-slate-500 dark:text-slate-400" />
								</div>
								<h3 className="text-2xl font-bold mb-3 text-foreground">No Leads Found</h3>
								<p className="text-muted-foreground text-lg">
									{allResponses.length === 0
										? "Start collecting leads by creating your first form."
										: "Try adjusting your search criteria to find more results."
									}
								</p>
							</div>
						</CardContent>
					</Card>
				) : (
					<Card className="border-0 shadow-xl overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
						<CardContent className="p-0">
							<div className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800/50 dark:to-gray-800/50 px-6 py-4 border-b border-slate-200/50 dark:border-slate-700/50">
								<div className="flex items-center gap-2">
									<div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
										<BarChart3 className="h-3 w-3 text-white" />
									</div>
									<h3 className="text-lg font-semibold text-foreground">Lead Submissions</h3>
									<Badge variant="secondary" className="ml-auto">
										{filteredResponses.length} {filteredResponses.length === 1 ? 'result' : 'results'}
									</Badge>
								</div>
							</div>
							<div className="overflow-x-auto">
								<table className="w-full">
									<thead className="bg-slate-50/50 dark:bg-slate-800/30">
										<tr>
											<th className="text-left p-4 font-semibold text-slate-700 dark:text-slate-300 text-sm uppercase tracking-wide">Form</th>
											<th className="text-left p-4 font-semibold text-slate-700 dark:text-slate-300 text-sm uppercase tracking-wide">Submitted By</th>
											<th className="text-left p-4 font-semibold text-slate-700 dark:text-slate-300 text-sm uppercase tracking-wide">Date & Time</th>
											<th className="text-left p-4 font-semibold text-slate-700 dark:text-slate-300 text-sm uppercase tracking-wide">Actions</th>
										</tr>
									</thead>
									<tbody>
										{filteredResponses.map((response, index) => {
											return (
												<tr key={response.id} className={`border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all duration-200 ${index % 2 === 0 ? 'bg-white/50 dark:bg-slate-900/30' : 'bg-slate-50/30 dark:bg-slate-800/20'}`}>
													<td className="p-4">
														<Tooltip>
															<TooltipTrigger asChild>
																<Link
																	href={`/dashboard/${companyId}/forms/${response.form_id}`}
																	className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold transition-colors flex items-center gap-2"
																>
																	<div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
																	{response.form_title}
																</Link>
															</TooltipTrigger>
															<TooltipContent>
																<p>Open form</p>
															</TooltipContent>
														</Tooltip>
													</td>
													<td className="p-4">
														<div className="flex items-center gap-2">
															<div className="w-8 h-8 bg-gradient-to-br from-slate-400 to-slate-500 rounded-full flex items-center justify-center">
																<User className="h-4 w-4 text-white" />
															</div>
															<span className="text-foreground font-medium">{response.submitted_by}</span>
														</div>
													</td>
													<td className="p-4 text-slate-600 dark:text-slate-400">
														<div className="flex items-center space-x-2">
															<Clock className="h-4 w-4" />
															<span className="font-medium">{new Date(response.submitted_at).toLocaleString()}</span>
														</div>
													</td>
													<td className="p-4">
														<Button
															size="sm"
															variant="outline"
															asChild
															className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium shadow-sm hover:shadow-md bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200"
														>
															<Link href={`/dashboard/${companyId}/forms/${response.form_id}/responses`}>
																<Eye className="h-4 w-4" />
																View Details
															</Link>
														</Button>
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						</CardContent>
					</Card>
				)}
			</div>

			{/* Export Modal - only show when no specific form is selected */}
			{selectedForm === "all" && (
				<ExportFormModal
					forms={forms}
					isOpen={isExportModalOpen}
					onClose={() => setIsExportModalOpen(false)}
					onExport={handleExport}
				/>
			)}
		</TooltipProvider>
	);
}
