import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged, 
  signInWithCustomToken, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  setDoc, 
  getDoc,
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend 
} from 'recharts';
import { 
  CheckCircle, Circle, Clock, Car, Search, AlertCircle, 
  ChevronRight, Calendar, MapPin, Phone, ShieldCheck,
  Users, Plus, FileText, Truck, ArrowLeft, PieChart as PieChartIcon, 
  Timer, AlertTriangle, Trash2, Cloud, WifiOff, Mail, X, Paperclip, 
  Eye, TrendingUp, Download, DollarSign, Wifi, RefreshCw, Globe, 
  Info, HelpCircle, Lock, UserCheck, Key, LogOut, User as UserIcon, Building
} from 'lucide-react';

// ====================================================================================
// 🔧 CONFIGURACIÓN DE FIREBASE (COMPARTIDA)
// ====================================================================================

const firebaseConfig = {
  apiKey: "AIzaSyBZJ-bkq9eGJEhCdirSPl6O1nI3XGvp-CY", 
  authDomain: "autoclub-adj.firebaseapp.com",
  projectId: "autoclub-adj",
  storageBucket: "autoclub-adj.firebasestorage.app",
  messagingSenderId: "945662692814",
  appId: "1:945662692814:web:6232635ab3c46d66acaf9f"
};

const appId = 'auto-club-main-shared'; 
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Configuración de etapas (Debe coincidir con la del CRM)
const STAGE_CONFIG = [
  { id: 'contact', label: "Registro y Contacto", days: 0 }, 
  { id: 'visit', label: "Visita Comercial", days: 3 },
  { id: 'docs', label: "Entrega Doc. y Pagos", days: 3 },
  { id: 'approval', label: "Aprobación de Compra", days: 3 },
  { id: 'order_emit', label: "Emisión Orden de Compra", days: 2 },
  { id: 'invoice', label: "Recepción de Factura", days: 2 },
  { id: 'contract', label: "Firma de Contrato", days: 2 },
  { id: 'insurance', label: "Seguro y Dispositivo", days: 4 },
  { id: 'registration', label: "Recepción Matrícula", days: 4 },
  { id: 'delivery_order', label: "Orden de Entrega", days: 2 },
  { id: 'delivery', label: "Entrega Vehículo", days: 1 }
];

// Constantes del CRM Admin
const MAX_SLA_DAYS = 26;
const ATTACHMENT_STAGES = ['docs', 'approval', 'order_emit', 'invoice', 'contract', 'insurance', 'registration', 'delivery_order'];
const MASTER_ADMIN_KEY = "admin2025";
const CORPORATE_DOMAIN = "@bopelual.com";

// Utilidades
const parseLocalDate = (dateStr) => {
  if(!dateStr) return new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
};

const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isWeekend = (d) => {
  const day = d.getDay();
  return day === 0 || day === 6; 
};

const getWorkingDays = (startDateStr, endDateStr) => {
  if (!startDateStr || !endDateStr) return 0;
  const start = parseLocalDate(startDateStr);
  const end = parseLocalDate(endDateStr);
  if (start >= end) return 0;
  let count = 0;
  const cur = new Date(start);
  cur.setDate(cur.getDate() + 1);
  while (cur <= end) {
    if (!isWeekend(cur)) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
};

// Componentes UI básicos
const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 ${className}`}>{children}</div>
);

const Badge = ({ children, color = "slate" }) => {
  const colors = {
    slate: "bg-slate-100 text-slate-600 border-slate-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[color]} inline-flex items-center gap-1`}>{children}</span>;
};

// ====================================================================================
// 👤 COMPONENTE: PORTAL DE CLIENTES (Mirroring)
// ====================================================================================

function ClientPortal() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cedula, setCedula] = useState('');
  const [code, setCode] = useState('');
  const [clientData, setClientData] = useState(null);

  useEffect(() => {
    // Intenta conectar inmediatamente al cargar
    const initAuth = async () => {
      if (!auth.currentUser) {
        try {
          await signInAnonymously(auth);
        } catch (err) {
          console.error("Error de conexión inicial:", err);
        }
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (u) => { 
      if (u) {
        setUser(u);
        setError(''); // Limpia errores previos si conecta exitosamente
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setClientData(null);

    // 1. Verificación robusta de autenticación
    let currentUser = user || auth.currentUser;

    if (!currentUser) {
      try {
        // Intento de reconexión forzada
        const result = await signInAnonymously(auth);
        currentUser = result.user;
        setUser(currentUser);
      } catch (authErr) {
        console.error(authErr);
        setError("Error de conexión. Por favor verifique su internet o recargue la página.");
        setLoading(false);
        return;
      }
    }

    try {
      const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'clients'), where('cedula', '==', cedula.trim()));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setError("No encontramos una solicitud con esa Cédula.");
        setLoading(false);
        return;
      }

      const foundClientDoc = querySnapshot.docs.find(doc => 
        doc.data().clientCode && doc.data().clientCode.toLowerCase() === code.trim().toLowerCase()
      );

      if (foundClientDoc) {
        onSnapshot(foundClientDoc.ref, (doc) => { setClientData({ id: doc.id, ...doc.data() }); });
      } else {
        setError("El Código de Cliente no coincide con la Cédula ingresada.");
      }
    } catch (err) {
      console.error(err);
      setError("Hubo un error al buscar su información. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const getProgress = () => {
    if (!clientData || !clientData.stages) return 0;
    const completedStages = STAGE_CONFIG.filter(s => clientData.stages[s.id]).length;
    return Math.round((completedStages / STAGE_CONFIG.length) * 100);
  };

  if (!clientData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans animate-fade-in">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full border-t-4 border-blue-600">
          <div className="flex justify-center mb-6"><div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600"><Car className="w-8 h-8"/></div></div>
          <h1 className="text-2xl font-bold text-center text-slate-800 mb-2">Rastreo de Trámite</h1>
          <p className="text-center text-slate-500 text-sm mb-6">Ingrese sus datos para ver el estado de su vehículo en tiempo real.</p>
          <form onSubmit={handleSearch} className="space-y-4">
            <div><label className="block text-xs font-bold text-slate-500 mb-1">CÉDULA / RUC</label><input type="text" required className="w-full px-4 py-3 border rounded-lg text-sm bg-slate-50" placeholder="Ej: 0999999999" value={cedula} onChange={e => setCedula(e.target.value)}/></div>
            <div><label className="block text-xs font-bold text-slate-500 mb-1">CÓDIGO DE CLIENTE</label><input type="text" required className="w-full px-4 py-3 border rounded-lg text-sm bg-slate-50" placeholder="Ej: CLI-001" value={code} onChange={e => setCode(e.target.value)}/><p className="text-[10px] text-slate-400 mt-1">Este código fue proporcionado por su asesor.</p></div>
            {error && <div className="bg-rose-50 text-rose-600 p-3 rounded text-xs flex items-start gap-2 border border-rose-100"><AlertCircle className="w-4 h-4 mt-0.5 shrink-0"/><span>{error}</span></div>}
            <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 transition disabled:opacity-50 flex justify-center items-center gap-2">{loading ? 'Buscando...' : <><Search className="w-4 h-4"/> Consultar Estado</>}</button>
          </form>
        </div>
      </div>
    );
  }

  const progress = getProgress();

  return (
    <div className="min-h-screen bg-slate-100 font-sans pb-10 animate-fade-in">
      <div className="bg-slate-900 text-white p-6 pb-24 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-10 transform translate-x-10 -translate-y-10"><Car className="w-64 h-64"/></div>
        <div className="max-w-md mx-auto relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2"><div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center"><Car className="w-5 h-5"/></div><span className="font-bold text-lg">AutoClub</span></div>
            <button onClick={() => { setClientData(null); setCedula(''); setCode(''); }} className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded transition border border-slate-700">Salir</button>
          </div>
          <h1 className="text-2xl font-bold mb-1">Hola, {clientData.name.split(' ')[0]}</h1>
          <p className="text-slate-400 text-sm">Aquí está el progreso de tu vehículo.</p>
        </div>
      </div>
      <div className="max-w-md mx-auto px-4 -mt-16 relative z-20 space-y-4">
        <div className="bg-white rounded-xl shadow-lg p-5 border border-slate-100">
          <div className="flex justify-between items-center mb-4"><span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Progreso General</span><span className="text-blue-600 font-bold text-lg">{progress}%</span></div>
          <div className="w-full bg-slate-100 rounded-full h-3 mb-4 overflow-hidden"><div className="bg-blue-600 h-3 rounded-full transition-all duration-1000 ease-out" style={{ width: `${progress}%` }}></div></div>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
            <div><div className="text-xs text-slate-400 mb-1">Fecha Adjudicación</div><div className="flex items-center gap-1 text-sm font-medium text-slate-700"><Calendar className="w-3 h-3 text-blue-500"/>{clientData.adjudicationDate}</div></div>
            <div><div className="text-xs text-slate-400 mb-1">Ciudad</div><div className="flex items-center gap-1 text-sm font-medium text-slate-700"><MapPin className="w-3 h-3 text-rose-500"/>{clientData.city}</div></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 p-4 border-b border-slate-100"><h3 className="font-bold text-slate-800 flex items-center gap-2"><Clock className="w-4 h-4 text-slate-500"/> Cronología</h3></div>
          <div className="p-0">
            {STAGE_CONFIG.map((stage, index) => {
              const isCompleted = clientData.stages && clientData.stages[stage.id];
              const isCurrent = !isCompleted && (index === 0 || (clientData.stages && clientData.stages[STAGE_CONFIG[index - 1].id]));
              return (
                <div key={stage.id} className={`flex items-stretch relative ${index !== STAGE_CONFIG.length - 1 ? 'pb-0' : ''}`}>
                  {index !== STAGE_CONFIG.length - 1 && (<div className={`absolute left-6 top-8 bottom-0 w-0.5 ${isCompleted ? 'bg-emerald-200' : 'bg-slate-100'}`}></div>)}
                  <div className="px-4 py-4 flex-1 flex gap-4 hover:bg-slate-50 transition-colors">
                    <div className="relative z-10 shrink-0">{isCompleted ? (<div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-sm shadow-emerald-200"><CheckCircle className="w-3 h-3"/></div>) : isCurrent ? (<div className="w-5 h-5 rounded-full bg-white border-2 border-blue-500 flex items-center justify-center animate-pulse"><div className="w-2 h-2 rounded-full bg-blue-500"></div></div>) : (<div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-300"></div>)}</div>
                    <div className="flex-1 pt-0.5">
                      <div className="flex justify-between items-start">
                        <h4 className={`text-sm font-medium ${isCompleted ? 'text-slate-800' : isCurrent ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>{stage.label}</h4>
                        {isCompleted && (<span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">{clientData.stages[stage.id]}</span>)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ====================================================================================
// 🛠️ COMPONENTE: ADMIN CRM (COMPLETO)
// ====================================================================================

function AdminCRM({ onBack }) {
  const [view, setView] = useState('dashboard');
  const [selectedClient, setSelectedClient] = useState(null);
  const [clients, setClients] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  
  const [authMode, setAuthMode] = useState('login');
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailData, setEmailData] = useState(null);
  const [stageModal, setStageModal] = useState(null); 
  const [searchTerm, setSearchTerm] = useState(""); 
  const [adminKeyInput, setAdminKeyInput] = useState("");
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u && !u.isAnonymous) { // Ignorar usuarios anónimos (Portal Clientes)
        setUser(u);
        setAuthError(null);
        await checkUserProfile(u);
      } else {
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAuthSubmit = async (e) => {
      e.preventDefault();
      setAuthLoading(true);
      setAuthError(null);
      if (authMode === 'register' && !emailInput.toLowerCase().endsWith(CORPORATE_DOMAIN)) {
          setAuthError(`Solo se permite el registro con correos corporativos (${CORPORATE_DOMAIN})`);
          setAuthLoading(false);
          return;
      }
      try {
          if (authMode === 'register') {
              if (!nameInput.trim()) throw new Error("El nombre es obligatorio");
              const userCredential = await createUserWithEmailAndPassword(auth, emailInput, passwordInput);
              await updateProfile(userCredential.user, { displayName: nameInput });
          } else {
              await signInWithEmailAndPassword(auth, emailInput, passwordInput);
          }
      } catch (error) {
          setAuthError(error.message);
          setAuthLoading(false);
      }
  };

  const handleLogout = async () => {
      await signOut(auth);
      onBack(); // Volver al landing al salir
  };

  const checkUserProfile = async (currentUser) => {
    try {
        const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', `user_${currentUser.uid}`);
        onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setUserProfile(data);
                if (data.status === 'approved') setLoading(false); 
            } else {
                const newUser = {
                    uid: currentUser.uid, status: 'pending', role: 'user', createdAt: new Date().toISOString(),
                    displayName: nameInput || currentUser.displayName || 'Usuario Nuevo', email: currentUser.email
                };
                setDoc(userRef, newUser);
                setUserProfile(newUser);
            }
            setLoading(false);
        });
    } catch (e) { setLoading(false); }
  };

  useEffect(() => {
    if (user && userProfile?.status === 'approved') {
      const qClients = collection(db, 'artifacts', appId, 'public', 'data', 'clients');
      const unsubClients = onSnapshot(qClients, (snap) => setClients(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
      let unsubUsers = () => {};
      if (userProfile.role === 'admin') {
          const qUsers = collection(db, 'artifacts', appId, 'public', 'data', 'users'); 
          unsubUsers = onSnapshot(qUsers, (snap) => setPendingUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))));
      }
      return () => { unsubClients(); unsubUsers(); };
    }
  }, [user, userProfile]);

  const handleAdminLogin = async () => {
      if (!user) return;
      if (adminKeyInput.trim() === MASTER_ADMIN_KEY) {
          try {
              const userRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', `user_${user.uid}`);
              await setDoc(userRef, { role: 'admin', status: 'approved', uid: user.uid, displayName: user.displayName, email: user.email, lastLogin: new Date().toISOString() }, { merge: true });
              alert("¡Clave correcta! Ahora eres Administrador."); setShowAdminLogin(false);
          } catch (e) { alert(`Error: ${e.message}`); }
      } else { alert("Clave incorrecta."); }
  };

  const approveUser = async (targetUid) => updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', `user_${targetUid}`), { status: 'approved' });
  const blockUser = async (targetUid) => { if(confirm("¿Bloquear?")) updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', `user_${targetUid}`), { status: 'blocked' }); };
  const addClient = async (clientData) => {
    if (isWeekend(parseLocalDate(clientData.adjudicationDate))) { alert("Fecha no válida (Fin de semana)."); return; }
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'clients'), { ...clientData, createdAt: new Date().toISOString(), stages: {}, attachments: {} });
    setView('list');
  };
  const updateClientStage = async (clientId, stageId, date) => {
    if (isWeekend(parseLocalDate(date))) { alert("Selecciona un día laborable."); return; }
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'clients', clientId), { [`stages.${stageId}`]: date });
  };
  const uploadAttachment = async (clientId, stageId, file) => {
      if (file.size > 800000) { alert("Máximo 800KB"); return; }
      const reader = new FileReader();
      reader.onload = async (e) => await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'clients', clientId), { [`attachments.${stageId}`]: { name: file.name, type: file.type, data: e.target?.result, date: new Date().toISOString() } });
      reader.readAsDataURL(file);
  };
  const deleteClient = async (clientId) => { if(confirm("¿Eliminar expediente?")) { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'clients', clientId)); if (selectedClient?.id === clientId) setView('list'); }};

  const exportToExcel = () => {
    const headers = ["Código", "Nombre", "Cédula", "Ciudad", "Teléfono", "Tipo Adj.", "F. Inscripción", "F. Adjudicación", "Estado General", ...STAGE_CONFIG.map(s => s.label)];
    let tableHTML = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:x='urn:schemas-microsoft-com:office:excel' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <style>
        th { background-color: #1e3a8a; color: white; font-weight: bold; border: 1px solid #000; padding: 5px; }
        td { border: 1px solid #000; vertical-align: middle; padding: 5px; }
        .status-ok { background-color: #d1fae5; color: #065f46; font-weight: bold; }
        .status-risk { background-color: #fef3c7; color: #92400e; font-weight: bold; }
        .status-late { background-color: #fee2e2; color: #991b1b; font-weight: bold; }
        .text-fmt { mso-number-format:"\@"; } 
      </style></head><body><table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>
    `;
    clients.forEach(c => {
       const clientStages = c.stages || {};
       const endDate = clientStages.delivery ? clientStages.delivery : getTodayString();
       const daysUsed = getWorkingDays(c.adjudicationDate, endDate);
       let status = "A Tiempo";
       let statusClass = "status-ok";
       if (daysUsed > MAX_SLA_DAYS) { status = "Atrasado"; statusClass = "status-late"; } 
       else if (daysUsed > 15) { status = "En Riesgo"; statusClass = "status-risk"; }
       const rowData = [
         c.clientCode || "", c.name || "", c.cedula || "", c.city || "", c.phone || "", c.adjudicationType || "", c.inscriptionDate || "", c.adjudicationDate || "", 
         { value: status, className: statusClass }, ...STAGE_CONFIG.map(s => clientStages[s.id] || "Pendiente")
       ];
       tableHTML += `<tr>`;
       rowData.forEach(item => {
         if (typeof item === 'object' && item !== null) tableHTML += `<td class="${item.className}">${item.value}</td>`;
         else tableHTML += `<td class="text-fmt">${item}</td>`;
       });
       tableHTML += `</tr>`;
    });
    tableHTML += `</tbody></table></body></html>`;
    const blob = new Blob(['\ufeff', tableHTML], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `Reporte_AutoClub_${getTodayString()}.xls`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
  };

  const dashboardStats = useMemo(() => {
    const totalClients = clients.length;
    const activeClients = clients.filter(c => !c.stages?.delivery).length;
    const deliveredClients = clients.filter(c => c.stages?.delivery);
    const totalDeliveryDays = deliveredClients.reduce((acc, c) => acc + getWorkingDays(c.adjudicationDate, c.stages.delivery), 0);
    const avgDeliveryTime = deliveredClients.length ? (totalDeliveryDays / deliveredClients.length).toFixed(1) : "0";
    const riskClients = clients.filter(c => !c.stages?.delivery && getWorkingDays(c.adjudicationDate, getTodayString()) > 15).length;
    const pieData = [
        { name: 'A Tiempo', value: clients.filter(c => !c.stages?.delivery && getWorkingDays(c.adjudicationDate, getTodayString()) <= 15).length, color: '#10b981' },
        { name: 'Riesgo (>15d)', value: clients.filter(c => !c.stages?.delivery && getWorkingDays(c.adjudicationDate, getTodayString()) > 15 && getWorkingDays(c.adjudicationDate, getTodayString()) <= 20).length, color: '#f59e0b' },
        { name: 'Atrasados (>20d)', value: clients.filter(c => !c.stages?.delivery && getWorkingDays(c.adjudicationDate, getTodayString()) > 20).length, color: '#ef4444' }
    ].filter(d => d.value > 0);
    const chartData = STAGE_CONFIG.slice(0, 8).map(stage => ({ id: stage.id, name: stage.label, completados: clients.filter(c => c.stages?.[stage.id]).length }));
    return { totalClients, activeClients, deliveredClients, avgDeliveryTime, riskClients, pieData, chartData };
  }, [clients]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 flex-col gap-4"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div><span className="text-sm">Cargando Sistema...</span></div>;

  if (!user) {
      return (
          <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 animate-fade-in">
              <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full border-t-4 border-blue-600">
                  <div className="flex justify-center mb-6"><div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600"><Truck className="w-6 h-6"/></div></div>
                  <h1 className="text-2xl font-bold text-center text-slate-800 mb-1">AutoClub CRM</h1>
                  <p className="text-center text-slate-500 text-sm mb-6">{authMode === 'login' ? 'Acceso Corporativo' : 'Registro de Empleado'}</p>
                  {authError && <div className="bg-rose-50 text-rose-600 p-3 rounded mb-4 text-xs font-medium border border-rose-100 break-all">{authError}</div>}
                  <form onSubmit={handleAuthSubmit} className="space-y-4">
                      {authMode === 'register' && (<div><label className="block text-xs font-bold text-slate-500 mb-1">NOMBRE COMPLETO</label><div className="relative"><UserIcon className="w-4 h-4 absolute left-3 top-2.5 text-slate-400"/><input type="text" required className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" placeholder="Ej: Juan Pérez" value={nameInput} onChange={e => setNameInput(e.target.value)}/></div></div>)}
                      <div><label className="block text-xs font-bold text-slate-500 mb-1">CORREO CORPORATIVO</label><div className="relative"><Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400"/><input type="email" required className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" placeholder="usuario@bopelual.com" value={emailInput} onChange={e => setEmailInput(e.target.value)}/></div></div>
                      <div><label className="block text-xs font-bold text-slate-500 mb-1">CONTRASEÑA</label><div className="relative"><Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400"/><input type="password" required className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" placeholder="••••••••" value={passwordInput} onChange={e => setPasswordInput(e.target.value)}/></div></div>
                      <button type="submit" disabled={authLoading} className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50">{authLoading ? 'Procesando...' : (authMode === 'login' ? 'Ingresar' : 'Registrarse')}</button>
                  </form>
                  <div className="mt-6 pt-6 border-t border-slate-100 text-center space-y-3">
                      <button onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(null); }} className="text-blue-600 font-bold text-sm hover:underline block w-full">{authMode === 'login' ? 'Solicitar Acceso' : 'Volver al Login'}</button>
                      <button onClick={onBack} className="text-slate-400 text-xs hover:text-slate-600">← Volver al Inicio</button>
                  </div>
              </div>
          </div>
      );
  }

  if (userProfile?.status !== 'approved') {
      return (
          <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 animate-fade-in">
              <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border-t-4 border-amber-500">
                  <div className="mx-auto w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4 text-amber-500"><Clock className="w-8 h-8"/></div>
                  <h1 className="text-2xl font-bold text-slate-800 mb-2">Cuenta Pendiente</h1>
                  <p className="text-slate-600">Hola <strong>{user.displayName}</strong>, tu solicitud está pendiente de aprobación.</p>
                  <div className="mt-8 pt-4 border-t border-slate-100 space-y-4">
                      {!showAdminLogin ? (
                          <>
                            <button onClick={handleLogout} className="text-sm text-slate-500 hover:text-slate-700 flex items-center justify-center gap-2 w-full border p-2 rounded hover:bg-slate-50"><LogOut className="w-4 h-4"/> Cerrar Sesión</button>
                            <button onClick={() => setShowAdminLogin(true)} className="text-xs text-blue-600 hover:underline flex items-center justify-center gap-1 w-full opacity-60 hover:opacity-100 mt-2"><Key className="w-3 h-3"/> Soy Administrador</button>
                          </>
                      ) : (
                          <div className="flex flex-col gap-2">
                              <div className="flex gap-2"><input type="password" placeholder="Clave maestra" className="flex-1 text-sm border rounded px-2 py-1" value={adminKeyInput} onChange={e => setAdminKeyInput(e.target.value)} /><button onClick={handleAdminLogin} className="bg-blue-600 text-white text-xs px-3 py-1 rounded">Entrar</button></div>
                              <button onClick={() => setShowAdminLogin(false)} className="text-xs text-slate-400 underline">Cancelar</button>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-600 flex relative animate-fade-in">
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col shadow-xl z-20">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3 font-bold text-lg text-white"><div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white"><Truck className="w-5 h-5"/></div><span>AutoClub CRM</span></div>
          <div className="mt-3 flex items-center gap-2 px-2 py-1 rounded text-[10px] font-mono border bg-emerald-900/30 border-emerald-800 text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>ONLINE v11.0</div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 py-2">Menu Principal</div>
          <button onClick={() => setView('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'dashboard' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><PieChartIcon className="w-5 h-5" /> <span>Dashboard</span></button>
          <button onClick={() => setView('list')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'list' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Users className="w-5 h-5" /> <span>Clientes</span></button>
          <button onClick={() => setView('form')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'form' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Plus className="w-5 h-5" /> <span>Nuevo Ingreso</span></button>
          {userProfile?.role === 'admin' && (
              <>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 py-2 mt-4">Administración</div>
                <button onClick={() => setView('admin_users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${view === 'admin_users' ? 'bg-indigo-600 text-white font-medium' : 'text-indigo-300 hover:bg-indigo-900 hover:text-white'}`}><UserCheck className="w-5 h-5" /> <span>Usuarios</span>{pendingUsers.filter(u => u.status === 'pending').length > 0 && (<span className="bg-rose-500 text-white text-[10px] px-1.5 rounded-full ml-auto">{pendingUsers.filter(u => u.status === 'pending').length}</span>)}</button>
              </>
          )}
        </nav>
        <div className="p-4 border-t border-slate-800">
             <div className="flex items-center gap-3 mb-3"><div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white uppercase">{user.displayName ? user.displayName.substring(0,2) : 'US'}</div><div className="flex-1 overflow-hidden"><div className="text-xs font-bold text-white truncate">{user.displayName || 'Usuario'}</div><div className="text-[10px] text-slate-500 truncate">{userProfile?.role === 'admin' ? 'Administrador' : 'Usuario'}</div></div></div>
             <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 text-xs text-rose-400 hover:bg-rose-900/20 py-2 rounded transition border border-rose-900/30"><LogOut className="w-3 h-3"/> Salir</button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto h-screen flex flex-col p-4 md:p-8 max-w-7xl mx-auto w-full">
          {view === 'dashboard' && <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-slate-800">Panel de Control</h2><button onClick={exportToExcel} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-slate-50 transition shadow-sm font-medium"><Download className="w-4 h-4"/> Exportar Excel</button></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4"><Card className="p-5 border-l-4 border-l-blue-500"><div className="text-slate-500 text-sm">Clientes Activos</div><div className="text-3xl font-bold text-slate-800">{dashboardStats.activeClients}</div></Card><Card className="p-5 border-l-4 border-l-amber-500"><div className="text-slate-500 text-sm">En Riesgo</div><div className="text-3xl font-bold text-slate-800">{dashboardStats.riskClients}</div></Card><Card className="p-5 border-l-4 border-l-emerald-500"><div className="text-slate-500 text-sm">Entregados</div><div className="text-3xl font-bold text-slate-800">{dashboardStats.deliveredClients.length}</div></Card><Card className="p-5 border-l-4 border-l-indigo-500"><div className="text-slate-500 text-sm">Tiempo Promedio</div><div className="text-3xl font-bold text-slate-800">{dashboardStats.avgDeliveryTime}<span className="text-sm text-slate-400 font-normal ml-1">días</span></div></Card></div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><Card className="p-6 col-span-1 flex flex-col"><h3 className="text-lg font-semibold mb-4 text-slate-800 flex items-center gap-2"><PieChartIcon className="w-4 h-4 text-slate-500"/> Estado General</h3><div className="w-full h-64 relative flex-1">{dashboardStats.pieData.length > 0 ? (<ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={dashboardStats.pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">{dashboardStats.pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}</Pie><RechartsTooltip /><Legend verticalAlign="bottom" /></PieChart></ResponsiveContainer>) : (<div className="absolute inset-0 flex flex-col items-center justify-center text-center"><p className="text-slate-400 text-sm">No hay datos suficientes</p></div>)}</div></Card><Card className="p-6 col-span-1 lg:col-span-2"><h3 className="text-lg font-semibold mb-4 text-slate-800 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-slate-500"/> Embudo de Conversión</h3><div className="space-y-4">{dashboardStats.chartData.map((d, i) => (<div key={i} className="group"><div className="flex justify-between text-xs mb-1"><span className="font-medium text-slate-600 cursor-pointer hover:text-blue-600 transition" onClick={() => setStageModal({ id: d.id, label: d.name, clients: clients.filter(c => c.stages?.[d.id]) })}>{d.name}</span><span className="font-bold text-slate-700">{d.completados}</span></div><div className="h-2.5 bg-slate-100 rounded-full overflow-hidden cursor-pointer" onClick={() => setStageModal({ id: d.id, label: d.name, clients: clients.filter(c => c.stages?.[d.id]) })}><div className="h-full bg-blue-500 rounded-full relative group-hover:bg-blue-600 transition-all duration-500" style={{ width: `${(d.completados / Math.max(dashboardStats.totalClients, 1)) * 100}%` }}></div></div></div>))}</div></Card></div>
          </div>}

          {view === 'admin_users' && userProfile?.role === 'admin' && (
              <div className="space-y-6 animate-fade-in"><h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><UserCheck className="w-6 h-6 text-indigo-600"/> Gestión de Usuarios</h2><div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"><table className="w-full text-left text-sm text-slate-600"><thead className="bg-slate-50 text-slate-700 uppercase font-bold text-xs border-b border-slate-200"><tr><th className="px-6 py-4">Usuario</th><th className="px-6 py-4">Rol</th><th className="px-6 py-4">Estado</th><th className="px-6 py-4 text-right">Acción</th></tr></thead><tbody className="divide-y divide-slate-100">{pendingUsers.map(u => (<tr key={u.id} className="hover:bg-slate-50"><td className="px-6 py-4"><div className="font-bold text-slate-800">{u.displayName}</div><div className="text-xs text-slate-400 font-mono">{u.email}</div></td><td className="px-6 py-4"><Badge color={u.role === 'admin' ? 'blue' : 'slate'}>{u.role}</Badge></td><td className="px-6 py-4">{u.status === 'pending' ? <Badge color="amber">Pendiente</Badge> : u.status === 'approved' ? <Badge color="emerald">Aprobado</Badge> : <Badge color="rose">Bloqueado</Badge>}</td><td className="px-6 py-4 text-right flex justify-end gap-2">{u.status !== 'approved' && <button onClick={() => approveUser(u.uid)} className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded hover:bg-emerald-200 font-bold transition">Aprobar</button>}{u.status !== 'blocked' && u.uid !== user?.uid && <button onClick={() => blockUser(u.uid)} className="text-xs bg-rose-100 text-rose-700 px-3 py-1 rounded hover:bg-rose-200 font-bold transition">Bloquear</button>}</td></tr>))}</tbody></table>{pendingUsers.length === 0 && <div className="p-8 text-center text-slate-400">No hay usuarios registrados.</div>}</div></div>
          )}

          {view === 'list' && <div className="space-y-4 animate-fade-in"><div className="flex justify-between items-center"><h2 className="text-2xl font-bold text-slate-800">Listado de Clientes</h2><div className="flex gap-2"><button onClick={exportToExcel} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-slate-50 transition shadow-sm font-medium"><Download className="w-4 h-4"/> Excel</button><button onClick={() => setView('form')} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2"><Plus className="w-4 h-4" /> Nuevo</button></div></div><div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"><div className="p-4 border-b border-slate-100 bg-slate-50/50"><div className="relative"><Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400"/><input type="text" placeholder="Buscar..." className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/></div></div><div className="overflow-x-auto"><table className="w-full text-left text-sm text-slate-600"><thead className="bg-slate-50 text-slate-700 uppercase font-bold text-xs border-b border-slate-200"><tr><th className="px-6 py-4">Cliente</th><th className="px-6 py-4">F. Adjudicación</th><th className="px-6 py-4">Estado</th><th className="px-6 py-4 text-right">Acción</th></tr></thead><tbody className="divide-y divide-slate-100">{clients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map(client => (<tr key={client.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => { setSelectedClient(client); setView('detail'); }}><td className="px-6 py-4 font-bold text-slate-800">{client.name}</td><td className="px-6 py-4">{client.adjudicationDate}</td><td className="px-6 py-4">{client.stages?.delivery ? <Badge color="emerald">Entregado</Badge> : <Badge color="blue">En Curso</Badge>}</td><td className="px-6 py-4 text-right"><ChevronRight className="w-5 h-5 text-slate-400 inline"/></td></tr>))}</tbody></table></div></div></div>}

          {view === 'form' && <div className="max-w-2xl mx-auto animate-fade-in"><button onClick={() => setView('dashboard')} className="flex items-center text-slate-500 mb-6 hover:text-blue-600"><ArrowLeft className="w-4 h-4 mr-1" /> Volver</button><Card className="p-8 border-t-4 border-t-blue-600"><h2 className="text-2xl font-bold text-slate-800 mb-6">Nuevo Ingreso</h2><form onSubmit={(e) => { e.preventDefault(); addClient({ name: e.target.name.value, cedula: e.target.cedula.value, phone: e.target.phone.value, clientCode: e.target.clientCode.value, city: e.target.city.value, adjudicationType: e.target.type.value, inscriptionDate: e.target.inscription.value, adjudicationDate: e.target.adjudication.value }); }}><div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6"><input name="name" required placeholder="Nombre Completo" className="p-2 border rounded" /><input name="cedula" required placeholder="Cédula/RUC" className="p-2 border rounded" /><input name="phone" required placeholder="Teléfono" className="p-2 border rounded" /><input name="clientCode" required placeholder="Código Cliente" className="p-2 border rounded" /><input name="city" required placeholder="Ciudad" className="p-2 border rounded" /><select name="type" className="p-2 border rounded bg-white"><option value="Sorteo">Sorteo</option><option value="Oferta">Oferta</option></select><div className="md:col-span-2 grid grid-cols-2 gap-6"><div className="space-y-1"><label className="text-xs font-bold text-slate-500">F. Inscripción</label><input name="inscription" required type="date" className="w-full p-2 border rounded" /></div><div className="space-y-1"><label className="text-xs font-bold text-slate-500">F. Adjudicación</label><input name="adjudication" required type="date" className="w-full p-2 border rounded" /></div></div></div><button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-lg hover:bg-slate-800 font-bold">Guardar</button></form></Card></div>}

          {view === 'detail' && selectedClient && <div className="space-y-6 animate-fade-in"><button onClick={() => setView('list')} className="flex items-center text-slate-500 hover:text-blue-600"><ArrowLeft className="w-4 h-4 mr-1" /> Volver</button><Card className="p-6 border-b-4 border-b-blue-500"><div className="flex justify-between items-start"><div><h2 className="text-2xl font-bold text-slate-800">{selectedClient.name}</h2><div className="text-sm text-slate-500">{selectedClient.clientCode} - {selectedClient.city}</div></div><button onClick={() => deleteClient(selectedClient.id)} className="text-rose-500 hover:bg-rose-50 p-2 rounded"><Trash2 className="w-5 h-5"/></button></div></Card><div className="space-y-3">{STAGE_CONFIG.map((stage, idx) => (<div key={stage.id} className={`p-4 rounded-xl border flex gap-4 items-center ${selectedClient.stages[stage.id] ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}`}><div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${selectedClient.stages[stage.id] ? 'bg-white text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>{selectedClient.stages[stage.id] ? <CheckCircle className="w-5 h-5"/> : idx + 1}</div><div className="flex-1"><div className="font-bold text-slate-800 text-sm">{stage.label}</div><div className="text-xs text-slate-500">{stage.days} días hábiles</div></div><div className="flex flex-col items-end gap-2"><input type="date" className="text-xs p-1 border rounded" value={selectedClient.stages[stage.id] || ''} onChange={(e) => updateClientStage(selectedClient.id, stage.id, e.target.value)} />{ATTACHMENT_STAGES.includes(stage.id) && (selectedClient.attachments[stage.id] ? <a href={selectedClient.attachments[stage.id].data} download={selectedClient.attachments[stage.id].name} className="text-xs text-blue-600 underline flex items-center gap-1"><FileText className="w-3 h-3"/> Ver Doc</a> : <label className="text-xs text-slate-400 cursor-pointer hover:text-blue-500 flex items-center gap-1"><Paperclip className="w-3 h-3"/> Adjuntar <input type="file" className="hidden" onChange={(e) => e.target.files && uploadAttachment(selectedClient.id, stage.id, e.target.files[0])} /></label>)}{stage.id === 'docs' && selectedClient.stages[stage.id] && <button onClick={() => { setEmailData({ to: 'talvarado@bopelual.com', subject: `Aprobación Documentos - ${selectedClient.name}`, body: `Estimado Tairo,\n\nSe ha completado la entrega de documentos y pagos para el siguiente cliente:\n\nDETALLES DEL CLIENTE:\n- Nombre: ${selectedClient.name}\n- Cédula/RUC: ${selectedClient.cedula}\n- Código Cliente: ${selectedClient.clientCode}\n- Teléfono: ${selectedClient.phone}\n- Ciudad: ${selectedClient.city}\n\nDETALLES DE ADJUDICACIÓN:\n- Tipo: ${selectedClient.adjudicationType}\n- Fecha Inscripción: ${selectedClient.inscriptionDate}\n- Fecha Adjudicación: ${selectedClient.adjudicationDate}\n\nPor favor proceder con la revisión y aprobación correspondiente.\n\nSaludos,\nAutoClub CRM` }); setShowEmailModal(true); }} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded border border-indigo-100">Notificar</button>}</div></div>))}</div></div>}
      </main>

      {/* MODAL EMAIL */}
      {showEmailModal && emailData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden p-6 space-y-4">
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Mail className="w-5 h-5 text-blue-500"/> Confirmar Correo</h3>
            <div className="bg-slate-50 p-3 rounded text-sm text-slate-600 whitespace-pre-line">{emailData.body}</div>
            <div className="flex justify-end gap-3"><button onClick={() => setShowEmailModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded">Cancelar</button><button onClick={() => { window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${emailData.to}&su=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}`, '_blank'); setShowEmailModal(false); }} className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Enviar con Gmail</button></div>
          </div>
        </div>
      )}
      
      {/* MODAL ETAPAS DASHBOARD */}
      {stageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center"><h3 className="font-bold text-lg text-slate-800">Detalle: {stageModal.label}</h3><button onClick={() => setStageModal(null)} className="text-slate-400 hover:text-slate-600 transition"><X className="w-5 h-5"/></button></div>
                <div className="p-0 overflow-y-auto flex-1">{stageModal.clients.length === 0 ? (<div className="flex flex-col items-center justify-center py-12 text-slate-400"><Users className="w-12 h-12 mb-2 opacity-20"/><p>No hay clientes en esta etapa.</p></div>) : (<table className="w-full text-left text-sm text-slate-600"><thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-xs border-b border-slate-200 sticky top-0"><tr><th className="px-6 py-3">Cliente</th><th className="px-6 py-3">Fecha Etapa</th><th className="px-6 py-3 text-right">Acción</th></tr></thead><tbody className="divide-y divide-slate-100">{stageModal.clients.map((client) => (<tr key={client.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => { setSelectedClient(client); setView('detail'); setStageModal(null); }}><td className="px-6 py-3"><div className="font-medium text-slate-800">{client.name}</div><div className="text-xs text-slate-400">{client.clientCode}</div></td><td className="px-6 py-3 font-mono text-xs">{client.stages[stageModal.id]}</td><td className="px-6 py-3 text-right"><span className="text-blue-600 font-medium text-xs hover:underline">Ver</span></td></tr>))}</tbody></table>)}</div>
                <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 text-right"><button onClick={() => setStageModal(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition">Cerrar</button></div>
            </div>
        </div>
      )}
    </div>
  );
}

// ====================================================================================
// 🚦 COMPONENTE PRINCIPAL (ORQUESTADOR)
// ====================================================================================

export default function App() {
  const [currentApp, setCurrentApp] = useState('landing');

  // VISTA 1: PÁGINA DE ATERRIZAJE (LANDING PAGE)
  if (currentApp === 'landing') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4 font-sans">
        <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-fade-in">
          
          {/* Lado Izquierdo: Imagen / Branding */}
          <div className="md:w-1/2 bg-blue-600 p-10 flex flex-col justify-between text-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-400 via-blue-800 to-slate-900"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                 <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                    <Car className="w-6 h-6 text-white"/>
                 </div>
              </div>
              <h1 className="text-4xl font-extrabold mb-2 tracking-tight">AutoClub</h1>
              <p className="text-blue-100 opacity-90 font-medium">Gestión inteligente de vehículos.</p>
            </div>
            <div className="relative z-10 text-xs opacity-60 font-mono">
              v2.0 Sistema Integrado
            </div>
          </div>

          {/* Lado Derecho: Selección de Perfil */}
          <div className="md:w-1/2 p-10 flex flex-col justify-center space-y-8 bg-white">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-800">Bienvenido</h2>
              <p className="text-slate-500 text-sm mt-1">Selecciona tu tipo de acceso para continuar</p>
            </div>

            <div className="space-y-4">
              {/* Opción 1: Soy Cliente */}
              <button 
                onClick={() => setCurrentApp('client')}
                className="w-full group relative flex items-center gap-4 p-4 rounded-xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 text-left"
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform shadow-sm">
                  <UserIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-700 group-hover:text-blue-700">Soy Cliente</h3>
                  <p className="text-xs text-slate-500">Consultar estado de mi trámite</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 ml-auto group-hover:text-blue-500 transition-colors"/>
              </button>

              {/* Opción 2: Soy Empleado */}
              <button 
                onClick={() => setCurrentApp('admin')}
                className="w-full group relative flex items-center gap-4 p-4 rounded-xl border-2 border-slate-100 hover:border-slate-800 hover:bg-slate-50 transition-all duration-300 text-left"
              >
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-xl group-hover:scale-110 transition-transform shadow-sm">
                  <Building className="w-6 h-6"/>
                </div>
                <div>
                  <h3 className="font-bold text-slate-700 group-hover:text-slate-900">Acceso Corporativo</h3>
                  <p className="text-xs text-slate-500">Ingreso administrativo y ventas</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 ml-auto group-hover:text-slate-900 transition-colors"/>
              </button>
            </div>

            <div className="text-center pt-6 border-t border-slate-100">
              <p className="text-[10px] text-slate-400">¿Necesitas ayuda? Contacta a soporte@autoclub.com</p>
            </div>
          </div>

        </div>
      </div>
    );
  }

  // VISTA 2: APLICACIÓN DE CLIENTES
  if (currentApp === 'client') {
    return (
      <div className="relative animate-fade-in">
        <button 
          onClick={() => setCurrentApp('landing')}
          className="fixed top-4 left-4 z-50 bg-black/80 text-white px-4 py-2 rounded-full text-xs font-medium hover:bg-black transition-all shadow-lg backdrop-blur-sm"
        >
          ← Volver al Inicio
        </button>
        <ClientPortal />
      </div>
    );
  }

  // VISTA 3: CRM ADMINISTRATIVO
  if (currentApp === 'admin') {
    return (
      <div className="relative animate-fade-in">
        {/* Ahora renderizamos el CRM completo en lugar del placeholder */}
        <AdminCRM onBack={() => setCurrentApp('landing')} />
      </div>
    );
  }

  return null;
}