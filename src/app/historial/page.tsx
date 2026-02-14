"use client"

import { useEffect, useState } from "react"
import { supabase as supabaseClient } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import type { Registro, Aseo } from "@/types"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Filter, Calendar, CheckCircle, AlertTriangle, XCircle } from "lucide-react"

export default function HistorialPage() {
    const [registros, setRegistros] = useState<any[]>([]) // Using any for join result
    const [aseos, setAseos] = useState<Aseo[]>([])
    const [loading, setLoading] = useState(true)

    // Filters
    const [filterAseo, setFilterAseo] = useState("all")
    const [filterEstado, setFilterEstado] = useState("all")

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        // Fetch today's records
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const { data: aseosData } = await supabaseClient
            .from("aseos")
            .select("*")
            .order("nombre")

        if (aseosData) setAseos(aseosData as Aseo[])

        const { data: registrosData, error } = await supabaseClient
            .from("registros")
            .select(`
        *,
        aseos (nombre)
      `)
            .gt("fecha_entrada", today.toISOString()) // From today
            .not("fecha_salida", "is", null) // Completed
            .order("fecha_salida", { ascending: false })

        if (registrosData) {
            setRegistros(registrosData)
        }
        setLoading(false)
    }

    const filteredRegistros = registros.filter((reg) => {
        if (filterAseo !== "all" && reg.aseo_id !== filterAseo) return false
        if (filterEstado !== "all" && reg.estado_salida !== filterEstado) return false
        return true
    })

    // Helper for status badge
    const getStatusBadge = (estado: string) => {
        switch (estado) {
            case "Bueno": return <Badge variant="success">Bueno</Badge>
            case "Regular": return <Badge variant="warning">Regular</Badge>
            case "Malo": return <Badge variant="destructive">Malo</Badge>
            default: return <Badge variant="outline">{estado}</Badge>
        }
    }

    if (loading) return <div className="flex h-screen items-center justify-center">Cargando...</div>

    return (
        <div className="space-y-6 pb-20">
            <header className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Historial de Hoy</h1>
                <p className="text-slate-500 dark:text-slate-400">
                    Registros completados del día.
                </p>
            </header>

            {/* Filters */}
            <Card>
                <CardContent className="p-4 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-2">
                        <Filter className="h-4 w-4" /> Filtros
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label className="text-xs font-semibold mb-1 block">Aseo</label>
                            <select
                                className="flex h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-slate-950 outline-none"
                                value={filterAseo}
                                onChange={(e) => setFilterAseo(e.target.value)}
                            >
                                <option value="all">Todos</option>
                                {aseos.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold mb-1 block">Estado Final</label>
                            <select
                                className="flex h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-slate-950 outline-none"
                                value={filterEstado}
                                onChange={(e) => setFilterEstado(e.target.value)}
                            >
                                <option value="all">Todos</option>
                                <option value="Bueno">Bueno</option>
                                <option value="Regular">Regular</option>
                                <option value="Malo">Malo</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* List */}
            <div className="space-y-4">
                {filteredRegistros.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">
                        No hay registros que coincidan con los filtros.
                    </div>
                ) : (
                    filteredRegistros.map((reg) => (
                        <Card key={reg.id} className="overflow-hidden">
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <span className="font-bold text-lg">{reg.alumno_nombre}</span>
                                        <div className="text-xs text-slate-500">{reg.alumno_curso}</div>
                                    </div>
                                    <div className="text-right">
                                        {getStatusBadge(reg.estado_salida)}
                                        <div className="text-xs text-slate-400 mt-1">
                                            {format(new Date(reg.fecha_salida), "HH:mm", { locale: es })}
                                        </div>
                                    </div>
                                </div>

                                <div className="text-sm bg-slate-50 p-2 rounded-lg mt-2 text-slate-600">
                                    <span className="font-semibold block text-xs uppercase tracking-wider text-slate-400 mb-1">Aseo</span>
                                    {reg.aseos?.nombre || "Desconocido"}
                                </div>

                                {reg.observaciones_salida && (
                                    <div className="text-sm mt-3 pt-3 border-t border-slate-100 italic text-slate-600">
                                        "{reg.observaciones_salida}"
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
