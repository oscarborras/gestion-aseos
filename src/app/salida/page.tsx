"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase as supabaseClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import type { Aseo, SalidaEstado } from "@/types"
import { LogOut, User, CheckCircle, AlertTriangle, XCircle, ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

export default function SalidaPage() {
    const router = useRouter()
    const [occupiedAseos, setOccupiedAseos] = useState<Aseo[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedAseo, setSelectedAseo] = useState<Aseo | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const [formData, setFormData] = useState<{
        estado: SalidaEstado | ""
        observaciones: string
    }>({
        estado: "",
        observaciones: "",
    })

    useEffect(() => {
        fetchOccupiedAseos()
    }, [])

    const fetchOccupiedAseos = async () => {
        const { data } = await supabaseClient
            .from("aseos")
            .select("*")
            .eq("estado", "ocupado")
            .order("nombre")

        if (data) setOccupiedAseos(data as Aseo[])
        setLoading(false)
    }

    const handleSelectAseo = (aseo: Aseo) => {
        setSelectedAseo(aseo)
        setFormData({ estado: "", observaciones: "" }) // Reset form
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedAseo || !formData.estado) return
        setSubmitting(true)

        try {
            // 1. Find the active registro
            const { data: registroData, error: findError } = await supabaseClient
                .from("registros")
                .select("id")
                .eq("aseo_id", selectedAseo.id)
                .is("fecha_salida", null)
                .single() // Should be only one active

            if (findError) throw findError

            // 2. Update registro
            const { error: updateRegistroError } = await supabaseClient
                .from("registros")
                .update({
                    fecha_salida: new Date().toISOString(),
                    estado_salida: formData.estado,
                    observaciones_salida: formData.observaciones,
                })
                .eq("id", registroData.id)

            if (updateRegistroError) throw updateRegistroError

            // 3. Free the Aseo
            const { error: updateAseoError } = await supabaseClient
                .from("aseos")
                .update({
                    estado: "libre",
                    ocupado_por: null,
                    curso_alumno: null,
                    observaciones_entrada: null,
                    ultimo_cambio: new Date().toISOString(),
                })
                .eq("id", selectedAseo.id)

            if (updateAseoError) throw updateAseoError

            router.push("/")
        } catch (error) {
            console.error("Error al registrar salida:", error)
            alert("Error al registrar salida. Inténtalo de nuevo.")
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return <div className="flex h-screen items-center justify-center">Cargando...</div>

    // Selection View
    if (!selectedAseo) {
        if (occupiedAseos.length === 0) {
            return (
                <div className="flex h-[80vh] flex-col items-center justify-center space-y-4 text-center">
                    <CheckCircle className="h-12 w-12 text-emerald-500" />
                    <h2 className="text-xl font-bold">Todos los aseos están libres</h2>
                    <Button onClick={() => router.push("/")} variant="outline">
                        Volver al Inicio
                    </Button>
                </div>
            )
        }

        return (
            <div className="space-y-6 pb-20">
                <header className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Registrar Salida</h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Selecciona el aseo que vas a liberar.
                    </p>
                </header>
                <div className="grid gap-4">
                    {occupiedAseos.map((aseo) => (
                        <Card
                            key={aseo.id}
                            className="cursor-pointer transition-all hover:bg-slate-50 active:scale-95 border-l-4 border-l-red-500"
                            onClick={() => handleSelectAseo(aseo)}
                        >
                            <CardContent className="flex items-center justify-between p-6">
                                <div>
                                    <h3 className="font-bold text-lg">{aseo.nombre}</h3>
                                    <div className="flex items-center gap-2 text-slate-600 mt-1">
                                        <User className="h-4 w-4" />
                                        <span>{aseo.ocupado_por}</span>
                                        <span className="text-slate-400 text-sm">({aseo.curso_alumno})</span>
                                    </div>
                                </div>
                                <LogOut className="h-6 w-6 text-slate-400" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    // Form View
    return (
        <div className="space-y-6 pb-20">
            <Button variant="ghost" onClick={() => setSelectedAseo(null)} className="pl-0 hover:bg-transparent">
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver a la lista
            </Button>

            <header className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Finalizar Uso</h1>
                <p className="text-slate-500">
                    {selectedAseo.nombre} - {selectedAseo.ocupado_por}
                </p>
            </header>

            <Card>
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-sm font-medium">¿Cómo estaba el aseo?</label>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { value: "Bueno", icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50 border-emerald-200" },
                                    { value: "Regular", icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50 border-amber-200" },
                                    { value: "Malo", icon: XCircle, color: "text-red-500", bg: "bg-red-50 border-red-200" },
                                ].map((option) => {
                                    const Icon = option.icon
                                    const isSelected = formData.estado === option.value
                                    return (
                                        <div
                                            key={option.value}
                                            className={cn(
                                                "flex flex-col items-center justify-center p-4 rounded-xl border-2 cursor-pointer transition-all",
                                                isSelected
                                                    ? `border-current ${option.color} ${option.bg}`
                                                    : "border-slate-100 hover:bg-slate-50 text-slate-500"
                                            )}
                                            onClick={() => setFormData({ ...formData, estado: option.value as SalidaEstado })}
                                        >
                                            <Icon className="h-8 w-8 mb-2" />
                                            <span className="text-sm font-medium">{option.value}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="obs-salida" className="text-sm font-medium">Observaciones (Incidencias)</label>
                            <Textarea
                                id="obs-salida"
                                placeholder="¿Algún problema? Falta papel, suciedad..."
                                value={formData.observaciones}
                                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 text-lg"
                            disabled={!formData.estado || submitting}
                        >
                            <LogOut className="mr-2 h-5 w-5" /> Registrar Salida
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
