import { whopSdk } from "@/lib/whop-sdk";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import FormViewPageClient from "./page-client";

interface FormViewPageProps {
	params: Promise<{ companyId: string; formId: string }>;
}

export default async function FormViewPage({ params }: FormViewPageProps) {
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

		if (!result.hasAccess) {
			redirect('/dashboard');
		}

		return (
			<FormViewPageClient
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
