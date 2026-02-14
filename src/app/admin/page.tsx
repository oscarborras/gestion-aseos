"use client"

import { useEffect, useState } from "react"
import { supabase as supabaseClient } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, Users, FileText, CheckCircle, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

export default function AdminPage() {
    const [stats, setStats] = useState({
        totalUsages: 0,
        totalStudents: 0,
        totalCourses: 0
    })
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        const [registrosCount, alumnosCount, cursosCount] = await Promise.all([
            supabaseClient.from("registros").select("*", { count: "exact", head: true }),
            supabaseClient.from("alumnos").select("*", { count: "exact", head: true }),
            supabaseClient.from("cursos").select("*", { count: "exact", head: true })
        ])

        setStats({
            totalUsages: registrosCount.count || 0,
            totalStudents: alumnosCount.count || 0,
            totalCourses: cursosCount.count || 0
        })
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
            setUploadStatus(null)
        }
    }

    const handleUpload = async () => {
        if (!file) return
        setUploading(true)
        setUploadStatus(null)

        const reader = new FileReader()
        reader.onload = async (e) => {
            const text = e.target?.result
            if (typeof text !== "string") return

            try {
                const lines = text.split("\n")
                const newStudents = []

                // Simple CSV parser: Name,Course (ignoring header if present?)
                // Assuming no header or handle it gracefully
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim()
                    if (!line) continue

                    const parts = line.split(",")
                    if (parts.length < 2) continue // Skip invalid lines

                    const nombre = parts[0].trim()
                    const curso = parts[1].trim()

                    if (nombre.toLowerCase() === "nombre" && curso.toLowerCase() === "curso") continue // Skip header

                    if (nombre && curso) {
                        newStudents.push({ nombre, curso })
                    }
                }

                if (newStudents.length > 0) {
                    const { error } = await supabaseClient.from("alumnos").insert(newStudents)
                    if (error) throw error

                    setUploadStatus({ type: "success", message: `Se han importado ${newStudents.length} alumnos correctamente.` })
                    fetchStats() // Refresh stats
                    setFile(null)
                    // Reset file input value manually if needed, tough in react without ref
                } else {
                    setUploadStatus({ type: "error", message: "No se encontraron datos válidos en el archivo." })
                }

            } catch (err: any) {
                console.error(err)
                setUploadStatus({ type: "error", message: `Error al importar: ${err.message}` })
            } finally {
                setUploading(false)
            }
        }
        reader.readAsText(file)
    }

    return (
        <div className="space-y-6 pb-20">
            <header className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Administración</h1>
                <p className="text-slate-500 dark:text-slate-400">
                    Gestión de datos y estadísticas generales.
                </p>
            </header>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Usos Totales</CardTitle>
                        <FileText className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalUsages}</div>
                        <p className="text-xs text-slate-500">Registros históricos</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Alumnos Importados</CardTitle>
                        <Users className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalStudents}</div>
                        <p className="text-xs text-slate-500">En base de datos</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cursos</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-slate-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalCourses}</div>
                        <p className="text-xs text-slate-500">Activos</p>
                    </CardContent>
                </Card>
            </div>

            {/* CSV Import */}
            <Card>
                <CardHeader>
                    <CardTitle>Importar Alumnos</CardTitle>
                    <CardDescription>
                        Sube un archivo CSV con el formato: <code>nombre, curso</code>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Input type="file" accept=".csv" onChange={handleFileChange} />
                        <p className="text-xs text-slate-500">Ejemplo: Juan Pérez, 1º ESO A</p>
                    </div>

                    <div className="mt-4">
                        <Button
                            onClick={handleUpload}
                            disabled={!file || uploading}
                            className="w-full sm:w-auto"
                        >
                            {uploading ? (
                                <>Importando...</>
                            ) : (
                                <>
                                    <Upload className="mr-2 h-4 w-4" /> Importar CSV
                                </>
                            )}
                        </Button>
                    </div>

                    {uploadStatus && (
                        <div className={cn(
                            "mt-4 p-4 rounded-lg flex items-center gap-2 text-sm",
                            uploadStatus.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                        )}>
                            {uploadStatus.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                            {uploadStatus.message}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
