import type { Metadata } from "next";
import {
	Geist,
	Geist_Mono,
	Inter,
	Roboto,
	Open_Sans,
	Lato,
	Montserrat,
	Poppins,
	Source_Sans_3,
	Nunito,
	Raleway,
	Ubuntu,
	Playfair_Display,
	Merriweather
} from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

// Google Fonts for form builder
const inter = Inter({
	variable: "--font-inter",
	subsets: ["latin"],
});

const roboto = Roboto({
	variable: "--font-roboto",
	subsets: ["latin"],
	weight: ["300", "400", "500", "700"],
});

const openSans = Open_Sans({
	variable: "--font-open-sans",
	subsets: ["latin"],
});

const lato = Lato({
	variable: "--font-lato",
	subsets: ["latin"],
	weight: ["300", "400", "700"],
});

const montserrat = Montserrat({
	variable: "--font-montserrat",
	subsets: ["latin"],
});

const poppins = Poppins({
	variable: "--font-poppins",
	subsets: ["latin"],
	weight: ["300", "400", "500", "600", "700"],
});

const sourceSans = Source_Sans_3({
	variable: "--font-source-sans",
	subsets: ["latin"],
});

const nunito = Nunito({
	variable: "--font-nunito",
	subsets: ["latin"],
});

const raleway = Raleway({
	variable: "--font-raleway",
	subsets: ["latin"],
});

const ubuntu = Ubuntu({
	variable: "--font-ubuntu",
	subsets: ["latin"],
	weight: ["300", "400", "500", "700"],
});

const playfairDisplay = Playfair_Display({
	variable: "--font-playfair-display",
	subsets: ["latin"],
});

const merriweather = Merriweather({
	variable: "--font-merriweather",
	subsets: ["latin"],
	weight: ["300", "400", "700", "900"],
});

export const metadata: Metadata = {
	title: "WhopForm | Customizable Forms",
	description: "Create, manage, and analyze customizable forms with ease",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${roboto.variable} ${openSans.variable} ${lato.variable} ${montserrat.variable} ${poppins.variable} ${sourceSans.variable} ${nunito.variable} ${raleway.variable} ${ubuntu.variable} ${playfairDisplay.variable} ${merriweather.variable} antialiased`}
			>
				<ThemeProvider
					attribute="class"
					defaultTheme="dark"
					enableSystem
					disableTransitionOnChange
				>
					{children}
					<Toaster />
				</ThemeProvider>
			</body>
		</html>
	);
}
