'use client';

import { useState } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';

interface ColorPickerProps {
	value: string;
	onChange: (color: string) => void;
	label?: string;
	className?: string;
}

export function ColorPicker({ value, onChange, label, className }: ColorPickerProps) {
	const [isOpen, setIsOpen] = useState(false);

	const presetColors = [
		'#645EFF', // Primary purple
		'#3B82F6', // Blue
		'#10B981', // Green
		'#F59E0B', // Yellow
		'#EF4444', // Red
		'#8B5CF6', // Purple
		'#06B6D4', // Cyan
		'#84CC16', // Lime
		'#F97316', // Orange
		'#EC4899', // Pink
		'#6B7280', // Gray
		'#000000', // Black
	];

	return (
		<div className={`space-y-2 ${className}`}>
			{label && <Label>{label}</Label>}
			<div className="flex items-center space-x-2">
				<div className="relative">
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => setIsOpen(!isOpen)}
						className="w-12 h-8 p-0 border-2"
						style={{ backgroundColor: value }}
					>
						<span className="sr-only">Pick color</span>
					</Button>
					{isOpen && (
						<div className="absolute top-10 left-0 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
							<div className="grid grid-cols-6 gap-2 mb-3">
								{presetColors.map((color) => (
									<button
										key={color}
										type="button"
										className="w-6 h-6 rounded border-2 border-gray-200 dark:border-gray-600 hover:scale-110 transition-transform"
										style={{ backgroundColor: color }}
										onClick={() => {
											onChange(color);
											setIsOpen(false);
										}}
									>
										<span className="sr-only">{color}</span>
									</button>
								))}
							</div>
							<div className="flex items-center space-x-2">
								<Input
									type="color"
									value={value}
									onChange={(e) => onChange(e.target.value)}
									className="w-12 h-8 p-0 border-0"
								/>
								<Input
									type="text"
									value={value}
									onChange={(e) => onChange(e.target.value)}
									placeholder="#000000"
									className="flex-1 text-sm"
								/>
							</div>
						</div>
					)}
				</div>
				<Input
					type="text"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder="#000000"
					className="flex-1"
				/>
			</div>
		</div>
	);
}
