import { whopSdk } from "@/lib/whop-sdk";
import { headers } from "next/headers";
import DashboardPageClient from "./page-client";

export default async function DashboardPage({
	params,
}: {
	params: Promise<{ companyId: string }>;
}) {
	// The headers contains the user token
	const headersList = await headers();

	// The companyId is a path param
	const { companyId } = await params;

	// The user token is in the headers
	const { userId } = await whopSdk.verifyUserToken(headersList);

	const result = await whopSdk.access.checkIfUserHasAccessToCompany({
		userId,
		companyId,
	});

	const user = await whopSdk.users.getUser({ userId });
	const company = await whopSdk.companies.getCompany({ companyId });

	// Either: 'admin' | 'no_access';
	// 'admin' means the user is an admin of the company, such as an owner or moderator
	// 'no_access' means the user is not an authorized member of the company
	const { accessLevel } = result;

	console.log('accessLevel', accessLevel, user);

	// Handle different access levels
	// If user is admin, they get admin access
	// If user is customer or no_access, they get member view
	let finalAccessLevel: 'admin' | 'no_access' | 'customer';

	if (accessLevel === 'admin') {
		finalAccessLevel = 'admin';
	} else {
		// Both 'customer' and 'no_access' get member view
		finalAccessLevel = 'customer';
	}

	return (
		<DashboardPageClient
			user={{
				name: user.name,
				username: user.username
			}}
			company={company}
			accessLevel={finalAccessLevel as 'admin' | 'no_access' | 'customer'}
			userId={userId}
			companyId={companyId}
		/>
	);
}