'use client';

import { useState, useEffect } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AdminFormsView } from '@/components/admin-forms-view';
import MemberFormsView from '@/components/member-forms-view';
import AllLeadsView from '@/components/all-leads-view';
import { FormBuilderLogo } from '@/components/whopform-logo';
import Link from 'next/link';

interface DashboardPageClientProps {
	user: {
		name?: string | null;
		username: string;
	};
	company: {
		title: string;
	};
	accessLevel: 'admin' | 'no_access' | 'customer';
	userId: string;
	companyId: string;
}

export default function DashboardPageClient({
	user,
	company,
	accessLevel,
	userId,
	companyId,
}: DashboardPageClientProps) {
	const [activeTab, setActiveTab] = useState<'admin' | 'member' | 'leads'>('admin');

	console.log('accessLevel', accessLevel);
	console.log(user)

	// Check if user is admin
	const isAdmin = (accessLevel === 'admin');

	// Set document title
	useEffect(() => {
		document.title = 'Form Builder | Dashboard';
	}, []);

	// For non-admin users, show only member view without tabs
	if (!isAdmin) {
		return (
			<div className="min-h-screen bg-background">
				{/* Fixed Header */}
				<div className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<div className="flex justify-between items-center py-6">
							<div>
								<div className="flex items-center gap-4 mb-2">
									<FormBuilderLogo variant="full" width={180} height={48} />
								</div>
								<p className="text-muted-foreground text-lg">
									Welcome back, <span className="font-semibold text-foreground">{user.name || user.username}</span> <span className="text-muted-foreground">(@{user.username})</span>
								</p>
							</div>
							<div className="flex items-center space-x-4">
								<Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
									Member
								</Badge>
								<ThemeToggle />
							</div>
						</div>
					</div>
				</div>

				{/* Member Content with top padding to account for fixed header */}
				<main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 pt-[140px]">
					<MemberFormsView companyId={companyId} userId={userId} />
				</main>
			</div>
		);
	}

	// For admin users, show full dashboard with tabs
	return (
		<div className="min-h-screen bg-background">
			{/* Fixed Header */}
			<div className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center py-6">
						<div>
							<div className="flex items-center gap-4 mb-2">
								<FormBuilderLogo variant="full" width={180} height={48} />
							</div>
							<p className="text-muted-foreground text-lg">
								Welcome back, <span className="font-semibold text-foreground">{user.name || user.username}</span> <span className="text-muted-foreground">(@{user.username})</span>
							</p>
						</div>
						<div className="flex items-center space-x-4">
							<Badge variant="default" className="px-4 py-2 text-sm font-medium">
								Admin
							</Badge>
							<ThemeToggle />
						</div>
					</div>
				</div>
			</div>

			{/* Fixed Navigation Tabs */}
			<div className="fixed top-[120px] left-0 right-0 z-40 border-b border-border bg-card/70 backdrop-blur-sm">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<nav className="flex space-x-1 py-2">
						<Button
							variant="ghost"
							onClick={() => setActiveTab('admin')}
							className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${activeTab === 'admin'
								? 'inline-flex items-center gap-2 text-white shadow hover:shadow-lg bg-gradient-to-r from-indigo-500 to-violet-500 hover:text-white'
								: 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
								}`}
						>
							Forms
						</Button>
						<Button
							variant="ghost"
							onClick={() => setActiveTab('leads')}
							className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${activeTab === 'leads'
								? 'inline-flex items-center gap-2 text-white shadow hover:shadow-lg bg-gradient-to-r from-indigo-500 to-violet-500 hover:text-white'
								: 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
								}`}
						>
							All Leads
						</Button>
						<Button
							variant="ghost"
							onClick={() => setActiveTab('member')}
							className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${activeTab === 'member'
								? 'inline-flex items-center gap-2 text-white shadow hover:shadow-lg bg-gradient-to-r from-indigo-500 to-violet-500 hover:text-white'
								: 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
								}`}
						>
							Member View
						</Button>
					</nav>
				</div>
			</div>

			{/* Tab Content with top padding to account for fixed header and tabs */}
			<main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 pt-[200px]">
				{activeTab === 'admin' && (
					<AdminFormsView companyId={companyId} userId={userId} />
				)}

				{activeTab === 'leads' && (
					<AllLeadsView companyId={companyId} userId={userId} />
				)}

				{activeTab === 'member' && (
					<MemberFormsView companyId={companyId} userId={userId} />
				)}
			</main>
		</div>
	);
}
