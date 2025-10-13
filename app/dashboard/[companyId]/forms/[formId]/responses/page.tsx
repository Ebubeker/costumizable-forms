import { whopSdk } from "@/lib/whop-sdk";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import FormResponsesPageClient from "./page-client";

interface FormResponsesPageProps {
	params: Promise<{ companyId: string; formId: string }>;
}

export default async function FormResponsesPage({ params }: FormResponsesPageProps) {
	const { companyId, formId } = await params;

	// Get the active Whop user from the request headers
	const headersList = await headers();

	try {
		const { userId } = await whopSdk.verifyUserToken(headersList);

		// Verify user has access to this company
		const result = await whopSdk.access.checkIfUserHasAccessToCompany({
			userId,
			companyId,
		});

		// Allow access for both admins and members (customers)
		// Only block if user truly has no access to the company
		if (!result.hasAccess && result.accessLevel === 'no_access') {
			redirect('/dashboard');
		}

		return (
			<FormResponsesPageClient
				formId={formId}
				companyId={companyId}
			/>
		);
	} catch (error) {
		// If user is not authenticated, redirect to dashboard
		console.error('User not authenticated:', error);
		redirect('/dashboard');
	}
}
