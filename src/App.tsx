import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

// ====================================================================================
// 🟢 CREDENCIALES INTEGRADAS (YA LISTAS PARA USAR)
// ====================================================================================
const firebaseConfig = {
  apiKey: "AIzaSyBZJ-bkq9eGJEhCdirSPl6O1nI3XGvp-CY",
  authDomain: "autoclub-adj.firebaseapp.com",
  projectId: "autoclub-adj",
  storageBucket: "autoclub-adj.firebasestorage.app",
  messagingSenderId: "945662692814",
  appId: "1:945662692814:web:6232635ab3c46d66acaf9f"
};
// ====================================================================================

// Variables globales de Firebase
let app = null;
let db = null;
const appId = 'auto-club-main';

// Inicialización segura de la app (Sin autenticación forzosa)
try {
  if (!app && firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("✅ Firebase Inicializado (Modo Directo)");
  }
} catch (e) {
  console.error("Error inicializando:", e);
}

// --- ICONOS (SVG Nativos para evitar errores de librería) ---
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
  WifiOff: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="1" x2="23" y1="1" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.58 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" x2="12.01" y1="20" y2="20"/></svg>,
  Mail: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
  X: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>,
  Paperclip: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>,
  Eye: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>,
  TrendingUp: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  Download: ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
};

// --- CONFIGURACIÓN SLA (26 DÍAS TOTAL) ---
const STAGE_CONFIG = [
  { id: 'contact', label: "Fecha 1er Contacto", days: 0 }, 
  { id: 'visit', label: "Fecha de Visita", days: 3 },
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
const MAX_SLA_DAYS = 26;
const ATTACHMENT_STAGES = ['docs', 'approval', 'order_emit', 'invoice', 'contract', 'insurance', 'registration', 'delivery_order'];

// --- UTILIDADES DE FECHA ---
const parseLocalDate = (dateStr) => {
  if(!dateStr) return new Date();
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return new Date();
    return new Date(year, month - 1, day, 12, 0, 0);
  } catch(e) {
    return new Date(); 
  }
};

const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isWeekend = (d) => {
  if (!d || isNaN(d.getTime())) return false;
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

const addWorkingDays = (startDateStr, daysToAdd) => {
  const result = (startDateStr instanceof Date) ? new Date(startDateStr) : parseLocalDate(startDateStr);
  result.setHours(12, 0, 0, 0); 
  let added = 0;
  while (added < daysToAdd) {
    result.setDate(result.getDate() + 1);
    if (!isWeekend(result)) {
      added++;
    }
  }
  return result;
};

const getPastDate = (daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// --- COMPONENTES UI ---
const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 ${className}`}>{children}</div>
);

// --- APP PRINCIPAL ---
export default function App() {
  const [view, setView] = useState('dashboard');
  const [selectedClient, setSelectedClient] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOnlineMode, setIsOnlineMode] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailData, setEmailData] = useState(null);
  const [searchTerm, setSearchTerm] = useState(""); 
  const [stageModal, setStageModal] = useState(null); 
  const [isLoaded, setIsLoaded] = useState(false); 

  // 1. CARGA DE DATOS CON PRIORIDAD A LA NUBE
  useEffect(() => {
    const initData = async () => {
      if (db) {
        // Intentar conexión a Nube
        try {
          const unsub = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'clients'), (snap) => {
              const cloudData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
              setClients(cloudData);
              setIsOnlineMode(true);
              setLoading(false);
              setIsLoaded(true);
          }, (error) => {
             console.error("Fallo conexión nube, usando local:", error);
             loadLocalData();
          });
          return () => unsub();
        } catch (e) {
          console.log("Error inicializando listener:", e);
          loadLocalData();
        }
      } else {
        loadLocalData();
      }
    };

    const loadLocalData = () => {
        setIsOnlineMode(false);
        const saved = localStorage.getItem('autoflow_db_v1');
        if (saved) {
            try { 
                const parsed = JSON.parse(saved);
                // Asegurar compatibilidad de datos
                const cleanData = Array.isArray(parsed) ? parsed.map(c => ({
                    ...c,
                    stages: c.stages || {},
                    attachments: c.attachments || {},
                    clientCode: c.clientCode || '',
                    city: c.city || '',
                    adjudicationType: c.adjudicationType || 'Sorteo'
                })) : [];
                setClients(cleanData);
            } catch (e) { setClients([]); }
        }
        setLoading(false);
        setIsLoaded(true);
    };

    initData();
  }, []);

  // 2. GUARDADO LOCAL (RESPALDO)
  useEffect(() => {
    if (isLoaded) {
        localStorage.setItem('autoflow_db_v1', JSON.stringify(clients));
    }
  }, [clients, isLoaded]);

  const loadDemoData = async () => {
    const demoClients = [
        { name: "Ejemplo 1", cedula: "0999000111", phone: "0991234567", inscriptionDate: getPastDate(5), adjudicationDate: getTodayString(), stages: { contact: getTodayString() }, clientCode: "CLI-001", city: "Guayaquil", adjudicationType: "Sorteo" },
        { name: "Ejemplo 2", cedula: "0999000222", phone: "0997654321", inscriptionDate: getPastDate(40), adjudicationDate: getPastDate(25), stages: { contact: getPastDate(24) }, clientCode: "CLI-002", city: "Quito", adjudicationType: "Oferta" }
    ];
    if (isOnlineMode && db) {
        for (const client of demoClients) await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'clients'), { ...client, createdAt: new Date().toISOString() });
    } else {
        const newClients = demoClients.map((c, i) => ({ ...c, id: `demo-${Date.now()}-${i}` }));
        setClients(prev => [...prev, ...newClients]);
    }
    alert("Datos de prueba cargados.");
  };

  const addClient = async (clientData) => {
    if(!clientData.adjudicationDate) {
        alert("Por favor ingresa la fecha de adjudicación");
        return;
    }
    try {
        if (isWeekend(parseLocalDate(clientData.adjudicationDate))) { 
            alert("La fecha de adjudicación no puede ser fin de semana."); 
            return; 
        }
        const newClient = { 
            ...clientData, 
            createdAt: new Date().toISOString(), 
            stages: {},
            attachments: {} 
        };

        if (isOnlineMode && db) {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'clients'), newClient);
        } else {
            setClients(prev => [...prev, { ...newClient, id: Date.now().toString() }]);
        }
        setView('list');
    } catch(error) {
        console.error("Error al agregar cliente:", error);
        alert("Hubo un error al guardar. Revisa los datos.");
    }
  };

  const updateClientStage = async (clientId, stageId, date) => {
    if (!date) return;
    if (isWeekend(parseLocalDate(date))) { alert("⚠️ Selecciona un día laborable."); return; }
    
    // Actualización Optimista
    if (selectedClient && selectedClient.id === clientId) {
        setSelectedClient(prev => ({ ...prev, stages: { ...prev.stages, [stageId]: date } }));
    }
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, stages: { ...c.stages, [stageId]: date } } : c));

    if (isOnlineMode && db) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'clients', clientId), { [`stages.${stageId}`]: date });
    }
  };

  const uploadAttachment = async (clientId, stageId, file) => {
      if (!file) return;
      if (file.size > 500000) {
          alert("El archivo es demasiado grande. Máximo 500KB para esta demo.");
          return;
      }
      const reader = new FileReader();
      reader.onload = async (e) => {
          const fileData = { name: file.name, type: file.type, data: e.target.result, date: new Date().toISOString() };
          
          // Actualización Optimista
          if (selectedClient && selectedClient.id === clientId) {
              setSelectedClient(prev => ({ ...prev, attachments: { ...(prev.attachments || {}), [stageId]: fileData } }));
          }
          setClients(prev => prev.map(c => c.id === clientId ? { ...c, attachments: { ...(c.attachments || {}), [stageId]: fileData } } : c));

          if (isOnlineMode && db) {
              await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'clients', clientId), { [`attachments.${stageId}`]: fileData });
          }
      };
      reader.readAsDataURL(file);
  };

  const deleteClient = async (clientId) => {
    if(!confirm("¿Estás seguro?")) return;
    
    // Actualización Optimista
    setClients(prev => prev.filter(c => c.id !== clientId));
    if (selectedClient?.id === clientId) setView('list');

    if (isOnlineMode && db) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'clients', clientId));
    }
  };

  const openEmailModal = (client) => {
      const subject = `Aprobación Documentos - ${client.name} (CI: ${client.cedula})`;
      const body = `Estimado Tairo,\n\nSe ha completado la entrega de documentos y pagos para el cliente:\n\n- Nombre: ${client.name}\n- Cédula: ${client.cedula}\n- Teléfono: ${client.phone}\n- Fecha Adj.: ${client.adjudicationDate}\n\nPor favor revisar y aprobar.\n\nNOTA: He adjuntado la imagen/comprobante a este correo.\n\nQuedo atento a su aprobación.\n\nSaludos cordiales`;
      setEmailData({ to: 'talvarado@bopelual.com', subject, body });
      setShowEmailModal(true);
  };

  const sendEmail = () => {
      if(!emailData) return;
      const gmailLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${emailData.to}&su=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}`;
      window.open(gmailLink, '_blank');
      setShowEmailModal(false);
  };

  const handleStageClick = (data) => {
    const stageClients = clients.filter(c => c.stages?.[data.id]);
    setStageModal({ id: data.id, label: data.name, clients: stageClients });
  };

  const exportToExcel = () => {
    const headers = ["Código", "Nombre", "Cédula", "Ciudad", "Teléfono", "Tipo Adj.", "F. Inscripción", "F. Adjudicación", "Estado General", ...STAGE_CONFIG.map(s => s.label)];
    let tableHTML = `<table border="1"><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>`;
    clients.forEach(c => {
       const clientStages = c.stages || {};
       const endDate = clientStages.delivery ? clientStages.delivery : getTodayString();
       const daysUsed = getWorkingDays(c.adjudicationDate, endDate);
       let status = "A Tiempo";
       if (daysUsed > MAX_SLA_DAYS) status = "Atrasado";
       else if (daysUsed > 15) status = "En Riesgo";

       const rowData = [
         c.clientCode || "", c.name || "", c.cedula || "", c.city || "", c.phone || "", c.adjudicationType || "", c.inscriptionDate || "", c.adjudicationDate || "", status,
         ...STAGE_CONFIG.map(s => clientStages[s.id] || "Pendiente")
       ];
       tableHTML += `<tr>${rowData.map(d => `<td>${d}</td>`).join('')}</tr>`;
    });
    tableHTML += `</tbody></table>`;
    const blob = new Blob([`\ufeff${tableHTML}`], { type: 'application/vnd.ms-excel' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Reporte_Clientes_${getTodayString()}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- VISTAS ---
  const DashboardView = () => {
    const totalClients = clients.length;
    const activeClients = clients.filter(c => !c.stages?.delivery).length;
    
    const deliveredClients = clients.filter(c => c.stages?.delivery);
    const totalDeliveryDays = deliveredClients.reduce((acc, c) => acc + getWorkingDays(c.adjudicationDate, c.stages.delivery), 0);
    const avgDeliveryTime = deliveredClients.length ? (totalDeliveryDays / deliveredClients.length).toFixed(1) : 0;

    const riskClients = clients.filter(c => {
      if (!c.adjudicationDate || c.stages?.delivery) return false;
      return getWorkingDays(c.adjudicationDate, getTodayString()) > 15;
    }).length;

    // Cálculo Promedio Días Usados Global
    const totalDaysUsedAll = clients.reduce((acc, client) => {
        if (!client.adjudicationDate) return acc;
        const endDate = client.stages?.delivery || getTodayString();
        const days = getWorkingDays(client.adjudicationDate, endDate);
        return acc + days;
    }, 0);
    const avgDaysUsed = totalClients > 0 ? (totalDaysUsedAll / totalClients).toFixed(1) : 0;

    const pieData = [
        { name: 'A Tiempo', value: clients.filter(c => !c.stages?.delivery && getWorkingDays(c.adjudicationDate, getTodayString()) <= 15).length, color: '#10b981' },
        { name: 'Por Vencer', value: clients.filter(c => !c.stages?.delivery && getWorkingDays(c.adjudicationDate, getTodayString()) > 15 && getWorkingDays(c.adjudicationDate, getTodayString()) <= 20).length, color: '#f59e0b' },
        { name: 'Atrasados', value: clients.filter(c => !c.stages?.delivery && getWorkingDays(c.adjudicationDate, getTodayString()) > 20).length, color: '#ef4444' }
    ].filter(d => d.value > 0);

    const chartData = STAGE_CONFIG.slice(0, 8).map(stage => ({
      id: stage.id, name: stage.label, completados: clients.filter(c => c.stages?.[stage.id]).length
    }));

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
             <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">Panel de Control {loading && <span className="text-xs font-normal text-blue-500 animate-pulse">(Cargando...)</span>}</h2>
             <button onClick={exportToExcel} className="bg-slate-800 text-white px-3 py-1.5 rounded-md text-xs flex items-center gap-2 hover:bg-slate-700 transition"><Icons.Download className="w-4 h-4"/> Descargar Excel</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 border-l-4 border-l-blue-500"><div className="text-slate-500 text-sm font-medium">Clientes Activos</div><div className="text-3xl font-bold text-slate-800">{activeClients}</div></Card>
          <Card className="p-4 border-l-4 border-l-amber-500"><div className="text-slate-500 text-sm font-medium">En Riesgo (&gt;15 días)</div><div className="text-3xl font-bold text-slate-800">{riskClients}</div></Card>
          <Card className="p-4 border-l-4 border-l-emerald-500"><div className="text-slate-500 text-sm font-medium">Vehículos Entregados</div><div className="text-3xl font-bold text-slate-800">{deliveredClients.length}</div></Card>
          <Card className="p-4 border-l-4 border-l-purple-500"><div className="text-slate-500 text-sm font-medium">Promedio Días Usados Global</div><div className="text-3xl font-bold text-slate-800">{avgDaysUsed}<span className="text-sm font-normal text-slate-400 ml-1">días / {MAX_SLA_DAYS}</span></div></Card>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-6 col-span-1 flex flex-col items-center justify-center">
                <h3 className="text-lg font-semibold mb-4 text-slate-700 w-full text-left">Estado General</h3>
                <div className="w-full h-64 relative">
                    {pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">{pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}</Pie><Tooltip /><Legend verticalAlign="bottom" /></PieChart></ResponsiveContainer>
                    ) : (<div className="absolute inset-0 flex flex-col items-center justify-center text-center"><p className="text-slate-400 text-sm mb-2">No hay datos</p><button onClick={loadDemoData} className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-full">Cargar Ejemplo</button></div>)}
                </div>
            </Card>
            <Card className="p-6 col-span-1 lg:col-span-2">
                <h3 className="text-lg font-semibold mb-4 text-slate-700">Progreso por Etapa (Click para detalle)</h3>
                <div className="space-y-3">{chartData.map((d, i) => (
                    <div key={i} className="flex items-center text-sm cursor-pointer hover:bg-slate-50 p-1 rounded" onClick={() => handleStageClick(d)}>
                    <div className="w-40 text-slate-500 truncate pr-2 text-xs font-medium uppercase" title={d.name}>{d.name}</div>
                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden relative group">
                        <div className="h-full bg-blue-500 rounded-full transition-all duration-500 relative" style={{ width: `${(d.completados / Math.max(totalClients, 1)) * 100}%` }}></div>
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white font-bold pointer-events-none">Ver Detalle</div>
                    </div>
                    <div className="w-8 text-right font-bold text-slate-700">{d.completados}</div>
                    </div>
                ))}</div>
            </Card>
        </div>
      </div>
    );
  };

  const ClientDetailView = () => {
    if (!selectedClient) return null;
    const clientStages = selectedClient.stages || {};
    const clientAttachments = selectedClient.attachments || {}; 
    const workingDaysUsed = getWorkingDays(selectedClient.adjudicationDate, clientStages.delivery ? clientStages.delivery : getTodayString());
    const daysRemaining = MAX_SLA_DAYS - workingDaysUsed;
    const progressPct = Math.min(100, Math.max(0, (workingDaysUsed / MAX_SLA_DAYS) * 100));
    let relativeBaseDate = parseLocalDate(selectedClient.adjudicationDate);

    return (
      <div className="space-y-6">
        <button onClick={() => setView('list')} className="flex items-center text-slate-500 hover:text-blue-600"><Icons.ArrowLeft className="w-4 h-4 mr-1" /> Volver a la lista</button>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start gap-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">{selectedClient.name}</h2>
                <div className="flex gap-4 text-sm text-slate-500 mt-1">
                    <span>CI: {selectedClient.cedula}</span>
                    <span>{selectedClient.city}</span>
                    <span>{selectedClient.adjudicationType}</span>
                </div>
            </div>
            <div className="flex gap-4 items-center"><div className="text-right bg-slate-50 px-4 py-2 rounded-lg border border-slate-100"><div className="text-xs text-slate-500 uppercase font-bold">Días Usados</div><div className="text-2xl font-mono font-bold text-slate-700">{workingDaysUsed}<span className="text-sm text-slate-400">/{MAX_SLA_DAYS}</span></div></div><div className={`text-right text-white px-4 py-2 rounded-lg ${daysRemaining <= 0 ? 'bg-rose-500' : daysRemaining <= 5 ? 'bg-amber-500' : 'bg-emerald-500'} shadow-sm`}><div className="text-xs opacity-90 uppercase font-bold">Días Restantes</div><div className="text-2xl font-mono font-bold">{daysRemaining}</div></div><button onClick={() => deleteClient(selectedClient.id)} className="ml-2 p-2 text-rose-500 hover:bg-rose-50 rounded-full border border-rose-200 transition" title="Eliminar"><Icons.Trash2 className="w-5 h-5" /></button></div>
          </div>
          <div className="px-6 py-4 bg-white"><div className="relative w-full bg-slate-100 rounded-full h-4 overflow-hidden"><div className={`h-full transition-all duration-500 ${daysRemaining <= 0 ? 'bg-rose-500' : daysRemaining <= 5 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${progressPct}%` }}></div></div></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Icons.Timer className="w-5 h-5 text-blue-500" /> Desglose por Etapa (v6.7)</h3>
            {STAGE_CONFIG.map((stage, index) => {
              const currentDateStr = clientStages[stage.id] || "";
              const isCompleted = !!currentDateStr;
              const targetDate = addWorkingDays(relativeBaseDate, stage.days);
              const attachment = clientAttachments[stage.id];
              
              let statusElement = <div className="text-xs text-slate-400 italic">Pendiente</div>;
              let stageDuration = 0;

              if (isCompleted) {
                  const actualDate = parseLocalDate(currentDateStr);
                  stageDuration = getWorkingDays(relativeBaseDate.toISOString().split('T')[0], currentDateStr);
                  const diffDays = Math.ceil((actualDate.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));
                  
                  statusElement = diffDays > 0 ? 
                    <span className="text-xs text-rose-600 mt-1 font-bold flex items-center gap-1 bg-rose-50 px-2 py-1 rounded border border-rose-100"><Icons.AlertCircle className="w-3 h-3"/> Retraso (+{diffDays} días)</span> :
                    <span className="text-xs text-emerald-600 mt-1 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded border border-emerald-100"><Icons.CheckCircle className="w-3 h-3"/> Dentro del tiempo</span>;
                  
                  relativeBaseDate = actualDate;
              } else {
                  relativeBaseDate = targetDate;
              }

              if (stage.id === 'contact') {
                  statusElement = isCompleted ? 
                      <span className="text-xs text-emerald-600 mt-1 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded border border-emerald-100"> <Icons.CheckCircle className="w-3 h-3"/> Registrado</span> 
                      : <div className="text-xs text-slate-400 italic">Pendiente de registro</div>;
              }

              return (
                <div key={stage.id} className={`relative flex items-center p-4 rounded-lg border transition-all ${isCompleted ? (statusElement.props && statusElement.props.className && statusElement.props.className.includes("rose") ? "border-rose-200 bg-rose-50/30" : "border-emerald-200 bg-emerald-50/30") : "border-slate-200 bg-white"}`}>
                  {index < STAGE_CONFIG.length - 1 && <div className="absolute left-8 top-12 bottom-[-16px] w-0.5 bg-slate-200 -z-10"></div>}
                  <div className="mr-4 flex-shrink-0 z-10"><div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isCompleted ? (statusElement.props && statusElement.props.className && statusElement.props.className.includes("rose") ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600") : "bg-slate-100 text-slate-400"}`}>{isCompleted ? (statusElement.props && statusElement.props.className && statusElement.props.className.includes("rose") ? <Icons.AlertCircle className="w-5 h-5"/> : <Icons.CheckCircle className="w-5 h-5"/>) : index + 1}</div></div>
                  <div className="flex-grow grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="md:col-span-4">
                        <div className="font-semibold text-slate-800 text-sm">{stage.label}</div>
                        <div className="text-xs text-slate-500">
                            {stage.days > 0 ? `Meta: ${stage.days} días` : 'Registro Inicial'}
                            {stage.days > 0 && <div className="text-[10px] text-slate-400 font-mono mt-0.5">Vence: {targetDate.toISOString().split('T')[0]}</div>}
                        </div>
                    </div>
                    <div className="md:col-span-4">
                        <input type="date" className="w-full text-sm p-1.5 rounded border border-slate-300 mb-2" value={currentDateStr} onChange={(e) => updateClientStage(selectedClient.id, stage.id, e.target.value)} />
                        {ATTACHMENT_STAGES.includes(stage.id) && (
                             <div className="flex items-center gap-2">
                                 {attachment ? (
                                     <div className="flex items-center gap-2 bg-blue-50 px-2 py-1 rounded border border-blue-100 text-xs">
                                         <Icons.FileText className="w-3 h-3 text-blue-500"/>
                                         <span className="truncate max-w-[100px] text-blue-700" title={attachment.name}>{attachment.name}</span>
                                         <a href={attachment.data} download={attachment.name} className="ml-1 text-blue-600 font-bold hover:underline">Ver</a>
                                     </div>
                                 ) : (
                                     <label className="cursor-pointer flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 border border-dashed border-slate-300 px-2 py-1 rounded hover:border-blue-400 transition">
                                         <Icons.Paperclip className="w-3 h-3"/> Adjuntar
                                         <input type="file" className="hidden" accept="image/*,application/pdf" onChange={(e) => uploadAttachment(selectedClient.id, stage.id, e.target.files[0])} />
                                     </label>
                                 )}
                             </div>
                        )}
                    </div>
                    <div className="md:col-span-4 text-right flex flex-col items-end justify-center">
                      {isCompleted && stage.days > 0 && <div className="flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded mb-1"><Icons.Clock className="w-3 h-3" /> Tomó: {stageDuration} días</div>}
                      {statusElement}
                      {stage.id === 'docs' && isCompleted && <button onClick={() => openEmailModal(selectedClient)} className="mt-2 text-xs flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition font-medium border border-blue-200"><Icons.Mail className="w-3 h-3"/> Notificar a Gerencia</button>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const ClientListView = () => {
    const filteredClients = clients.filter(c => {
       if (!searchTerm) return true;
       const term = searchTerm.toLowerCase();
       return (
          (String(c.name || '').toLowerCase().includes(term)) ||
          (String(c.cedula || '').includes(term)) ||
          (String(c.clientCode || '').toLowerCase().includes(term)) ||
          (String(c.city || '').toLowerCase().includes(term)) ||
          (String(c.phone || '').includes(term))
       );
    });

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-slate-800">Listado de Clientes</h2>
            <div className="flex gap-2">
                <button onClick={exportToExcel} className="bg-slate-800 text-white px-3 py-2 rounded-lg text-sm hover:bg-slate-700 flex items-center gap-2 transition"><Icons.Download className="w-4 h-4"/> Descargar Excel</button>
                <button onClick={() => setView('form')} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2"><Icons.Plus className="w-4 h-4" /> Nuevo</button>
            </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-xs border-b border-slate-200"><tr><th className="px-6 py-4">Cliente</th><th className="px-6 py-4">F. Adjudicación</th><th className="px-6 py-4">SLA</th><th className="px-6 py-4">Estado</th><th className="px-6 py-4 text-right">Acción</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClients.length === 0 && <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-400">No se encontraron clientes.</td></tr>}
                {filteredClients.map(client => {
                  const endDate = client.stages?.delivery || new Date().toISOString().split('T')[0];
                  const daysUsed = getWorkingDays(client.adjudicationDate, endDate);
                  const daysLeft = MAX_SLA_DAYS - daysUsed;
                  return (
                    <tr key={client.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4">
                          <div className="font-medium text-slate-800">{client.name}</div>
                          <div className="text-xs text-slate-400">{client.cedula}</div>
                          <div className="text-xs text-slate-400">{client.city} - {client.adjudicationType}</div>
                      </td>
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
  };

  const NewClientForm = () => {
    const [formData, setFormData] = useState({ 
        name: '', cedula: '', phone: '', inscriptionDate: '', adjudicationDate: '',
        clientCode: '', city: '', adjudicationType: 'Sorteo'
    });

    const handleSubmit = (e) => { 
        e.preventDefault(); 
        if (!formData.adjudicationDate) { alert("Por favor, ingresa la Fecha de Adjudicación."); return; }
        if (isWeekend(parseLocalDate(formData.adjudicationDate))) { alert("La Fecha de Adjudicación no puede ser Sábado ni Domingo."); return; }
        addClient(formData); 
    };
    return (
      <div className="max-w-2xl mx-auto">
        <button type="button" onClick={() => setView('dashboard')} className="flex items-center text-slate-500 mb-4 hover:text-blue-600"><Icons.ArrowLeft className="w-4 h-4 mr-1" /> Volver</button>
        <Card className="p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Icons.Plus className="w-6 h-6 text-blue-500" /> Nuevo Cliente</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label><input required type="text" className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Cédula</label><input required type="text" className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={formData.cedula} onChange={e => setFormData({...formData, cedula: e.target.value})} /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label><input required type="tel" className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Código Cliente</label><input required type="text" className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={formData.clientCode} onChange={e => setFormData({...formData, clientCode: e.target.value})} /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Ciudad</label><input required type="text" className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} /></div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Adjudicación</label>
                <select className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white" value={formData.adjudicationType} onChange={e => setFormData({...formData, adjudicationType: e.target.value})}>
                  <option value="Sorteo">Sorteo</option>
                  <option value="Oferta">Oferta</option>
                </select>
              </div>
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
    <div className="min-h-screen bg-slate-50 font-sans text-slate-600 flex relative">
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3 font-bold text-lg"><img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-full bg-white p-0.5" /><span>Workflow Auto Club</span></div>
          <div className="mt-2 text-xs font-mono text-slate-500 text-center border border-slate-700 rounded p-1">v6.7 (Activación Forzada)</div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button type="button" onClick={() => setView('form')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${view === 'form' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <Icons.Plus className="w-5 h-5" /> 
            <span className="font-medium">Nuevo Ingreso</span>
          </button>
          <div className="px-4 pt-4 pb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Clientes</div>
          <button type="button" onClick={() => setView('list')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${view === 'list' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <Icons.Users className="w-5 h-5" /> 
            <span>Listado clientes</span>
          </button>
           <div className="my-2 border-t border-slate-800 mx-4"></div>
          <button type="button" onClick={() => setView('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${view === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
            <Icons.PieChart className="w-5 h-5" /> 
            <span>Dashboard</span>
          </button>
        </nav>
        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 flex items-center gap-2">
            {isOnlineMode ? <><Icons.Cloud className="w-3 h-3 text-emerald-400"/> Conectado (Nube)</> : <><Icons.WifiOff className="w-3 h-3 text-amber-400"/> Modo Local</>}
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto h-screen flex flex-col">
        {/* GLOBAL TOP BAR WITH SEARCH */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center flex-1 max-w-xl gap-4">
              <div className="font-bold text-slate-800 md:hidden">Workflow Auto Club</div>
              <div className="relative flex-1 hidden md:block">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Icons.Search className="h-5 w-5 text-slate-400" />
                  </div>
                  <input 
                      type="text" 
                      className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition" 
                      placeholder="Buscar cliente (nombre, cédula, código...)" 
                      value={searchTerm}
                      onChange={(e) => { 
                          setSearchTerm(e.target.value);
                          if(e.target.value && view !== 'list') setView('list');
                      }}
                  />
              </div>
              <button 
                  className="hidden md:flex bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition items-center gap-2"
                  onClick={() => setView('list')}
              >
                  <Icons.Search className="w-4 h-4" /> Buscar
              </button>
          </div>
          <div className="flex items-center gap-3">
             <div className="text-sm text-slate-500 text-right hidden md:block">
                 <div className="font-bold text-slate-700">{user?.displayName || "Usuario"}</div>
                 <div className="text-xs">{user?.email || "Invitado"}</div>
             </div>
             <button className="text-slate-500 md:hidden"><Icons.Users className="w-5 h-5" /></button>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
          {view === 'dashboard' && <DashboardView />}
          {view === 'list' && <ClientListView />}
          {view === 'form' && <NewClientForm />}
          {view === 'detail' && <ClientDetailView />}
        </div>
      </main>
      
      {showEmailModal && emailData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center"><h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Icons.Mail className="w-5 h-5 text-blue-500"/> Vista Previa del Correo</h3><button onClick={() => setShowEmailModal(false)} className="text-slate-400 hover:text-slate-600"><Icons.X className="w-5 h-5"/></button></div>
            <div className="p-6 space-y-4">
              <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Para:</label><div className="bg-slate-50 border border-slate-200 rounded p-2 text-sm text-slate-700">{emailData.to}</div></div>
              <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Asunto:</label><div className="bg-slate-50 border border-slate-200 rounded p-2 text-sm text-slate-700 font-medium">{emailData.subject}</div></div>
              <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mensaje:</label><div className="bg-slate-50 border border-slate-200 rounded p-3 text-sm text-slate-600 whitespace-pre-line h-40 overflow-y-auto">{emailData.body}</div></div>
              <div className="bg-amber-50 border border-amber-100 rounded p-3 text-xs text-amber-700 flex gap-2 items-start"><Icons.AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5"/><span>Recuerda adjuntar manualmente la imagen o comprobante antes de enviar el correo desde tu aplicación de email.</span></div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3"><button onClick={() => setShowEmailModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition">Cancelar</button><button onClick={sendEmail} className="px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition flex items-center gap-2">Abrir en Gmail y Enviar <Icons.ChevronRight className="w-4 h-4"/></button></div>
          </div>
        </div>
      )}
      {stageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fade-in max-h-[80vh] flex flex-col">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center"><h3 className="font-bold text-lg text-slate-800">Clientes en etapa: {stageModal.label}</h3><button onClick={() => setStageModal(null)} className="text-slate-400 hover:text-slate-600"><Icons.X className="w-5 h-5"/></button></div>
                <div className="p-6 overflow-y-auto flex-1">
                    {stageModal.clients.length === 0 ? (<p className="text-slate-400 text-center py-8">No hay clientes en esta etapa.</p>) : (
                        <table className="w-full text-left text-sm text-slate-600"><thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-xs border-b border-slate-200"><tr><th className="px-4 py-2">Cliente</th><th className="px-4 py-2">Cédula</th><th className="px-4 py-2">Fecha Etapa</th><th className="px-4 py-2 text-right">Acción</th></tr></thead><tbody className="divide-y divide-slate-100">{stageModal.clients.map(client => (<tr key={client.id} className="hover:bg-slate-50"><td className="px-4 py-3 font-medium text-slate-800">{client.name}</td><td className="px-4 py-3">{client.cedula}</td><td className="px-4 py-3">{client.stages[stageModal.id]}</td><td className="px-4 py-3 text-right"><button onClick={() => { setSelectedClient(client); setView('detail'); setStageModal(null); }} className="text-blue-600 hover:text-blue-800 font-medium text-xs border border-blue-200 px-2 py-1 rounded hover:bg-blue-50">Ver Detalle</button></td></tr>))}</tbody></table>
                    )}
                </div>
                <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 text-right"><button onClick={() => setStageModal(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition">Cerrar</button></div>
            </div>
        </div>
      )}
    </div>
  );
}