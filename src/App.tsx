import { useState, useEffect } from 'react'

// Tipos
interface Registro {
  id: number
  timestamp: string
  nombre: string
  email: string
  tipo: string
  motivo: string
  area: string
  mailAuditor: string
  numeroAula: string
  estado: 'retirada' | 'devuelta'
}

// Mock data inicial
const MOCK_DATA: Registro[] = [
  {
    id: 1,
    timestamp: '2026-04-15 09:30:00',
    nombre: 'Maria Gonzalez',
    email: 'mgonzalez@maimonides.edu.ar',
    tipo: 'Docente',
    motivo: 'Dictado de clase',
    area: 'Laboratorio Quimica',
    mailAuditor: 'auditor.quimica@maimonides.edu.ar',
    numeroAula: '101',
    estado: 'retirada'
  },
  {
    id: 2,
    timestamp: '2026-04-15 10:15:00',
    nombre: 'Carlos Perez',
    email: 'cperez@maimonides.edu.ar',
    tipo: 'Docente',
    motivo: 'Evaluacion',
    area: 'Laboratorio Fisica',
    mailAuditor: 'auditor.fisica@maimonides.edu.ar',
    numeroAula: '203',
    estado: 'retirada'
  },
  {
    id: 3,
    timestamp: '2026-04-15 11:00:00',
    nombre: 'Lucas Martinez',
    email: 'lmartinez@maimonides.edu.ar',
    tipo: 'Docente',
    motivo: 'Clase practica',
    area: 'Laboratorio Computacion',
    mailAuditor: 'auditor.computacion@maimonides.edu.ar',
    numeroAula: '305',
    estado: 'devuelta'
  },
  {
    id: 4,
    timestamp: '2026-04-15 11:30:00',
    nombre: 'Jose Herrera',
    email: 'jherrera@maimonides.edu.ar',
    tipo: 'Mantenimiento',
    motivo: 'Reparacion',
    area: 'Laboratorio Computacion',
    mailAuditor: 'auditor.computacion@maimonides.edu.ar',
    numeroAula: '102',
    estado: 'retirada'
  },
]

function App() {
  const [registros, setRegistros] = useState<Registro[]>([])
  const [historial, setHistorial] = useState<Registro[]>([])
  const [darkMode, setDarkMode] = useState(false)

  // Inicializar
  useEffect(() => {
    // Cargar dark mode
    const savedDark = localStorage.getItem('darkMode') === 'true'
    setDarkMode(savedDark)
    if (savedDark) document.documentElement.classList.add('dark')

    // Cargar datos (mock)
    setRegistros(MOCK_DATA.filter(r => r.estado === 'retirada'))
    setHistorial(MOCK_DATA.filter(r => r.estado === 'devuelta'))
  }, [])

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    localStorage.setItem('darkMode', String(newMode))
    document.documentElement.classList.toggle('dark', newMode)
  }

  // Devolver llave
  const devolver = (id: number) => {
    const registro = registros.find(r => r.id === id)
    if (!registro) return

    if (!confirm(`Confirmar devolucion del aula ${registro.numeroAula} por ${registro.nombre}?`)) {
      return
    }

    const actualizado = { ...registro, estado: 'devuelta' as const }
    setRegistros(prev => prev.filter(r => r.id !== id))
    setHistorial(prev => [...prev, actualizado])
  }

  // Totales
  const total = registros.length
  const historialTotal = historial.length

  return (
    <div className="min-h-screen">
      {/* Header - Negro con "Auditor" en rojo */}
      <header className="bg-black text-white px-6 py-3 flex justify-between items-center">
        <h1 className="text-xl font-semibold">
          <span className="text-red-500">Auditor</span>
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-sm opacity-90">Seguridad</span>
          <button
            onClick={toggleDarkMode}
            className="text-lg hover:opacity-80 transition"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-8">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">Retiradas</div>
              <div className="text-2xl font-bold text-red-600">{total}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">Historial Hoy</div>
              <div className="text-2xl font-bold text-green-600">{historialTotal}</div>
            </div>
          </div>
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium">
            Actualizar
          </button>
        </div>

        {/* Dos tablas lado a lado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tabla: Llaves Retiradas */}
          <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b dark:border-gray-600 font-semibold dark:text-white">
              Llaves Retiradas
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 dark:text-gray-300 uppercase text-xs">Aula</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 dark:text-gray-300 uppercase text-xs">Area</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 dark:text-gray-300 uppercase text-xs">Nombre</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 dark:text-gray-300 uppercase text-xs">Motivo</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 dark:text-gray-300 uppercase text-xs">Auditor</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 dark:text-gray-300 uppercase text-xs">Accion</th>
                  </tr>
                </thead>
                <tbody>
                  {registros.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        No hay llaves retiradas
                      </td>
                    </tr>
                  ) : (
                    registros
                      .sort((a, b) => a.numeroAula.localeCompare(b.numeroAula))
                      .map((reg, idx) => (
                        <tr
                          key={reg.id}
                          className={`${idx % 2 === 0 ? (darkMode ? 'bg-gray-800' : 'bg-white') : (darkMode ? 'bg-gray-750' : 'bg-gray-50')} hover:${darkMode ? 'bg-gray-700' : 'bg-gray-100'} transition`}
                        >
                          <td className="px-3 py-2 font-medium">{reg.numeroAula}</td>
                          <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{reg.area}</td>
                          <td className="px-3 py-2">{reg.nombre}</td>
                          <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{reg.motivo}</td>
                          <td className="px-3 py-2 text-gray-500 dark:text-gray-400 text-xs">{reg.mailAuditor}</td>
                          <td className="px-3 py-2">
                            <button
                              onClick={() => devolver(reg.id)}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium"
                            >
                              Devolver
                            </button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tabla: Historial */}
          <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b dark:border-gray-600 font-semibold dark:text-white">
              Historial del Dia
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 dark:text-gray-300 uppercase text-xs">Hora</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 dark:text-gray-300 uppercase text-xs">Aula</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 dark:text-gray-300 uppercase text-xs">Area</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 dark:text-gray-300 uppercase text-xs">Nombre</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 dark:text-gray-300 uppercase text-xs">Motivo</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 dark:text-gray-300 uppercase text-xs">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        No hay historial hoy
                      </td>
                    </tr>
                  ) : (
                    historial
                      .sort((a, b) => a.numeroAula.localeCompare(b.numeroAula))
                      .map((reg, idx) => (
                        <tr
                          key={reg.id}
                          className={`${idx % 2 === 0 ? (darkMode ? 'bg-gray-800' : 'bg-white') : (darkMode ? 'bg-gray-750' : 'bg-gray-50')} hover:${darkMode ? 'bg-gray-700' : 'bg-gray-100'} transition`}
                        >
                          <td className="px-3 py-2 text-gray-500 dark:text-gray-400">{reg.timestamp.split(' ')[1]}</td>
                          <td className="px-3 py-2 font-medium">{reg.numeroAula}</td>
                          <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{reg.area}</td>
                          <td className="px-3 py-2">{reg.nombre}</td>
                          <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{reg.motivo}</td>
                          <td className="px-3 py-2">
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                              Devuelta
                            </span>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-6 py-4 text-center text-gray-400 dark:text-gray-500 text-xs">
          Universidad Maimonides - Sistema de Prestamo de Llaves
        </footer>
      </main>
    </div>
  )
}

export default App