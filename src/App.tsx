import { useState, useEffect } from 'react'
import { guardarSolicitud, subscribeRegistros, subscribeHistorial, validarTokenEnFirebase, marcarDevolucion, generarTokenAuditor, verificarTokenAuditor, enviarTokenPorEmail, FORMSPREE_ID, type Registro } from './firebase'
import resourcesData from '../resources.json'

// ============================================
// CONSTANTES
// ============================================

// Contraseña única para todos los guardias
const CONTRASENA_GUARDIA = 'umai2026'

// Lista de aulas desde resources.json (filtrados vehículos: Hyundai, Toyota, Mercedes)
const EXCLUIDOS = ['Hyundai (10 personas)', 'Toyota camioneta', 'Mercedes (19 personas)']
const AULAS = (resourcesData as { resources: Array<{ name: string }> }).resources
  .map(r => r.name)
  .filter(name => !EXCLUIDOS.includes(name))
  .sort()



// ============================================
// COMPONENTES
// ============================================

// Vista: Página de Inicio (Selector de rol)
function PantallaInicio({ onSeleccionarRol }: { onSeleccionarRol: (rol: 'docente' | 'seguridad') => void }) {
  const [isDarkHome, setIsDarkHome] = useState(() => document.documentElement.classList.contains('dark'))

  const toggleHomeDark = () => {
    const newMode = !document.documentElement.classList.contains('dark')
    if (newMode) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    localStorage.setItem('darkMode', String(newMode))
    setIsDarkHome(newMode)
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-200 via-sky-100 to-indigo-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4 z-10">
      {/* Decorativas blobs for depth */}
      <div className="absolute top-1/4 -left-24 w-80 h-80 bg-blue-200/30 dark:bg-blue-500/15 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/3 -right-24 w-80 h-80 bg-sky-200/25 dark:bg-sky-500/15 rounded-full blur-[120px]" />
      <div className="absolute top-1/2 left-1/3 w-60 h-60 bg-indigo-100/15 dark:bg-indigo-800/10 rounded-full blur-[100px]" />

      <div className="max-w-sm w-full relative">
        {/* Dark Mode Toggle */}
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={toggleHomeDark}
            className="w-9 h-9 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/50 dark:border-gray-700 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
            title={isDarkHome ? 'Modo Claro' : 'Modo Oscuro'}
          >
            {isDarkHome ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            )}
          </button>
        </div>

        {/* Glass Card */}
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-2xl border border-white/40 dark:border-gray-700/50 rounded-3xl p-8 shadow-2xl dark:shadow-black/50">

        {/* Logo / Titulo */}
        <div className="text-center mb-8">
          <div className="relative w-24 h-24 mx-auto mb-5">
            <div className="absolute inset-0 rounded-[26px] bg-blue-400/40 dark:bg-blue-500/20 blur-2xl" />
            <div className="relative w-24 h-24 rounded-[26px] bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-2xl dark:shadow-black/50">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">UMAI-Key</h1>
          <p className="text-blue-500 dark:text-blue-400 mt-1.5 text-sm font-medium">Sistema de Préstamo de Llaves</p>
        </div>

        {/* Opciones */}
        <div className="space-y-4">
          <button
            onClick={() => onSeleccionarRol('docente')}
            className="w-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 border border-blue-100 dark:border-gray-700 text-left p-5 rounded-2xl transition-all group shadow-lg dark:shadow-black/50 hover:shadow-xl active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center group-hover:scale-110 transition shadow-md shadow-blue-200 dark:shadow-blue-900/30">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-base font-semibold text-gray-900 dark:text-white">Quiero retirar una llave</div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Solicitar retiro de llave</div>
              </div>
              <svg className="w-5 h-5 text-blue-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </div>
          </button>

          <button
            onClick={() => onSeleccionarRol('seguridad')}
            className="w-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 border border-blue-100 dark:border-gray-700 text-left p-5 rounded-2xl transition-all group shadow-lg dark:shadow-black/50 hover:shadow-xl active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center group-hover:scale-110 transition shadow-md shadow-blue-200 dark:shadow-blue-900/30">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-base font-semibold text-gray-900 dark:text-white">Soy Seguridad</div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Panel de control</div>
              </div>
              <svg className="w-5 h-5 text-blue-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </div>
          </button>
        </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-400 dark:text-gray-500 text-xs mt-8">
          Universidad Maimónides
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
  const [isDarkForm, setIsDarkForm] = useState(() => document.documentElement.classList.contains('dark'))

  const toggleFormDark = () => {
    const newMode = !document.documentElement.classList.contains('dark')
    if (newMode) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    localStorage.setItem('darkMode', String(newMode))
    setIsDarkForm(newMode)
  }

  // Saber qué aulas están en uso (retiradas)
  useEffect(() => {
    const unsubscribe = subscribeRegistros((todos) => {
      setAulasOcupadas(todos.filter(r => r.estado === 'retirada').map(r => r.numeroAula))
    })
    return () => unsubscribe()
  }, [])

  // Validar email institucional
  const validarEmail = (email: string): boolean => {
    const dominio1 = '@maimonides.edu'
    const dominio2 = '@maimonidesvirtual.com.ar'
    return email.endsWith(dominio1) || email.endsWith(dominio2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar email
    if (!validarEmail(formData.email)) {
      setEmailError('Solo se permiten emails @maimonides.edu o @maimonidesvirtual.com.ar')
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
        mailAuditor: formData.email, // El mail del formulario = el responsable/auditor
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
      <div className="min-h-screen bg-gradient-to-br from-blue-200 via-sky-100 to-indigo-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
        <div className="max-w-sm w-full relative">
          <div className="absolute -top-2 right-0 z-10">
            <button
              onClick={toggleFormDark}
              className="w-9 h-9 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/50 dark:border-gray-700 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
              title={isDarkForm ? 'Modo Claro' : 'Modo Oscuro'}
            >
              {isDarkForm ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              )}
            </button>
          </div>
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-blue-100 dark:border-gray-700 rounded-3xl p-8 text-center shadow-lg">
          <div className="w-16 h-16 rounded-[20px] bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mx-auto mb-5 shadow-md shadow-green-200 dark:shadow-green-900/30">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Solicitud Enviada</h2>
          <p className="text-sm text-blue-400 dark:text-blue-500 mb-6">Tu solicitud ha sido registrada correctamente.</p>
          
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-2xl p-5 mb-6 border border-blue-100 dark:border-blue-900/30">
            <p className="text-xs text-blue-600 dark:text-blue-400 mb-2 font-medium">Tu código de validación</p>
            <div className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400 tracking-widest">{tokenGenerado}</div>
            <p className="text-blue-400 dark:text-blue-500 text-[11px] mt-3">Comunicate con Seguridad y entregales este código</p>
          </div>

          <button
            onClick={() => { setEnviado(false); setFormData(prev => ({ nombre: prev.nombre, email: prev.email, aula: '', motivo: '' })); }}
            className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white py-3 rounded-2xl font-medium text-sm transition-all shadow-md shadow-blue-200 dark:shadow-blue-900/30"
          >
            Nueva Solicitud
          </button>
          
          <button
            onClick={() => {
              localStorage.removeItem('umai_nombre')
              localStorage.removeItem('umai_email')
              onVolver()
            }}
            className="w-full mt-2 text-blue-400 dark:text-blue-500 hover:text-blue-600 dark:hover:text-blue-300 py-2.5 text-xs font-medium transition"
          >
            Volver al inicio
          </button>
        </div>
      </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 via-sky-100 to-indigo-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => {
              localStorage.removeItem('umai_nombre')
              localStorage.removeItem('umai_email')
              onVolver()
            }}
            className="w-10 h-10 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-sm hover:shadow-md transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white flex-1">Solicitar Llave</h1>
          <button
            onClick={toggleFormDark}
            className="w-9 h-9 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/50 dark:border-gray-700 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
            title={isDarkForm ? 'Modo Claro' : 'Modo Oscuro'}
          >
            {isDarkForm ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            )}
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-blue-100 dark:border-gray-700 rounded-3xl p-6 space-y-5 shadow-lg">
          <div>
            <label className="block text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Nombre completo</label>
            <input
              type="text"
              required
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full bg-blue-50/50 dark:bg-gray-900/50 border border-blue-200 dark:border-gray-600 rounded-2xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition text-sm"
              placeholder="Ej: Juan Pérez"
            />
          </div>

          <div>
            <label className="block text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Email institucional</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => handleEmailChange(e.target.value)}
              className={`w-full bg-blue-50/50 dark:bg-gray-900/50 border rounded-2xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none transition text-sm ${emailError ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500' : 'border-blue-200 dark:border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'}`}
              placeholder="jperez@maimonides.edu"
            />
            {emailError && <p className="text-red-500 text-xs mt-1.5 font-medium">{emailError}</p>}
          </div>

          <div>
            <label className="block text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Aula / Espacio</label>
            <select
              required
              value={formData.aula}
              onChange={(e) => setFormData({ ...formData, aula: e.target.value })}
              className="w-full bg-blue-50/50 dark:bg-gray-900/50 border border-blue-200 dark:border-gray-600 rounded-2xl px-4 py-3 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition text-sm"
            >
              <option value="" className="text-gray-400">Seleccionar...</option>
              {AULAS.map((aula) => {
                const ocupada = aulasOcupadas.includes(aula)
                return (
                  <option key={aula} value={aula} disabled={ocupada} className={ocupada ? 'text-gray-400' : ''}>
                    {aula}{ocupada ? ' (en uso)' : ''}
                  </option>
                )
              })}
            </select>
          </div>

          <div>
            <label className="block text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Motivo</label>
            <select
              required
              value={formData.motivo}
              onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
              className="w-full bg-blue-50/50 dark:bg-gray-900/50 border border-blue-200 dark:border-gray-600 rounded-2xl px-4 py-3 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition text-sm"
            >
              <option value="" className="text-gray-400">Seleccionar...</option>
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
            className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:bg-blue-300 dark:disabled:bg-blue-800 disabled:cursor-not-allowed text-white py-3 rounded-2xl font-semibold text-sm transition-all shadow-md shadow-blue-200 dark:shadow-blue-900/30"
          >
            {cargando ? (
              <span className="inline-flex items-center gap-2 justify-center">
                <Spinner /> Enviando
              </span>
            ) : 'Enviar Solicitud'}
          </button>

          <p className="text-gray-400 dark:text-gray-500 text-xs text-center">
            Recibiras un codigo. Comunicate con Seguridad para entregarlo y recibir la llave.
          </p>
        </form>
      </div>
    </div>
  )
}

// Componente: Modal de Devolución (iOS-style)
function ModalDevolucion({
  registro,
  onConfirm,
  onCancel,
  cargando
}: {
  registro: Registro | null;
  onConfirm: () => void;
  onCancel: () => void;
  cargando: boolean;
}) {
  if (!registro) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 max-w-sm w-full mx-auto shadow-2xl border border-blue-100 dark:border-gray-700">
        {/* Handle bar (iOS-style) */}
        <div className="w-10 h-1 bg-blue-200 dark:bg-blue-700 rounded-full mx-auto mb-5" />
        
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-1">Confirmar Devolución</h3>
        <p className="text-xs text-blue-400 dark:text-blue-400 text-center mb-6">¿Estás seguro de que querés marcar esta llave como devuelta?</p>
        
        <div className="space-y-3 mb-6 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl p-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-blue-600 dark:text-blue-400">Aula</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">{registro.numeroAula}</span>
          </div>
          <div className="border-t border-blue-100 dark:border-gray-700/50" />
          <div className="flex justify-between items-center">
            <span className="text-xs text-blue-600 dark:text-blue-400">Docente</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">{registro.nombre}</span>
          </div>
          <div className="border-t border-blue-100 dark:border-gray-700/50" />
          <div className="flex justify-between items-center">
            <span className="text-xs text-blue-600 dark:text-blue-400">Email</span>
            <span className="text-sm text-blue-700 dark:text-blue-300">{registro.email}</span>
          </div>
          <div className="border-t border-blue-100 dark:border-gray-700/50" />
          <div className="flex justify-between items-center">
            <span className="text-xs text-blue-600 dark:text-blue-400">Motivo</span>
            <span className="text-sm text-blue-700 dark:text-blue-300">{registro.motivo}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 py-2.5 rounded-2xl font-medium text-sm transition active:scale-95"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={cargando}
            className="flex-1 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:bg-blue-400 disabled:cursor-not-allowed text-white py-2.5 rounded-2xl font-medium text-sm transition-all shadow-md shadow-blue-200 dark:shadow-blue-900/30 flex items-center justify-center gap-2"
          >
            {cargando ? <><Spinner /> Confirmando</> : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Componente: Calendario visual tipo monthly grid
function Calendario({
  fechaSeleccionada,
  onFechaChange
}: {
  fechaSeleccionada: string;
  onFechaChange: (fecha: string) => void;
}) {
  // Estado interno: mes y año que se está visualizando
  const [fechaActual, setFechaActual] = useState(() => {
    if (!fechaSeleccionada) return { mes: new Date().getMonth(), año: new Date().getFullYear() }
    const d = new Date(fechaSeleccionada + 'T12:00:00')
    return { mes: d.getMonth(), año: d.getFullYear() }
  })

  const navegarMes = (delta: number) => {
    setFechaActual(prev => {
      let mes = prev.mes + delta
      let año = prev.año
      if (mes < 0) { mes = 11; año-- }
      else if (mes > 11) { mes = 0; año++ }
      return { mes, año }
    })
  }

  const diasDelMes = new Date(fechaActual.año, fechaActual.mes + 1, 0).getDate()
  const primerDia = (new Date(fechaActual.año, fechaActual.mes, 1).getDay() + 6) % 7 // 0 = Lunes
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  const diasSemana = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

  const handleDayClick = (dia: number) => {
    const mesStr = String(fechaActual.mes + 1).padStart(2, '0')
    const diaStr = String(dia).padStart(2, '0')
    onFechaChange(`${fechaActual.año}-${mesStr}-${diaStr}`)
  }

  const hoy = new Date()
  const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-blue-100 dark:border-gray-700 rounded-2xl p-4 shadow-lg dark:shadow-black/50 select-none">
      {/* Header con navegación de meses */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => navegarMes(-1)}
          className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/50 transition active:scale-90"
          title="Mes anterior"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-gray-900 dark:text-white">
          {meses[fechaActual.mes]} {fechaActual.año}
        </span>
        <button
          onClick={() => navegarMes(1)}
          className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/50 transition active:scale-90"
          title="Mes siguiente"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 mb-1">
        {diasSemana.map((d) => (
          <div key={d} className="text-center text-[11px] font-semibold text-blue-400 dark:text-blue-500 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Grilla de días */}
      <div className="grid grid-cols-7">
        {Array.from({ length: primerDia }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: diasDelMes }, (_, i) => i + 1).map((dia) => {
          const mesStr = String(fechaActual.mes + 1).padStart(2, '0')
          const diaStr = String(dia).padStart(2, '0')
          const fechaCompleta = `${fechaActual.año}-${mesStr}-${diaStr}`
          const esSeleccionado = fechaCompleta === fechaSeleccionada
          const esHoy = fechaCompleta === hoyStr

          return (
            <button
              key={dia}
              onClick={() => handleDayClick(dia)}
              className={`
                text-center text-xs py-1.5 rounded-xl transition-all active:scale-90
                ${esSeleccionado
                  ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-200 dark:shadow-blue-900/30'
                  : esHoy
                    ? 'text-blue-600 dark:text-blue-400 font-semibold ring-1 ring-blue-300 dark:ring-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-950/50'
                }
              `}
            >
              {dia}
            </button>
          )
        })}
      </div>

      {/* Botón "Hoy" */}
      <button
        onClick={() => {
          const hoy = new Date()
          setFechaActual({ mes: hoy.getMonth(), año: hoy.getFullYear() })
          const nuevoHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`
          onFechaChange(nuevoHoy)
        }}
        className="w-full mt-2 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 py-1.5 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950/50 transition active:scale-95"
      >
        Hoy
      </button>
    </div>
  )
}

// Componente: Spinner animado (iOS-style)
function Spinner({ className = '', size = 'sm' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-7 h-7' }
  return (
    <svg className={`animate-spin ${sizes[size]} ${className}`} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-80" />
    </svg>
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
  // Leer tab desde la URL al iniciar
  const tabDesdeURL = (): 'activos' | 'historial' | 'panel' => {
    const path = window.location.pathname.replace(/\/$/, '')
    if (path === '/historial') return 'historial'
    if (path === '/panel') return 'panel'
    return 'activos'
  }
  const [tabActiva, setTabActiva] = useState<'activos' | 'historial' | 'panel'>(tabDesdeURL)

  // Sincronizar tab con la URL
  const cambiarTab = (tab: 'activos' | 'historial' | 'panel') => {
    setTabActiva(tab)
    const paths: Record<string, string> = {
      activos: '/',
      historial: '/historial',
      panel: '/panel'
    }
    window.history.pushState(null, '', paths[tab])
  }
  const [showModal, setShowModal] = useState(false)
  const [registroADevolver, setRegistroADevolver] = useState<Registro | null>(null)
  const [devolviendoCargando, setDevolviendoCargando] = useState(false)
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

    // Escuchar atrás/adelante del navegador
    const handlePopState = () => {
      const path = window.location.pathname.replace(/\/$/, '')
      if (path === '/historial') setTabActiva('historial')
      else if (path === '/panel') setTabActiva('panel')
      else setTabActiva('activos')
    }
    window.addEventListener('popstate', handlePopState)

    return () => {
      unsubscribe()
      unsubHistorial()
      window.removeEventListener('popstate', handlePopState)
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

    setDevolviendoCargando(true)
    try {
      await marcarDevolucion(registroADevolver.id, idGuardia)
      setShowModal(false)
      setRegistroADevolver(null)
    } catch (error) {
      console.error('Error al devolver:', error)
      alert('Error al procesar la devolucion')
    }
    setDevolviendoCargando(false)
  }

  // Cancelar devolución
  const cancelarDevolucion = () => {
    setShowModal(false)
    setRegistroADevolver(null)
  }

  // Validar token (busca en Firebase y cambia estado a 'retirada')
  const [tokenCargando, setTokenCargando] = useState(false)
  const validarToken = async () => {
    setTokenError('')
    setTokenSuccess('')
    
    const tokenUpper = tokenInput.toUpperCase().trim()
    if (!tokenUpper) return
    
    setTokenCargando(true)
    try {
      await validarTokenEnFirebase(tokenUpper, idGuardia)
      setTokenSuccess('Token validado correctamente!')
      setTimeout(() => setTokenSuccess(''), 3000)
    } catch (error) {
      setTokenError('Token no encontrado o ya utilizado')
    }
    setTokenCargando(false)
    setTokenInput('')
  }

  const totalRetiradas = registros.filter(r => r.estado === 'retirada').length
  const totalPendientes = registros.filter(r => r.estado === 'pendiente').length
  const historialTotal = historialRegistros.length
  const hoyStr = new Date().toISOString().split('T')[0]
  const historialHoy = historialRegistros.filter(r => r.fechaDevolucion?.startsWith(hoyStr))
  const historialBusqueda = historialRegistros.filter(r => r.fechaDevolucion?.startsWith(fechaBusqueda))

  // ============================================
  // Íconos SVG inline
  // ============================================
  const IcoKey = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
    </svg>
  )
  const IcoShield = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  )
  const IcoClock = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
  const IcoGrid = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  )
  const IcoChevronLeft = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  )
  const IcoEye = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
  const IcoEyeOff = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  )
  const IcoSun = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
  )
  const IcoMoon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
    </svg>
  )
  const IcoCheck = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  )
  const IcoBuilding = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  )

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-200 via-sky-100 to-indigo-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* ============================================ */}
      {/* HEADER — Desktop + Mobile */}
      {/* ============================================ */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-blue-100 dark:border-gray-800 px-4 md:px-6 py-2.5 flex items-center justify-between z-10 shadow-sm">
        {/* Left: Back + Logo + Title */}
        <div className="flex items-center gap-3">
          <button onClick={onVolver} className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/50 transition">
            <IcoChevronLeft />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-md shadow-blue-200 dark:shadow-blue-900/30">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-gray-900 dark:text-white text-sm leading-tight">UMAI-Key</h1>
              <p className="text-[10px] text-blue-500 dark:text-blue-400 font-medium leading-tight">Seguridad</p>
            </div>
          </div>
        </div>

        {/* Right: Guardia + Dark Mode */}
        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs md:text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 rounded-xl px-3 py-1.5 border border-blue-100 dark:border-blue-900/30">
            <IcoShield />
            <span>Guardia: <span className="font-semibold text-blue-700 dark:text-blue-200">{idGuardia}</span></span>
          </div>
          <button onClick={toggleDarkMode} className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/50 transition" title={darkMode ? 'Modo Claro' : 'Modo Oscuro'}>
            {darkMode ? <IcoSun /> : <IcoMoon />}
          </button>
        </div>
      </header>

      {/* ============================================ */}
      {/* BODY: Sidebar + Content */}
      {/* ============================================ */}
      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR — Desktop */}
        <aside className="hidden md:flex w-64 flex-col bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border-r border-blue-100 dark:border-gray-800 shadow-sm">
          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            <button
              onClick={() => cambiarTab('activos')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 ${
                tabActiva === 'activos'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-blue-900/30'
                  : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-700 dark:hover:text-blue-300'
              }`}
            >
              <span className="w-5 h-5 flex items-center justify-center">
                <IcoShield />
              </span>
              Activos
            </button>
            <button
              onClick={() => cambiarTab('historial')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 ${
                tabActiva === 'historial'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-blue-900/30'
                  : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-700 dark:hover:text-blue-300'
              }`}
            >
              <span className="w-5 h-5 flex items-center justify-center">
                <IcoClock />
              </span>
              Historial
            </button>
            <button
              onClick={() => cambiarTab('panel')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 ${
                tabActiva === 'panel'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200 dark:shadow-blue-900/30'
                  : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-700 dark:hover:text-blue-300'
              }`}
            >
              <span className="w-5 h-5 flex items-center justify-center">
                <IcoGrid />
              </span>
              Panel Completo
            </button>
          </nav>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 flex flex-col overflow-auto">
          <div className="flex-1 p-4 md:p-8 space-y-5 md:space-y-6 max-w-7xl mx-auto w-full pb-24 md:pb-8">
            {/* ============================================ */}
            {/* STATS — Bento Cards */}
            {/* ============================================ */}
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              <div className="rounded-2xl bg-white/80 backdrop-blur-xl dark:bg-gray-800/80 border border-blue-100 dark:border-gray-700 p-3 md:p-4 shadow-lg dark:shadow-black/50 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] md:text-[11px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Retiradas</span>
                  <div className="w-7 h-7 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500">
                    <IcoKey />
                  </div>
                </div>
                <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{totalRetiradas}</p>
              </div>

              <div className="rounded-2xl bg-white/80 backdrop-blur-xl dark:bg-gray-800/80 border border-blue-100 dark:border-gray-700 p-3 md:p-4 shadow-lg dark:shadow-black/50 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] md:text-[11px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Pendientes</span>
                  <div className="w-7 h-7 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center text-yellow-500">
                    <IcoClock />
                  </div>
                </div>
                <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{totalPendientes}</p>
              </div>

              <div className="rounded-2xl bg-white/80 backdrop-blur-xl dark:bg-gray-800/80 border border-blue-100 dark:border-gray-700 p-3 md:p-4 shadow-lg dark:shadow-black/50 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] md:text-[11px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Hist. Hoy</span>
                  <div className="w-7 h-7 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-500">
                    <IcoBuilding />
                  </div>
                </div>
                <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{historialTotal}</p>
        </div>
      </div>

            {/* ============================================ */}
            {/* VALIDAR TOKEN — Bento Card */}
            {/* ============================================ */}
            <div className="rounded-2xl bg-white/80 backdrop-blur-xl dark:bg-gray-800/80 border border-blue-100 dark:border-gray-700 p-4 md:p-5 shadow-lg dark:shadow-black/50">
              <label className="block text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-3">
                Validar Token
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && validarToken()}
                    placeholder="Código del docente..."
                    className="w-full bg-blue-50/50 dark:bg-gray-900/50 border border-blue-200 dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition"
                  />
                </div>
                <button
                  onClick={validarToken}
                  disabled={tokenCargando}
                  className="bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:bg-blue-400 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-md shadow-blue-200 dark:shadow-blue-900/30 min-w-[88px] flex items-center justify-center"
                >
                  {tokenCargando ? <Spinner /> : 'Validar'}
                </button>
              </div>
              {tokenError && (
                <div className="mt-2 flex items-center gap-2 text-red-500 text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  {tokenError}
                </div>
              )}
              {tokenSuccess && (
                <div className="mt-2 flex items-center gap-2 text-green-500 text-xs">
                  <IcoCheck />
                  {tokenSuccess}
                </div>
              )}
            </div>

            {/* ============================================ */}
            {/* TAB CONTENT */}
            {/* ============================================ */}
            {tabActiva === 'activos' && (
              <div className="rounded-2xl bg-white/80 backdrop-blur-xl dark:bg-gray-800/80 border border-blue-100 dark:border-gray-700 shadow-xl dark:shadow-black/50 overflow-hidden">
                <div className="px-5 py-4 border-b border-blue-100 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Llaves Activas</h3>
                    <button
                      onClick={() => setMostrarTokens(!mostrarTokens)}
                      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl transition ${
                        mostrarTokens
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                          : 'text-blue-400 dark:text-blue-500 hover:text-blue-600 dark:hover:text-blue-300'
                      }`}
                    >
                      {mostrarTokens ? <IcoEye /> : <IcoEyeOff />}
                      Token
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-sm">
                    <thead className="bg-blue-50/50 dark:bg-gray-900/50">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-blue-600 dark:text-blue-400 uppercase text-[11px] tracking-wider">Aula</th>
                        <th className="text-left px-4 py-3 font-semibold text-blue-600 dark:text-blue-400 uppercase text-[11px] tracking-wider">Nombre</th>
                        <th className="text-left px-4 py-3 font-semibold text-blue-600 dark:text-blue-400 uppercase text-[11px] tracking-wider">Email</th>
                        <th className="text-left px-4 py-3 font-semibold text-blue-600 dark:text-blue-400 uppercase text-[11px] tracking-wider">Token</th>
                        <th className="text-left px-4 py-3 font-semibold text-blue-600 dark:text-blue-400 uppercase text-[11px] tracking-wider">Estado</th>
                        <th className="text-left px-4 py-3 font-semibold text-blue-600 dark:text-blue-400 uppercase text-[11px] tracking-wider">Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
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
                              <td colSpan={6} className="px-4 py-12 text-center text-blue-400 dark:text-blue-500 text-sm">
                                No hay llaves activas
                              </td>
                            </tr>
                          )
                        }

                        return todos.map((reg) => (
                          <tr
                            key={reg.id}
                            className={`transition ${
                              reg.estado === 'pendiente'
                                ? 'bg-yellow-50/70 dark:bg-yellow-900/10'
                                : 'hover:bg-blue-50/30 dark:hover:bg-blue-950/20'
                            }`}
                          >
                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{reg.numeroAula}</td>
                            <td className="px-4 py-3 text-blue-700 dark:text-blue-300">{reg.nombre}</td>
                            <td className="px-4 py-3 text-blue-400 dark:text-blue-400 text-xs">{reg.email}</td>
                            <td className="px-4 py-3 font-mono text-xs">
                              {reg.estado === 'pendiente' || mostrarTokens ? (
                                <span className={`font-bold ${reg.estado === 'pendiente' ? 'text-yellow-600 dark:text-yellow-400' : 'text-blue-400 dark:text-blue-400'}`}>{reg.token}</span>
                              ) : (
                                <span className="text-blue-300 dark:text-blue-500">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {reg.estado === 'pendiente' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                                  Pendiente
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                  En uso
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {reg.estado === 'retirada' && (
                                <button
                                  onClick={() => abrirModalDevolucion(reg)}
                                  className="bg-green-500 hover:bg-green-600 active:scale-95 text-white px-3 py-1.5 rounded-xl text-xs font-medium transition-all shadow-sm"
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
                <div className="flex gap-1.5 mb-4">
                  <button
                    onClick={() => setSubTabHistorial('hoy')}
                    className={`px-4 py-1.5 rounded-xl text-xs font-medium transition ${
                      subTabHistorial === 'hoy'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-blue-50 dark:bg-gray-700/50 text-blue-500 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    Hoy
                  </button>
                  <button
                    onClick={() => setSubTabHistorial('buscar')}
                    className={`px-4 py-1.5 rounded-xl text-xs font-medium transition ${
                      subTabHistorial === 'buscar'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-blue-50 dark:bg-gray-700/50 text-blue-500 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    Buscar
                  </button>
                </div>

                {subTabHistorial === 'hoy' && (
                  <div className="rounded-2xl bg-white/80 backdrop-blur-xl dark:bg-gray-800/80 border border-blue-100 dark:border-gray-700 shadow-xl dark:shadow-black/50 overflow-hidden">
                    <div className="px-5 py-4 border-b border-blue-100 dark:border-gray-700">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                        Historial de Hoy <span className="text-gray-400 dark:text-gray-500 font-normal">({historialHoy.length})</span>
                      </h3>
                    </div>
                    <div className="overflow-x-auto max-h-80">
                      <table className="w-full text-sm">
                        <thead className="bg-blue-50/50 dark:bg-gray-900/50">
                          <tr>
                            <th className="text-left px-4 py-3 font-semibold text-blue-600 dark:text-blue-400 uppercase text-[11px] tracking-wider">Hora</th>
                            <th className="text-left px-4 py-3 font-semibold text-blue-600 dark:text-blue-400 uppercase text-[11px] tracking-wider">Aula</th>
                            <th className="text-left px-4 py-3 font-semibold text-blue-600 dark:text-blue-400 uppercase text-[11px] tracking-wider">Docente</th>
                            <th className="text-left px-4 py-3 font-semibold text-blue-600 dark:text-blue-400 uppercase text-[11px] tracking-wider">Estado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {historialHoy.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-4 py-12 text-center text-blue-400 dark:text-blue-500 text-sm">
                                No hay devoluciones hoy
                              </td>
                            </tr>
                          ) : (
                            historialHoy
                              .sort((a, b) => a.numeroAula.localeCompare(b.numeroAula))
                              .map((reg) => (
                                <tr key={reg.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition">
                                  <td className="px-4 py-3 text-blue-400 dark:text-blue-400 text-xs">
                                    {reg.fechaDevolucion ? new Date(reg.fechaDevolucion).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                                  </td>
                                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{reg.numeroAula}</td>
                                  <td className="px-4 py-3 text-blue-700 dark:text-blue-300">{reg.nombre}</td>
                                  <td className="px-4 py-3">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
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
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Calendario: primero en DOM (arriba en mobile) */}
                    <div className="w-full md:w-72 shrink-0 md:order-2">
                      <Calendario
                        fechaSeleccionada={fechaBusqueda}
                        onFechaChange={setFechaBusqueda}
                      />
                    </div>

                    {/* Tabla: segundo en DOM (abajo en mobile, izquierda en desktop) */}
                    <div className="flex-1 rounded-2xl bg-white/80 backdrop-blur-xl dark:bg-gray-800/80 border border-blue-100 dark:border-gray-700 shadow-xl dark:shadow-black/50 overflow-hidden md:order-1">
                      <div className="px-5 py-4 border-b border-blue-100 dark:border-gray-700 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                          Historial del <span className="text-blue-600 dark:text-blue-400">{fechaBusqueda}</span>
                        </h3>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {historialBusqueda.length} registro{historialBusqueda.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="overflow-x-auto max-h-80">
                        <table className="w-full text-sm">
                          <thead className="bg-blue-50/50 dark:bg-gray-900/50">
                            <tr>
                              <th className="text-left px-4 py-3 font-semibold text-blue-600 dark:text-blue-400 uppercase text-[11px] tracking-wider">Hora</th>
                              <th className="text-left px-4 py-3 font-semibold text-blue-600 dark:text-blue-400 uppercase text-[11px] tracking-wider">Aula</th>
                              <th className="text-left px-4 py-3 font-semibold text-blue-600 dark:text-blue-400 uppercase text-[11px] tracking-wider">Docente</th>
                              <th className="text-left px-4 py-3 font-semibold text-blue-600 dark:text-blue-400 uppercase text-[11px] tracking-wider">Estado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {historialBusqueda.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="px-4 py-12 text-center text-blue-400 dark:text-blue-500 text-sm">
                                  No hay devoluciones en esta fecha
                                </td>
                              </tr>
                            ) : (
                              historialBusqueda
                                .sort((a, b) => a.numeroAula.localeCompare(b.numeroAula))
                                .map((reg) => (
                                  <tr key={reg.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition">
                                    <td className="px-4 py-3 text-blue-400 dark:text-blue-400 text-xs">
                                      {reg.fechaDevolucion ? new Date(reg.fechaDevolucion).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
                                    </td>
                                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{reg.numeroAula}</td>
                                    <td className="px-4 py-3 text-blue-700 dark:text-blue-300">{reg.nombre}</td>
                                    <td className="px-4 py-3">
                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
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
                )}
              </div>
            )}

            {tabActiva === 'panel' && (
              <div className="rounded-2xl bg-white/80 backdrop-blur-xl dark:bg-gray-800/80 border border-blue-100 dark:border-gray-700 shadow-lg dark:shadow-black/50 p-5">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-5">
                  Panel Completo de Llaves
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                  {AULAS.sort().map((aula) => {
                    const activo = registros.find(r => r.numeroAula === aula)

                    let colorStyles = 'bg-white border-green-400 shadow-lg dark:bg-gray-800 dark:border-green-600 dark:shadow-black/50'
                    let dotColor = 'bg-green-500'
                    let textoEstado = 'Disponible'
                    let nombreSolicitante = ''

                    if (activo?.estado === 'pendiente') {
                      colorStyles = 'bg-amber-50 border-amber-400 shadow-lg dark:bg-amber-900/20 dark:border-amber-600 dark:shadow-black/50'
                      dotColor = 'bg-amber-500'
                      textoEstado = 'Pendiente'
                      nombreSolicitante = activo.nombre
                    } else if (activo?.estado === 'retirada') {
                      colorStyles = 'bg-red-50 border-red-400 shadow-lg dark:bg-red-900/20 dark:border-red-600 dark:shadow-black/50'
                      dotColor = 'bg-red-500'
                      textoEstado = 'Retirada'
                      nombreSolicitante = activo.nombre
                    }

                    return (
                      <div key={aula} className={`rounded-xl border-2 p-3.5 ${colorStyles}`}>
                        <div className="font-semibold text-sm text-gray-900 dark:text-white mb-0.5">{aula}</div>
                        {nombreSolicitante && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">{nombreSolicitante}</div>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-600 dark:text-gray-300">
                            <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                            {textoEstado}
                          </span>
                          {activo?.estado === 'retirada' && (
                            <button
                              onClick={() => abrirModalDevolucion(activo)}
                              className="bg-green-500 hover:bg-green-600 active:scale-95 text-white px-2.5 py-1 rounded-xl text-[11px] font-medium transition-all shadow-sm"
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
          </div>

        {/* ============================================ */}
        {/* MOBILE BOTTOM NAV — iOS-style tab bar */}
        {/* ============================================ */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-blue-100 dark:border-gray-800 pb-4">
          <div className="flex">
            {[
              { key: 'activos' as const, label: 'Activos', icon: IcoShield },
              { key: 'historial' as const, label: 'Historial', icon: IcoClock },
              { key: 'panel' as const, label: 'Panel', icon: IcoGrid },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => cambiarTab(tab.key)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition ${
                  tabActiva === tab.key
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                <tab.icon />
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        {/* ============================================ */}
        {/* MODAL */}
        {/* ============================================ */}
        {showModal && (
          <ModalDevolucion
            registro={registroADevolver}
            onConfirm={confirmarDevolucion}
            onCancel={cancelarDevolucion}
            cargando={devolviendoCargando}
          />
        )}
      </main>
    </div>
    </div>
  )
}

// ============================================
// COMPONENTES DE AUDITOR
// ============================================

// Login del Auditor (acceso por token vía email)
function LoginAuditor({ onLogin }: { onLogin: (email: string) => void }) {
  const [email, setEmail] = useState('')
  const [tokenEnviado, setTokenEnviado] = useState(false)
  const [tokenIngresado, setTokenIngresado] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [tokenGenerado, setTokenGenerado] = useState('')

  const enviarCodigo = async () => {
    if (!email.trim()) {
      setError('Ingresá tu email')
      return
    }
    setError('')
    setCargando(true)
    try {
      const token = await generarTokenAuditor(email.trim())
      setTokenGenerado(token)
      // El token se muestra en pantalla al instante
      setTokenEnviado(true)
      // Intento enviarlo por email en segundo plano (no bloquea)
      enviarTokenPorEmail(email.trim(), token).catch(() => {})
    } catch (err) {
      setError('Error al generar el código. Intentá de nuevo.')
    }
    setCargando(false)
  }

  const verificarCodigo = async () => {
    if (!tokenIngresado.trim()) {
      setError('Ingresá el código que recibiste por email')
      return
    }
    setError('')
    setCargando(true)
    try {
      const valido = await verificarTokenAuditor(email.trim(), tokenIngresado.trim().toUpperCase())
      if (valido) {
        onLogin(email.trim())
      } else {
        setError('Código incorrecto o ya utilizado')
      }
    } catch (err) {
      setError('Error al verificar el código')
    }
    setCargando(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 via-sky-100 to-indigo-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="max-w-sm w-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => window.location.href = '/'}
            className="w-10 h-10 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-sm hover:shadow-md transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Acceso Auditor</h1>
        </div>

        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-blue-100 dark:border-gray-700 rounded-3xl p-6 space-y-5 shadow-lg">
          {!tokenEnviado ? (
            <>
              {/* Paso 1: Email */}
              <div>
                <label className="block text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Email institucional</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError('') }}
                  placeholder="tunombre@maimonides.edu"
                  className="w-full bg-blue-50/50 dark:bg-gray-900/50 border border-blue-200 dark:border-gray-600 rounded-2xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition text-sm"
                />
              </div>

              <button
                onClick={enviarCodigo}
                disabled={cargando}
                className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:bg-blue-400 disabled:cursor-not-allowed text-white py-3 rounded-2xl font-semibold text-sm transition-all shadow-md shadow-blue-200 dark:shadow-blue-900/30 flex items-center justify-center gap-2"
              >
                {cargando ? <><Spinner /> Generando...</> : 'Solicitar acceso'}
              </button>
            </>
          ) : (
            <>
              {/* Paso 2: Mostrar token + Ingresar */}
              <div className="text-center">
                <div className="w-14 h-14 rounded-[24px] bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200 dark:shadow-blue-900/30">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Tu código de acceso para</p>
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-4">{email}</p>

                {/* Token display */}
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-5 mb-5">
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-2">Código de verificación</p>
                  <p className="text-3xl font-mono font-bold text-blue-600 dark:text-blue-400 tracking-[0.3em] select-all">{tokenGenerado}</p>
                </div>
              </div>

              <div>
                <label className="block text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Ingresá el código</label>
                <input
                  type="text"
                  required
                  value={tokenIngresado}
                  onChange={(e) => { setTokenIngresado(e.target.value); setError('') }}
                  onKeyDown={(e) => e.key === 'Enter' && verificarCodigo()}
                  placeholder="Ej: A7X3K2"
                  className="w-full bg-blue-50/50 dark:bg-gray-900/50 border border-blue-200 dark:border-gray-600 rounded-2xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition text-sm text-center font-mono text-lg tracking-widest uppercase"
                  maxLength={6}
                />
              </div>

              <button
                onClick={verificarCodigo}
                disabled={cargando}
                className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] disabled:bg-blue-400 disabled:cursor-not-allowed text-white py-3 rounded-2xl font-semibold text-sm transition-all shadow-md shadow-blue-200 dark:shadow-blue-900/30 flex items-center justify-center gap-2"
              >
                {cargando ? <><Spinner /> Verificando...</> : 'Ingresar'}
              </button>
            </>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl px-4 py-3">
              <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>
            </div>
          )}
        </div>

        <p className="text-center text-gray-400 dark:text-gray-500 text-xs mt-6">
          Acceso para auditores institucionales
        </p>
      </div>
    </div>
  )
}

// Dashboard del Auditor (versión simplificada)
function DashboardAuditor({ auditorEmail, onVolver }: { auditorEmail: string; onVolver: () => void }) {
  const [registros, setRegistros] = useState<Registro[]>([])
  const [historialRegistros, setHistorialRegistros] = useState<Registro[]>([])
  const [darkMode, setDarkMode] = useState(false)
  // Suscribirse y filtrar por mailAuditor
  useEffect(() => {
    const savedDark = localStorage.getItem('darkMode') === 'true'
    setDarkMode(savedDark)
    if (savedDark) document.documentElement.classList.add('dark')

    const unsubRegistros = subscribeRegistros((todos) => {
      setRegistros(todos.filter(r => r.mailAuditor === auditorEmail))
    })

    const unsubHistorial = subscribeHistorial((hist) => {
      setHistorialRegistros(hist.filter(r => r.mailAuditor === auditorEmail))
    })

    return () => { unsubRegistros(); unsubHistorial() }
  }, [auditorEmail])

  const toggleDarkMode = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    localStorage.setItem('darkMode', String(newMode))
    document.documentElement.classList.toggle('dark', newMode)
  }

  // Unir activos + historial en una sola lista para vista unificada
  const todosLosRegistros = [...registros, ...historialRegistros].sort(
    (a, b) => (b.timestamp || '').localeCompare(a.timestamp || '')
  )
  const IcoChevronLeft = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  )
  const IcoSun = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
  )
  const IcoMoon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
    </svg>
  )

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-200 via-sky-100 to-indigo-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* HEADER */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-blue-100 dark:border-gray-800 px-4 md:px-6 py-2.5 flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onVolver} className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/50 transition">
            <IcoChevronLeft />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-md shadow-blue-200 dark:shadow-blue-900/30">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <div>
              <h1 className="font-bold text-gray-900 dark:text-white text-sm leading-tight">UMAI-Key</h1>
              <p className="text-[10px] text-blue-500 dark:text-blue-400 font-medium leading-tight">Auditor</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs md:text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 rounded-xl px-3 py-1.5 border border-blue-100 dark:border-blue-900/30">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            <span>Auditor: <span className="font-semibold text-blue-700 dark:text-blue-200">{auditorEmail}</span></span>
          </div>
          <button onClick={toggleDarkMode} className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center hover:bg-blue-100 dark:hover:bg-blue-900/50 transition" title={darkMode ? 'Modo Claro' : 'Modo Oscuro'}>
            {darkMode ? <IcoSun /> : <IcoMoon />}
          </button>
        </div>
      </header>

      {/* BODY: Simplified — Unified single view */}
      <main className="flex-1 overflow-auto">
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          <div className="rounded-2xl bg-white/80 backdrop-blur-xl dark:bg-gray-800/80 border border-blue-100 dark:border-gray-700 shadow-xl dark:shadow-black/50 overflow-hidden">
            <div className="px-5 py-4 border-b border-blue-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                Registro completo <span className="text-gray-400 dark:text-gray-500 font-normal">({todosLosRegistros.length})</span>
              </h3>
            </div>
            <div className="overflow-x-auto max-h-[calc(100vh-220px)]">
              <table className="w-full text-sm">
                <thead className="bg-blue-50/50 dark:bg-gray-900/50 sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-blue-600 dark:text-blue-400 uppercase text-[11px] tracking-wider">Fecha</th>
                    <th className="text-left px-4 py-3 font-semibold text-blue-600 dark:text-blue-400 uppercase text-[11px] tracking-wider">Aula</th>
                    <th className="text-left px-4 py-3 font-semibold text-blue-600 dark:text-blue-400 uppercase text-[11px] tracking-wider">Docente</th>
                    <th className="text-left px-4 py-3 font-semibold text-blue-600 dark:text-blue-400 uppercase text-[11px] tracking-wider">Email</th>
                    <th className="text-left px-4 py-3 font-semibold text-blue-600 dark:text-blue-400 uppercase text-[11px] tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {todosLosRegistros.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-blue-400 dark:text-blue-500 text-sm">
                        No hay registros para este auditor
                      </td>
                    </tr>
                  ) : (
                    todosLosRegistros.map((reg) => (
                      <tr key={reg.id} className={`transition ${
                        reg.estado === 'pendiente' ? 'bg-yellow-50/70 dark:bg-yellow-900/10' :
                        reg.estado === 'retirada' ? 'bg-red-50/30 dark:bg-red-900/5' :
                        'hover:bg-blue-50/30 dark:hover:bg-blue-950/20'
                      }`}>
                        <td className="px-4 py-3 text-blue-400 dark:text-blue-400 text-xs whitespace-nowrap">
                          {new Date(reg.timestamp).toLocaleDateString([], { day: '2-digit', month: '2-digit' })}
                          <span className="mx-1 text-blue-300">·</span>
                          {new Date(reg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{reg.numeroAula}</td>
                        <td className="px-4 py-3 text-blue-700 dark:text-blue-300">{reg.nombre}</td>
                        <td className="px-4 py-3 text-blue-400 dark:text-blue-400 text-xs">{reg.email}</td>
                        <td className="px-4 py-3">
                          {reg.estado === 'pendiente' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                              Pendiente
                            </span>
                          ) : reg.estado === 'retirada' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                              En uso
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />Devuelta
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-200 via-sky-100 to-indigo-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <div className="max-w-sm w-full">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => window.location.reload()}
            className="w-10 h-10 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-sm hover:shadow-md transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Acceso Seguridad</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-blue-100 dark:border-gray-700 rounded-3xl p-6 space-y-5 shadow-lg">
          <div>
            <label className="block text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Número de Guardia / ID</label>
            <input
              type="text"
              required
              value={idGuardia}
              onChange={(e) => setIdGuardia(e.target.value)}
              className="w-full bg-blue-50/50 dark:bg-gray-900/50 border border-blue-200 dark:border-gray-600 rounded-2xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition text-sm"
              placeholder="Ej: G001"
            />
          </div>

          <div>
            <label className="block text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Contraseña</label>
            <input
              type="password"
              required
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              className="w-full bg-blue-50/50 dark:bg-gray-900/50 border border-blue-200 dark:border-gray-600 rounded-2xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition text-sm"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl px-4 py-3">
              <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white py-3 rounded-2xl font-semibold text-sm transition-all shadow-md shadow-blue-200 dark:shadow-blue-900/30"
          >
            Ingresar
          </button>
        </form>

        <p className="text-center text-gray-400 dark:text-gray-500 text-xs mt-6">
          Acceso restringido al personal de seguridad
        </p>
      </div>
    </div>
  )
}

type Vista = 'inicio' | 'docente' | 'login-seguridad' | 'seguridad' | 'login-auditor' | 'dashboard-auditor'

function App() {
  const [vista, setVista] = useState<Vista>(() => {
    const path = window.location.pathname.replace(/\/$/, '')
    if (path === '/auditores') return 'login-auditor'
    return 'inicio'
  })
  const [idGuardia, setIdGuardia] = useState('')
  const [auditorEmail, setAuditorEmail] = useState('')

  // Inicializar dark mode desde localStorage
  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true'
    if (isDark) document.documentElement.classList.add('dark')
  }, [])

  const handleSeguridadClick = () => {
    setVista('login-seguridad')
  }

  const handleLoginSeguridad = (id: string) => {
    setIdGuardia(id)
    setVista('seguridad')
  }

  const handleLoginAuditor = (email: string) => {
    setAuditorEmail(email)
    setVista('dashboard-auditor')
  }

  return (
    <>
      {/* Ambient Auras - Fondo */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-48 -right-48 w-[700px] h-[700px] bg-blue-400/25 dark:bg-blue-600/25 rounded-full blur-[150px]" />
        <div className="absolute -bottom-48 -left-48 w-[600px] h-[600px] bg-sky-300/30 dark:bg-sky-600/25 rounded-full blur-[150px]" />
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-200/25 dark:bg-indigo-700/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-cyan-200/25 dark:bg-cyan-700/20 rounded-full blur-[100px]" />
      </div>

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
      {vista === 'login-auditor' && (
        <LoginAuditor onLogin={handleLoginAuditor} />
      )}
      {vista === 'dashboard-auditor' && (
        <DashboardAuditor auditorEmail={auditorEmail} onVolver={() => setVista('login-auditor')} />
      )}
    </>
  )
}

export default App