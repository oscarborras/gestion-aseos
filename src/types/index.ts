export type AseoEstado = 'libre' | 'ocupado'
export type SalidaEstado = 'Bueno' | 'Regular' | 'Malo'

export interface Aseo {
    id: string
    nombre: string
    estado: AseoEstado
    ocupado_por: string | null
    curso_alumno: string | null
    observaciones_entrada: string | null
    ultimo_cambio: string
}

export interface Curso {
    id: string
    nombre: string
}

export interface Registro {
    id: string
    alumno_nombre: string
    alumno_curso: string
    aseo_id: string
    fecha_entrada: string
    fecha_salida: string | null
    estado_salida: SalidaEstado | null
    observaciones_salida: string | null
}
