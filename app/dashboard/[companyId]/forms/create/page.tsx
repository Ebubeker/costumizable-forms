import { whopSdk } from "@/lib/whop-sdk";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { FormBuilderWithHeader } from "@/components/form-builder/form-builder-with-header";

interface CreateFormPageProps {
	params: Promise<{ companyId: string }>;
}

export default async function CreateFormPage({ params }: CreateFormPageProps) {
	const { companyId } = await params;

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
			<FormBuilderWithHeader
				companyId={companyId}
				title="Create New Form"
				backUrl={`/dashboard/${companyId}`}
			/>
		);
	} catch (error) {
		// If user is not authenticated, redirect to dashboard
		console.error('User not authenticated:', error);
		redirect('/dashboard');
	}
}
