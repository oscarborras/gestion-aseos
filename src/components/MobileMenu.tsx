"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, LogIn, LogOut, History, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

export function MobileMenu() {
    const pathname = usePathname()

    const links = [
        { href: "/", label: "Inicio", icon: Home },
        { href: "/entrada", label: "Entrada", icon: LogIn },
        { href: "/salida", label: "Salida", icon: LogOut },
        { href: "/historial", label: "Historial", icon: History },
        // Admin link or hidden for now, user asked for admin screen but maybe specialized login?
        // Listing it for navigation as requested.
        { href: "/admin", label: "Admin", icon: Settings },
    ]

    return (
        <nav className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 pb-safe">
            <div className="flex h-16 items-center justify-around px-2">
                {links.map((link) => {
                    const Icon = link.icon
                    const isActive = pathname === link.href
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "flex flex-col items-center justify-center space-y-1 text-xs font-medium transition-colors hover:text-slate-900 dark:hover:text-slate-50",
                                isActive
                                    ? "text-slate-900 dark:text-slate-50"
                                    : "text-slate-500 dark:text-slate-400"
                            )}
                        >
                            <Icon className="h-5 w-5" />
                            <span>{link.label}</span>
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
