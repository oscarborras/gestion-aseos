"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase as supabaseClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Aseo, Curso } from "@/types"
import { LogIn } from "lucide-react"

export default function EntradaPage() {
    const router = useRouter()
    const [aseos, setAseos] = useState<Aseo[]>([])
    const [cursos, setCursos] = useState<Curso[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    const [formData, setFormData] = useState({
        nombre: "",
        curso: "",
        aseoId: "",
        observaciones: "",
    })

    useEffect(() => {
        const fetchData = async () => {
            const [aseosRes, cursosRes] = await Promise.all([
                supabaseClient
                    .from("aseos")
                    .select("*")
                    .eq("estado", "libre")
                    .order("nombre"),
                supabaseClient.from("cursos").select("*").order("nombre"),
            ])

            if (aseosRes.data) setAseos(aseosRes.data as Aseo[])
            if (cursosRes.data) setCursos(cursosRes.data as Curso[])
            setLoading(false)
        }

        fetchData()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.aseoId || !formData.nombre || !formData.curso) return

        setSubmitting(true)

        try {
            // 1. Update Aseo status
            const { error: updateError } = await supabaseClient
                .from("aseos")
                .update({
                    estado: "ocupado",
                    ocupado_por: formData.nombre,
                    curso_alumno: formData.curso,
                    observaciones_entrada: formData.observaciones,
                    ultimo_cambio: new Date().toISOString(),
                })
                .eq("id", formData.aseoId)

            if (updateError) throw updateError

            // 2. Insert Registro
            const { error: insertError } = await supabaseClient.from("registros").insert({
                alumno_nombre: formData.nombre,
                alumno_curso: formData.curso,
                aseo_id: formData.aseoId,
                fecha_entrada: new Date().toISOString(),
            })

            if (insertError) throw insertError

            router.push("/")
        } catch (error) {
            console.error("Error al registrar entrada:", error)
            alert("Hubo un error al registrar la entrada. Por favor, inténtalo de nuevo.")
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return <div className="flex h-screen items-center justify-center">Cargando...</div>
    }

    if (aseos.length === 0) {
        return (
            <div className="flex h-[80vh] flex-col items-center justify-center space-y-4 text-center">
                <h2 className="text-xl font-bold">Todos los aseos están ocupados</h2>
                <p className="text-slate-500">Por favor, espera a que se libere uno.</p>
                <Button onClick={() => router.push("/")} variant="outline">
                    Volver al Inicio
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-20">
            <header className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Registrar Entrada</h1>
                <p className="text-slate-500 dark:text-slate-400">
                    Completa los datos para acceder al aseo.
                </p>
            </header>

            <Card>
                <CardHeader>
                    <CardTitle>Datos del Alumno</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="nombre" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Nombre Completo
                            </label>
                            <Input
                                id="nombre"
                                placeholder="Ej. Juan Pérez"
                                value={formData.nombre}
                                onChange={(e) =>
                                    setFormData({ ...formData, nombre: e.target.value })
                                }
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="curso" className="text-sm font-medium leading-none">
                                Curso
                            </label>
                            <select
                                id="curso"
                                className="flex h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300"
                                value={formData.curso}
                                onChange={(e) =>
                                    setFormData({ ...formData, curso: e.target.value })
                                }
                                required
                            >
                                <option value="">Selecciona un curso</option>
                                {cursos.map((c) => (
                                    <option key={c.id} value={c.nombre}>
                                        {c.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none">
                                Selecciona Aseo
                            </label>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                {aseos.map((aseo) => (
                                    <div
                                        key={aseo.id}
                                        className={`cursor-pointer rounded-xl border p-4 transition-all hover:bg-slate-50 ${formData.aseoId === aseo.id
                                            ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500"
                                            : "border-slate-200"
                                            }`}
                                        onClick={() =>
                                            setFormData({ ...formData, aseoId: aseo.id })
                                        }
                                    >
                                        <div className="font-medium">{aseo.nombre}</div>
                                        <div className="text-xs text-emerald-600">Libre</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="observaciones" className="text-sm font-medium leading-none">
                                Observaciones (Opcional)
                            </label>
                            <Textarea
                                id="observaciones"
                                placeholder="Ej. Me siento mal..."
                                value={formData.observaciones}
                                onChange={(e) =>
                                    setFormData({ ...formData, observaciones: e.target.value })
                                }
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full text-lg h-12"
                            disabled={submitting || !formData.aseoId || !formData.nombre || !formData.curso}
                        >
                            {submitting ? "Registrando..." : (
                                <>
                                    <LogIn className="mr-2 h-5 w-5" /> Registrar Entrada
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
