import { whopSdk } from "@/lib/whop-sdk";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import FormSubmitPageClient from "./page-client";

interface FormSubmitPageProps {
	params: Promise<{ companyId: string; formId: string }>;
}

export default async function FormSubmitPage({ params }: FormSubmitPageProps) {
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

		// Handle different access levels - same logic as main dashboard
		let finalAccessLevel: 'admin' | 'no_access' | 'customer';

		if (result.accessLevel === 'admin') {
			finalAccessLevel = 'admin';
		} else {
			// Both 'customer' and 'no_access' get member view
			finalAccessLevel = 'customer';
		}

		// Allow access for both admins and members (customers)
		// Only block if user truly has no access to the company
		// if (!result.hasAccess && result.accessLevel === 'no_access') {
		// 	redirect('/dashboard');
		// }

		return (
			<FormSubmitPageClient
				formId={formId}
				companyId={companyId}
				userId={userId}
			/>
		);
	} catch (error) {
		// If user is not authenticated, redirect to dashboard
		console.error('User not authenticated:', error);
		redirect('/dashboard');
	}
}
