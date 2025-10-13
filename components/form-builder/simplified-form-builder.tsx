'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ColorPicker } from '@/components/ui/color-picker';
import { FormsService } from '@/lib/forms';
import { FormWithFields } from '@/types/database';
import { Upload, X, Image as ImageIcon, Copy, Plus, Trash2, GripVertical } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
	DndContext,
	closestCenter,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
	DragEndEvent,
} from '@dnd-kit/core';
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
	useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export interface SimplifiedFormField {
	id: string;
	type: 'text' | 'email' | 'phone' | 'select' | 'checkbox' | 'textarea' | 'heading' | 'paragraph';
	label?: string;
	placeholder?: string;
	content?: string;
	required?: boolean;
	options?: string[];
	step_id?: string;
	order_index?: number;
}

interface FormStep {
	id: string;
	title: string;
	description?: string;
	order_index: number;
}

interface SimplifiedFormBuilderProps {
	companyId: string;
	formId?: string;
	initialTemplate?: any;
}

export function SimplifiedFormBuilder({ companyId, formId, initialTemplate }: SimplifiedFormBuilderProps) {
	const router = useRouter();
	const { toast } = useToast();
	const [fields, setFields] = useState<SimplifiedFormField[]>([]);
	const [steps, setSteps] = useState<FormStep[]>([]);
	const [isPreview, setIsPreview] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [formTitle, setFormTitle] = useState("");
	const [formDescription, setFormDescription] = useState("");
	const [formType, setFormType] = useState<'single' | 'multi-step'>('single');
	const [currentForm, setCurrentForm] = useState<FormWithFields | null>(null);

	// Branding settings
	const [logoUrl, setLogoUrl] = useState("");
	const [primaryColor, setPrimaryColor] = useState("#645EFF");
	const [backgroundColor, setBackgroundColor] = useState("transparent");
	const [useDefaultColors, setUseDefaultColors] = useState(true);
	const [fontFamily, setFontFamily] = useState("Arial");

	// File upload
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Drag and drop sensors
	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	);

	// Color picker state
	const [showColorPicker, setShowColorPicker] = useState<'primary' | 'background' | null>(null);
	const [tempColor, setTempColor] = useState(primaryColor);

	// Color conversion utilities
	const hexToRgb = (hex: string) => {
		const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result ? {
			r: parseInt(result[1], 16),
			g: parseInt(result[2], 16),
			b: parseInt(result[3], 16)
		} : null;
	};

	const rgbToHex = (r: number, g: number, b: number) => {
		return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
	};

	const rgbToHsv = (r: number, g: number, b: number) => {
		r /= 255;
		g /= 255;
		b /= 255;
		const max = Math.max(r, g, b);
		const min = Math.min(r, g, b);
		const diff = max - min;
		let h = 0;
		let s = max === 0 ? 0 : diff / max;
		let v = max;

		if (diff !== 0) {
			switch (max) {
				case r: h = ((g - b) / diff) % 6; break;
				case g: h = (b - r) / diff + 2; break;
				case b: h = (r - g) / diff + 4; break;
			}
		}
		h = Math.round(h * 60);
		if (h < 0) h += 360;

		return { h, s: Math.round(s * 100), v: Math.round(v * 100) };
	};

	const hsvToRgb = (h: number, s: number, v: number) => {
		s /= 100;
		v /= 100;
		const c = v * s;
		const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
		const m = v - c;
		let r = 0, g = 0, b = 0;

		if (0 <= h && h < 60) { r = c; g = x; b = 0; }
		else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
		else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
		else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
		else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
		else if (300 <= h && h < 360) { r = c; g = 0; b = x; }

		return {
			r: Math.round((r + m) * 255),
			g: Math.round((g + m) * 255),
			b: Math.round((b + m) * 255)
		};
	};

	const rgbToHsl = (r: number, g: number, b: number) => {
		r /= 255;
		g /= 255;
		b /= 255;
		const max = Math.max(r, g, b);
		const min = Math.min(r, g, b);
		const diff = max - min;
		let h = 0;
		let l = (max + min) / 2;
		let s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);

		if (diff !== 0) {
			switch (max) {
				case r: h = ((g - b) / diff) % 6; break;
				case g: h = (b - r) / diff + 2; break;
				case b: h = (r - g) / diff + 4; break;
			}
		}
		h = Math.round(h * 60);
		if (h < 0) h += 360;

		return { h, s: Math.round(s * 100), l: Math.round(l * 100) };
	};

	// Font options
	const fontOptions = [
		{ value: "Inter", label: "Inter", preview: "Inter", cssClass: "font-inter" },
		{ value: "Roboto", label: "Roboto", preview: "Roboto", cssClass: "font-roboto" },
		{ value: "Open Sans", label: "Open Sans", preview: "Open Sans", cssClass: "font-open-sans" },
		{ value: "Lato", label: "Lato", preview: "Lato", cssClass: "font-lato" },
		{ value: "Montserrat", label: "Montserrat", preview: "Montserrat", cssClass: "font-montserrat" },
		{ value: "Poppins", label: "Poppins", preview: "Poppins", cssClass: "font-poppins" },
		{ value: "Source Sans Pro", label: "Source Sans Pro", preview: "Source Sans Pro", cssClass: "font-source-sans" },
		{ value: "Nunito", label: "Nunito", preview: "Nunito", cssClass: "font-nunito" },
		{ value: "Raleway", label: "Raleway", preview: "Raleway", cssClass: "font-raleway" },
		{ value: "Ubuntu", label: "Ubuntu", preview: "Ubuntu", cssClass: "font-ubuntu" },
		{ value: "Playfair Display", label: "Playfair Display", preview: "Playfair Display", cssClass: "font-playfair-display" },
		{ value: "Merriweather", label: "Merriweather", preview: "Merriweather", cssClass: "font-merriweather" },
		{ value: "Georgia", label: "Georgia", preview: "Georgia", cssClass: "" },
		{ value: "Times New Roman", label: "Times New Roman", preview: "Times New Roman", cssClass: "" },
		{ value: "Arial", label: "Arial", preview: "Arial", cssClass: "" },
		{ value: "Helvetica", label: "Helvetica", preview: "Helvetica", cssClass: "" },
		{ value: "Verdana", label: "Verdana", preview: "Verdana", cssClass: "" },
		{ value: "Tahoma", label: "Tahoma", preview: "Tahoma", cssClass: "" },
		{ value: "Trebuchet MS", label: "Trebuchet MS", preview: "Trebuchet MS", cssClass: "" },
		{ value: "Courier New", label: "Courier New", preview: "Courier New", cssClass: "" }
	];

	// Color presets
	const primaryColorPresets = [
		{ name: "Blue", value: "#3B82F6" },
		{ name: "Purple", value: "#8B5CF6" },
		{ name: "Indigo", value: "#6366F1" },
		{ name: "Violet", value: "#645EFF" },
		{ name: "Green", value: "#10B981" },
		{ name: "Emerald", value: "#059669" },
		{ name: "Teal", value: "#14B8A6" },
		{ name: "Cyan", value: "#06B6D4" },
		{ name: "Sky", value: "#0EA5E9" },
		{ name: "Red", value: "#EF4444" },
		{ name: "Rose", value: "#F43F5E" },
		{ name: "Pink", value: "#EC4899" },
		{ name: "Orange", value: "#F97316" },
		{ name: "Amber", value: "#F59E0B" },
		{ name: "Yellow", value: "#EAB308" },
		{ name: "Lime", value: "#84CC16" },
		{ name: "Slate", value: "#64748B" },
		{ name: "Gray", value: "#6B7280" },
		{ name: "Zinc", value: "#71717A" },
		{ name: "Neutral", value: "#737373" }
	];

	const backgroundColorPresets = [
		{ name: "White", value: "#FFFFFF" },
		{ name: "Light Gray", value: "#F8FAFC" },
		{ name: "Gray", value: "#F1F5F9" },
		{ name: "Slate", value: "#E2E8F0" },
		{ name: "Zinc", value: "#F4F4F5" },
		{ name: "Neutral", value: "#FAFAFA" },
		{ name: "Stone", value: "#F5F5F4" },
		{ name: "Dark", value: "#0A0A0A" },
		{ name: "Dark Gray", value: "#1A1A1A" },
		{ name: "Slate Dark", value: "#0F172A" },
		{ name: "Zinc Dark", value: "#18181B" },
		{ name: "Neutral Dark", value: "#171717" },
		{ name: "Stone Dark", value: "#1C1917" },
		{ name: "Transparent", value: "transparent" }
	];

	// Load existing form if formId is provided
	useEffect(() => {
		if (formId) {
			loadForm(formId);
		}
	}, [formId]);

	// Initialize form with template if provided
	useEffect(() => {
		if (initialTemplate && !formId) {
			// Set form type
			setFormType(initialTemplate.formType);

			// Set form title based on template
			setFormTitle(initialTemplate.name);
			setFormDescription(`Form created from ${initialTemplate.name} template`);

			// Set fields from template
			setFields(initialTemplate.fields);

			// Set steps if it's a multi-step form
			if (initialTemplate.formType === 'multi-step' && initialTemplate.steps) {
				setSteps(initialTemplate.steps);
			}
		}
	}, [initialTemplate, formId]);

	const loadForm = async (id: string) => {
		setIsLoading(true);
		try {
			const form = await FormsService.getForm(id);
			if (form) {
				setCurrentForm(form);
				setFormTitle(form.title);
				setFormDescription(form.description || "");

				// Load branding settings
				const settings = form.settings || {};
				setLogoUrl(settings.logoUrl || "");
				setPrimaryColor(settings.primaryColor || "#645EFF");
				setBackgroundColor(settings.backgroundColor || "transparent");
				setFontFamily(settings.fontFamily || "Arial");
				setUseDefaultColors((form as any).use_default_colors !== false);

				// If form_type is multi-step but no steps exist, treat as single
				const hasSteps = form.steps && form.steps.length > 0;
				const formType = form.form_type || 'single';
				const actualFormType = (formType === 'multi-step' && !hasSteps) ? 'single' : formType;

				setFormType(actualFormType);

				// Convert database steps to session steps
				const sessionSteps: FormStep[] = (form.steps || [])
					.sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
					.map(step => ({
						id: step.id,
						title: step.title,
						description: step.description || '',
						order_index: step.order_index
					}));
				setSteps(sessionSteps);

				// Convert database fields to session fields
				const sessionFields: SimplifiedFormField[] = (form.fields || [])
					.sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
					.map(field => ({
						id: field.id,
						type: field.type,
						label: field.label || '',
						placeholder: field.placeholder || '',
						content: field.content || '',
						required: field.required,
						options: field.options || [],
						step_id: field.step_id || undefined
					}));
				setFields(sessionFields);
			}
		} catch (error) {
			console.error('Error loading form:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const saveForm = async () => {
		if (!formTitle.trim()) {
			toast({
				variant: "destructive",
				title: "Form Title Required",
				description: "Please enter a form title before saving.",
			});
			return;
		}

		if (!companyId) {
			toast({
				variant: "destructive",
				title: "Company ID Required",
				description: "Company ID is required to save forms.",
			});
			return;
		}

		setIsSaving(true);
		try {
			const formData = {
				title: formTitle,
				description: formDescription,
				company_id: companyId,
				form_type: formType,
				use_default_colors: useDefaultColors,
				settings: {
					logoUrl,
					primaryColor,
					backgroundColor,
					fontFamily
				},
				steps: formType === 'multi-step' ? steps.map(step => ({
					id: step.id,
					title: step.title,
					description: step.description,
					order_index: step.order_index
				})) : [],
				fields: fields.map(field => ({
					type: field.type,
					label: field.label,
					placeholder: field.placeholder,
					content: field.content,
					required: field.required,
					options: field.options,
					step_id: field.step_id
				}))
			};

			let savedForm: FormWithFields;
			if (currentForm) {
				savedForm = await FormsService.updateForm(currentForm.id, formData);
				toast({
					variant: "success",
					title: "Form Updated",
					description: "Your form has been updated successfully!",
				});
			} else {
				savedForm = await FormsService.createForm(formData);
				toast({
					variant: "success",
					title: "Form Created",
					description: "Your form has been created successfully!",
				});
				// Redirect to admin page after form creation
				router.push(`/dashboard/${companyId}`);
			}

			setCurrentForm(savedForm);
		} catch (error) {
			console.error('Error saving form:', error);
			toast({
				variant: "destructive",
				title: "Save Failed",
				description: "Failed to save form. Please try again.",
			});
		} finally {
			setIsSaving(false);
		}
	};

	const addField = (type: SimplifiedFormField['type'], stepId?: string) => {
		// Get the highest order_index for fields in the same step (or no step for single forms)
		const relevantFields = fields.filter(field =>
			stepId ? field.step_id === stepId : !field.step_id
		);
		const maxOrderIndex = relevantFields.length > 0
			? Math.max(...relevantFields.map(field => field.order_index || 0))
			: -1;

		const newField: SimplifiedFormField = {
			id: `field-${Date.now()}`,
			type,
			label: type === 'heading' ? 'Heading' : type === 'paragraph' ? 'Paragraph' : 'Field Label',
			placeholder: type === 'heading' || type === 'paragraph' ? '' : 'Enter placeholder...',
			content: type === 'heading' ? 'Your heading text' : type === 'paragraph' ? 'Your paragraph text' : '',
			required: false,
			options: type === "select" ? [] : undefined,
			step_id: stepId,
			order_index: maxOrderIndex + 1,
		};
		setFields([...fields, newField]);
	};

	const handleDragStart = (event: any) => {
		// Prevent any default behavior that might cause scrolling
		event.preventDefault?.();
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		if (over && active.id !== over.id) {
			const oldIndex = fields.findIndex(field => field.id === active.id);
			const newIndex = fields.findIndex(field => field.id === over.id);

			const reorderedFields = arrayMove(fields, oldIndex, newIndex);

			// Update order_index for all fields
			const updatedFields = reorderedFields.map((field, index) => ({
				...field,
				order_index: index
			}));

			setFields(updatedFields);
		}

		// Prevent any default behavior that might cause scrolling
		event.preventDefault?.();
	};

	const addStep = () => {
		const newStep: FormStep = {
			id: `step-${Date.now()}`,
			title: `Step ${steps.length + 1}`,
			description: '',
			order_index: steps.length,
		};
		setSteps([...steps, newStep]);
	};

	const updateStep = (stepId: string, updates: Partial<FormStep>) => {
		setSteps(steps.map(step =>
			step.id === stepId ? { ...step, ...updates } : step
		));
	};

	const deleteStep = (stepId: string) => {
		setSteps(steps.filter(step => step.id !== stepId));
		setFields(fields.filter(field => field.step_id !== stepId));
	};

	const updateField = (fieldId: string, updates: Partial<SimplifiedFormField>) => {
		setFields(fields.map(field =>
			field.id === fieldId ? { ...field, ...updates } : field
		));
	};

	const deleteField = (fieldId: string) => {
		setFields(fields.filter(field => field.id !== fieldId));
	};

	// Image handling functions
	const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			// Validate file type
			if (!file.type.startsWith('image/')) {
				toast({
					variant: "destructive",
					title: "Invalid File Type",
					description: "Please select an image file.",
				});
				return;
			}

			// Validate file size (max 5MB)
			if (file.size > 5 * 1024 * 1024) {
				toast({
					variant: "destructive",
					title: "File Too Large",
					description: "Image size must be less than 5MB.",
				});
				return;
			}

			// Convert to base64
			const reader = new FileReader();
			reader.onload = (e) => {
				const result = e.target?.result as string;
				setLogoUrl(result);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleImageDrop = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
		const file = event.dataTransfer.files[0];
		if (file) {
			// Validate file type
			if (!file.type.startsWith('image/')) {
				toast({
					variant: "destructive",
					title: "Invalid File Type",
					description: "Please drop an image file.",
				});
				return;
			}

			// Validate file size (max 5MB)
			if (file.size > 5 * 1024 * 1024) {
				toast({
					variant: "destructive",
					title: "File Too Large",
					description: "Image size must be less than 5MB.",
				});
				return;
			}

			// Convert to base64
			const reader = new FileReader();
			reader.onload = (e) => {
				const result = e.target?.result as string;
				setLogoUrl(result);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
	};

	const clearLogo = () => {
		setLogoUrl("");
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	// Advanced Color Picker Component
	const AdvancedColorPicker = ({
		label,
		currentColor,
		onColorChange,
		isOpen,
		onClose
	}: {
		label: string;
		currentColor: string;
		onColorChange: (color: string) => void;
		isOpen: boolean;
		onClose: () => void;
	}) => {
		const [hue, setHue] = useState(0);
		const [saturation, setSaturation] = useState(100);
		const [value, setValue] = useState(100);
		const [hex, setHex] = useState(currentColor);
		const [rgb, setRgb] = useState({ r: 0, g: 0, b: 0 });
		const [hsv, setHsv] = useState({ h: 0, s: 100, v: 100 });
		const [hsl, setHsl] = useState({ h: 0, s: 100, l: 50 });

		useEffect(() => {
			if (currentColor && currentColor !== 'transparent') {
				const rgbValue = hexToRgb(currentColor);
				if (rgbValue) {
					const hsvValue = rgbToHsv(rgbValue.r, rgbValue.g, rgbValue.b);
					const hslValue = rgbToHsl(rgbValue.r, rgbValue.g, rgbValue.b);

					setHue(hsvValue.h);
					setSaturation(hsvValue.s);
					setValue(hsvValue.v);
					setRgb(rgbValue);
					setHsv(hsvValue);
					setHsl(hslValue);
					setHex(currentColor);
				}
			}
		}, [currentColor]);

		const updateColor = (newHue: number, newSat: number, newVal: number) => {
			const newRgb = hsvToRgb(newHue, newSat, newVal);
			const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
			const newHsl = rgbToHsl(newRgb.r, newRgb.g, newRgb.b);

			setHue(newHue);
			setSaturation(newSat);
			setValue(newVal);
			setRgb(newRgb);
			setHsv({ h: newHue, s: newSat, v: newVal });
			setHsl(newHsl);
			setHex(newHex);
			onColorChange(newHex);
		};

		const handleGradientClick = (e: React.MouseEvent<HTMLDivElement>) => {
			const rect = e.currentTarget.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;
			const newSat = Math.round((x / rect.width) * 100);
			const newVal = Math.round(100 - (y / rect.height) * 100);
			updateColor(hue, newSat, newVal);
		};

		const handleHueClick = (e: React.MouseEvent<HTMLDivElement>) => {
			const rect = e.currentTarget.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const newHue = Math.round((x / rect.width) * 360);
			updateColor(newHue, saturation, value);
		};

		const copyToClipboard = (text: string) => {
			navigator.clipboard.writeText(text);
		};

		if (!isOpen) return null;

		return (
			<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
				<div className="bg-card border border-border rounded-lg p-6 w-96 max-w-[90vw]">
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-lg font-semibold">{label}</h3>
						<Button variant="ghost" size="sm" onClick={onClose}>
							<X className="h-4 w-4" />
						</Button>
					</div>

					{/* Current Color Display */}
					<div className="flex items-center space-x-3 mb-4">
						<div
							className="w-16 h-16 rounded-lg border-2 border-border shadow-sm"
							style={{ backgroundColor: hex }}
						/>
						<div className="flex-1">
							<Input
								value={hex}
								onChange={(e) => {
									setHex(e.target.value);
									onColorChange(e.target.value);
								}}
								className="font-mono text-sm"
							/>
						</div>
					</div>

					{/* Color Gradient Area */}
					<div className="mb-4">
						<div
							className="w-full h-48 rounded-lg border border-border cursor-crosshair relative"
							style={{
								background: `linear-gradient(to right, white, hsl(${hue}, 100%, 50%)), linear-gradient(to top, black, transparent)`
							}}
							onClick={handleGradientClick}
						>
							{/* Saturation/Value Selector */}
							<div
								className="absolute w-4 h-4 border-2 border-white rounded-full shadow-lg transform -translate-x-2 -translate-y-2"
								style={{
									left: `${saturation}%`,
									top: `${100 - value}%`
								}}
							/>
						</div>
					</div>

					{/* Hue Slider */}
					<div className="mb-4">
						<div
							className="w-full h-6 rounded border border-border cursor-pointer relative"
							style={{
								background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)'
							}}
							onClick={handleHueClick}
						>
							{/* Hue Selector */}
							<div
								className="absolute w-4 h-6 border-2 border-white rounded shadow-lg transform -translate-x-2"
								style={{ left: `${(hue / 360) * 100}%` }}
							/>
						</div>
					</div>

					{/* Color Format Inputs */}
					<div className="grid grid-cols-2 gap-3 text-sm">
						<div>
							<Label className="text-xs text-muted-foreground">RGB</Label>
							<div className="flex items-center space-x-1">
								<Input
									value={`${rgb.r}, ${rgb.g}, ${rgb.b}`}
									readOnly
									className="text-xs font-mono"
								/>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => copyToClipboard(`${rgb.r}, ${rgb.g}, ${rgb.b}`)}
								>
									<Copy className="h-3 w-3" />
								</Button>
							</div>
						</div>
						<div>
							<Label className="text-xs text-muted-foreground">HSV</Label>
							<div className="flex items-center space-x-1">
								<Input
									value={`${hsv.h}°, ${hsv.s}%, ${hsv.v}%`}
									readOnly
									className="text-xs font-mono"
								/>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => copyToClipboard(`${hsv.h}°, ${hsv.s}%, ${hsv.v}%`)}
								>
									<Copy className="h-3 w-3" />
								</Button>
							</div>
						</div>
						<div>
							<Label className="text-xs text-muted-foreground">HSL</Label>
							<div className="flex items-center space-x-1">
								<Input
									value={`${hsl.h}°, ${hsl.s}%, ${hsl.l}%`}
									readOnly
									className="text-xs font-mono"
								/>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => copyToClipboard(`${hsl.h}°, ${hsl.s}%, ${hsl.l}%`)}
								>
									<Copy className="h-3 w-3" />
								</Button>
							</div>
						</div>
						<div>
							<Label className="text-xs text-muted-foreground">HEX</Label>
							<div className="flex items-center space-x-1">
								<Input
									value={hex}
									readOnly
									className="text-xs font-mono"
								/>
								<Button
									variant="ghost"
									size="sm"
									onClick={() => copyToClipboard(hex)}
								>
									<Copy className="h-3 w-3" />
								</Button>
							</div>
						</div>
					</div>

					<div className="flex justify-end space-x-2 mt-4">
						<Button variant="outline" onClick={onClose}>
							Cancel
						</Button>
						<Button onClick={onClose}>
							Done
						</Button>
					</div>
				</div>
			</div>
		);
	};

	const renderFieldInput = (field: SimplifiedFormField) => {
		switch (field.type) {
			case "text":
				return (
					<Input
						id={field.id}
						placeholder={field.placeholder}
						disabled={isPreview}
					/>
				);
			case "email":
				return (
					<Input
						id={field.id}
						type="email"
						placeholder={field.placeholder}
						disabled={isPreview}
					/>
				);
			case "phone":
				return (
					<Input
						id={field.id}
						type="tel"
						placeholder={field.placeholder}
						disabled={isPreview}
					/>
				);
			case "select":
				return (
					<Select disabled={isPreview}>
						<SelectTrigger>
							<SelectValue placeholder={field.placeholder} />
						</SelectTrigger>
						<SelectContent>
							{field.options?.map((option, index) => (
								<SelectItem key={index} value={option}>
									{option}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				);
			case "checkbox":
				return (
					<div className="flex items-center space-x-2">
						<Checkbox id={field.id} disabled={isPreview} />
						<Label htmlFor={field.id}>{field.label}</Label>
					</div>
				);
			case "textarea":
				return (
					<Textarea
						id={field.id}
						placeholder={field.placeholder}
						disabled={isPreview}
					/>
				);
			default:
				return null;
		}
	};

	// Sortable Field Component
	const SortableField = ({ field, index }: { field: SimplifiedFormField; index: number }) => {
		const {
			attributes,
			listeners,
			setNodeRef,
			transform,
			transition,
			isDragging,
		} = useSortable({ id: field.id });

		const style = {
			transform: CSS.Transform.toString(transform),
			transition,
			opacity: isDragging ? 0.5 : 1,
		};

		return (
			<div
				ref={setNodeRef}
				style={style}
				className="relative"
			>
				<Card className="p-4 mb-4">
					<div className="flex items-center justify-between mb-3">
						<div className="flex items-center gap-2">
							<button
								{...attributes}
								{...listeners}
								type="button"
								onMouseDown={(e) => e.preventDefault()}
								onClick={(e) => e.preventDefault()}
								className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
							>
								<GripVertical className="h-4 w-4 text-gray-400" />
							</button>
							<h3 className="text-lg font-semibold capitalize">
								{field.type === 'heading' ? 'Heading' : field.type === 'paragraph' ? 'Paragraph' : `${field.type} Field`}
							</h3>
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={() => deleteField(field.id)}
							className="text-red-500 hover:text-red-700 hover:bg-red-50"
						>
							<X className="h-4 w-4" />
							Delete
						</Button>
					</div>

					<div className="space-y-3">
						{field.type === 'heading' || field.type === 'paragraph' ? (
							<>
								<div className="space-y-1">
									<Label htmlFor={`content-${field.id}`}>
										{field.type === 'heading' ? 'Heading Text' : 'Paragraph Text'}
									</Label>
									<Textarea
										id={`content-${field.id}`}
										value={field.content || ''}
										onChange={(e) => updateField(field.id, { content: e.target.value })}
										placeholder={field.type === 'heading' ? 'Enter heading text...' : 'Enter paragraph text...'}
									/>
								</div>
							</>
						) : (
							<>
								<div className="space-y-1">
									<Label htmlFor={`label-${field.id}`}>Field Label</Label>
									<Input
										id={`label-${field.id}`}
										value={field.label || ''}
										onChange={(e) => updateField(field.id, { label: e.target.value })}
										placeholder="Enter field label..."
									/>
								</div>

								<div className="space-y-1">
									<Label htmlFor={`placeholder-${field.id}`}>Placeholder Text</Label>
									<Input
										id={`placeholder-${field.id}`}
										value={field.placeholder || ''}
										onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
										placeholder="Enter placeholder text..."
									/>
								</div>

								{field.type === 'select' && (
									<div className="space-y-2">
										<Label>Options</Label>
										<div className="space-y-2">
											{(field.options || []).map((option, index) => (
												<div key={index} className="flex items-center gap-2">
													<Input
														value={option}
														onChange={(e) => {
															const newOptions = [...(field.options || [])];
															newOptions[index] = e.target.value;
															updateField(field.id, { options: newOptions });
														}}
														placeholder={`Option ${index + 1}`}
														className="flex-1"
													/>
													<Button
														type="button"
														variant="outline"
														size="sm"
														onClick={() => {
															const newOptions = (field.options || []).filter((_, i) => i !== index);
															updateField(field.id, { options: newOptions });
														}}
														className="w-8 h-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
													>
														<Trash2 className="h-4 w-4" />
													</Button>
												</div>
											))}
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() => {
													const newOptions = [...(field.options || []), ''];
													updateField(field.id, { options: newOptions });
												}}
												className="w-full inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
											>
												<Plus className="h-4 w-4" />
												Add Option
											</Button>
										</div>
									</div>
								)}

								<div className="flex items-center space-x-2">
									<Checkbox
										id={`required-${field.id}`}
										checked={field.required}
										onCheckedChange={(checked) => updateField(field.id, { required: !!checked })}
									/>
									<Label htmlFor={`required-${field.id}`}>Required field</Label>
								</div>
							</>
						)}
					</div>
				</Card>
			</div>
		);
	};

	const renderField = (field: SimplifiedFormField, index: number) => {
		if (isPreview) {
			// Use theme-aware colors when use_default_colors is true
			const isDarkMode = useDefaultColors ? false : (backgroundColor === '#0A0A0A' || backgroundColor === 'transparent');
			const textColor = useDefaultColors ? 'hsl(var(--foreground))' : (isDarkMode ? '#ffffff' : '#1a1a1a');
			const mutedTextColor = useDefaultColors ? 'hsl(var(--muted-foreground))' : (isDarkMode ? '#a0a0a0' : '#6b7280');
			const borderColor = useDefaultColors ? 'hsl(var(--border))' : (isDarkMode ? '#374151' : '#d1d5db');
			const inputBgColor = useDefaultColors ? 'hsl(var(--input))' : (isDarkMode ? '#374151' : '#ffffff');

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
					return (
						<div key={field.id} className="space-y-2">
							<Label
								htmlFor={field.id}
								style={{ color: textColor }}
							>
								{field.label}
							</Label>
							<Input
								id={field.id}
								placeholder={field.placeholder || ''}
								required={field.required}
								className="border-2 focus:border-opacity-100 transition-colors"
								style={{
									backgroundColor: inputBgColor,
									borderColor: borderColor,
									color: textColor,
								}}
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
							</Label>
							<Input
								id={field.id}
								type="email"
								placeholder={field.placeholder || ''}
								required={field.required}
								className="border-2 focus:border-opacity-100 transition-colors"
								style={{
									backgroundColor: inputBgColor,
									borderColor: borderColor,
									color: textColor,
								}}
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
							</Label>
							<Input
								id={field.id}
								type="tel"
								placeholder={field.placeholder || ''}
								required={field.required}
								className="border-2 focus:border-opacity-100 transition-colors"
								style={{
									backgroundColor: inputBgColor,
									borderColor: borderColor,
									color: textColor,
								}}
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
							</Label>
							<Textarea
								id={field.id}
								placeholder={field.placeholder || ''}
								required={field.required}
								className="border-2 focus:border-opacity-100 transition-colors"
								style={{
									backgroundColor: inputBgColor,
									borderColor: borderColor,
									color: textColor,
								}}
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
							</Label>
							<Select>
								<SelectTrigger
									className="border-2 focus:border-opacity-100 transition-colors"
									style={{
										backgroundColor: inputBgColor,
										borderColor: borderColor,
										color: textColor,
									}}
								>
									<SelectValue placeholder={field.placeholder || 'Select an option'} />
								</SelectTrigger>
								<SelectContent>
									{field.options?.map((option, index) => (
										<SelectItem key={index} value={option}>
											{option}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					);

				case 'checkbox':
					return (
						<div key={field.id} className="flex items-center space-x-2">
							<Checkbox id={field.id} required={field.required} />
							<Label
								htmlFor={field.id}
								style={{ color: textColor }}
							>
								{field.label}
							</Label>
						</div>
					);

				default:
					return null;
			}
		}

		return (
			<Card key={field.id} className="p-4 space-y-4">
				<div className="flex items-center justify-between">
					<span className="text-sm font-medium text-gray-500">
						{field.type.charAt(0).toUpperCase() + field.type.slice(1)} Field
					</span>
					<div className="flex items-center space-x-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => deleteField(field.id)}
						>
							Delete
						</Button>
					</div>
				</div>

				{field.type === 'heading' || field.type === 'paragraph' ? (
					<div className="space-y-2">
						<Label htmlFor={`content-${field.id}`}>
							{field.type === 'heading' ? 'Heading Text' : 'Paragraph Text'}
						</Label>
						<Textarea
							id={`content-${field.id}`}
							value={field.content || ''}
							onChange={(e) => updateField(field.id, { content: e.target.value })}
							placeholder={field.type === 'heading' ? 'Enter heading text...' : 'Enter paragraph text...'}
						/>
					</div>
				) : (
					<>
						<div className="space-y-2">
							<Label htmlFor={`label-${field.id}`}>Field Label</Label>
							<Input
								id={`label-${field.id}`}
								value={field.label || ''}
								onChange={(e) => updateField(field.id, { label: e.target.value })}
								placeholder="Enter field label..."
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor={`placeholder-${field.id}`}>Placeholder Text</Label>
							<Input
								id={`placeholder-${field.id}`}
								value={field.placeholder || ''}
								onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
								placeholder="Enter placeholder text..."
							/>
						</div>

						{field.type === 'select' && (
							<div className="space-y-3">
								<Label>Options</Label>
								<div className="space-y-2">
									{(field.options || []).map((option, index) => (
										<div key={index} className="flex items-center gap-2">
											<Input
												value={option}
												onChange={(e) => {
													const newOptions = [...(field.options || [])];
													newOptions[index] = e.target.value;
													updateField(field.id, { options: newOptions });
												}}
												placeholder={`Option ${index + 1}`}
												className="flex-1"
											/>
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() => {
													const newOptions = (field.options || []).filter((_, i) => i !== index);
													updateField(field.id, { options: newOptions });
												}}
												className="w-8 h-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									))}
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => {
											const newOptions = [...(field.options || []), ''];
											updateField(field.id, { options: newOptions });
										}}
										className="w-full inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
									>
										<Plus className="h-4 w-4" />
										Add Option
									</Button>
								</div>
							</div>
						)}

						<div className="flex items-center space-x-2">
							<Checkbox
								id={`required-${field.id}`}
								checked={field.required}
								onCheckedChange={(checked) => updateField(field.id, { required: !!checked })}
							/>
							<Label htmlFor={`required-${field.id}`}>Required field</Label>
						</div>
					</>
				)}
			</Card>
		);
	};

	if (isLoading) {
		return <div className="p-4">Loading form...</div>;
	}

	return (
		<div className={`${!isPreview ? 'max-w-4xl mx-auto p-6' : ''}  space-y-6`}>
			<div className={`flex items-center justify-between ${isPreview ? 'px-6 pt-6' : ''}`}>
				<h1 className="text-2xl font-bold">
					{currentForm ? 'Edit Form' : 'Create New Form'}
				</h1>
				<div className="flex items-center space-x-2">
					<Button
						variant={isPreview ? "default" : "outline"}
						onClick={() => setIsPreview(!isPreview)}
						className={isPreview ? "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white shadow hover:shadow-lg bg-gradient-to-r from-indigo-500 to-violet-500" : ""}
					>
						{isPreview ? 'Edit' : 'Preview'}
					</Button>
					<Button
						onClick={saveForm}
						disabled={isSaving}
						className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white shadow hover:shadow-lg bg-gradient-to-r from-indigo-500 to-violet-500"
					>
						{isSaving ? 'Saving...' : 'Save Form'}
					</Button>
				</div>
			</div>

			{!isPreview && (
				<>
					<Card className="p-4 space-y-4">
						<div className="space-y-2">
							<Label htmlFor="form-title">Form Title</Label>
							<Input
								id="form-title"
								value={formTitle}
								onChange={(e) => setFormTitle(e.target.value)}
								placeholder="Enter form title..."
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="form-description">Form Description</Label>
							<Textarea
								id="form-description"
								value={formDescription}
								onChange={(e) => setFormDescription(e.target.value)}
								placeholder="Enter form description..."
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="form-type">Form Type</Label>
							<Select value={formType} onValueChange={(value: 'single' | 'multi-step') => setFormType(value)}>
								<SelectTrigger>
									<SelectValue placeholder="Select form type" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="single">Single Form</SelectItem>
									<SelectItem value="multi-step">Multi-Step Form</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</Card>

					{/* Branding Settings */}
					<Card className="p-4 space-y-4">
						<h3 className="text-lg font-semibold">Branding Settings</h3>

						<div className="flex items-center space-x-2">
							<Checkbox
								id="use-default-colors"
								checked={useDefaultColors}
								onCheckedChange={(checked) => setUseDefaultColors(!!checked)}
							/>
							<Label htmlFor="use-default-colors" className="text-sm">
								Use default color settings for new forms
							</Label>
						</div>
						<p className="text-xs text-muted-foreground">
							When enabled, new forms will automatically use the default color scheme (#645EFF primary, transparent background)
						</p>

						<div className="space-y-2">
							<Label>Organization Logo</Label>

							{/* Image Upload Area */}
							<div
								className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
								onClick={() => fileInputRef.current?.click()}
								onDrop={handleImageDrop}
								onDragOver={handleDragOver}
							>
								<input
									ref={fileInputRef}
									type="file"
									accept="image/*"
									onChange={handleImageUpload}
									className="hidden"
								/>

								{logoUrl ? (
									<div className="space-y-3">
										<div className="flex justify-center">
											<div className="relative">
												<img
													src={logoUrl}
													alt="Organization Logo"
													className="h-16 w-16 object-contain rounded-lg border"
												/>
												<Button
													type="button"
													variant="destructive"
													size="sm"
													className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
													onClick={(e) => {
														e.stopPropagation();
														clearLogo();
													}}
												>
													<X className="h-3 w-3" />
												</Button>
											</div>
										</div>
										<p className="text-sm text-muted-foreground">
											Click to change logo or drag & drop a new image
										</p>
									</div>
								) : (
									<div className="space-y-3">
										<ImageIcon className="h-8 w-8 mx-auto text-muted-foreground" />
										<div>
											<p className="text-sm font-medium">Upload your logo</p>
											<p className="text-xs text-muted-foreground">
												Click to browse or drag & drop an image file
											</p>
										</div>
									</div>
								)}
							</div>

							{/* URL Input as Alternative */}
							<div className="space-y-2">
								<Label htmlFor="logo-url" className="text-sm text-muted-foreground">
									Or enter a URL:
								</Label>
								<Input
									id="logo-url"
									value={logoUrl.startsWith('data:') ? '' : logoUrl}
									onChange={(e) => setLogoUrl(e.target.value)}
									placeholder="https://example.com/logo.png"
									className="text-sm"
								/>
							</div>

							<p className="text-xs text-muted-foreground">
								Supported formats: JPG, PNG, GIF, SVG. Max size: 5MB
							</p>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{/* Primary Color */}
							<div className="space-y-3">
								<Label>Primary Color</Label>
								<div className="space-y-3">
									{/* Current Color Display */}
									<div className="flex items-center space-x-3">
										<div
											className="w-12 h-12 rounded-lg border-2 border-border shadow-sm cursor-pointer"
											style={{ backgroundColor: primaryColor }}
											onClick={() => {
												setTempColor(primaryColor);
												setShowColorPicker('primary');
											}}
										/>
										<div className="flex-1">
											<Input
												value={primaryColor}
												onChange={(e) => setPrimaryColor(e.target.value)}
												placeholder="#000000"
												className="font-mono text-sm"
											/>
										</div>
										<Button
											variant="outline"
											size="sm"
											onClick={() => {
												setTempColor(primaryColor);
												setShowColorPicker('primary');
											}}
										>
											Pick Color
										</Button>
									</div>

									{/* Preset Colors */}
									<div className="space-y-2">
										<p className="text-sm text-muted-foreground">Preset Colors:</p>
										<div className="grid grid-cols-5 gap-2">
											{primaryColorPresets.map((preset) => (
												<button
													key={preset.value}
													type="button"
													onClick={() => setPrimaryColor(preset.value)}
													className={`w-8 h-8 rounded-md border-2 transition-all hover:scale-110 ${primaryColor === preset.value
														? 'border-foreground ring-2 ring-foreground ring-offset-2'
														: 'border-border hover:border-foreground/50'
														}`}
													style={{ backgroundColor: preset.value }}
													title={preset.name}
												/>
											))}
										</div>
									</div>
								</div>
							</div>

							{/* Background Color */}
							<div className="space-y-3">
								<Label>Background Color</Label>
								<div className="space-y-3">
									{/* Current Color Display */}
									<div className="flex items-center space-x-3">
										<div
											className="w-12 h-12 rounded-lg border-2 border-border shadow-sm cursor-pointer"
											style={{ backgroundColor: backgroundColor }}
											onClick={() => {
												setTempColor(backgroundColor);
												setShowColorPicker('background');
											}}
										/>
										<div className="flex-1">
											<Input
												value={backgroundColor}
												onChange={(e) => setBackgroundColor(e.target.value)}
												placeholder="transparent"
												className="font-mono text-sm"
											/>
										</div>
										<Button
											variant="outline"
											size="sm"
											onClick={() => {
												setTempColor(backgroundColor);
												setShowColorPicker('background');
											}}
										>
											Pick Color
										</Button>
									</div>

									{/* Preset Colors */}
									<div className="space-y-2">
										<p className="text-sm text-muted-foreground">Preset Colors:</p>
										<div className="grid grid-cols-5 gap-2">
											{backgroundColorPresets.map((preset) => (
												<button
													key={preset.value}
													type="button"
													onClick={() => setBackgroundColor(preset.value)}
													className={`w-8 h-8 rounded-md border-2 transition-all hover:scale-110 ${backgroundColor === preset.value
														? 'border-foreground ring-2 ring-foreground ring-offset-2'
														: 'border-border hover:border-foreground/50'
														}`}
													style={{ backgroundColor: preset.value }}
													title={preset.name}
												/>
											))}
										</div>
									</div>
								</div>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="font-family">Font Family</Label>
							<Select value={fontFamily} onValueChange={setFontFamily}>
								<SelectTrigger>
									<SelectValue placeholder="Select a font" />
								</SelectTrigger>
								<SelectContent>
									{fontOptions.map((font) => (
										<SelectItem key={font.value} value={font.value}>
											<span className={font.cssClass || ''} style={font.cssClass ? {} : { fontFamily: font.value }}>
												{font.label}
											</span>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<p className="text-xs text-muted-foreground">
								Choose the font family for your form text
							</p>
						</div>
					</Card>
				</>
			)}

			{isPreview && (
				<div
					className="p-6 min-h-screen"
					style={{ backgroundColor, fontFamily }}
				>
					{/* Header Card with Logo */}
					<Card
						className={`max-w-2xl mx-auto mb-6 p-4 shadow-lg border-0 ${useDefaultColors ? 'bg-card' : ''
							}`}
						style={{
							backgroundColor: useDefaultColors ? undefined : (backgroundColor === 'transparent' ? 'transparent' : (backgroundColor === '#0A0A0A' ? '#1a1a1a' : '#ffffff')),
							borderColor: useDefaultColors ? 'hsl(var(--border))' : (primaryColor + '20')
						}}
					>
						<div className="flex items-center justify-between">
							<div className="flex-1">
								<h1
									className={`text-xl font-semibold ${useDefaultColors ? 'text-foreground' : ''}`}
									style={{ color: useDefaultColors ? undefined : (backgroundColor === '#0A0A0A' ? '#ffffff' : '#1a1a1a') }}
								>
									{formTitle}
								</h1>
								{formDescription && (
									<p
										className={`text-sm mt-1 ${useDefaultColors ? 'text-muted-foreground' : ''}`}
										style={{ color: useDefaultColors ? undefined : (backgroundColor === '#0A0A0A' ? '#a0a0a0' : '#6b7280') }}
									>
										{formDescription}
									</p>
								)}
							</div>
							{logoUrl && (
								<div className="ml-4">
									<div
										className="h-16 w-16 rounded-lg flex items-center justify-center"
										style={{
											backgroundColor: useDefaultColors
												? 'hsl(var(--muted-foreground))'
												: (backgroundColor === '#0A0A0A' ? '#1f2937' : '#e5e7eb')
										}}
									>
										<img
											src={logoUrl}
											alt="Organization Logo"
											className="h-14 w-14 object-contain"
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

					{/* Form Content Card */}
					<Card
						className={`max-w-2xl mx-auto p-6 shadow-xl border-0 ${useDefaultColors ? 'bg-card' : ''
							}`}
						style={{
							backgroundColor: useDefaultColors ? undefined : (backgroundColor === 'transparent' ? 'transparent' : (backgroundColor === '#0A0A0A' ? '#1a1a1a' : '#ffffff')),
							borderColor: useDefaultColors ? 'hsl(var(--border))' : (primaryColor + '20')
						}}
					>
						<form className="space-y-6">
							{/* Step Progress Indicator */}
							{formType === 'multi-step' && steps.length > 0 && (
								<div className="mb-6">
									<div className="flex items-center justify-between mb-2">
										<span className="text-sm font-medium text-muted-foreground">
											Step {1} of {steps.length}
										</span>
									</div>
									<div className="w-full bg-muted rounded-full h-2">
										<div
											className="h-2 rounded-full transition-all duration-300"
											style={{
												width: `${(1 / steps.length) * 100}%`,
												backgroundColor: useDefaultColors ? 'hsl(var(--primary))' : primaryColor
											}}
										/>
									</div>
								</div>
							)}

							<div className="space-y-4">
								<DndContext
									sensors={sensors}
									collisionDetection={closestCenter}
									onDragStart={handleDragStart}
									onDragEnd={handleDragEnd}
								>
									<SortableContext
										items={fields.map(field => field.id)}
										strategy={verticalListSortingStrategy}
									>
										{fields
											.sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
											.map((field, index) => (
												<SortableField key={field.id} field={field} index={index} />
											))}
									</SortableContext>
								</DndContext>
							</div>
						</form>
					</Card>
				</div>
			)}

			{!isPreview && (
				<>
					{formType === 'multi-step' && (
						<Card className="p-4">
							<div className="flex items-center justify-between mb-4">
								<h3 className="text-lg font-semibold">Form Steps</h3>
								<Button
									onClick={addStep}
									className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white shadow hover:shadow-lg bg-gradient-to-r from-indigo-500 to-violet-500"
								>
									+ Add Step
								</Button>
							</div>
							<div className="space-y-4">
								{steps
									.sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
									.map((step, index) => (
										<Card key={step.id} className="p-4">
											<div className="flex items-center justify-between mb-4">
												<span className="text-sm font-medium text-gray-500">
													Step {index + 1}
												</span>
												<Button
													variant="outline"
													size="sm"
													onClick={() => deleteStep(step.id)}
												>
													Delete Step
												</Button>
											</div>
											<div className="space-y-4">
												<div className="space-y-2">
													<Label htmlFor={`step-title-${step.id}`}>Step Title</Label>
													<Input
														id={`step-title-${step.id}`}
														value={step.title}
														onChange={(e) => updateStep(step.id, { title: e.target.value })}
														placeholder="Enter step title..."
													/>
												</div>
												<div className="space-y-2">
													<Label htmlFor={`step-description-${step.id}`}>Step Description</Label>
													<Textarea
														id={`step-description-${step.id}`}
														value={step.description || ''}
														onChange={(e) => updateStep(step.id, { description: e.target.value })}
														placeholder="Enter step description..."
													/>
												</div>
												<div className="space-y-4">
													<div className="flex items-center justify-between">
														<h4 className="text-md font-medium">Step Fields</h4>
														<div className="flex flex-wrap gap-2">
															<Button
																size="sm"
																onClick={() => addField('text', step.id)}
																className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium text-white shadow hover:shadow-lg bg-gradient-to-r from-indigo-500 to-violet-500"
															>
																+ Text
															</Button>
															<Button
																size="sm"
																onClick={() => addField('email', step.id)}
																className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium text-white shadow hover:shadow-lg bg-gradient-to-r from-indigo-500 to-violet-500"
															>
																+ Email
															</Button>
															<Button
																size="sm"
																onClick={() => addField('phone', step.id)}
																className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium text-white shadow hover:shadow-lg bg-gradient-to-r from-indigo-500 to-violet-500"
															>
																+ Phone
															</Button>
															<Button
																size="sm"
																onClick={() => addField('select', step.id)}
																className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium text-white shadow hover:shadow-lg bg-gradient-to-r from-indigo-500 to-violet-500"
															>
																+ Select
															</Button>
															<Button
																size="sm"
																onClick={() => addField('checkbox', step.id)}
																className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium text-white shadow hover:shadow-lg bg-gradient-to-r from-indigo-500 to-violet-500"
															>
																+ Checkbox
															</Button>
															<Button
																size="sm"
																onClick={() => addField('textarea', step.id)}
																className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium text-white shadow hover:shadow-lg bg-gradient-to-r from-indigo-500 to-violet-500"
															>
																+ Textarea
															</Button>
															<Button
																size="sm"
																onClick={() => addField('heading', step.id)}
																className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium text-white shadow hover:shadow-lg bg-gradient-to-r from-indigo-500 to-violet-500"
															>
																+ Heading
															</Button>
															<Button
																size="sm"
																onClick={() => addField('paragraph', step.id)}
																className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium text-white shadow hover:shadow-lg bg-gradient-to-r from-indigo-500 to-violet-500"
															>
																+ Paragraph
															</Button>
														</div>
													</div>
													<div className="space-y-4">
														<DndContext
															sensors={sensors}
															collisionDetection={closestCenter}
															onDragEnd={handleDragEnd}
														>
															<SortableContext
																items={fields.filter(field => field.step_id === step.id).map(field => field.id)}
																strategy={verticalListSortingStrategy}
															>
																{fields
																	.filter(field => field.step_id === step.id)
																	.sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
																	.map((field, fieldIndex) => (
																		<SortableField key={field.id} field={field} index={fieldIndex} />
																	))}
															</SortableContext>
														</DndContext>
													</div>
												</div>
											</div>
										</Card>
									))}
							</div>
						</Card>
					)}

					{formType !== 'multi-step' && (
						<Card className="p-4">
							<div className="flex items-center justify-between mb-4">
								<h3 className="text-lg font-semibold">
									Form Fields
								</h3>
								<div className="flex flex-wrap gap-2">
									<Button
										size="sm"
										onClick={() => addField('text')}
										className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium text-white shadow hover:shadow-lg bg-gradient-to-r from-indigo-500 to-violet-500"
									>
										+ Text
									</Button>
									<Button
										size="sm"
										onClick={() => addField('email')}
										className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium text-white shadow hover:shadow-lg bg-gradient-to-r from-indigo-500 to-violet-500"
									>
										+ Email
									</Button>
									<Button
										size="sm"
										onClick={() => addField('phone')}
										className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium text-white shadow hover:shadow-lg bg-gradient-to-r from-indigo-500 to-violet-500"
									>
										+ Phone
									</Button>
									<Button
										size="sm"
										onClick={() => addField('select')}
										className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium text-white shadow hover:shadow-lg bg-gradient-to-r from-indigo-500 to-violet-500"
									>
										+ Select
									</Button>
									<Button
										size="sm"
										onClick={() => addField('checkbox')}
										className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium text-white shadow hover:shadow-lg bg-gradient-to-r from-indigo-500 to-violet-500"
									>
										+ Checkbox
									</Button>
									<Button
										size="sm"
										onClick={() => addField('textarea')}
										className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium text-white shadow hover:shadow-lg bg-gradient-to-r from-indigo-500 to-violet-500"
									>
										+ Textarea
									</Button>
									<Button
										size="sm"
										onClick={() => addField('heading')}
										className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium text-white shadow hover:shadow-lg bg-gradient-to-r from-indigo-500 to-violet-500"
									>
										+ Heading
									</Button>
									<Button
										size="sm"
										onClick={() => addField('paragraph')}
										className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium text-white shadow hover:shadow-lg bg-gradient-to-r from-indigo-500 to-violet-500"
									>
										+ Paragraph
									</Button>
								</div>
							</div>
							<div className="space-y-4">
								<DndContext
									sensors={sensors}
									collisionDetection={closestCenter}
									onDragStart={handleDragStart}
									onDragEnd={handleDragEnd}
								>
									<SortableContext
										items={fields.filter(field => !field.step_id).map(field => field.id)}
										strategy={verticalListSortingStrategy}
									>
										{fields
											.filter(field => !field.step_id)
											.sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
											.map((field, index) => (
												<SortableField key={field.id} field={field} index={index} />
											))}
									</SortableContext>
								</DndContext>
							</div>
						</Card>
					)}
				</>
			)}

			{/* Advanced Color Pickers */}
			<AdvancedColorPicker
				label="Primary Color"
				currentColor={tempColor}
				onColorChange={(color) => {
					if (showColorPicker === 'primary') {
						setPrimaryColor(color);
					} else if (showColorPicker === 'background') {
						setBackgroundColor(color);
					}
				}}
				isOpen={showColorPicker === 'primary'}
				onClose={() => setShowColorPicker(null)}
			/>

			<AdvancedColorPicker
				label="Background Color"
				currentColor={tempColor}
				onColorChange={(color) => {
					if (showColorPicker === 'primary') {
						setPrimaryColor(color);
					} else if (showColorPicker === 'background') {
						setBackgroundColor(color);
					}
				}}
				isOpen={showColorPicker === 'background'}
				onClose={() => setShowColorPicker(null)}
			/>
		</div>
	);
}