'use client';

import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface WhopFormLogoProps {
	variant?: 'icon' | 'full';
	className?: string;
	width?: number;
	height?: number;
}

export function WhopFormLogo({
	variant = 'full',
	className = '',
	width,
	height
}: WhopFormLogoProps) {
	const { theme, resolvedTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return <div className={`animate-pulse bg-muted rounded ${className}`} style={{ width, height }} />;
	}

	const isDark = resolvedTheme === 'dark';

	// Apply darkening filter for light mode
	const filterClass = isDark ? '' : 'brightness-0 saturate-100';

	if (variant === 'icon') {
		return (
			<Image
				src="/WhopForm Icon _ Transparent.png"
				alt="WhopForms"
				width={width || 32}
				height={height || 32}
				className={`${filterClass} ${className}`}
				priority
			/>
		);
	}

	return (
		<Image
			src="/WhopForm Logo _ Transparent.png"
			alt="WhopForms"
			width={width || 150}
			height={height || 40}
			className={`${filterClass} ${className}`}
			priority
		/>
	);
}
