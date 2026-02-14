"use client"

import { useEffect, useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { DashboardCard } from "@/components/DashboardCard"
import { User } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { Aseo } from "@/types"

// Re-initialize supabase client here or import from lib?
// The lib/supabase.ts was created but I need to make sure I import it correctly.
// I'll check my previous step: `export const supabase = createClient(...)` in `src/lib/supabase.ts`
import { supabase as supabaseClient } from "@/lib/supabase"

export default function Dashboard() {
    const [aseos, setAseos] = useState<Aseo[]>([])
    const [usosHoy, setUsosHoy] = useState<number>(0)
    const [loading, setLoading] = useState(true)

    const fetchAseos = async () => {
        const { data, error } = await supabaseClient
            .from("aseos")
            .select("*")
            .order("nombre")

        if (data) {
            setAseos(data as Aseo[])
        }
    }

    const fetchUsosHoy = async () => {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const { count, error } = await supabaseClient
            .from("registros")
            .select("*", { count: "exact", head: true })
            .gte("fecha_entrada", today.toISOString())

        if (count !== null) {
            setUsosHoy(count)
        }
    }

    useEffect(() => {
        fetchAseos()
        fetchUsosHoy()
        setLoading(false)

        // Realtime subscription for Aseos
        const channelAseos = supabaseClient
            .channel("aseos-changes")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "aseos" },
                (payload) => {
                    if (payload.eventType === "UPDATE") {
                        setAseos((prev) =>
                            prev.map((aseo) =>
                                aseo.id === payload.new.id ? (payload.new as Aseo) : aseo
                            )
                        )
                    } else if (payload.eventType === "INSERT") {
                        setAseos((prev) => [...prev, payload.new as Aseo])
                    }
                    // Fetch stats again if status changes to occupied (new entry likely)
                    // Actually better to subscribe to 'registros' for accurate count
                    if ((payload.new as Aseo).estado === 'ocupado') {
                        // trigger update uses? content of payload doesn't confirm new *record* in registros, 
                        // but 'registros' insert would.
                    }
                }
            )
            .subscribe()

        // Realtime subscription for Registros (to update daily count)
        const channelRegistros = supabaseClient
            .channel("registros-changes")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "registros" },
                () => {
                    fetchUsosHoy()
                }
            )
            .subscribe()

        return () => {
            supabaseClient.removeChannel(channelAseos)
            supabaseClient.removeChannel(channelRegistros)
        }
    }, [])

    const stats = useMemo(() => {
        const chicosOccupied = aseos.filter(
            (a) => a.nombre.toLowerCase().includes("chicos") && a.estado === "ocupado"
        ).length
        const chicosTotal = aseos.filter((a) => a.nombre.toLowerCase().includes("chicos")).length

        const chicasOccupied = aseos.filter(
            (a) => a.nombre.toLowerCase().includes("chicas") && a.estado === "ocupado"
        ).length
        const chicasTotal = aseos.filter((a) => a.nombre.toLowerCase().includes("chicas")).length

        return {
            chicos: { occupied: chicosOccupied, total: chicosTotal },
            chicas: { occupied: chicasOccupied, total: chicasTotal },
        }
    }, [aseos])

    if (loading) {
        return <div className="flex h-screen items-center justify-center">Cargando...</div>
    }

    return (
        <div className="space-y-6 pb-20">
            <header className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Estado de Aseos</h1>
                <p className="text-slate-500 dark:text-slate-400">
                    Vista en tiempo real
                </p>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Card>
                    <CardContent className="flex flex-col items-center justify-center p-6">
                        <span className="text-sm font-medium text-slate-500">Usos hoy</span>
                        <span className="text-4xl font-bold mt-2">{usosHoy}</span>
                    </CardContent>
                </Card>
                <Card className={cn(stats.chicas.occupied > 0 && "border-amber-200 bg-amber-50 dark:bg-amber-950/10")}>
                    <CardContent className="flex flex-col items-center justify-center p-6">
                        <span className="text-sm font-medium text-slate-500 flex items-center gap-2">
                            <User className="h-4 w-4" /> Chicas
                        </span>
                        <div className="mt-2 flex items-baseline gap-1">
                            <span className="text-4xl font-bold">{stats.chicas.occupied}</span>
                            <span className="text-sm text-slate-400">/ {stats.chicas.total}</span>
                        </div>
                        <span className="text-xs text-slate-400 mt-1">Ocupados</span>
                    </CardContent>
                </Card>
                <Card className={cn(stats.chicos.occupied > 0 && "border-amber-200 bg-amber-50 dark:bg-amber-950/10")}>
                    <CardContent className="flex flex-col items-center justify-center p-6">
                        <span className="text-sm font-medium text-slate-500 flex items-center gap-2">
                            <User className="h-4 w-4" /> Chicos
                        </span>
                        <div className="mt-2 flex items-baseline gap-1">
                            <span className="text-4xl font-bold">{stats.chicos.occupied}</span>
                            <span className="text-sm text-slate-400">/ {stats.chicos.total}</span>
                        </div>
                        <span className="text-xs text-slate-400 mt-1">Ocupados</span>
                    </CardContent>
                </Card>
            </div>

            {/* Aseos Grid */}
            <div className="grid gap-4 md:grid-cols-2">
                {aseos.map((aseo) => (
                    <DashboardCard key={aseo.id} aseo={aseo} />
                ))}
                {aseos.length === 0 && (
                    <div className="col-span-2 text-center text-slate-500 py-10">
                        No se encontraron aseos configurados.
                    </div>
                )}
            </div>
        </div>
    )
}
