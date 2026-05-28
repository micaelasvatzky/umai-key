import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, where, getDocs, deleteDoc, setDoc, getDoc } from 'firebase/firestore'

// Configurable: form ID de Formspree (crear en https://formspree.io y pegar el ID)
// Ej: si tu form es https://formspree.io/f/xabc1234, el ID es 'xabc1234'
export const FORMSPREE_ID = 'CAMBIAME'

const firebaseConfig = {
  apiKey: 'AIzaSyDOOqkroPWlP_TAQB_qpC4Qs4hEKALz33U',
  authDomain: 'umai-key.firebaseapp.com',
  projectId: 'umai-key',
  storageBucket: 'umai-key.firebasestorage.app',
  messagingSenderId: '263059590633',
  appId: '1:263059590633:web:c1e9ae13c490ceabae0f78'
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)

export interface Registro {
  id?: string
  timestamp: string
  nombre: string
  email: string
  tipo: string
  motivo: string
  area: string
  mailAuditor: string
  numeroAula: string
  estado: 'pendiente' | 'retirada' | 'devuelta'
  token?: string
  idGuardia?: string
  fechaRetiro?: string    // Momento en que se validó el token (pasa a Verde/Disponible)
  fechaDevolucion?: string // Momento en que se marcó como devuelta
}

// 1. Guardar solicitud (estado inicial: PENDIENTE)
export const guardarSolicitud = async (data: Omit<Registro, 'id' | 'timestamp' | 'estado' | 'token'>) => {
  const token = Math.random().toString(36).substring(2, 8).toUpperCase()
  const registro: Registro = {
    ...data,
    timestamp: new Date().toISOString(),
    estado: 'pendiente',
    token
  }
  const docRef = await addDoc(collection(db, 'solicitudes'), registro)
  return { ...registro, id: docRef.id }
}

// 2. Validar Token (Marca fechaRetiro -> VERDE en Panel. NO cambia a retirada aún)
export const validarTokenEnFirebase = async (token: string, idGuardia: string) => {
  const q = query(
    collection(db, 'solicitudes'), 
    where('token', '==', token), 
    where('estado', '==', 'pendiente')
  )
  const snapshot = await getDocs(q)  
  if (snapshot.empty) {
    throw new Error('Token no encontrado o ya utilizado')
  }
  const docRef = snapshot.docs[0].ref
  // Cambiamos estado a 'retirada' y guardamos fechaRetiro
  await updateDoc(docRef, {
    estado: 'retirada',
    fechaRetiro: new Date().toISOString(),
    idGuardia: idGuardia
  })
}   

// 4. Escuchar cambios en tiempo real (Activos: pendientes y retiradas en 'solicitudes')
export const subscribeRegistros = (callback: (registros: Registro[]) => void) => {
  const q = query(collection(db, 'solicitudes'), orderBy('timestamp', 'desc'))
  return onSnapshot(q, (snapshot) => {
    const registros = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Registro[]
    callback(registros)
  })
}

// 5. Escuchar el HISTORIAL REAL de Firebase (colección 'historial')
export const subscribeHistorial = (callback: (registros: Registro[]) => void) => {
  const q = query(collection(db, 'historial'), orderBy('fechaDevolucion', 'desc'))
  return onSnapshot(q, (snapshot) => {
    const registros = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Registro[]
    callback(registros)
  })
}

// 6. Marcar devolución (Mover de 'solicitudes' a 'historial' en Firebase)
export const marcarDevolucion = async (id: string, idGuardia: string) => {
  const solicitudRef = doc(db, 'solicitudes', id)
  const snapshot = await getDocs(query(collection(db, 'solicitudes'), where('__name__', '==', id)))
  
  if (snapshot.empty) throw new Error('Registro no encontrado')
  const data = snapshot.docs[0].data() as Registro
  
  const historialRef = doc(collection(db, 'historial'))
  await setDoc(historialRef, {
    ...data,
    estado: 'devuelta',
    idGuardia: idGuardia,
    fechaDevolucion: new Date().toISOString()
  })
  
  await deleteDoc(solicitudRef)
}

// ============================================
// AUDITOR HELPERS
// ============================================

// Generar token de acceso para auditor y guardarlo en Firebase
export const generarTokenAuditor = async (email: string) => {
  const token = Math.random().toString(36).substring(2, 8).toUpperCase()
  await setDoc(doc(db, 'auditorTokens', email), {
    email,
    token,
    createdAt: new Date().toISOString(),
    usado: false
  })
  return token
}

// Verificar token de auditor contra Firebase
export const verificarTokenAuditor = async (email: string, token: string): Promise<boolean> => {
  const docRef = doc(db, 'auditorTokens', email)
  const docSnap = await getDoc(docRef)
  if (docSnap.exists() && docSnap.data().token === token && !docSnap.data().usado) {
    await updateDoc(docRef, { usado: true })
    return true
  }
  return false
}

// Enviar token por email usando Formspree
export const enviarTokenPorEmail = async (email: string, token: string) => {
  if (FORMSPREE_ID === 'CAMBIAME') {
    console.warn('⚠️  Formspree no configurado. El token se muestra en pantalla para testing.')
    return
  }
  await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      email,
      subject: 'Código de acceso - UMAI-Key Auditor',
      message: `Tu código de acceso para UMAI-Key es: ${token}\n\nIngresalo en la pantalla de inicio de sesión de auditoría.\n\nSaludos,\nEquipo UMAI-Key`
    })
  })
}
