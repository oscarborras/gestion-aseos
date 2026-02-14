import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import type { Aseo } from "@/types"

interface DashboardCardProps {
    aseo: Aseo
}

export function DashboardCard({ aseo }: DashboardCardProps) {
    const isOccupied = aseo.estado === "ocupado"

    return (
        <Card
            className={cn(
                "transition-colors duration-300",
                isOccupied
                    ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20"
                    : "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20"
            )}
        >
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold flex justify-between items-center">
                    {aseo.nombre}
                    <Badge
                        variant={isOccupied ? "destructive" : "success"}
                        className="text-xs uppercase"
                    >
                        {isOccupied ? "Ocupado" : "Libre"}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {isOccupied ? (
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                            <User className="h-4 w-4" />
                            <span className="font-medium">{aseo.ocupado_por}</span>
                        </div>
                        {aseo.curso_alumno && (
                            <div className="text-slate-500 dark:text-slate-400 pl-6 text-xs">
                                {aseo.curso_alumno}
                            </div>
                        )}
                        {aseo.ultimo_cambio && (
                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs mt-2 pl-6">
                                <Clock className="h-3 w-3" />
                                <span>
                                    {formatDistanceToNow(new Date(aseo.ultimo_cambio), {
                                        addSuffix: true,
                                        locale: es,
                                    })}
                                </span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-sm text-slate-500 dark:text-slate-400 py-4 italic text-center">
                        Disponible para su uso
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
