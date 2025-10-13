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

		if (!result.hasAccess) {
			redirect('/dashboard');
		}

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
