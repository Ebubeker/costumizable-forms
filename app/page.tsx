import { ThemeToggle } from '@/components/theme-toggle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FormBuilderLogo } from '@/components/whopform-logo';

export default function Page() {
	return (
		<div className="min-h-screen bg-background">
			{/* Header with theme toggle */}
			<div className="border-b bg-card">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center py-4">
						<FormBuilderLogo variant="full" width={150} height={40} />
						<ThemeToggle />
					</div>
				</div>
			</div>

			<div className="py-12 px-4 sm:px-6 lg:px-8">
				<div className="max-w-3xl mx-auto">
					<div className="text-center mb-12">
						<h1 className="text-4xl font-bold text-foreground mb-4">
							Welcome to Form Builder
						</h1>
						<p className="text-lg text-muted-foreground">
							Create, manage, and analyze customizable forms with ease
						</p>
					</div>

					<div className="space-y-8">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center">
									<span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground mr-3">
										1
									</span>
									Create your Whop app
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground">
									Go to your{" "}
									<a
										href="https://whop.com/dashboard"
										target="_blank"
										rel="noopener noreferrer"
										className="text-primary hover:underline"
									>
										Whop Dashboard
									</a>{" "}
									and create a new app. Make sure to note down your app ID and API key.
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="flex items-center">
									<span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground mr-3">
										2
									</span>
									Set up your environment
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground mb-4">
									Create a <code className="bg-muted px-2 py-1 rounded text-sm">.env.local</code> file in your project root and add your Whop app credentials:
								</p>
								<pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
									<code>
										{`WHOP_API_KEY=your_api_key_here
NEXT_PUBLIC_WHOP_APP_ID=your_app_id_here`}
									</code>
								</pre>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="flex items-center">
									<span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-primary-foreground mr-3">
										3
									</span>
									Start developing
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground">
									Run <code className="bg-muted px-2 py-1 rounded text-sm">npm run dev</code> to start your development server and begin building your app!
								</p>
							</CardContent>
						</Card>
					</div>

					<div className="mt-12 text-center space-y-4">
						<div>
							<Button
								asChild
								size="lg"
								className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium text-white shadow hover:shadow-lg bg-gradient-to-r from-indigo-500 to-violet-500"
							>
								<a href="/forms">
									Start Building Forms
								</a>
							</Button>
						</div>
						<p className="text-sm text-muted-foreground">
							Need help? Check out the{" "}
							<a
								href="https://docs.whop.com"
								target="_blank"
								rel="noopener noreferrer"
								className="text-primary hover:underline"
							>
								Whop Documentation
							</a>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}