"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Mail,
	User,
	Star,
	Ticket,
	Briefcase,
	BarChart3
} from "lucide-react";
// Define the interface locally to avoid import issues
interface SimplifiedFormField {
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

interface FormTemplate {
	id: string;
	name: string;
	description: string;
	icon: React.ComponentType<{ className?: string }>;
	fields: SimplifiedFormField[];
	formType: 'single' | 'multi-step';
	steps?: Array<{
		id: string;
		title: string;
		description?: string;
	}>;
}

interface TemplateSelectorProps {
	onTemplateSelect: (template: FormTemplate) => void;
	onSkip: () => void;
}

const formTemplates: FormTemplate[] = [
	{
		id: 'contact-form',
		name: 'Contact Form',
		description: 'Basic contact form with name, email, and message fields',
		icon: Mail,
		formType: 'single',
		fields: [
			{
				id: 'field-1',
				type: 'text',
				label: 'Full Name',
				placeholder: 'Enter your full name',
				required: true,
				order_index: 0
			},
			{
				id: 'field-2',
				type: 'email',
				label: 'Email Address',
				placeholder: 'Enter your email address',
				required: true,
				order_index: 1
			},
			{
				id: 'field-3',
				type: 'phone',
				label: 'Phone Number',
				placeholder: 'Enter your phone number',
				required: false,
				order_index: 2
			},
			{
				id: 'field-4',
				type: 'textarea',
				label: 'Message',
				placeholder: 'Enter your message',
				required: true,
				order_index: 3
			}
		]
	},
	{
		id: 'registration-form',
		name: 'Registration Form',
		description: 'User registration with personal details and preferences',
		icon: User,
		formType: 'single',
		fields: [
			{
				id: 'field-1',
				type: 'text',
				label: 'First Name',
				placeholder: 'Enter your first name',
				required: true,
				order_index: 0
			},
			{
				id: 'field-2',
				type: 'text',
				label: 'Last Name',
				placeholder: 'Enter your last name',
				required: true,
				order_index: 1
			},
			{
				id: 'field-3',
				type: 'email',
				label: 'Email Address',
				placeholder: 'Enter your email address',
				required: true,
				order_index: 2
			},
			{
				id: 'field-4',
				type: 'phone',
				label: 'Phone Number',
				placeholder: 'Enter your phone number',
				required: false,
				order_index: 3
			},
			{
				id: 'field-5',
				type: 'select',
				label: 'How did you hear about us?',
				placeholder: 'Select an option',
				required: false,
				options: ['Social Media', 'Search Engine', 'Friend/Family', 'Advertisement', 'Other'],
				order_index: 4
			},
			{
				id: 'field-6',
				type: 'checkbox',
				label: 'I agree to the terms and conditions',
				required: true,
				order_index: 5
			}
		]
	},
	{
		id: 'feedback-form',
		name: 'Feedback Form',
		description: 'Collect customer feedback and ratings',
		icon: Star,
		formType: 'single',
		fields: [
			{
				id: 'field-1',
				type: 'text',
				label: 'Your Name',
				placeholder: 'Enter your name',
				required: false,
				order_index: 0
			},
			{
				id: 'field-2',
				type: 'email',
				label: 'Email Address',
				placeholder: 'Enter your email address',
				required: false,
				order_index: 1
			},
			{
				id: 'field-3',
				type: 'select',
				label: 'Overall Rating',
				placeholder: 'Select a rating',
				required: true,
				options: ['Excellent', 'Good', 'Average', 'Poor', 'Very Poor'],
				order_index: 2
			},
			{
				id: 'field-4',
				type: 'textarea',
				label: 'Your Feedback',
				placeholder: 'Please share your thoughts and suggestions',
				required: true,
				order_index: 3
			},
			{
				id: 'field-5',
				type: 'checkbox',
				label: 'I would like to receive updates about improvements',
				required: false,
				order_index: 4
			}
		]
	},
	{
		id: 'event-registration',
		name: 'Event Registration',
		description: 'Multi-step form for event registration with personal and event details',
		icon: Ticket,
		formType: 'multi-step',
		steps: [
			{
				id: 'step-1',
				title: 'Personal Information',
				description: 'Tell us about yourself'
			},
			{
				id: 'step-2',
				title: 'Event Details',
				description: 'Select your preferences'
			}
		],
		fields: [
			{
				id: 'field-1',
				type: 'text',
				label: 'Full Name',
				placeholder: 'Enter your full name',
				required: true,
				step_id: 'step-1',
				order_index: 0
			},
			{
				id: 'field-2',
				type: 'email',
				label: 'Email Address',
				placeholder: 'Enter your email address',
				required: true,
				step_id: 'step-1',
				order_index: 1
			},
			{
				id: 'field-3',
				type: 'phone',
				label: 'Phone Number',
				placeholder: 'Enter your phone number',
				required: true,
				step_id: 'step-1',
				order_index: 2
			},
			{
				id: 'field-4',
				type: 'select',
				label: 'Dietary Requirements',
				placeholder: 'Select your dietary needs',
				required: false,
				options: ['None', 'Vegetarian', 'Vegan', 'Gluten-Free', 'Halal', 'Kosher', 'Other'],
				step_id: 'step-2',
				order_index: 0
			},
			{
				id: 'field-5',
				type: 'checkbox',
				label: 'I need accessibility accommodations',
				required: false,
				step_id: 'step-2',
				order_index: 1
			},
			{
				id: 'field-6',
				type: 'textarea',
				label: 'Additional Comments',
				placeholder: 'Any additional information or special requests',
				required: false,
				step_id: 'step-2',
				order_index: 2
			}
		]
	},
	{
		id: 'job-application',
		name: 'Job Application',
		description: 'Comprehensive job application form with experience and skills',
		icon: Briefcase,
		formType: 'single',
		fields: [
			{
				id: 'field-1',
				type: 'text',
				label: 'Full Name',
				placeholder: 'Enter your full name',
				required: true,
				order_index: 0
			},
			{
				id: 'field-2',
				type: 'email',
				label: 'Email Address',
				placeholder: 'Enter your email address',
				required: true,
				order_index: 1
			},
			{
				id: 'field-3',
				type: 'phone',
				label: 'Phone Number',
				placeholder: 'Enter your phone number',
				required: true,
				order_index: 2
			},
			{
				id: 'field-4',
				type: 'select',
				label: 'Position Applied For',
				placeholder: 'Select the position',
				required: true,
				options: ['Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'UI/UX Designer', 'Product Manager', 'Other'],
				order_index: 3
			},
			{
				id: 'field-5',
				type: 'select',
				label: 'Experience Level',
				placeholder: 'Select your experience level',
				required: true,
				options: ['Entry Level (0-2 years)', 'Mid Level (3-5 years)', 'Senior Level (6+ years)', 'Lead/Principal (8+ years)'],
				order_index: 4
			},
			{
				id: 'field-6',
				type: 'textarea',
				label: 'Cover Letter',
				placeholder: 'Tell us why you\'re interested in this position',
				required: true,
				order_index: 5
			},
			{
				id: 'field-7',
				type: 'checkbox',
				label: 'I confirm that all information provided is accurate',
				required: true,
				order_index: 6
			}
		]
	},
	{
		id: 'survey-form',
		name: 'Survey Form',
		description: 'General survey with multiple choice and open-ended questions',
		icon: BarChart3,
		formType: 'single',
		fields: [
			{
				id: 'field-1',
				type: 'heading',
				content: 'Customer Satisfaction Survey',
				order_index: 0
			},
			{
				id: 'field-2',
				type: 'paragraph',
				content: 'We value your feedback! Please take a few minutes to complete this survey.',
				order_index: 1
			},
			{
				id: 'field-3',
				type: 'select',
				label: 'How satisfied are you with our service?',
				placeholder: 'Select your satisfaction level',
				required: true,
				options: ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied'],
				order_index: 2
			},
			{
				id: 'field-4',
				type: 'select',
				label: 'How likely are you to recommend us?',
				placeholder: 'Select likelihood',
				required: true,
				options: ['Very Likely', 'Likely', 'Neutral', 'Unlikely', 'Very Unlikely'],
				order_index: 3
			},
			{
				id: 'field-5',
				type: 'textarea',
				label: 'What could we improve?',
				placeholder: 'Share your suggestions for improvement',
				required: false,
				order_index: 4
			},
			{
				id: 'field-6',
				type: 'text',
				label: 'Your Name (Optional)',
				placeholder: 'Enter your name if you\'d like to be contacted',
				required: false,
				order_index: 5
			}
		]
	}
];

export function TemplateSelector({ onTemplateSelect, onSkip }: TemplateSelectorProps) {
	const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

	return (
		<div className="max-w-6xl mx-auto p-6">
			<div className="text-center mb-8">
				<h1 className="text-3xl font-bold text-foreground mb-4">
					Choose a Template
				</h1>
				<p className="text-muted-foreground text-lg">
					Start with a pre-built form template or create from scratch
				</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
				{formTemplates.map((template) => (
					<Card
						key={template.id}
						className={`p-6 cursor-pointer transition-all duration-200 hover:shadow-lg ${selectedTemplate === template.id
							? 'ring-2 ring-primary bg-primary/5'
							: 'hover:shadow-md'
							}`}
						onClick={() => setSelectedTemplate(template.id)}
					>
						<div className="text-center">
							<div className="flex justify-center mb-4">
								<template.icon className="h-12 w-12 text-primary" />
							</div>
							<h3 className="text-xl font-semibold text-foreground mb-2">
								{template.name}
							</h3>
							<p className="text-muted-foreground text-sm mb-4">
								{template.description}
							</p>
							<div className="text-xs text-muted-foreground">
								{template.formType === 'multi-step' ? 'Multi-step form' : 'Single form'} • {template.fields.length} fields
							</div>
						</div>
					</Card>
				))}
			</div>

			<div className="flex justify-center gap-4">
				<Button
					variant="outline"
					onClick={onSkip}
					className="px-8"
				>
					Start from Scratch
				</Button>
				<Button
					onClick={() => {
						if (selectedTemplate) {
							const template = formTemplates.find(t => t.id === selectedTemplate);
							if (template) {
								onTemplateSelect(template);
							}
						}
					}}
					disabled={!selectedTemplate}
					className="px-8"
				>
					Use Template
				</Button>
			</div>
		</div>
	);
}
