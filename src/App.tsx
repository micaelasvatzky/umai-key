import { useState, useEffect } from 'react'
import { guardarSolicitud, subscribeRegistros, subscribeHistorial, validarTokenEnFirebase, marcarDevolucion, type Registro } from './firebase'

// ============================================
// CONSTANTES
// ============================================

// Contraseña única para todos los guardias
const CONTRASENA_GUARDIA = 'umai2026'

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
                  <div className="text-lg font-semibold">Quiero retirar una llave</div>
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
    nombre: localStorage.getItem('umai_nombre') || '',
    email: localStorage.getItem('umai_email') || '',
    aula: '',
    motivo: ''
  })
  const [enviado, setEnviado] = useState(false)
  const [tokenGenerado, setTokenGenerado] = useState('')
  const [emailError, setEmailError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [aulasOcupadas, setAulasOcupadas] = useState<string[]>([])

  // Saber qué aulas están en uso (retiradas)
  useEffect(() => {
    const unsubscribe = subscribeRegistros((todos) => {
      setAulasOcupadas(todos.filter(r => r.estado === 'retirada').map(r => r.numeroAula))
    })
    return () => unsubscribe()
  }, [])

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

    // Validar que el aula no esté ocupada
    if (aulasOcupadas.includes(formData.aula)) {
      alert('Esa aula ya está en uso. Elegí otra.')
      return
    }
    
    setEmailError('')
    setCargando(true)
    
    try {
      // Guardar datos del docente para próxima solicitud
      localStorage.setItem('umai_nombre', formData.nombre)
      localStorage.setItem('umai_email', formData.email)

      // Guardar en Firestore (token se genera automáticamente)
      const nuevoRegistro = await guardarSolicitud({
        nombre: formData.nombre,
        email: formData.email,
        tipo: 'Docente',
        motivo: formData.motivo,
        area: formData.aula,
        mailAuditor: '',
        numeroAula: formData.aula
      })
      
      setTokenGenerado(nuevoRegistro.token || '')
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
            onClick={() => { setEnviado(false); setFormData(prev => ({ nombre: prev.nombre, email: prev.email, aula: '', motivo: '' })); }}
            className="w-full bg-slate-600 hover:bg-slate-500 text-white py-3 rounded-lg font-medium transition"
          >
            Nueva Solicitud
          </button>
          
          <button
            onClick={() => {
              localStorage.removeItem('umai_nombre')
              localStorage.removeItem('umai_email')
              onVolver()
            }}
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
            onClick={() => {
              localStorage.removeItem('umai_nombre')
              localStorage.removeItem('umai_email')
              onVolver()
            }}
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
              {AULAS.map((aula) => {
                const ocupada = aulasOcupadas.includes(aula)
                return (
                  <option key={aula} value={aula} disabled={ocupada} className={ocupada ? 'text-gray-500' : ''}>
                    {aula}{ocupada ? ' (en uso)' : ''}
                  </option>
                )
              })}
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
            disabled={cargando}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition"
          >
            {cargando ? 'Enviando...' : 'Enviar Solicitud'}
          </button>

          <p className="text-slate-500 text-xs text-center">
            Recibiras un codigo. Comunicate con Seguridad para entregarlo y recibir la llave.
          </p>
        </form>
      </div>
    </div>
  )
}

// Componente: Modal de Devolución
function ModalDevolucion({
  registro,
  onConfirm,
  onCancel
}: {
  registro: Registro | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!registro) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-4">Confirmar Devolución</h3>
        <div className="space-y-3 mb-6">
          <div className="flex justify-between">
            <span className="text-slate-400">Aula:</span>
            <span className="text-white font-semibold">{registro.numeroAula}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Docente:</span>
            <span className="text-white font-semibold">{registro.nombre}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Email:</span>
            <span className="text-white">{registro.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Motivo:</span>
            <span className="text-white">{registro.motivo}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-2.5 rounded-lg font-medium transition"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-medium transition"
          >
            Confirmar Devolución
          </button>
        </div>
      </div>
    </div>
  )
}

// Vista: Dashboard Seguridad
function DashboardSeguridad({ idGuardia, onVolver }: { idGuardia: string; onVolver: () => void }) {
  const [registros, setRegistros] = useState<Registro[]>([])      // TODOS los de 'solicitudes'
  const [historialRegistros, setHistorialRegistros] = useState<Registro[]>([]) // colección 'historial'
  const [darkMode, setDarkMode] = useState(false)
  const [tokenInput, setTokenInput] = useState('')
  const [tokenError, setTokenError] = useState('')
  const [tokenSuccess, setTokenSuccess] = useState('')
  const [tabActiva, setTabActiva] = useState<'activos' | 'historial' | 'panel'>('activos')
  const [showModal, setShowModal] = useState(false)
  const [registroADevolver, setRegistroADevolver] = useState<Registro | null>(null)
  const [mostrarTokens, setMostrarTokens] = useState(false)
  const [subTabHistorial, setSubTabHistorial] = useState<'hoy' | 'buscar'>('hoy')
  const [fechaBusqueda, setFechaBusqueda] = useState(() => new Date().toISOString().split('T')[0])

  // Inicializar - suscribirse a Firestore
  useEffect(() => {
    const savedDark = localStorage.getItem('darkMode') === 'true'
    setDarkMode(savedDark)
    if (savedDark) document.documentElement.classList.add('dark')

    // Suscribirse a cambios en tiempo real en 'solicitudes' (pendientes + retiradas)
    const unsubscribe = subscribeRegistros((todosRegistros) => {
      setRegistros(todosRegistros)
    })

    // Suscribirse al HISTORIAL REAL (colección 'historial' en Firebase)
    const unsubHistorial = subscribeHistorial((hist) => {
      setHistorialRegistros(hist)
    })

    return () => {
      unsubscribe()
      unsubHistorial()
    }
  }, [])

  const toggleDarkMode = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    localStorage.setItem('darkMode', String(newMode))
    document.documentElement.classList.toggle('dark', newMode)
  }

  // Abrir modal de devolución
  const abrirModalDevolucion = (reg: Registro) => {
    setRegistroADevolver(reg)
    setShowModal(true)
  }

  // Confirmar devolución desde el modal
  const confirmarDevolucion = async () => {
    if (!registroADevolver?.id) return

    try {
      await marcarDevolucion(registroADevolver.id, idGuardia)
      setShowModal(false)
      setRegistroADevolver(null)
    } catch (error) {
      console.error('Error al devolver:', error)
      alert('Error al procesar la devolucion')
    }
  }

  // Cancelar devolución
  const cancelarDevolucion = () => {
    setShowModal(false)
    setRegistroADevolver(null)
  }

  // Validar token (busca en Firebase y cambia estado a 'retirada')
  const validarToken = async () => {
    setTokenError('')
    setTokenSuccess('')
    
    const tokenUpper = tokenInput.toUpperCase().trim()
    if (!tokenUpper) return
    
    try {
      await validarTokenEnFirebase(tokenUpper, idGuardia)
      setTokenSuccess('Token validado correctamente!')
      setTimeout(() => setTokenSuccess(''), 3000)
    } catch (error) {
      setTokenError('Token no encontrado o ya utilizado')
    }
    setTokenInput('')
  }

  const totalRetiradas = registros.filter(r => r.estado === 'retirada').length
  const totalPendientes = registros.filter(r => r.estado === 'pendiente').length
  const historialTotal = historialRegistros.length
  const hoyStr = new Date().toISOString().split('T')[0]
  const historialHoy = historialRegistros.filter(r => r.fechaDevolucion?.startsWith(hoyStr))
  const historialBusqueda = historialRegistros.filter(r => r.fechaDevolucion?.startsWith(fechaBusqueda))

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
            <span className="text-red-500">Seguridad</span>
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

        {/* Pestañas (Tabs) */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTabActiva('activos')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tabActiva === 'activos' ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            Activos
          </button>
          <button
            onClick={() => setTabActiva('historial')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tabActiva === 'historial' ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            Historial
          </button>
          <button
            onClick={() => setTabActiva('panel')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tabActiva === 'panel' ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            Panel Completo
          </button>
        </div>

        {/* Stats */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-8">
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">Retiradas</div>
              <div className="text-2xl font-bold text-red-600">{totalRetiradas}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">Pendientes</div>
              <div className="text-2xl font-bold text-yellow-600">{totalPendientes}</div>
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

        {/* Contenido según Pestaña Activa */}
        {tabActiva === 'activos' && (
          <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b dark:border-gray-600 font-semibold dark:text-white">
              Llaves Activas
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 dark:text-gray-300 uppercase text-xs">Aula</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 dark:text-gray-300 uppercase text-xs">Nombre</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 dark:text-gray-300 uppercase text-xs">
                      <button
                        onClick={() => setMostrarTokens(!mostrarTokens)}
                        className="flex items-center gap-1.5 hover:text-gray-900 dark:hover:text-white transition"
                      >
                        Token
                        <svg className={`w-4 h-4 transition ${mostrarTokens ? 'text-yellow-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          {mostrarTokens ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          )}
                        </svg>
                      </button>
                    </th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 dark:text-gray-300 uppercase text-xs">Estado</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600 dark:text-gray-300 uppercase text-xs">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Juntar pendientes y retiradas, pendientes primero
                    const pendientes = registros
                      .filter(r => r.estado === 'pendiente')
                      .sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''))
                    const retiradas = registros
                      .filter(r => r.estado === 'retirada')
                      .sort((a, b) => a.numeroAula.localeCompare(b.numeroAula))
                    const todos = [...pendientes, ...retiradas]

                    if (todos.length === 0) {
                      return (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                            No hay llaves activas
                          </td>
                        </tr>
                      )
                    }

                    return todos.map((reg) => (
                      <tr
                        key={reg.id}
                        className={`
                          ${reg.estado === 'pendiente'
                            ? 'bg-yellow-50 dark:bg-yellow-900/10 border-l-4 border-l-yellow-500'
                            : darkMode ? 'bg-gray-800' : 'bg-white'
                          }
                          hover:bg-yellow-100 dark:hover:bg-yellow-900/20 transition
                        `}
                      >
                        <td className="px-3 py-2 font-medium">{reg.numeroAula}</td>
                        <td className="px-3 py-2">{reg.nombre}</td>
                        <td className="px-3 py-2 font-mono text-xs">
                          {reg.estado === 'pendiente' || mostrarTokens ? (
                            <span className={`font-bold ${reg.estado === 'pendiente' ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-500 dark:text-gray-400'}`}>{reg.token}</span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {reg.estado === 'pendiente' ? (
                            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300">
                              Pendiente
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                              En uso
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {reg.estado === 'retirada' && (
                            <button
                              onClick={() => abrirModalDevolucion(reg)}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium"
                            >
                              Devolver
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tabActiva === 'historial' && (
          <div>
            {/* Sub-tabs Historial */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setSubTabHistorial('hoy')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition ${subTabHistorial === 'hoy' ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
              >
                Hoy
              </button>
              <button
                onClick={() => setSubTabHistorial('buscar')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition ${subTabHistorial === 'buscar' ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
              >
                Buscar
              </button>
            </div>

            {subTabHistorial === 'hoy' && (
              <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded overflow-hidden">
                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b dark:border-gray-600 font-semibold dark:text-white text-sm">
                  Historial de Hoy ({historialHoy.length})
                </div>
                <div className="overflow-x-auto max-h-80">
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
                      {historialHoy.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                            No hay devoluciones hoy
                          </td>
                        </tr>
                      ) : (
                        historialHoy
                          .sort((a, b) => a.numeroAula.localeCompare(b.numeroAula))
                          .map((reg, idx) => (
                            <tr
                              key={reg.id}
                              className={`${idx % 2 === 0 ? (darkMode ? 'bg-gray-800' : 'bg-white') : (darkMode ? 'bg-gray-750' : 'bg-gray-50')} hover:${darkMode ? 'bg-gray-700' : 'bg-gray-100'} transition`}
                            >
                              <td className="px-3 py-2 text-gray-500 dark:text-gray-400 text-xs">
                                {reg.fechaDevolucion ? new Date(reg.fechaDevolucion).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                              </td>
                              <td className="px-3 py-2 font-medium">{reg.numeroAula}</td>
                              <td className="px-3 py-2">{reg.nombre}</td>
                              <td className="px-3 py-2">
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
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
            )}

            {subTabHistorial === 'buscar' && (
              <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded overflow-hidden">
                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b dark:border-gray-600 flex items-center gap-3">
                  <label className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Fecha</label>
                  <input
                    type="date"
                    value={fechaBusqueda}
                    onChange={(e) => setFechaBusqueda(e.target.value)}
                    className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-white text-xs focus:border-red-500 focus:outline-none"
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {historialBusqueda.length} registro{historialBusqueda.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="overflow-x-auto max-h-80">
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
                      {historialBusqueda.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                            No hay devoluciones en esta fecha
                          </td>
                        </tr>
                      ) : (
                        historialBusqueda
                          .sort((a, b) => a.numeroAula.localeCompare(b.numeroAula))
                          .map((reg, idx) => (
                            <tr
                              key={reg.id}
                              className={`${idx % 2 === 0 ? (darkMode ? 'bg-gray-800' : 'bg-white') : (darkMode ? 'bg-gray-750' : 'bg-gray-50')} hover:${darkMode ? 'bg-gray-700' : 'bg-gray-100'} transition`}
                            >
                              <td className="px-3 py-2 text-gray-500 dark:text-gray-400 text-xs">
                                {reg.fechaDevolucion ? new Date(reg.fechaDevolucion).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                              </td>
                              <td className="px-3 py-2 font-medium">{reg.numeroAula}</td>
                              <td className="px-3 py-2">{reg.nombre}</td>
                              <td className="px-3 py-2">
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
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
            )}
          </div>
        )}

        {tabActiva === 'panel' && (
          <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded overflow-hidden p-6">
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b dark:border-gray-600 font-semibold dark:text-white -mx-6 -mt-6 mb-6">
              Panel Completo de Llaves
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {AULAS.sort().map((aula) => {
                // Buscar si hay un registro activo para esta aula
                const activo = registros.find(r => r.numeroAula === aula)

                let colorClass = 'border-green-500 bg-green-50 dark:bg-green-900/20' // Verde: Disponible
                let badgeClass = 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                let textoEstado = 'Disponible'
                let nombreSolicitante = ''

                if (activo?.estado === 'pendiente') {
                  colorClass = 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' // Amarillo: Pendiente
                  badgeClass = 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
                  textoEstado = 'Pendiente'
                  nombreSolicitante = activo.nombre
                } else if (activo?.estado === 'retirada') {
                  colorClass = 'border-red-500 bg-red-50 dark:bg-red-900/20' // Rojo: Retirada
                  badgeClass = 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                  textoEstado = 'Retirada'
                  nombreSolicitante = activo.nombre
                }

                return (
                  <div key={aula} className={`border-l-4 rounded-lg p-4 shadow-sm ${colorClass}`}>
                    <div className="font-bold text-lg mb-1">{aula}</div>
                    {nombreSolicitante && (
                      <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">{nombreSolicitante}</div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badgeClass}`}>
                        {textoEstado}
                      </span>
                      {activo?.estado === 'retirada' && (
                        <button
                          onClick={() => abrirModalDevolucion(activo)}
                          className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs"
                        >
                          Devolver
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Modal de Devolución */}
        {showModal && (
          <ModalDevolucion
            registro={registroADevolver}
            onConfirm={confirmarDevolucion}
            onCancel={cancelarDevolucion}
          />
        )}

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