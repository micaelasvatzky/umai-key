import { useState, useEffect } from 'react'
import { guardarSolicitud, subscribeRegistros, marcarDevolucion, Registro } from './firebase'

// ============================================
// TIPOS
// ============================================

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
  token?: string
  idGuardia?: string  // Guardia que entregó/recibió la llave
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
    estado: 'retirada',
    token: 'ABC123'
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
    estado: 'retirada',
    token: 'DEF456'
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
    estado: 'devuelta',
    token: 'GHI789'
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
    estado: 'retirada',
    token: 'JKL012'
  },
]

// ============================================
// CONSTANTES
// ============================================

// Contraseña única para todos los guardias
const CONTRASENA_GUARDIA = 'seguridad2024'

// Lista de aulas disponibles
const AULAS = [
  '101', '102', '103', '201', '202', '203', '301', '302', '303',
  'Laboratorio Quimica', 'Laboratorio Fisica', 'Laboratorio Computacion',
  'Biblioteca', 'Sala de Reuniones', 'Direccion'
]



// ============================================
// COMPONENTES
// ============================================

// Vista: Página de Inicio (Selector de rol)
function PantallaInicio({ onSeleccionarRol }: { onSeleccionarRol: (rol: 'docente' | 'seguridad') => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo / Titulo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-3xl font-bold">K</span>
          </div>
          <h1 className="text-3xl font-bold text-white">UMAI-Key</h1>
          <p className="text-slate-400 mt-2">Sistema de Prestamo de Llaves</p>
        </div>

        {/* Opciones */}
        <div className="space-y-4">
          <button
            onClick={() => onSeleccionarRol('docente')}
            className="w-full bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white p-6 rounded-lg transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="text-left">
                <div className="text-lg font-semibold">Soy Docente</div>
                <div className="text-slate-400 text-sm">Solicitar retiro de llave</div>
              </div>
              <svg className="w-5 h-5 text-slate-500 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          <button
            onClick={() => onSeleccionarRol('seguridad')}
            className="w-full bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white p-6 rounded-lg transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="text-left">
                <div className="text-lg font-semibold">Soy Seguridad</div>
                <div className="text-slate-400 text-sm">Panel de control</div>
              </div>
              <svg className="w-5 h-5 text-slate-500 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-xs mt-8">
          Universidad Maimonides
        </p>
      </div>
    </div>
  )
}

// Vista: Formulario para Docente
function FormularioDocente({ onVolver }: { onVolver: () => void }) {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    aula: '',
    motivo: ''
  })
  const [enviado, setEnviado] = useState(false)
  const [tokenGenerado, setTokenGenerado] = useState('')
  const [emailError, setEmailError] = useState('')
  const [cargando, setCargando] = useState(false)

  // Validar email institucional
  const validarEmail = (email: string): boolean => {
    const dominio1 = '@maimonides.edu.ar'
    const dominio2 = '@maimonidesvirtual.com.ar'
    return email.endsWith(dominio1) || email.endsWith(dominio2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar email
    if (!validarEmail(formData.email)) {
      setEmailError('Solo se permiten emails @maimonides.edu.ar o @maimonidesvirtual.com.ar')
      return
    }
    
    setEmailError('')
    setCargando(true)
    
    try {
      // Generar token aleatorio
      const token = Math.random().toString(36).substring(2, 8).toUpperCase()
      
      // Guardar en Firestore
      await guardarSolicitud({
        nombre: formData.nombre,
        email: formData.email,
        tipo: 'Docente',
        motivo: formData.motivo,
        area: formData.aula,
        mailAuditor: '',
        numeroAula: formData.aula,
        token
      })
      
      setTokenGenerado(token)
      setEnviado(true)
    } catch (error) {
      console.error('Error al guardar:', error)
      alert('Error al enviar la solicitud. Intenta de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  const handleEmailChange = (value: string) => {
    setFormData({ ...formData, email: value })
    if (emailError && validarEmail(value)) {
      setEmailError('')
    }
  }

  if (enviado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Solicitud Enviada</h2>
          <p className="text-slate-400 mb-6">Tu solicitud ha sido registrada correctamente.</p>
          
          <div className="bg-slate-700 rounded-lg p-4 mb-6">
            <p className="text-slate-400 text-sm mb-2">Tu codigo de validacion:</p>
            <div className="text-3xl font-mono font-bold text-yellow-400 tracking-wider">{tokenGenerado}</div>
            <p className="text-slate-500 text-xs mt-2">Comunicate con Seguridad y entregales este codigo</p>
          </div>

          <button
            onClick={() => { setEnviado(false); setFormData({ nombre: '', email: '', aula: '', motivo: '' }); }}
            className="w-full bg-slate-600 hover:bg-slate-500 text-white py-3 rounded-lg font-medium transition"
          >
            Nueva Solicitud
          </button>
          
          <button
            onClick={onVolver}
            className="w-full mt-3 text-slate-400 hover:text-white py-2 text-sm transition"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onVolver}
            className="w-10 h-10 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-center transition"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-white">Solicitar Llave</h1>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-5">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Nombre completo</label>
            <input
              type="text"
              required
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-red-500 focus:outline-none transition"
              placeholder="Ej: Juan Perez"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Email institucional</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => handleEmailChange(e.target.value)}
              className={`w-full bg-slate-900 border rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none transition ${emailError ? 'border-red-500 focus:border-red-500' : 'border-slate-600 focus:border-red-500'}`}
              placeholder="jperez@maimonides.edu.ar"
            />
            {emailError && <p className="text-red-400 text-xs mt-1">{emailError}</p>}
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Aula / Espacio</label>
            <select
              required
              value={formData.aula}
              onChange={(e) => setFormData({ ...formData, aula: e.target.value })}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-red-500 focus:outline-none transition"
            >
              <option value="">Seleccionar...</option>
              {AULAS.map((aula) => (
                <option key={aula} value={aula}>{aula}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Motivo</label>
            <select
              required
              value={formData.motivo}
              onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-red-500 focus:outline-none transition"
            >
              <option value="">Seleccionar...</option>
              <option value="Dictado de clase">Dictado de clase</option>
              <option value="Evaluacion">Evaluacion</option>
              <option value="Clase practica">Clase practica</option>
              <option value="Reunion">Reunion</option>
              <option value="Otro">Otro</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition"
          >
            Enviar Solicitud
          </button>

          <p className="text-slate-500 text-xs text-center">
            Recibiras un codigo. Comunicate con Seguridad para entregarlo y recibir la llave.
          </p>
        </form>
      </div>
    </div>
  )
}

// Vista: Dashboard Seguridad
function DashboardSeguridad({ idGuardia, onVolver }: { idGuardia: string; onVolver: () => void }) {
  const [registros, setRegistros] = useState<Registro[]>([])
  const [historial, setHistorial] = useState<Registro[]>([])
  const [darkMode, setDarkMode] = useState(false)
  const [tokenInput, setTokenInput] = useState('')
  const [tokenError, setTokenError] = useState('')
  const [tokenSuccess, setTokenSuccess] = useState('')

  // Inicializar - suscribirse a Firestore
  useEffect(() => {
    const savedDark = localStorage.getItem('darkMode') === 'true'
    setDarkMode(savedDark)
    if (savedDark) document.documentElement.classList.add('dark')

    // Suscribirse a cambios en tiempo real
    const unsubscribe = subscribeRegistros((todosRegistros) => {
      setRegistros(todosRegistros.filter(r => r.estado === 'retirada'))
      setHistorial(todosRegistros.filter(r => r.estado === 'devuelta'))
    })

    return () => unsubscribe()
  }, [])

  const toggleDarkMode = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    localStorage.setItem('darkMode', String(newMode))
    document.documentElement.classList.toggle('dark', newMode)
  }

  // Devolver llave
  const devolver = async (id: string) => {
    const registro = registros.find(r => r.id === id)
    if (!registro) return

    if (!confirm(`Confirmar devolucion del aula ${registro.numeroAula} por ${registro.nombre}?`)) {
      return
    }

    try {
      await marcarDevolucion(id, idGuardia)
    } catch (error) {
      console.error('Error al devolver:', error)
      alert('Error al procesar la devolucion')
    }
  }

  // Validar token
  const validarToken = () => {
    setTokenError('')
    setTokenSuccess('')
    
    const tokenUpper = tokenInput.toUpperCase().trim()
    const encontrado = registros.find(r => r.token === tokenUpper)
    
    if (encontrado) {
      setTokenSuccess(`Token valido! ${encontrado.nombre} - Aula ${encontrado.numeroAula}`)
    } else {
      setTokenError('Token no encontrado o ya utilizado')
    }
    setTokenInput('')
  }

  const total = registros.length
  const historialTotal = historial.length

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-black text-white px-6 py-3 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={onVolver}
            className="w-8 h-8 bg-slate-700 hover:bg-slate-600 rounded flex items-center justify-center transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold">
            <span className="text-red-500">Auditor</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm opacity-90">Guardia: <span className="font-semibold">{idGuardia}</span></span>
          <button
            onClick={toggleDarkMode}
            className="text-lg hover:opacity-80 transition"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Validar Token */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-slate-400 text-xs font-medium mb-1">Validar Token</label>
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && validarToken()}
                placeholder="Ingresa el codigo del docente..."
                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white placeholder-slate-500 focus:border-yellow-500 focus:outline-none text-sm"
              />
            </div>
            <button
              onClick={validarToken}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded font-medium text-sm h-10 mt-5"
            >
              Validar
            </button>
          </div>
          {tokenError && <p className="text-red-400 text-xs mt-2">{tokenError}</p>}
          {tokenSuccess && <p className="text-green-400 text-xs mt-2">{tokenSuccess}</p>}
        </div>

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

        {/* Tablas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Llaves Retiradas */}
          <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b dark:border-gray-600 font-semibold dark:text-white">
              Llaves Retiradas
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 dark:text-gray-300 uppercase text-xs">Aula</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 dark:text-gray-300 uppercase text-xs">Nombre</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 dark:text-gray-300 uppercase text-xs">Token</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 dark:text-gray-300 uppercase text-xs">Accion</th>
                  </tr>
                </thead>
                <tbody>
                  {registros.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
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
                          <td className="px-3 py-2">{reg.nombre}</td>
                          <td className="px-3 py-2 font-mono text-xs text-yellow-600 dark:text-yellow-400">{reg.token}</td>
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

          {/* Historial */}
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
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 dark:text-gray-300 uppercase text-xs">Nombre</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 dark:text-gray-300 uppercase text-xs">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
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
                          <td className="px-3 py-2">{reg.nombre}</td>
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

        <footer className="mt-6 py-4 text-center text-gray-400 dark:text-gray-500 text-xs">
          Universidad Maimonides - Sistema de Prestamo de Llaves
        </footer>
      </main>
    </div>
  )
}

// ============================================
// APP PRINCIPAL
// ============================================

// Componente: Login de Seguridad
function LoginSeguridad({ onLogin }: { onLogin: (idGuardia: string) => void }) {
  const [idGuardia, setIdGuardia] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!idGuardia.trim()) {
      setError('Ingresá tu número de guardia')
      return
    }
    if (contrasena !== CONTRASENA_GUARDIA) {
      setError('Contraseña incorrecta')
      return
    }
    
    setError('')
    onLogin(idGuardia.trim())
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => window.location.reload()}
            className="w-10 h-10 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-center transition"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-white">Acceso Seguridad</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-5">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Número de Guardia / ID</label>
            <input
              type="text"
              required
              value={idGuardia}
              onChange={(e) => setIdGuardia(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-red-500 focus:outline-none transition"
              placeholder="Ej: G001"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Contraseña</label>
            <input
              type="password"
              required
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:border-red-500 focus:outline-none transition"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition"
          >
            Ingresar
          </button>
        </form>

        <p className="text-center text-slate-500 text-xs mt-6">
          Acceso restringido al personal de seguridad
        </p>
      </div>
    </div>
  )
}

function App() {
  const [vista, setVista] = useState<'inicio' | 'docente' | 'login-seguridad' | 'seguridad'>('inicio')
  const [idGuardia, setIdGuardia] = useState('')

  const handleSeguridadClick = () => {
    setVista('login-seguridad')
  }

  const handleLoginSeguridad = (id: string) => {
    setIdGuardia(id)
    setVista('seguridad')
  }

  return (
    <>
      {vista === 'inicio' && (
        <PantallaInicio onSeleccionarRol={(rol) => rol === 'docente' ? setVista('docente') : handleSeguridadClick()} />
      )}
      {vista === 'login-seguridad' && (
        <LoginSeguridad onLogin={handleLoginSeguridad} />
      )}
      {vista === 'docente' && (
        <FormularioDocente onVolver={() => setVista('inicio')} />
      )}
      {vista === 'seguridad' && (
        <DashboardSeguridad idGuardia={idGuardia} onVolver={() => setVista('inicio')} />
      )}
    </>
  )
}

export default App