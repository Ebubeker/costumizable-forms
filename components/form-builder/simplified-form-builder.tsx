'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import { Upload, X, Image as ImageIcon, Copy, Plus, Trash2, GripVertical, Eye, Info } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import FormPreviewModal from '@/components/form-preview-modal';
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
	const [primaryColor, setPrimaryColor] = useState("#F6EDE4");
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

	// Preview modal state
	const [showPreviewModal, setShowPreviewModal] = useState(false);

	// Local state for all form changes (no backend updates until preview)
	const [localFields, setLocalFields] = useState<SimplifiedFormField[]>([]);
	const [localSteps, setLocalSteps] = useState<FormStep[]>([]);
	const [localFormTitle, setLocalFormTitle] = useState("");
	const [localFormDescription, setLocalFormDescription] = useState("");
	const [localFormType, setLocalFormType] = useState<'single' | 'multi-step'>('single');

	// Local branding settings
	const [localLogoUrl, setLocalLogoUrl] = useState("");
	const [localPrimaryColor, setLocalPrimaryColor] = useState("#F6EDE4");
	const [localBackgroundColor, setLocalBackgroundColor] = useState("transparent");
	const [localUseDefaultColors, setLocalUseDefaultColors] = useState(true);
	const [localFontFamily, setLocalFontFamily] = useState("Arial");

	// Function to sync local changes to actual state before preview
	const syncLocalChangesToState = useCallback(() => {
		setFormTitle(localFormTitle);
		setFormDescription(localFormDescription);
		setFormType(localFormType);
		setFields(localFields);
		setSteps(localSteps);
		setLogoUrl(localLogoUrl);
		setPrimaryColor(localPrimaryColor);
		setBackgroundColor(localBackgroundColor);
		setFontFamily(localFontFamily);
		setUseDefaultColors(localUseDefaultColors);
	}, [localFormTitle, localFormDescription, localFormType, localFields, localSteps, localLogoUrl, localPrimaryColor, localBackgroundColor, localFontFamily, localUseDefaultColors]);

	// Helper function to get field descriptions
	const getFieldDescription = useCallback((fieldType: SimplifiedFormField['type']) => {
		const descriptions = {
			text: "A single-line text input field for short text responses like names, titles, or brief answers.",
			email: "An email input field with built-in validation to ensure proper email format.",
			phone: "A phone number input field optimized for telephone number entry with formatting.",
			select: "A dropdown menu allowing users to choose from predefined options. Perfect for categories or choices.",
			checkbox: "A checkbox for yes/no questions or terms acceptance. Users can check or uncheck the option.",
			textarea: "A message field for longer responses like comments, descriptions, or detailed feedback.",
			heading: "A heading element to organize and structure your form with titles or section breaks.",
			paragraph: "A paragraph element to add explanatory text, instructions, or additional information."
		};
		return descriptions[fieldType] || "A form field for collecting user input.";
	}, []);

	// Simple local update functions (no debouncing needed)
	const handleFieldUpdate = useCallback((fieldId: string, updates: Partial<SimplifiedFormField>) => {
		setLocalFields(prevFields => prevFields.map(field =>
			field.id === fieldId ? { ...field, ...updates } : field
		));
	}, []);

	const handleStepUpdate = useCallback((stepId: string, updates: Partial<FormStep>) => {
		setLocalSteps(prevSteps => prevSteps.map(step =>
			step.id === stepId ? { ...step, ...updates } : step
		));
	}, []);

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
		{ name: "Warm Cream", value: "#F6EDE4" },
		{ name: "Golden Beige", value: "#F6E5BA" },
		{ name: "Peach", value: "#F3D2B3" },
		{ name: "Lavender", value: "#DED2E0" },
		{ name: "Mint Green", value: "#CCDECC" }
	];

	const backgroundColorPresets = [
		{ name: "Deep Teal", value: "#1D434B" },
		{ name: "Muted Rose", value: "#9C5B5F" },
		{ name: "Golden Brown", value: "#C49B43" },
		{ name: "Dark Purple", value: "#462E44" },
		{ name: "Olive Green", value: "#4D532F" },
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
			setLocalFormType(initialTemplate.formType);

			// Set form title based on template
			setFormTitle(initialTemplate.name);
			setLocalFormTitle(initialTemplate.name);
			setFormDescription(`Form created from ${initialTemplate.name} template`);
			setLocalFormDescription(`Form created from ${initialTemplate.name} template`);

			// Set fields from template
			setFields(initialTemplate.fields);
			setLocalFields(initialTemplate.fields);

			// Set steps if it's a multi-step form
			if (initialTemplate.formType === 'multi-step' && initialTemplate.steps) {
				setSteps(initialTemplate.steps);
				setLocalSteps(initialTemplate.steps);
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
				setLocalFormTitle(form.title);
				setFormDescription(form.description || "");
				setLocalFormDescription(form.description || "");

				// Load branding settings
				const settings = form.settings || {};
				setLogoUrl(settings.logoUrl || "");
				setLocalLogoUrl(settings.logoUrl || "");
				setPrimaryColor(settings.primaryColor || "#645EFF");
				setLocalPrimaryColor(settings.primaryColor || "#645EFF");
				setBackgroundColor(settings.backgroundColor || "transparent");
				setLocalBackgroundColor(settings.backgroundColor || "transparent");
				setFontFamily(settings.fontFamily || "Arial");
				setLocalFontFamily(settings.fontFamily || "Arial");
				setUseDefaultColors((form as any).use_default_colors !== false);
				setLocalUseDefaultColors((form as any).use_default_colors !== false);

				// If form_type is multi-step but no steps exist, treat as single
				const hasSteps = form.steps && form.steps.length > 0;
				const formType = form.form_type || 'single';
				const actualFormType = (formType === 'multi-step' && !hasSteps) ? 'single' : formType;

				setFormType(actualFormType);
				setLocalFormType(actualFormType);

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
				setLocalSteps(sessionSteps);

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
				setLocalFields(sessionFields);
			}
		} catch (error) {
			console.error('Error loading form:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const saveForm = async () => {
		if (!localFormTitle.trim()) {
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
			// Sync local changes to state before saving
			syncLocalChangesToState();

			const formData = {
				title: localFormTitle,
				description: localFormDescription,
				company_id: companyId,
				form_type: localFormType,
				use_default_colors: localUseDefaultColors,
				settings: {
					logoUrl: localLogoUrl,
					primaryColor: localPrimaryColor,
					backgroundColor: localBackgroundColor,
					fontFamily: localFontFamily
				},
				steps: localFormType === 'multi-step' ? localSteps.map(step => ({
					id: step.id,
					title: step.title,
					description: step.description,
					order_index: step.order_index
				})) : [],
				fields: localFields.map(field => ({
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
		const relevantFields = localFields.filter(field =>
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
		setLocalFields([...localFields, newField]);
	};

	const handleDragStart = (event: any) => {
		// Prevent any default behavior that might cause scrolling
		event.preventDefault?.();
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		if (over && active.id !== over.id) {
			const oldIndex = localFields.findIndex(field => field.id === active.id);
			const newIndex = localFields.findIndex(field => field.id === over.id);

			const reorderedFields = arrayMove(localFields, oldIndex, newIndex);

			// Update order_index for all fields
			const updatedFields = reorderedFields.map((field, index) => ({
				...field,
				order_index: index
			}));

			setLocalFields(updatedFields);
		}
	};

	const addStep = () => {
		const newStep: FormStep = {
			id: `step-${Date.now()}`,
			title: `Step ${localSteps.length + 1}`,
			description: '',
			order_index: localSteps.length,
		};
		setLocalSteps([...localSteps, newStep]);
	};

	const updateStep = useCallback((stepId: string, updates: Partial<FormStep>) => {
		setSteps(prevSteps => prevSteps.map(step =>
			step.id === stepId ? { ...step, ...updates } : step
		));
	}, []);

	const deleteStep = useCallback((stepId: string) => {
		setLocalSteps(prevSteps => prevSteps.filter(step => step.id !== stepId));
		setLocalFields(prevFields => prevFields.filter(field => field.step_id !== stepId));
	}, []);

	const updateField = useCallback((fieldId: string, updates: Partial<SimplifiedFormField>) => {
		setFields(prevFields => prevFields.map(field =>
			field.id === fieldId ? { ...field, ...updates } : field
		));
	}, []);

	const deleteField = useCallback((fieldId: string) => {
		setLocalFields(prevFields => prevFields.filter(field => field.id !== fieldId));
	}, []);

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
				setLocalLogoUrl(result);
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
				setLocalLogoUrl(result);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
	};

	const clearLogo = () => {
		setLogoUrl("");
		setLocalLogoUrl("");
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
	const SortableField = useCallback(({ field, index }: { field: SimplifiedFormField; index: number }) => {
		const {
			attributes,
			listeners,
			setNodeRef,
			transform,
			transition,
			isDragging,
		} = useSortable({ id: field.id });

		const style = useMemo(() => ({
			transform: CSS.Transform.toString(transform),
			transition,
			opacity: isDragging ? 0.5 : 1,
		}), [transform, transition, isDragging]);

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
							<div className="flex items-center gap-2">
								<h3 className="text-lg font-semibold capitalize">
									{field.type === 'heading' ? 'Heading' : field.type === 'paragraph' ? 'Paragraph' : field.type === 'textarea' ? 'Message Field' : `${field.type} Field`}
								</h3>
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<Info className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
										</TooltipTrigger>
										<TooltipContent className="max-w-xs">
											<p className="text-sm">{getFieldDescription(field.type)}</p>
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							</div>
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
										onChange={(e) => handleFieldUpdate(field.id, { content: e.target.value })}
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
										onChange={(e) => handleFieldUpdate(field.id, { label: e.target.value })}
										placeholder="Enter field label..."
									/>
								</div>

								<div className="space-y-1">
									<Label htmlFor={`placeholder-${field.id}`}>Placeholder Text</Label>
									<Input
										id={`placeholder-${field.id}`}
										value={field.placeholder || ''}
										onChange={(e) => handleFieldUpdate(field.id, { placeholder: e.target.value })}
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
															handleFieldUpdate(field.id, { options: newOptions });
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
															handleFieldUpdate(field.id, { options: newOptions });
														}}
														className="w-8 h-8 p-0 min-w-8 min-h-8 max-w-8 max-h-8 text-red-500 hover:text-red-700 hover:bg-red-50"
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
													handleFieldUpdate(field.id, { options: newOptions });
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
										onCheckedChange={(checked) => handleFieldUpdate(field.id, { required: !!checked })}
									/>
									<Label htmlFor={`required-${field.id}`}>Required field</Label>
								</div>
							</>
						)}
					</div>
				</Card>
			</div>
		);
	}, [deleteField, getFieldDescription, handleFieldUpdate]);

	// Memoize sorted fields to prevent unnecessary re-sorting
	const sortedFields = useMemo(() =>
		localFields.sort((a, b) => (a.order_index || 0) - (b.order_index || 0)),
		[localFields]
	);

	// Memoize sorted steps to prevent unnecessary re-sorting
	const sortedSteps = useMemo(() =>
		localSteps.sort((a, b) => (a.order_index || 0) - (b.order_index || 0)),
		[localSteps]
	);

	const renderField = useCallback((field: SimplifiedFormField, index: number) => {
		if (isPreview) {
			// Use theme-aware colors when use_default_colors is true
			const isDarkMode = localUseDefaultColors ? false : (localBackgroundColor === '#0A0A0A' || localBackgroundColor === 'transparent');
			const textColor = localUseDefaultColors ? 'hsl(var(--foreground))' : (isDarkMode ? '#ffffff' : '#1a1a1a');
			const mutedTextColor = localUseDefaultColors ? 'hsl(var(--muted-foreground))' : (isDarkMode ? '#a0a0a0' : '#6b7280');
			const borderColor = localUseDefaultColors ? 'hsl(var(--border))' : (isDarkMode ? '#374151' : '#d1d5db');
			const inputBgColor = localUseDefaultColors ? 'hsl(var(--input))' : (isDarkMode ? '#374151' : '#ffffff');

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
								<SelectContent
									className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
									style={{
										backgroundColor: localUseDefaultColors ? undefined : (localBackgroundColor === '#0A0A0A' ? '#1a1a1a' : '#ffffff'),
										borderColor: localUseDefaultColors ? undefined : borderColor,
									}}
								>
									{field.options?.map((option, index) => (
										<SelectItem
											key={index}
											value={option}
											className="hover:bg-gray-100 dark:hover:bg-gray-700"
											style={{
												color: localUseDefaultColors ? undefined : textColor,
											}}
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
							onChange={(e) => handleFieldUpdate(field.id, { content: e.target.value })}
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
								onChange={(e) => handleFieldUpdate(field.id, { label: e.target.value })}
								placeholder="Enter field label..."
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor={`placeholder-${field.id}`}>Placeholder Text</Label>
							<Input
								id={`placeholder-${field.id}`}
								value={field.placeholder || ''}
								onChange={(e) => handleFieldUpdate(field.id, { placeholder: e.target.value })}
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
													handleFieldUpdate(field.id, { options: newOptions });
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
													handleFieldUpdate(field.id, { options: newOptions });
												}}
												className="w-8 h-8 p-0 min-w-8 min-h-8 max-w-8 max-h-8 text-red-500 hover:text-red-700 hover:bg-red-50"
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
											handleFieldUpdate(field.id, { options: newOptions });
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
								onCheckedChange={(checked) => handleFieldUpdate(field.id, { required: !!checked })}
							/>
							<Label htmlFor={`required-${field.id}`}>Required field</Label>
						</div>
					</>
				)}
			</Card>
		);
	}, [isPreview, localUseDefaultColors, localBackgroundColor, localPrimaryColor, handleFieldUpdate, updateField]);

	if (isLoading) {
		return <div className="p-4">Loading form...</div>;
	}

	return (
		<div className={`${!isPreview ? 'max-w-4xl mx-auto p-6 pb-40' : ''}  space-y-6`}>
			<div className={`flex items-center justify-between ${isPreview ? 'px-6 pt-6' : ''}`}>
				<h1 className="text-2xl font-bold">
					{currentForm ? 'Edit Form' : 'Create New Form'}
				</h1>
				<div className="flex items-center space-x-2">
					<Button
						onClick={saveForm}
						disabled={isSaving}
						className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white shadow hover:shadow-lg bg-gradient-to-r from-indigo-500 to-violet-500"
					>
						{isSaving ? 'Saving...' : 'Save Form'}
					</Button>
				</div>
			</div>

			{/* Fixed Preview Alert - Bottom Right */}
			{!isPreview && (
				<div className="fixed bottom-4 right-4 z-50 w-full max-w-sm bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 shadow-lg">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
								<Eye className="h-4 w-4 text-white" />
							</div>
							<div>
								<h3 className="font-semibold text-blue-900 dark:text-blue-100">
									Preview the changes
								</h3>
								<p className="text-sm text-blue-700 dark:text-blue-300">
									See how your form will look to users before saving
								</p>
							</div>
						</div>
						<Button
							onClick={() => {
								syncLocalChangesToState();
								setShowPreviewModal(true);
							}}
							className="bg-blue-500 hover:bg-blue-600 text-white"
						>
							<Eye className="h-4 w-4 mr-2" />
							Preview
						</Button>
					</div>
				</div>
			)}

			{!isPreview && (
				<>
					<Card className="p-4 space-y-4">
						<div className="space-y-2">
							<Label htmlFor="form-title">Form Title</Label>
							<Input
								id="form-title"
								value={localFormTitle}
								onChange={(e) => setLocalFormTitle(e.target.value)}
								placeholder="Enter form title..."
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="form-description">Form Description</Label>
							<Textarea
								id="form-description"
								value={localFormDescription}
								onChange={(e) => setLocalFormDescription(e.target.value)}
								placeholder="Enter form description..."
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="form-type">Form Type</Label>
							<Select value={localFormType} onValueChange={(value: 'single' | 'multi-step') => setLocalFormType(value)}>
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
									value={localLogoUrl.startsWith('data:') ? '' : localLogoUrl}
									onChange={(e) => setLocalLogoUrl(e.target.value)}
									placeholder="https://example.com/logo.png"
									className="text-sm"
								/>
							</div>

							<p className="text-xs text-muted-foreground">
								Supported formats: JPG, PNG, GIF, SVG. Max size: 5MB
							</p>
						</div>

						{/* Use Default Colors Checkbox */}
						<div className="space-y-2">
							<div className="flex items-center space-x-2">
								<Checkbox
									id="use-default-colors"
									checked={localUseDefaultColors}
									onCheckedChange={(checked) => setLocalUseDefaultColors(!!checked)}
								/>
								<Label htmlFor="use-default-colors" className="text-sm">
									Use default color settings for new forms (Uncheck to use custom colors)
								</Label>
							</div>
							<p className="text-xs text-muted-foreground">
								When enabled, new forms will automatically use the default color scheme (#645EFF primary, transparent background)
							</p>
						</div>

						{/* Color Settings - Only show when default colors is disabled */}
						{!localUseDefaultColors && (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								{/* Primary Color */}
								<div className="space-y-3">
									<Label>Primary Color</Label>
									<div className="space-y-3">
										{/* Current Color Display */}
										<div className="flex items-center space-x-3">
											<div
												className="w-12 h-12 rounded-lg border-2 border-border shadow-sm cursor-pointer"
												style={{ backgroundColor: localPrimaryColor }}
												onClick={() => {
													setTempColor(localPrimaryColor);
													setShowColorPicker('primary');
												}}
											/>
											<div className="flex-1">
												<Input
													value={localPrimaryColor}
													onChange={(e) => setLocalPrimaryColor(e.target.value)}
													placeholder="#000000"
													className="font-mono text-sm"
												/>
											</div>
											<Button
												variant="outline"
												size="sm"
												onClick={() => {
													setTempColor(localPrimaryColor);
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
														onClick={() => setLocalPrimaryColor(preset.value)}
														className={`w-8 h-8 rounded-md border-2 transition-all hover:scale-110 ${localPrimaryColor === preset.value
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
												style={{ backgroundColor: localBackgroundColor }}
												onClick={() => {
													setTempColor(localBackgroundColor);
													setShowColorPicker('background');
												}}
											/>
											<div className="flex-1">
												<Input
													value={localBackgroundColor}
													onChange={(e) => setLocalBackgroundColor(e.target.value)}
													placeholder="transparent"
													className="font-mono text-sm"
												/>
											</div>
											<Button
												variant="outline"
												size="sm"
												onClick={() => {
													setTempColor(localBackgroundColor);
													setShowColorPicker('background');
												}}
											>
												Pick Color
											</Button>
										</div>

										{/* Preset Colors */}
										<div className="space-y-2">
											<p className="text-sm text-muted-foreground">Preset Colors:</p>
											<div className="grid grid-cols-6 gap-2">
												{backgroundColorPresets.map((preset) => (
													<button
														key={preset.value}
														type="button"
														onClick={() => setLocalBackgroundColor(preset.value)}
														className={`w-8 h-8 rounded-md border-2 transition-all hover:scale-110 ${localBackgroundColor === preset.value
															? 'border-foreground ring-2 ring-foreground ring-offset-2'
															: preset.value === 'transparent'
																? 'border-red-500 hover:border-red-600'
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
						)}

						{/* Font Family - Always visible */}
						<div className="space-y-2">
							<Label htmlFor="font-family">Font Family</Label>
							<Select value={localFontFamily} onValueChange={setLocalFontFamily}>
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
					style={{ backgroundColor: localBackgroundColor, fontFamily: localFontFamily }}
				>
					{/* Header Card with Logo */}
					<Card
						className={`max-w-2xl mx-auto mb-6 p-4 shadow-lg border-0 ${localUseDefaultColors ? 'bg-card' : ''
							}`}
						style={{
							backgroundColor: localUseDefaultColors ? undefined : (localBackgroundColor === 'transparent' ? 'transparent' : (localBackgroundColor === '#0A0A0A' ? '#1a1a1a' : '#ffffff')),
							borderColor: localUseDefaultColors ? 'hsl(var(--border))' : (localPrimaryColor + '20')
						}}
					>
						<div className="flex items-center justify-between">
							<div className="flex-1">
								<h1
									className={`text-xl font-semibold ${localUseDefaultColors ? 'text-foreground' : ''}`}
									style={{ color: localUseDefaultColors ? undefined : (localBackgroundColor === '#0A0A0A' ? '#ffffff' : '#1a1a1a') }}
								>
									{localFormTitle}
								</h1>
								{localFormDescription && (
									<p
										className={`text-sm mt-1 ${localUseDefaultColors ? 'text-muted-foreground' : ''}`}
										style={{ color: localUseDefaultColors ? undefined : (localBackgroundColor === '#0A0A0A' ? '#a0a0a0' : '#6b7280') }}
									>
										{localFormDescription}
									</p>
								)}
							</div>
							{localLogoUrl && (
								<div className="ml-4">
									<div
										className="h-16 w-16 rounded-lg flex items-center justify-center"
										style={{
											backgroundColor: localUseDefaultColors
												? 'hsl(var(--muted-foreground))'
												: (localBackgroundColor === '#0A0A0A' ? '#1f2937' : '#e5e7eb')
										}}
									>
										<img
											src={localLogoUrl}
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
						className={`max-w-2xl mx-auto p-6 shadow-xl border-0 ${localUseDefaultColors ? 'bg-card' : ''
							}`}
						style={{
							backgroundColor: localUseDefaultColors ? undefined : (localBackgroundColor === 'transparent' ? 'transparent' : (localBackgroundColor === '#0A0A0A' ? '#1a1a1a' : '#ffffff')),
							borderColor: localUseDefaultColors ? 'hsl(var(--border))' : (localPrimaryColor + '20')
						}}
					>
						<form className="space-y-6">
							{/* Step Progress Indicator */}
							{localFormType === 'multi-step' && localSteps.length > 0 && (
								<div className="mb-6">
									<div className="flex items-center justify-between mb-2">
										<span className="text-sm font-medium text-muted-foreground">
											Step {1} of {localSteps.length}
										</span>
									</div>
									<div className="w-full bg-muted rounded-full h-2">
										<div
											className="h-2 rounded-full transition-all duration-300"
											style={{
												width: `${(1 / localSteps.length) * 100}%`,
												backgroundColor: localUseDefaultColors ? 'hsl(var(--primary))' : localPrimaryColor
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
										items={sortedFields.map(field => field.id)}
										strategy={verticalListSortingStrategy}
									>
										{sortedFields.map((field, index) => (
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
					{localFormType === 'multi-step' && (
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
								{sortedSteps.map((step, index) => (
									<Card key={step.id} className="p-4">
										<div className="flex items-center justify-between mb-4">
											<div className="flex items-center gap-2">
												<span className="text-sm font-medium text-gray-500">
													Step {index + 1}
												</span>
												<TooltipProvider>
													<Tooltip>
														<TooltipTrigger asChild>
															<Info className="h-3 w-3 text-gray-400 hover:text-gray-600 cursor-help" />
														</TooltipTrigger>
														<TooltipContent className="max-w-xs">
															<p className="text-sm">A step in a multi-step form. Each step can contain multiple fields and helps organize complex forms into manageable sections.</p>
														</TooltipContent>
													</Tooltip>
												</TooltipProvider>
											</div>
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
													onChange={(e) => handleStepUpdate(step.id, { title: e.target.value })}
													placeholder="Enter step title..."
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor={`step-description-${step.id}`}>Step Description</Label>
												<Textarea
													id={`step-description-${step.id}`}
													value={step.description || ''}
													onChange={(e) => handleStepUpdate(step.id, { description: e.target.value })}
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
															+ Message
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
															items={sortedFields.filter(field => field.step_id === step.id).map(field => field.id)}
															strategy={verticalListSortingStrategy}
														>
															{sortedFields
																.filter(field => field.step_id === step.id)
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

					{localFormType !== 'multi-step' && (
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
										+ Message
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
										items={sortedFields.filter(field => !field.step_id).map(field => field.id)}
										strategy={verticalListSortingStrategy}
									>
										{sortedFields
											.filter(field => !field.step_id)
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
						setLocalPrimaryColor(color);
					} else if (showColorPicker === 'background') {
						setLocalBackgroundColor(color);
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
						setLocalPrimaryColor(color);
					} else if (showColorPicker === 'background') {
						setLocalBackgroundColor(color);
					}
				}}
				isOpen={showColorPicker === 'background'}
				onClose={() => setShowColorPicker(null)}
			/>

			{/* Form Preview Modal */}
			<FormPreviewModal
				isOpen={showPreviewModal}
				onClose={() => setShowPreviewModal(false)}
				formData={{
					title: localFormTitle,
					description: localFormDescription,
					fields: localFields.map(field => ({
						id: field.id,
						type: field.type,
						label: field.label || '',
						placeholder: field.placeholder,
						content: field.content,
						required: field.required || false,
						options: field.options
					})),
					primaryColor: localPrimaryColor,
					backgroundColor: localBackgroundColor,
					fontFamily: localFontFamily,
					logoUrl: localLogoUrl,
					useDefaultColors: localUseDefaultColors
				}}
			/>
		</div>
	);
}