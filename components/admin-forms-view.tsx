"use client";

import { useState, useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { FormsService } from "@/lib/forms";
import { FormWithFields } from "@/types/database";
import { Plus, Edit, Trash2, Loader2, Eye, BarChart3, GripVertical } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	DragEndEvent,
	DragOverEvent,
	DragStartEvent,
	DragOverlay,
	Active,
	Over,
} from '@dnd-kit/core';
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	rectSortingStrategy,
} from '@dnd-kit/sortable';
import {
	useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface AdminFormsViewProps {
	companyId: string;
	userId: string;
}

interface SortableFormCardProps {
	form: FormWithFields;
	companyId: string;
	resolvedTheme: string | undefined;
	onDelete: (formId: string) => void;
	onToggleActivity: (formId: string) => void;
}

function SortableFormCard({ form, companyId, resolvedTheme, onDelete, onToggleActivity }: SortableFormCardProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id: form.id,
		transition: {
			duration: 150,
			easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
		},
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition: isDragging ? 'none' : transition,
		opacity: isDragging ? 0.5 : 1,
		pointerEvents: isDragging ? 'none' : 'auto',
	} as React.CSSProperties;

	return (
		<Card
			ref={setNodeRef}
			style={style}
			className={`h-full min-h-[240px] flex flex-col border shadow-lg hover:shadow-xl group bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50 border-slate-200/50 dark:border-slate-700/50 ${!form.is_active ? 'opacity-60' : ''} ${isDragging ? '' : 'transition-shadow duration-200'}`}
		>
							<CardHeader className="pb-4">
								<div className="flex justify-between items-start">
									<div className="flex-1">
										<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<div
									{...attributes}
									{...listeners}
									className="cursor-grab active:cursor-grabbing p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-md transition-colors duration-200 group/handle border border-transparent hover:border-blue-300"
									onMouseDown={(e) => {
										console.log('🖱️ MOUSE DOWN on drag handle:', form.title);
									}}
									onMouseUp={(e) => {
										console.log('🖱️ MOUSE UP on drag handle:', form.title);
									}}
								>
									<GripVertical className="h-4 w-4 text-gray-400 group-hover/handle:text-blue-500 transition-colors duration-200" />
								</div>
											<CardTitle className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
												{form.title}
											</CardTitle>
							</div>
											<div className="flex items-center gap-2 ml-4">
												<span className="text-xs text-muted-foreground">
													{form.is_active ? 'Active' : 'Inactive'}
												</span>
												<Switch
													checked={form.is_active}
									onCheckedChange={() => onToggleActivity(form.id)}
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
							onClick={() => onDelete(form.id)}
											className="form-card-delete-button"
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
	);
}

export function AdminFormsView({ companyId, userId }: AdminFormsViewProps) {
	const [forms, setForms] = useState<FormWithFields[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isReordering, setIsReordering] = useState(false);
	const [activeId, setActiveId] = useState<string | null>(null);
	const [hasReordered, setHasReordered] = useState(false);
	const { toast } = useToast();
	const { resolvedTheme } = useTheme();

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 3, // Reduced distance for easier activation
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	// Add sensor debugging
	console.log('🎯 Sensors configured:', sensors.length);

	const loadForms = useCallback(async () => {
		try {
			setIsLoading(true);
			const formsData = await FormsService.getFormsForAdmin(companyId);
			setForms(formsData);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to load forms');
		} finally {
			setIsLoading(false);
		}
	}, [companyId]);

	useEffect(() => {
		loadForms();
	}, [loadForms]);

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

	const handleDragStart = useCallback((event: DragStartEvent) => {
		console.log('🚀 DRAG START:', { activeId: event.active.id });
		setActiveId(event.active.id as string);
		setHasReordered(false); // Reset reorder flag
	}, []);

	const handleDragOver = useCallback((event: DragOverEvent) => {
		const { active, over } = event;
		console.log('🔄 DRAG OVER:', { activeId: active.id, overId: over?.id });

		if (over && active.id !== over.id) {
			console.log('📝 Updating form order during drag');
			setForms((prevForms) => {
				const oldIndex = prevForms.findIndex(form => form.id === active.id);
				const newIndex = prevForms.findIndex(form => form.id === over.id);

				if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
					console.log('✅ Moving form from index', oldIndex, 'to', newIndex);
					setHasReordered(true); // Mark that we've reordered
					return arrayMove(prevForms, oldIndex, newIndex);
				}
				console.log('❌ No move needed or invalid indices');
				return prevForms;
			});
		}
	}, []);

	const handleDragEnd = useCallback(async (event: DragEndEvent) => {
		const { active, over } = event;
		console.log('🏁 DRAG END:', {
			activeId: active.id,
			overId: over?.id,
			hasReordered,
			willSave: hasReordered
		});

		setActiveId(null);

		if (hasReordered) {
			console.log('💾 STARTING SAVE PROCESS - Forms were reordered');
			setIsReordering(true);

			try {
				console.log('📋 Current form order:', forms.map(f => ({ id: f.id, title: f.title })));

				// Save the current order to the database
				const formIds = forms.map(form => form.id);
				console.log('📤 Sending form IDs:', formIds);
				console.log('🏢 Company ID:', companyId);

				await FormsService.reorderForms(formIds, companyId);

				console.log('✅ Reorder API call successful - keeping optimistic updates');

				toast({
					title: "Forms Reordered",
					description: "The form order has been saved successfully.",
				});
			} catch (err) {
				console.error('❌ Reorder failed:', err);
				// Only reload on error to revert optimistic updates
				console.log('🔄 Reloading forms to revert changes...');
				await loadForms();
				toast({
					variant: "destructive",
					title: "Reorder Failed",
					description: `Failed to save form order: ${err instanceof Error ? err.message : 'Unknown error'}`,
				});
			} finally {
				setIsReordering(false);
			}
		} else {
			console.log('🚫 NO SAVE - No reordering occurred:', {
				hasOver: !!over,
				activeId: active.id,
				overId: over?.id,
				hasReordered
			});
		}

		// Reset the reorder flag for next drag
		setHasReordered(false);
	}, [forms, companyId, toast, loadForms, hasReordered]);

	const handleDragCancel = useCallback(() => {
		console.log('🚫 DRAG CANCELLED');
		setActiveId(null);
		setHasReordered(false); // Reset reorder flag
		// Reload forms to reset any optimistic updates
		loadForms();
	}, [loadForms]);

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
						Create and manage forms for your community. Drag and drop to reorder.
					</p>
				</div>
				<Button
					asChild
					className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium text-white shadow hover:shadow-lg bg-gradient-to-r from-indigo-500 to-violet-500"
				>
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
				<div className="relative">
					{/* Debug info */}
					{/* {process.env.NODE_ENV === 'development' && (
						<div className="mb-4 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs">
							<strong>Debug Info:</strong> {forms.length} forms loaded, IDs: {forms.map(f => f.id.slice(-4)).join(', ')}
							{activeId && <div>Active: {activeId.slice(-4)}</div>}
							{hasReordered && <div className="text-green-600">✅ Has reordered</div>}
						</div>
					)} */}

					{isReordering && (
						<div className="absolute top-0 left-0 right-0 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4 z-10">
							<div className="flex items-center gap-2">
								<Loader2 className="h-4 w-4 animate-spin text-blue-500" />
								<span className="text-blue-700 dark:text-blue-300 text-sm font-medium">
									Saving new form order...
								</span>
							</div>
						</div>
					)}
					<DndContext
						sensors={sensors}
						collisionDetection={closestCenter}
						onDragStart={handleDragStart}
						onDragOver={handleDragOver}
						onDragEnd={handleDragEnd}
						onDragCancel={handleDragCancel}
					>
						<SortableContext items={forms.map(form => form.id)} strategy={rectSortingStrategy}>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
								{forms.map((form) => (
									<SortableFormCard
										key={form.id}
										form={form}
										companyId={companyId}
										resolvedTheme={resolvedTheme}
										onDelete={deleteForm}
										onToggleActivity={toggleFormActivity}
									/>
								))}
							</div>
						</SortableContext>
						<DragOverlay>
							{activeId ? (
								<div className="transform rotate-2">
									<SortableFormCard
										form={forms.find(form => form.id === activeId)!}
										companyId={companyId}
										resolvedTheme={resolvedTheme}
										onDelete={() => { }}
										onToggleActivity={() => { }}
									/>
								</div>
							) : null}
						</DragOverlay>
					</DndContext>
				</div>
			)}
		</div>
	);
}