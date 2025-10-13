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
		'#F6EDE4', // Warm Cream
		'#F6E5BA', // Golden Beige
		'#F3D2B3', // Peach
		'#DED2E0', // Lavender
		'#CCDECC', // Mint Green
		'#1D434B', // Deep Teal
		'#9C5B5F', // Muted Rose
		'#C49B43', // Golden Brown
		'#462E44', // Dark Purple
		'#4D532F', // Olive Green
		'transparent', // Transparent
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
										className={`w-6 h-6 rounded border-2 hover:scale-110 transition-transform ${color === 'transparent'
												? 'border-red-500 hover:border-red-600'
												: 'border-gray-200 dark:border-gray-600'
											}`}
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
