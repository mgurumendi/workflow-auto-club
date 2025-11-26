import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';

// --- CONFIGURACIÓN INTELIGENTE ---
// Intenta leer la configuración. Si falla, el sistema usará Modo Local.
let app = null;
let auth = null;
let db = null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

try {
  const configStr = typeof __firebase_config !== 'undefined' ? __firebase_config : '{}';
  const firebaseConfig = JSON.parse(configStr);
  if (Object.keys(firebaseConfig).length > 0) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  }
} catch (e) {
  console.log("Modo Local Activado: No se detectó configuración de Firebase.");
}

// --- ICONOS MANUALES ---
const Icons = {
  Users: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Calendar: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>,
  CheckCircle: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  AlertCircle: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>,
  Clock: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Plus: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="M12 5v14"/></svg>,
  Search: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
  ChevronRight: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m9 18 6-6-6-6"/></svg>,
  FileText: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>,
  Truck: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11"/><path d="M14 9h4l4 4v4c0 .6-.4 1-1 1h-2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>,
  ArrowLeft: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>,
  PieChart: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>,
  Timer: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="15" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/></svg>,
  AlertTriangle: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>,
  Trash2: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>,
  Cloud: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17.5 19c0-3.037-2.463-5.5-5.5-5.5S6.5 15.963 6.5 19"/><path d="M19 19h-1.5c-2.9 0-5.43-2.2-5.5-5.1"/><path d="M20 14.9A5 5 0 0 0 13 10h-1A7 7 0 0 0 5 16.5"/></svg>,
  WifiOff: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="1" x2="23" y1="1" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.58 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" x2="12.01" y1="20" y2="20"/></svg>
};

// --- CONFIGURACIÓN SLA ---
const STAGE_CONFIG = [
  { id: 'contact', label: "Fecha 1er Contacto", days: 1 },
  { id: 'visit', label: "Fecha de Visita", days: 2 },
  { id: 'docs', label: "Entrega Doc. y Pagos", days: 1 },
  { id: 'approval', label: "Aprobación de Compra", days: 3 },
  { id: 'order_emit', label: "Emisión Orden de Compra", days: 2 },
  { id: 'invoice', label: "Recepción de Factura", days: 2 },
  { id: 'contract', label: "Firma de Contrato", days: 1 },
  { id: 'insurance', label: "Seguro y Dispositivo", days: 1 },
  { id: 'registration', label: "Recepción Matrícula", days: 4 },
  { id: 'delivery_order', label: "Orden de Entrega", days: 4 },
  { id: 'delivery', label: "Entrega Vehículo", days: 0 }
];

const MAX_SLA_DAYS = 20;

// --- UTILIDADES ---
const getWorkingDays = (startDateStr, endDateStr) => {
  if (!startDateStr || !endDateStr) return 0;
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  start.setHours(0,0,0,0);
  end.setHours(0,0,0,0);
  if (start >= end) return 0;
  let count = 0;
  const cur = new Date(start);
  cur.setDate(cur.getDate() + 1);
  while (cur <= end) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
};

const getCumulativeDays = (stageIndex) => {
  let total = 0;
  for (let i = 0; i <= stageIndex; i++) {
    total += STAGE_CONFIG[i].days;
  }
  return total;
};

// --- COMPONENTES UI ---
const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 ${className}`}>{children}</div>
);

const Badge = ({ children, type = 'neutral' }) => {
  const styles = {
    neutral: 'bg-slate-100 text-slate-600',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-rose-100 text-rose-700',
    info: 'bg-blue-100 text-blue-700'
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[type] || styles.neutral}`}>{children}</span>;
};

// --- APLICACIÓN PRINCIPAL ---
export default function App() {
  const [view, setView] = useState('dashboard');
  const [selectedClient, setSelectedClient] = useState(null);
  const [clients, setClients] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnlineMode, setIsOnlineMode] = useState(false);

  // 1. INIT: DECIDIR SI USAR NUBE O LOCAL
  useEffect(() => {
    if (auth && db) {
        // --- MODO NUBE ---
        setIsOnlineMode(true);
        const initAuth = async () => {
          if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
          } else {
            await signInAnonymously(auth);
          }
        };
        initAuth();
        const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
        return () => unsubscribe();
    } else {
        // --- MODO LOCAL (Fallback) ---
        setIsOnlineMode(false);
        const saved = localStorage.getItem('autoflow_db_v1');
        if (saved) setClients(JSON.parse(saved));
        else setClients([{
            id: 1, name: "Ejemplo Local: Carlos", cedula: "099999", phone: "099", 
            inscriptionDate: "2023-10-01", adjudicationDate: "2023-11-01", stages: {}
        }]);
        setLoading(false);
    }
  }, []);

  // 2. SINCRONIZACIÓN DE DATOS
  useEffect(() => {
    if (isOnlineMode && user && db) {
        const q = collection(db, 'artifacts', appId, 'public', 'data', 'clients');
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const clientsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setClients(clientsData);
          setLoading(false);
        }, (error) => {
          console.error("Error nube:", error);
          setLoading(false);
        });
        return () => unsubscribe();
    } else if (!isOnlineMode) {
        // Guardar en LocalStorage cada vez que cambie 'clients'
        localStorage.setItem('autoflow_db_v1', JSON.stringify(clients));
    }
  }, [user, clients, isOnlineMode]);

  // --- ACCIONES UNIFICADAS ---

  const addClient = async (clientData) => {
    const newClient = { ...clientData, createdAt: new Date().toISOString(), stages: {} };
    
    if (isOnlineMode && db) {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'clients'), newClient);
    } else {
        setClients([...clients, { ...newClient, id: Date.now().toString() }]);
    }
    setView('list');
  };

  const updateClientStage = async (clientId, stageId, date) => {
    // Actualizar UI local inmediatamente (optimista)
    if (selectedClient && selectedClient.id === clientId) {
        setSelectedClient(prev => ({ ...prev, stages: { ...prev.stages, [stageId]: date } }));
    }

    if (isOnlineMode && db) {
        const clientRef = doc(db, 'artifacts', appId, 'public', 'data', 'clients', clientId);
        await updateDoc(clientRef, { [`stages.${stageId}`]: date });
    } else {
        setClients(prev => prev.map(c => c.id === clientId ? { ...c, stages: { ...c.stages, [stageId]: date } } : c));
    }
  };

  const deleteClient = async (clientId) => {
    if(!confirm("¿Estás seguro de eliminar este cliente?")) return;
    
    if (isOnlineMode && db) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'clients', clientId));
    } else {
        setClients(clients.filter(c => c.id !== clientId));
    }
    if (selectedClient?.id === clientId) setView('list');
  };

  // --- LÓGICA DE NEGOCIO ---
  const calculateDelay = (adjudicationDate, stageId, actualDateString) => {
    if (!actualDateString || !adjudicationDate) return null;
    const adjDate = new Date(adjudicationDate);
    const actDate = new Date(actualDateString);
    const stageIndex = STAGE_CONFIG.findIndex(s => s.id === stageId);
    const targetDays = getCumulativeDays(stageIndex);
    const targetDate = new Date(adjDate);
    targetDate.setDate(targetDate.getDate() + targetDays);
    const diffTime = actDate - targetDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return { diffDays, targetDate: targetDate.toISOString().split('T')[0], isLate: diffDays > 0 };
  };

  // --- VISTAS ---
  const DashboardView = () => {
    const totalClients = clients.length;
    const activeClients = clients.filter(c => !c.stages?.delivery).length;
    const riskClients = clients.filter(c => {
      if (!c.adjudicationDate || c.stages?.delivery) return false;
      const daysUsed = getWorkingDays(c.adjudicationDate, new Date().toISOString());
      return daysUsed > 15;
    }).length;

    const chartData = STAGE_CONFIG.slice(0, 8).map(stage => ({
      name: stage.label,
      completados: clients.filter(c => c.stages?.[stage.id]).length
    }));
    const scaleMax = Math.max(totalClients, 1);

    return (
      <div className="space-y-6 animate-fade-in">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            Panel de Control
            {loading && <span className="text-xs font-normal text-blue-500 animate-pulse">(Cargando...)</span>}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 border-l-4 border-l-blue-500">
            <div className="text-slate-500 text-sm font-medium">Clientes Activos</div>
            <div className="text-3xl font-bold text-slate-800">{activeClients}</div>
          </Card>
          <Card className="p-4 border-l-4 border-l-amber-500">
            <div className="text-slate-500 text-sm font-medium">En Riesgo (&gt;15 días)</div>
            <div className="text-3xl font-bold text-slate-800">{riskClients}</div>
          </Card>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-slate-700">Progreso por Etapa</h3>
            <div className="space-y-3">
              {chartData.map((d, i) => (
                <div key={i} className="flex items-center text-sm">
                  <div className="w-40 text-slate-500 truncate pr-2 text-xs font-medium uppercase" title={d.name}>{d.name}</div>
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${(d.completados / scaleMax) * 100}%` }}></div>
                  </div>
                  <div className="w-8 text-right font-bold text-slate-700">{d.completados}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-slate-700">Acciones</h3>
            <div className="space-y-3">
              <button onClick={() => setView('form')} className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition border border-slate-200 group">
                <span className="flex items-center gap-3"><div className="bg-blue-100 p-2 rounded-full text-blue-600 group-hover:bg-blue-200"><Icons.Plus className="w-5 h-5" /></div><span className="font-medium text-slate-700">Registrar Nuevo Cliente</span></span>
                <Icons.ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
              <button onClick={() => setView('list')} className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition border border-slate-200 group">
                <span className="flex items-center gap-3"><div className="bg-emerald-100 p-2 rounded-full text-emerald-600 group-hover:bg-emerald-200"><Icons.Users className="w-5 h-5" /></div><span className="font-medium text-slate-700">Ver Lista de Clientes</span></span>
                <Icons.ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </Card>
        </div>
      </div>
    );
  };

  const ClientDetailView = () => {
    if (!selectedClient) return null;
    const clientStages = selectedClient.stages || {};
    const endDateForCalc = clientStages.delivery ? clientStages.delivery : new Date().toISOString().split('T')[0];
    const workingDaysUsed = getWorkingDays(selectedClient.adjudicationDate, endDateForCalc);
    const daysRemaining = MAX_SLA_DAYS - workingDaysUsed;
    let healthColor = "bg-emerald-500";
    if (daysRemaining <= 5 && daysRemaining > 0) healthColor = "bg-amber-500";
    if (daysRemaining <= 0) healthColor = "bg-rose-500";
    const progressPct = Math.min(100, Math.max(0, (workingDaysUsed / MAX_SLA_DAYS) * 100));
    let previousStageDate = selectedClient.adjudicationDate;

    return (
      <div className="space-y-6">
        <button onClick={() => setView('list')} className="flex items-center text-slate-500 hover:text-blue-600"><Icons.ArrowLeft className="w-4 h-4 mr-1" /> Volver a la lista</button>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">{selectedClient.name}</h2>
              <div className="text-sm text-slate-500 mt-1">Adjudicado: <span className="font-medium text-slate-700">{selectedClient.adjudicationDate}</span></div>
            </div>
            <div className="flex gap-4 items-center">
               <div className="text-right bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
                 <div className="text-xs text-slate-500 uppercase font-bold">Días Usados</div>
                 <div className="text-2xl font-mono font-bold text-slate-700">{workingDaysUsed}<span className="text-sm text-slate-400">/{MAX_SLA_DAYS}</span></div>
               </div>
               <div className={`text-right text-white px-4 py-2 rounded-lg ${healthColor} shadow-sm`}>
                 <div className="text-xs opacity-90 uppercase font-bold">Días Restantes</div>
                 <div className="text-2xl font-mono font-bold">{daysRemaining}</div>
               </div>
               <button onClick={() => deleteClient(selectedClient.id)} className="ml-2 p-2 text-rose-500 hover:bg-rose-50 rounded-full border border-rose-200 transition" title="Eliminar"><Icons.Trash2 className="w-5 h-5" /></button>
            </div>
          </div>
          <div className="px-6 py-4 bg-white">
            <div className="relative w-full bg-slate-100 rounded-full h-4 overflow-hidden">
              <div className={`h-full transition-all duration-500 ${healthColor}`} style={{ width: `${progressPct}%` }}></div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Icons.Timer className="w-5 h-5 text-blue-500" /> Desglose por Etapa</h3>
            {STAGE_CONFIG.map((stage, index) => {
              const currentDate = clientStages[stage.id] || "";
              const isCompleted = !!currentDate;
              let stageDuration = 0;
              if (isCompleted && previousStageDate) stageDuration = getWorkingDays(previousStageDate, currentDate);
              const analysis = calculateDelay(selectedClient.adjudicationDate, stage.id, currentDate);
              let borderColor = "border-slate-200";
              let icon = <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-sm">{index + 1}</div>;
              if (isCompleted) {
                 if (analysis.isLate) {
                   borderColor = "border-rose-300 bg-rose-50";
                   icon = <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600"><Icons.AlertCircle className="w-5 h-5" /></div>;
                 } else {
                   borderColor = "border-emerald-300 bg-emerald-50";
                   icon = <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600"><Icons.CheckCircle className="w-5 h-5" /></div>;
                 }
              }
              const row = (
                <div key={stage.id} className={`relative flex items-center p-4 rounded-lg border ${borderColor} bg-white transition-all`}>
                  {index < STAGE_CONFIG.length - 1 && <div className="absolute left-8 top-12 bottom-[-16px] w-0.5 bg-slate-200 -z-10"></div>}
                  <div className="mr-4 flex-shrink-0 z-10">{icon}</div>
                  <div className="flex-grow grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="md:col-span-4">
                      <div className="font-semibold text-slate-800 text-sm">{stage.label}</div>
                      <div className="text-xs text-slate-500">Meta: {stage.days} días</div>
                    </div>
                    <div className="md:col-span-4">
                      <input type="date" className={`w-full text-sm p-1.5 rounded border ${isCompleted ? 'bg-white' : 'bg-slate-50'} border-slate-300 focus:ring-2 focus:ring-blue-500`} value={currentDate} onChange={(e) => updateClientStage(selectedClient.id, stage.id, e.target.value)} />
                    </div>
                    <div className="md:col-span-4 text-right flex flex-col items-end justify-center">
                      {isCompleted ? (<div className="flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded"><Icons.Clock className="w-3 h-3" /> Tomó: {stageDuration} días lab.</div>) : (<div className="text-xs text-slate-400 italic">Pendiente</div>)}
                    </div>
                  </div>
                </div>
              );
              if (isCompleted) previousStageDate = currentDate;
              return row;
            })}
          </div>
        </div>
      </div>
    );
  };

  const ClientListView = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-slate-800">Listado de Clientes</h2>
        <div className="flex gap-2">
          <button onClick={() => setView('form')} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2"><Icons.Plus className="w-4 h-4" /> Nuevo</button>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-xs border-b border-slate-200">
              <tr><th className="px-6 py-4">Cliente</th><th className="px-6 py-4">F. Adjudicación</th><th className="px-6 py-4">SLA</th><th className="px-6 py-4">Estado</th><th className="px-6 py-4 text-right">Acción</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clients.length === 0 && <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-400">No hay clientes registrados.</td></tr>}
              {clients.map(client => {
                const endDate = client.stages?.delivery || new Date().toISOString().split('T')[0];
                const daysUsed = getWorkingDays(client.adjudicationDate, endDate);
                const daysLeft = MAX_SLA_DAYS - daysUsed;
                return (
                  <tr key={client.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4"><div className="font-medium text-slate-800">{client.name}</div><div className="text-xs text-slate-400">{client.cedula}</div></td>
                    <td className="px-6 py-4">{client.adjudicationDate}</td>
                    <td className="px-6 py-4"><div className="flex items-center gap-2"><span className="font-mono font-bold text-slate-700">{daysUsed}</span><span className="text-slate-400 text-xs">/ 20</span></div></td>
                    <td className="px-6 py-4"><span className={`font-bold ${daysLeft < 0 ? 'text-rose-600' : 'text-slate-600'}`}>{daysLeft < 0 ? 'Vencido' : daysLeft <= 5 ? 'En Riesgo' : 'A tiempo'}</span></td>
                    <td className="px-6 py-4 text-right"><button onClick={() => { setSelectedClient(client); setView('detail'); }} className="text-blue-600 hover:text-blue-800 font-medium text-xs border border-blue-200 px-3 py-1 rounded hover:bg-blue-50">Gestionar</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const NewClientForm = () => {
    const [formData, setFormData] = useState({ name: '', cedula: '', phone: '', inscriptionDate: '', adjudicationDate: '' });
    const handleSubmit = (e) => { e.preventDefault(); addClient(formData); };
    return (
      <div className="max-w-2xl mx-auto">
        <button onClick={() => setView('dashboard')} className="flex items-center text-slate-500 mb-4 hover:text-blue-600"><Icons.ArrowLeft className="w-4 h-4 mr-1" /> Volver</button>
        <Card className="p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Icons.Plus className="w-6 h-6 text-blue-500" /> Nuevo Cliente</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label><input required type="text" className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Cédula</label><input required type="text" className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={formData.cedula} onChange={e => setFormData({...formData, cedula: e.target.value})} /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label><input required type="tel" className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-100">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Inscripción</label><input required type="date" className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={formData.inscriptionDate} onChange={e => setFormData({...formData, inscriptionDate: e.target.value})} /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Adjudicación</label><input required type="date" className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={formData.adjudicationDate} onChange={e => setFormData({...formData, adjudicationDate: e.target.value})} /><p className="text-xs text-slate-500 mt-1">Hito 0: Inicia el conteo de 20 días laborables</p></div>
            </div>
            <div className="pt-6"><button type="submit" className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-medium transition shadow-sm">Guardar {isOnlineMode ? 'en Nube' : 'Localmente'}</button></div>
          </form>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-600 flex">
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3 font-bold text-lg">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-full bg-white p-0.5" />
            <span>Workflow Auto Club</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${view === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Icons.PieChart className="w-5 h-5" /> Dashboard</button>
          <button onClick={() => setView('list')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${view === 'list' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Icons.Users className="w-5 h-5" /> Clientes</button>
          <button onClick={() => setView('form')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${view === 'form' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Icons.Plus className="w-5 h-5" /> Nuevo Ingreso</button>
        </nav>
        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 flex items-center gap-2">
            {isOnlineMode ? <><Icons.Cloud className="w-3 h-3 text-emerald-400"/> Conectado (Nube)</> : <><Icons.WifiOff className="w-3 h-3 text-amber-400"/> Modo Local</>}
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto h-screen">
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center md:hidden">
          <div className="font-bold text-slate-800">Workflow Auto Club</div>
          <button className="text-slate-500"><Icons.Users className="w-5 h-5" /></button>
        </header>
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {view === 'dashboard' && <DashboardView />}
          {view === 'list' && <ClientListView />}
          {view === 'form' && <NewClientForm />}
          {view === 'detail' && <ClientDetailView />}
        </div>
      </main>
    </div>
  );
}