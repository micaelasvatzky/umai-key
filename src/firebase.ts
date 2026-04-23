import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, Timestamp } from 'firebase/firestore'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyDOOqkroPWlP_TAQB_qpC4Qs4hEKALz33U',
  authDomain: 'umai-key.firebaseapp.com',
  projectId: 'umai-key',
  storageBucket: 'umai-key.firebasestorage.app',
  messagingSenderId: '263059590633',
  appId: '1:263059590633:web:c1e9ae13c490ceabae0f78'
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firestore
export const db = getFirestore(app)

// Tipos
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
  estado: 'retirada' | 'devuelta'
  token?: string
  idGuardia?: string
}

// Helper para guardar una solicitud
export const guardarSolicitud = async (data: Omit<Registro, 'id' | 'timestamp' | 'estado' | 'token'>) => {
  const token = Math.random().toString(36).substring(2, 8).toUpperCase()
  
  const registro: Registro = {
    ...data,
    timestamp: new Date().toISOString(),
    estado: 'retirada',
    token
  }
  
  const docRef = await addDoc(collection(db, 'solicitudes'), registro)
  return { ...registro, id: docRef.id }
}

// Helper para escuchar cambios en tiempo real
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

// Helper para marcar devolución
export const marcarDevolucion = async (id: string, idGuardia: string) => {
  const docRef = doc(db, 'solicitudes', id)
  await updateDoc(docRef, {
    estado: 'devuelta',
    idGuardia
  })
}