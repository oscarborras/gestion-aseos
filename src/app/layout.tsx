import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { MobileMenu } from "@/components/MobileMenu"
import { cn } from "@/lib/utils"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
    title: "Registro Aseos",
    description: "Gestión de acceso a aseos del instituto",
    manifest: "/manifest.json",
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="es">
            <body className={cn(inter.className, "bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50 antialiased")}>
                <div className="flex min-h-screen flex-col pb-16">
                    <main className="flex-1 p-4 md:p-8 max-w-2xl mx-auto w-full">
                        {children}
                    </main>
                    <MobileMenu />
                </div>
            </body>
        </html>
    )
}
