'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function SupabaseTestPage() {
	const [connectionStatus, setConnectionStatus] = useState<string>('Testing...');
	const [user, setUser] = useState<any>(null);

	useEffect(() => {
		const testConnection = async () => {
			try {
				const supabase = createClient();

				// Test basic connection
				const { data, error } = await supabase.from('_test').select('*').limit(1);

				if (error && error.code === 'PGRST116') {
					// This error means the table doesn't exist, but connection is working
					setConnectionStatus('✅ Connected to Supabase (table _test not found - this is expected)');
				} else if (error) {
					setConnectionStatus(`❌ Connection error: ${error.message}`);
				} else {
					setConnectionStatus('✅ Connected to Supabase successfully!');
				}

				// Check if user is authenticated
				const { data: { user } } = await supabase.auth.getUser();
				setUser(user);

			} catch (err) {
				setConnectionStatus(`❌ Connection failed: ${err}`);
			}
		};

		testConnection();
	}, []);

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
			<div className="max-w-2xl mx-auto">
				<h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
					Supabase Connection Test
				</h1>

				<div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
					<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
						Connection Status
					</h2>
					<p className="text-gray-600 dark:text-gray-400">{connectionStatus}</p>
				</div>

				<div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
					<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
						Authentication Status
					</h2>
					{user ? (
						<div>
							<p className="text-green-600 dark:text-green-400 mb-2">✅ User is authenticated</p>
							<pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded text-sm overflow-auto">
								{JSON.stringify(user, null, 2)}
							</pre>
						</div>
					) : (
						<p className="text-gray-600 dark:text-gray-400">❌ No user authenticated</p>
					)}
				</div>

				<div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
					<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
						Environment Variables
					</h2>
					<div className="space-y-2 text-sm">
						<p>
							<span className="font-medium">NEXT_PUBLIC_SUPABASE_URL:</span>{' '}
							{process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}
						</p>
						<p>
							<span className="font-medium">NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>{' '}
							{process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
