import React, { useState } from 'react';
import { 
  LogOut, 
  QrCode, 
  PlusCircle, 
  User, 
  History, 
  Sparkles, 
  Check, 
  DollarSign, 
  Users, 
  Video, 
  Ticket,
  Clock,
  Search,
  Award,
  Coffee,
  Gift,
  Settings,
  Lock
} from 'lucide-react';
import { User as UserType, Transaction, RewardItem, QRVoucher } from '../types';

interface StaffDashboardProps {
  staffUser: UserType;
  registeredUsers: UserType[];
  transactions: Transaction[];
  vouchers: QRVoucher[];
  onOpenScanner: () => void;
  onAddPoints: (userQrCode: string, points: number, description: string) => void;
  onGenerateVoucher: (points: number, description: string) => void;
  onLogout: () => void;
  onResetClientStamps?: (userQrCode: string) => void;
  stampSymbol: string;
  brandBrown: string;
  brandGold: string;
  brandBg: string;
  settingsPin: string;
  logoUrl: string;
  logoHeight: number;
  onUpdateSettings: (stamp: string, brown: string, gold: string, bg: string, newPin: string, logoUrl: string, logoHeight: number) => void;
}

export default function StaffDashboard({
  staffUser,
  registeredUsers,
  transactions,
  vouchers,
  onOpenScanner,
  onAddPoints,
  onGenerateVoucher,
  onLogout,
  onResetClientStamps,
  stampSymbol,
  brandBrown,
  brandGold,
  brandBg,
  settingsPin,
  logoUrl,
  logoHeight,
  onUpdateSettings,
}: StaffDashboardProps) {
  // Tabs: 'control' (point administration) and 'users' (manage customers list)
  const [activeTab, setActiveTab] = useState<'control' | 'users'>('control');
  
  // Settings & Security PIN States
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [tempStamp, setTempStamp] = useState<string>(stampSymbol);
  const [tempBrown, setTempBrown] = useState<string>(brandBrown);
  const [tempGold, setTempGold] = useState<string>(brandGold);
  const [tempBg, setTempBg] = useState<string>(brandBg);
  const [tempPin, setTempPin] = useState<string>(settingsPin);
  const [tempLogoUrl, setTempLogoUrl] = useState<string>(logoUrl);
  const [tempLogoHeight, setTempLogoHeight] = useState<number>(logoHeight);

  const THEME_PRESETS = [
    { name: 'Original Buttery (Café & Oro)', brown: '#2D241E', gold: '#C5A059', bg: '#FAF7F2' },
    { name: 'Matcha Forest (Verde & Oliva)', brown: '#142E25', gold: '#7A8C40', bg: '#F2F6F3' },
    { name: 'Cereza Intensa (Burgundy & Oro Rosa)', brown: '#3E1929', gold: '#D0887A', bg: '#FAF2F4' },
    { name: 'Lavanda & Indigo (Suave)', brown: '#1C2541', gold: '#8D99AE', bg: '#F1F3F9' },
    { name: 'Midnight Charcoal (Elegante)', brown: '#121212', gold: '#B08E5F', bg: '#F5F5F5' },
  ];

  const STAMP_PRESETS = [
    { char: '🥐', name: 'Croissant' },
    { char: '☕', name: 'Café' },
    { char: '🍪', name: 'Galleta' },
    { char: '🍩', name: 'Dona' },
    { char: '🥯', name: 'Bagel' },
    { char: '⭐', name: 'Estrella' },
    { char: '🧁', name: 'Cupcake' },
  ];

  const handlePinKeypadPress = (val: string) => {
    if (enteredPin.length >= 4) return;
    const nextPin = enteredPin + val;
    setEnteredPin(nextPin);
    setPinError(null);
    
    if (nextPin.length === 4) {
      if (nextPin === settingsPin) {
        setIsPinModalOpen(false);
        setEnteredPin('');
        setIsSettingsOpen(true);
        // Sync values to existing state on open
        setTempStamp(stampSymbol);
        setTempBrown(brandBrown);
        setTempGold(brandGold);
        setTempBg(brandBg);
        setTempPin(settingsPin);
        setTempLogoUrl(logoUrl);
        setTempLogoHeight(logoHeight);
      } else {
        setTimeout(() => {
          setPinError('PIN Incorrecto. Reintente.');
          setEnteredPin('');
        }, 200);
      }
    }
  };

  const handlePinKeypadBackspace = () => {
    setEnteredPin(prev => prev.slice(0, -1));
    setPinError(null);
  };
  
  // CRM tracking states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedHistoryClientId, setSelectedHistoryClientId] = useState<string | null>(null);
  const [crmFilter, setCrmFilter] = useState<'all' | 'near' | 'ready'>('all');
  const [selectedCustomerPageId, setSelectedCustomerPageId] = useState<string | null>(null);

  // Points administration state
  const [selectedUserQr, setSelectedUserQr] = useState<string>('');
  const [purchaseAmount, setPurchaseAmount] = useState<string>('');
  const [pointsToAward, setPointsToAward] = useState<string>('1'); // Default manual award is 1 stamp!
  const [customDescription, setCustomDescription] = useState<string>('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Calculate points/stamps if needed (not active in modern stamp mode, but kept safe)
  const handleAmountChange = (val: string) => {
    setPurchaseAmount(val);
  };

  const handleAwardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserQr) {
      setFeedbackMsg({ text: "Por favor selecciona o escanea un cliente.", isError: true });
      return;
    }
    const points = Number(pointsToAward);
    if (isNaN(points) || points <= 0) {
      setFeedbackMsg({ text: "Por favor introduce una cantidad de sellos válida.", isError: true });
      return;
    }

    const desc = customDescription.trim() || `Sello de visita por consumo`;
    
    onAddPoints(selectedUserQr, points, desc);
    
    // Reset form & show toast
    const matchedClient = registeredUsers.find(u => u.qrCode === selectedUserQr);
    setFeedbackMsg({ 
      text: `¡Éxito! Sumaste ${points} ${points === 1 ? 'sello' : 'sellos'} a la cuenta de ${matchedClient?.name || selectedUserQr}.`, 
      isError: false 
    });
    
    setSelectedUserQr('');
    setPurchaseAmount('');
    setPointsToAward('1'); // reset to default 1 stamp
    setCustomDescription('');

    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Only get transactions processed in the latest feeds or globally
  const staffTransactions = [...transactions].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Filter out staff roles from customer directory
  const clientUsers = registeredUsers.filter((u) => u.role === 'client');

  const activeClientPage = selectedCustomerPageId 
    ? registeredUsers.find((u) => u.id === selectedCustomerPageId) 
    : null;

  if (activeClientPage) {
    const userTxs = transactions.filter(t => t.userId === activeClientPage.id);
    const stamps = Math.min(10, Math.max(0, activeClientPage.points));
    const isCompleted = stamps === 10;
    const init = activeClientPage.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const sortedTxs = [...userTxs].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const lastVisitTx = sortedTxs.find(tx => tx.type === 'earn');
    const lastVisitDate = lastVisitTx 
      ? new Date(lastVisitTx.timestamp).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : 'Sin visitas registradas';
    const rewardsCashedCount = userTxs.filter(t => t.type === 'redeem').length;
    const registeredSince = activeClientPage.createdAt 
      ? new Date(activeClientPage.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
      : 'No disponible';
    const nameParts = activeClientPage.name.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || 'No especificado';

    return (
      <div className="flex-1 flex flex-col h-full bg-brand-bg text-brand-brown pb-10">
        {/* Navigation & Header */}
        <div className="bg-brand-bg/95 backdrop-blur-md border-b border-brand-brown/5 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <button
            id="detail-back-button"
            onClick={() => setSelectedCustomerPageId(null)}
            className="flex items-center gap-2 font-sans text-[9px] font-bold uppercase tracking-widest text-brand-brown hover:text-brand-gold cursor-pointer transition-all bg-white hover:bg-stone-55 px-3 py-2 rounded-xl border border-brand-brown/5 shadow-3xs"
          >
            ← Volver a Socios
          </button>
          <div className="text-right">
            <p className="font-sans text-[8px] uppercase tracking-[0.2em] text-brand-gold font-bold">Expediente Socio</p>
            <h2 className="font-serif italic font-semibold text-brand-brown text-sm mt-px">Detalles de Visitas</h2>
          </div>
        </div>

        <div className="px-6 mt-6 space-y-6 overflow-y-auto max-h-[calc(100vh-140px)] scrollbar-none">
          {/* Main Visual Header Card of the user */}
          <div className="p-6 bg-white rounded-3xl border border-brand-brown/5 shadow-3xs space-y-4">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center font-serif text-xl font-bold border shrink-0 shadow-3xs ${
                isCompleted ? 'bg-brand-gold text-white' : 'bg-[#EADED2]/50 text-brand-brown border-brand-brown/10'
              }`}>
                {init}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
                  <h3 className="font-serif text-xl font-bold text-brand-brown truncate">{activeClientPage.name}</h3>
                  {isCompleted ? (
                    <span className="inline-flex self-center sm:self-start text-[8px] font-sans font-extrabold uppercase tracking-widest text-[#FAF7F2] bg-brand-gold px-2.5 py-1 rounded-full shrink-0 items-center justify-center gap-0.5 animate-pulse">
                      ⭐ LISTO PARA CORTESÍA
                    </span>
                  ) : (
                    <span className="inline-flex self-center sm:self-start text-[8px] font-sans font-extrabold uppercase tracking-widest text-[#2D241E]/60 bg-[#EADED2]/30 border border-brand-brown/5 px-2.5 py-1 rounded-full shrink-0">
                      ACUMULANDO VISITAS
                    </span>
                  )}
                </div>
                <p className="font-sans text-xs text-stone-400 block truncate leading-tight">{activeClientPage.email}</p>
                <div className="pt-1 flex flex-wrap gap-2 justify-center sm:justify-start">
                  <span className="font-mono text-[9px] text-[#2D241E]/60 bg-[#EADED2]/20 px-2 py-0.5 rounded-md border border-[#2D241E]/5">
                    Membresía: {activeClientPage.qrCode}
                  </span>
                  <span className="font-mono text-[9px] text-[#C5A059] bg-[#EADED2]/20 px-2 py-0.5 rounded-md border border-brand-gold/10">
                    Registro: {registeredSince}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left side: Croquis & Actions */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Croquis de Planilla */}
              <div className="bg-white p-5 rounded-3xl border border-[#2D241E]/10 shadow-3xs space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-[#2D241E]/5">
                  <span className="block text-[9px] font-sans font-extrabold uppercase tracking-widest text-[#C5A059]">
                    Planilla de Visitas
                  </span>
                  <span className="font-serif italic font-bold text-brand-gold text-sm leading-none">
                    {stamps} / 10 sellos
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: 10 }).map((_, idx) => {
                    const sNum = idx + 1;
                    const isStamped = stamps >= sNum;
                    return (
                      <div
                        key={idx}
                        className={`h-11 rounded-xl flex items-center justify-center text-lg transition-all ${
                          isStamped 
                            ? 'bg-[#EADED2]/30 border border-brand-gold scale-102 font-bold animate-fadeIn' 
                            : 'border border-dashed border-stone-200 text-[#2D241E]/20 bg-brand-bg/40 text-xs font-bold'
                        }`}
                      >
                        {isStamped ? (
                          stampSymbol && (stampSymbol.startsWith('data:image/') || stampSymbol.startsWith('http')) ? (
                            <img src={stampSymbol} alt="Sello" className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
                          ) : (
                            stampSymbol
                          )
                        ) : sNum}
                      </div>
                    );
                  })}
                </div>

                <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden border border-black/5 mt-1">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${isCompleted ? 'bg-brand-gold' : 'bg-[#C5A059]'}`}
                    style={{ width: `${stamps * 10}%` }}
                  ></div>
                </div>
              </div>

              {/* CRM Actions card on details page */}
              <div className="bg-white p-5 rounded-3xl border border-[#2D241E]/10 shadow-3xs space-y-4">
                <span className="block text-[9px] font-sans font-extrabold uppercase tracking-widest text-brand-brown pb-1.5 border-b border-brand-brown/5">
                  Acciones Administrativas
                </span>

                <div className="space-y-3">
                  <button
                    id="add-stamp-detail-page-btn"
                    disabled={isCompleted}
                    onClick={() => {
                      onAddPoints(activeClientPage.qrCode, 1, 'Sello de visita registrado desde Expediente');
                    }}
                    className={`w-full py-3.5 rounded-xl font-sans text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      isCompleted 
                        ? 'bg-brand-bg border border-brand-brown/5 text-stone-300 cursor-not-allowed border'
                        : 'bg-brand-brown hover:bg-brand-gold text-white hover:shadow-xs'
                    }`}
                  >
                    {stampSymbol && (stampSymbol.startsWith('data:image/') || stampSymbol.startsWith('http')) ? (
                      <img src={stampSymbol} alt="Stamp" className="w-5 h-5 object-contain inline" referrerPolicy="no-referrer" />
                    ) : (
                      <span>{stampSymbol}</span>
                    )}
                    <span>+ 1 Registrar Visita (Sello)</span>
                  </button>

                  {isCompleted && onResetClientStamps && (
                    <button
                      id="reset-detail-page-btn"
                      onClick={() => {
                        onResetClientStamps(activeClientPage.qrCode);
                      }}
                      className="w-full py-3.5 bg-brand-gold hover:bg-[#B38C46] text-white border border-brand-gold rounded-xl font-sans text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 animate-pulse shadow-sm"
                      title="Entrega cortesía y reinicia su tarjeta a 10 visitas."
                    >
                      <span>🎁 Canjear Cortesía & Renovar Planilla</span>
                    </button>
                  )}
                </div>
              </div>

            </div>

            {/* Right side: Summary info and Operational Histories */}
            <div className="lg:col-span-12 xl:col-span-7 space-y-6">
              
              {/* Detailed profile specs */}
              <div className="bg-white p-5 rounded-3xl border border-[#2D241E]/10 shadow-3xs space-y-4">
                <span className="block text-[9px] font-sans font-extrabold uppercase tracking-widest text-[#C5A059] pb-1.5 border-b border-[#2D241E]/5">
                  Resumen de Cuenta
                </span>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#2D241E]/5">
                    <span className="block text-[8px] font-sans font-bold text-stone-400 uppercase tracking-widest mb-1">Nombre</span>
                    <span className="font-serif font-bold text-brand-brown text-sm">{firstName}</span>
                  </div>
                  <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#2D241E]/5">
                    <span className="block text-[8px] font-sans font-bold text-stone-400 uppercase tracking-widest mb-1">Apellido(s)</span>
                    <span className="font-serif font-bold text-brand-brown text-sm">{lastName}</span>
                  </div>
                  <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#2D241E]/5">
                    <span className="block text-[8px] font-sans font-bold text-stone-400 uppercase tracking-widest mb-1">Cortesías Canjeadas</span>
                    <span className="font-sans font-bold text-brand-brown text-sm">{rewardsCashedCount} Canje(s)</span>
                  </div>
                  <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#2D241E]/5">
                    <span className="block text-[8px] font-sans font-bold text-stone-400 uppercase tracking-widest mb-1">Última Visita</span>
                    <span className="font-sans text-stone-600 font-bold block truncate text-xs">{lastVisitDate}</span>
                  </div>
                </div>
              </div>

              {/* Transactions logs table */}
              <div className="bg-white p-5 rounded-3xl border border-[#2D241E]/10 shadow-3xs space-y-4">
                <span className="block text-[9px] font-sans font-extrabold uppercase tracking-widest text-stone-450 pb-1.5 border-b border-[#2D241E]/5">
                  Historial Completo de Operaciones
                </span>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {userTxs.length === 0 ? (
                    <p className="font-serif italic text-stone-450 text-xs text-center py-8">
                      No hay transacciones registradas aún para este socio.
                    </p>
                  ) : (
                    userTxs.map((tx) => (
                      <div key={tx.id} className="p-3 bg-[#FAF7F2]/60 border border-[#2D241E]/5 rounded-xl flex justify-between items-center text-xs">
                        <div className="space-y-1 pr-2 min-w-0 text-left">
                          <span className="font-serif italic text-brand-brown block truncate leading-snug font-semibold">
                            {tx.description}
                          </span>
                          <span className="block text-[8px] text-stone-400 font-mono">
                            {new Date(tx.timestamp).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} · Por: {tx.staffName || 'Staff'}
                          </span>
                        </div>
                        <span className={`font-sans font-extrabold shrink-0 text-xs ${tx.type === 'earn' ? 'text-[#C5A059] bg-[#EADED2]/30 px-2 py-1 rounded-lg border border-brand-gold/15' : 'text-stone-500 bg-stone-100 px-2 py-1 rounded-lg'}`}>
                          {tx.type === 'earn' ? '+' : '-'}{tx.points} {tx.points === 1 ? 'sello' : 'sellos'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-brand-bg text-brand-brown pb-10">
      
      {/* Header section */}
      <div className="bg-brand-bg/95 backdrop-blur-md border-b border-brand-brown/5 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand-brown flex items-center justify-center text-white border border-brand-gold/15">
            <span className="font-serif italic text-brand-gold font-bold text-sm">S</span>
          </div>
          <div>
            <p className="font-sans text-[8px] uppercase tracking-[0.2em] text-brand-gold font-bold">Consola Staff</p>
            <h2 className="font-serif italic font-semibold text-brand-brown text-base mt-px">{staffUser.name}</h2>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            id="staff-settings-btn"
            onClick={() => {
              setIsPinModalOpen(true);
              setEnteredPin('');
              setPinError(null);
            }}
            className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-stone-100 text-stone-400 hover:text-brand-brown transition-all cursor-pointer"
            title="Configuración"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            id="staff-logout-btn"
            onClick={onLogout}
            className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-stone-100 text-stone-400 hover:text-brand-brown transition-all cursor-pointer"
            title="Cerrar Sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation for staff */}
      <div className="mx-6 mt-6">
        <div className="bg-[#F4F1EC] p-1 rounded-full flex border border-stone-200/40">
          <button
            id="staff-tab-control-btn"
            onClick={() => setActiveTab('control')}
            className={`flex-1 py-2.5 font-sans text-[9px] font-bold uppercase tracking-widest rounded-full cursor-pointer transition-all ${
              activeTab === 'control' 
                ? 'bg-white text-brand-brown shadow-2xs border border-brand-brown/5' 
                : 'text-stone-400 hover:text-[#1C1A17]'
            }`}
          >
            Puntos / Barra
          </button>
          <button
            id="staff-tab-users-btn"
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-2.5 font-sans text-[9px] font-bold uppercase tracking-widest rounded-full cursor-pointer transition-all ${
              activeTab === 'users' 
                ? 'bg-white text-brand-brown shadow-2xs border border-brand-brown/5' 
                : 'text-stone-400 hover:text-[#1C1A17]'
            }`}
          >
            Socios ({clientUsers.length})
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className={`mx-6 mt-4 p-4 rounded-xl text-brand-brown flex items-start gap-2.5 animate-fadeIn border ${
          feedbackMsg.isError 
            ? 'bg-rose-50 border-rose-200' 
            : 'bg-white border-brand-gold/30'
        }`}>
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white flex-shrink-0 mt-0.5 ${
            feedbackMsg.isError ? 'bg-rose-500' : 'bg-brand-gold'
          }`}>
            {feedbackMsg.isError ? (
              <span className="text-[11px] font-sans font-extrabold leading-none">!</span>
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
          </div>
          <p className="font-serif italic text-xs leading-relaxed">{feedbackMsg.text}</p>
        </div>
      )}

      {/* Tabs panels */}
      <div className="px-6 mt-6 flex-1 flex flex-col">
        {activeTab === 'control' && (
          <div className="flex-1 flex flex-col space-y-6">
            
            {/* Primary trigger: Live QR scan with Camera */}
            <div className="p-6 bg-white rounded-3xl border border-brand-brown/5 text-center space-y-4 shadow-3xs">
              <div className="w-12 h-12 bg-brand-gold text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                <QrCode className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif text-lg font-medium text-brand-brown">Escanear Membresía</h3>
                <p className="font-sans text-[11px] text-stone-500 leading-relaxed max-w-xs mx-auto">
                  Escanea el código QR de socio desde la pantalla del comensal para sumarle puntos instantáneamente.
                </p>
              </div>
              <button
                id="staff-open-scanner-btn"
                onClick={onOpenScanner}
                className="w-full bg-brand-brown hover:bg-brand-gold text-[#FAF7F2] font-sans text-[10px] font-bold uppercase tracking-widest py-3.5 px-4 rounded-xl cursor-pointer transition-colors shadow-sm flex items-center justify-center gap-2 max-w-xs mx-auto text-center"
              >
                <Video className="w-4 h-4 text-brand-gold" />
                Escanear Celular de Socio
              </button>
            </div>

          </div>
        )}

        {activeTab === 'users' && (
          <div className="flex-1 flex flex-col space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="font-serif text-base font-semibold text-brand-brown flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-gold" />
                CRM DE SOCIOS DE LEALTAD
              </h3>
            </div>

            {/* Premium Dual-filter Search Bar controls */}
            <div className="flex flex-col md:flex-row md:items-center gap-3 bg-white p-4 rounded-2xl border border-[#2D241E]/10 shadow-3xs">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar socio por nombre, correo o membresía..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#FAF7F2] rounded-xl pl-9 pr-4 py-2 border-none text-xs text-brand-brown outline-hidden placeholder:text-stone-400 focus:ring-1 focus:ring-brand-gold/40"
                />
              </div>
              
              <div className="flex gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                {(['all', 'near', 'ready'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setCrmFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg font-sans text-[8px] font-bold uppercase tracking-wider cursor-pointer border transition-all ${
                      crmFilter === filter
                        ? 'bg-brand-brown text-[#FAF7F2] border-brand-brown'
                        : 'bg-white text-stone-400 border-stone-200 hover:border-stone-450'
                    }`}
                  >
                    {filter === 'all' ? 'Todos' : filter === 'near' ? 'Cerca (7+)' : 'Listos (10)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Mini CRM Stats Section */}
            <div className="grid grid-cols-3 gap-2 bg-gradient-to-br from-[#FAF7F2] to-[#EADED2]/30 p-3.5 rounded-2xl border border-brand-gold/15 shadow-3xs">
              <div className="text-center space-y-0.5">
                <span className="block font-sans text-[8px] uppercase tracking-wider text-stone-400 font-bold">Socios Activos</span>
                <span className="block font-serif italic text-base font-bold text-brand-brown">{clientUsers.length}</span>
              </div>
              <div className="text-center space-y-0.5 border-x border-[#2D241E]/10">
                <span className="block font-sans text-[8px] uppercase tracking-wider text-[#C5A059] font-bold">Acumulando</span>
                <span className="block font-serif italic text-base font-bold text-brand-brown">
                  {clientUsers.filter(u => u.points > 0 && u.points < 10).length}
                </span>
              </div>
              <div className="text-center space-y-0.5">
                <span className="block font-sans text-[8px] uppercase tracking-wider text-rose-500 font-bold">Por Premiar</span>
                <span className="block font-serif italic text-base font-bold text-brand-brown flex items-center justify-center gap-1">
                  {clientUsers.filter(u => u.points === 10).length}
                  {clientUsers.some(u => u.points === 10) && <span className="inline-block animate-bounce text-xs">🎁</span>}
                </span>
              </div>
            </div>

            {/* List of matched clients with complete stamp sheet dashboards */}
            {(() => {
              const matchedClients = clientUsers.filter((client) => {
                const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                     client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                     client.qrCode.toLowerCase().includes(searchQuery.toLowerCase());
                
                if (!matchesSearch) return false;
                if (crmFilter === 'near') return client.points >= 7 && client.points < 10;
                if (crmFilter === 'ready') return client.points === 10;
                return true;
              });

              if (matchedClients.length === 0) {
                return (
                  <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-stone-200">
                    <p className="font-serif italic text-stone-400 text-xs">No se encontraron socios con los criterios de búsqueda.</p>
                  </div>
                );
              }

              return (
                <div className="bg-white rounded-2xl border border-[#2D241E]/10 overflow-hidden shadow-3xs pb-2">
                  {/* Table Header block on larger screens */}
                  <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-3 bg-[#FAF7F2] border-b border-[#2D241E]/5 text-[8px] font-sans font-bold uppercase tracking-widest text-[#2D241E]/50">
                    <div className="col-span-4">Socio / Correo</div>
                    <div className="col-span-2">Código QR</div>
                    <div className="col-span-3">Progreso de Planilla</div>
                    <div className="col-span-3 text-right">Acciones Rápidas</div>
                  </div>

                  <div className="divide-y divide-[#2D241E]/5">
                    {matchedClients.map((client) => {
                      const userTxs = transactions.filter(t => t.userId === client.id);
                      const stamps = Math.min(10, Math.max(0, client.points));
                      const isCompleted = stamps === 10;
                      const init = client.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

                      return (
                        <div key={client.id} className={`transition-all hover:bg-[#FAF7F2]/30 ${isCompleted ? 'bg-[#FAF7F2]/45' : ''}`}>
                          {/* Main Interactive Row */}
                          <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-center">
                            
                            {/* Col 1: Avatar, Name, Email */}
                            <div className="col-span-1 sm:col-span-4 flex items-center gap-3">
                              <button
                                id={`client-avatar-btn-${client.id}`}
                                onClick={() => setSelectedCustomerPageId(client.id)}
                                className={`w-9 h-9 rounded-full flex items-center justify-center font-serif text-[11px] font-bold shrink-0 shadow-3xs transition-all hover:scale-105 hover:bg-brand-gold hover:text-white cursor-pointer ${
                                  isCompleted ? 'bg-brand-gold text-white' : 'bg-[#EADED2]/50 text-brand-brown border border-brand-brown/10'
                                }`}
                                title="Ver expediente del socio"
                              >
                                {init}
                              </button>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <button
                                    id={`client-name-btn-${client.id}`}
                                    onClick={() => setSelectedCustomerPageId(client.id)}
                                    className="font-serif text-xs font-bold text-brand-brown hover:text-brand-gold hover:underline truncate text-left cursor-pointer transition-colors"
                                    title="Ver expediente del socio"
                                  >
                                    {client.name}
                                  </button>
                                  {isCompleted && (
                                    <span className="text-[7px] font-sans font-extrabold uppercase tracking-widest text-[#FAF7F2] bg-brand-gold px-1.5 py-0.5 rounded-full shrink-0 flex items-center gap-0.5 animate-pulse">
                                      ⭐ LISTO
                                    </span>
                                  )}
                                </div>
                                <span className="font-sans text-[10px] text-stone-400 block truncate leading-tight">{client.email}</span>
                              </div>
                            </div>

                            {/* Col 2: Code badge */}
                            <div className="col-span-1 sm:col-span-2 flex items-center">
                              <span className="font-mono text-[9px] text-[#2D241E]/60 bg-[#EADED2]/20 px-2 py-1 rounded-md border border-[#2D241E]/5 truncate">
                                {client.qrCode}
                              </span>
                            </div>

                            {/* Col 3: Points/Stamps Progress indicators */}
                            <div className="col-span-1 sm:col-span-3">
                              <div className="flex items-center justify-between sm:justify-start sm:gap-3">
                                <span className="font-serif italic font-bold text-brand-gold text-xs leading-none">
                                  {stamps} / 10 sellos
                                </span>
                                {/* Miniature progress bar */}
                                <div className="w-24 h-1.5 bg-stone-100 rounded-full overflow-hidden border border-black/5 hidden md:block">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-300 ${isCompleted ? 'bg-brand-gold' : 'bg-[#C5A059]'}`}
                                    style={{ width: `${stamps * 10}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>

                            {/* Col 4: Buttons / Accordion toggle */}
                            <div className="col-span-1 sm:col-span-3 flex items-center justify-between sm:justify-end gap-2.5">
                              {/* Stamps Buttons row */}
                              <div className="flex items-center gap-1.5">
                                <button
                                  id={`quick-crm-stamp-${client.id}`}
                                  disabled={isCompleted}
                                  onClick={() => {
                                    onAddPoints(client.qrCode, 1, 'Sello de visita por escaneo rápido en CRM');
                                  }}
                                  className={`px-3 py-1.5 rounded-lg font-sans text-[8px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                                    isCompleted 
                                      ? 'bg-[#FAF7F2] border border-brand-brown/5 text-stone-300 cursor-not-allowed'
                                      : 'bg-brand-brown hover:bg-brand-gold text-white hover:shadow-xs'
                                  }`}
                                >
                                  <span>+ 1 Sello</span>
                                </button>

                                {isCompleted && onResetClientStamps && (
                                  <button
                                    id={`quick-crm-reset-${client.id}`}
                                    onClick={() => {
                                      onResetClientStamps(client.qrCode);
                                    }}
                                    className="px-2.5 py-1.5 bg-brand-gold hover:bg-[#B38C46] text-white border border-brand-gold rounded-lg font-sans text-[8px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shrink-0 animate-pulse"
                                    title="Entrega cortesía y reinicia su tarjeta a 0 visitas."
                                  >
                                    <span>Canjear 🎁</span>
                                  </button>
                                )}
                              </div>

                              {/* Details/Ledger toggle */}
                              <button
                                id={`details-toggle-${client.id}`}
                                onClick={() => {
                                  setSelectedCustomerPageId(client.id);
                                }}
                                className={`p-1.5 rounded-lg border border-stone-200 text-stone-400 hover:text-brand-brown hover:border-brand-gold hover:bg-[#EADED2]/10 transition-colors flex items-center justify-center cursor-pointer`}
                                title="Ver expediente completo del socio"
                              >
                                <Clock className="w-3.5 h-3.5" />
                              </button>
                            </div>

                          </div>

                          {/* EXPANDED SECTION (Stamps Detail & Ledger History) */}
                          {selectedHistoryClientId === client.id && (() => {
                            const sortedTxs = [...userTxs].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                            const lastVisitTx = sortedTxs.find(tx => tx.type === 'earn');
                            const lastVisitDate = lastVisitTx 
                              ? new Date(lastVisitTx.timestamp).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                              : 'Sin visitas registradas';
                            const rewardsCashedCount = userTxs.filter(t => t.type === 'redeem').length;
                            const registeredSince = client.createdAt 
                              ? new Date(client.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
                              : 'No disponible';
                            const nameParts = client.name.trim().split(/\s+/);
                            const firstName = nameParts[0] || '';
                            const lastName = nameParts.slice(1).join(' ') || 'No especificado';

                            return (
                              <div className="px-5 pb-5 pt-3 bg-[#FAF7F2]/60 border-t border-[#2D241E]/5 transition-all text-left space-y-4">
                                
                                {/* Top detailed profile card */}
                                <div className="bg-white p-4 rounded-xl border border-[#2D241E]/5 shadow-3xs space-y-3">
                                  <div className="flex items-center gap-2 pb-2 border-b border-[#2D241E]/5">
                                    <User className="w-4 h-4 text-brand-gold" />
                                    <span className="font-sans text-[9px] font-extrabold uppercase tracking-widest text-[#2D241E]/60">
                                      Resumen del Historial del Socio
                                    </span>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                    <div>
                                      <span className="block text-[8px] font-sans font-bold text-stone-400 uppercase tracking-widest">Nombre</span>
                                      <span className="font-serif font-bold text-brand-brown">{firstName}</span>
                                    </div>
                                    <div>
                                      <span className="block text-[8px] font-sans font-bold text-stone-400 uppercase tracking-widest">Apellido(s)</span>
                                      <span className="font-serif font-bold text-brand-brown">{lastName}</span>
                                    </div>
                                    <div>
                                      <span className="block text-[8px] font-sans font-bold text-stone-400 uppercase tracking-widest">Sellos Actuales</span>
                                      <span className="font-sans font-bold text-brand-gold text-xs">{stamps} / 10 sellos</span>
                                    </div>
                                    <div>
                                      <span className="block text-[8px] font-sans font-bold text-stone-400 uppercase tracking-widest">Cortesías Canjeadas</span>
                                      <span className="font-sans font-bold text-brand-brown text-xs">{rewardsCashedCount} canje(s)</span>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1.5 border-t border-dashed border-[#2D241E]/5">
                                    <div>
                                      <span className="block text-[8px] font-sans font-bold text-stone-400 uppercase tracking-widest">Última Visita</span>
                                      <span className="font-sans text-stone-600 font-medium text-[11px] block truncate">{lastVisitDate}</span>
                                    </div>
                                    <div>
                                      <span className="block text-[8px] font-sans font-bold text-stone-400 uppercase tracking-widest">Fecha de Registro</span>
                                      <span className="font-sans text-stone-600 font-medium text-[11px] block">{registeredSince}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                  
                                  {/* Left block: Detail 10 stamps sheet representation */}
                                  <div className="bg-white p-3.5 rounded-xl border border-[#2D241E]/5 shadow-3xs">
                                    <span className="block text-[8px] font-sans font-extrabold uppercase tracking-widest text-[#C5A059] mb-2 px-0.5">
                                      CROQUIS DE PLANILLA DE VISITAS
                                    </span>
                                    <div className="grid grid-cols-5 gap-2">
                                      {Array.from({ length: 10 }).map((_, idx) => {
                                        const sNum = idx + 1;
                                        const isStamped = stamps >= sNum;
                                        return (
                                          <div
                                            key={idx}
                                            className={`h-8 rounded-lg flex items-center justify-center text-sm transition-all ${
                                              isStamped 
                                                ? 'bg-[#EADED2]/30 border border-brand-gold scale-102 font-bold animate-fadeIn' 
                                                : 'border border-dashed border-stone-200 text-[#2D241E]/20 bg-brand-bg/40 text-[9px] font-bold'
                                            }`}
                                          >
                                            {isStamped ? (
                                              stampSymbol && (stampSymbol.startsWith('data:image/') || stampSymbol.startsWith('http')) ? (
                                                <img src={stampSymbol} alt="Sello" className="w-5 h-5 object-contain" referrerPolicy="no-referrer" />
                                              ) : (
                                                stampSymbol
                                              )
                                            ) : sNum}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  {/* Right block: Activity Log ledger */}
                                  <div className="bg-white p-3.5 rounded-xl border border-[#2D241E]/5 shadow-3xs flex flex-col justify-start">
                                    <span className="block text-[8px] font-sans font-extrabold uppercase tracking-widest text-stone-400 mb-2 px-0.5 flex items-center justify-between">
                                      <span>HISTORIAL DE OPERACIONES</span>
                                      <span className="font-normal font-mono normal-case text-stone-500 text-[9px]">{client.name}</span>
                                    </span>

                                    <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                                      {userTxs.length === 0 ? (
                                        <p className="font-serif italic text-stone-450 text-[10px] text-center py-4">
                                          No hay transacciones registradas aún.
                                        </p>
                                      ) : (
                                        userTxs.map((tx) => (
                                          <div key={tx.id} className="p-2 bg-[#FAF7F2]/60 border border-[#2D241E]/5 rounded-lg flex justify-between items-center text-[10px]">
                                            <div className="space-y-0.5 pr-1 min-w-0 text-left">
                                              <span className="font-serif italic text-brand-brown block truncate leading-tight">
                                                {tx.description}
                                              </span>
                                              <span className="block text-[7.5px] text-stone-400 font-mono">
                                                {new Date(tx.timestamp).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })} · Por: {tx.staffName || 'Staff'}
                                              </span>
                                            </div>
                                            <span className={`font-sans font-bold shrink-0 text-[10px] ${tx.type === 'earn' ? 'text-[#C5A059]' : 'text-stone-400'}`}>
                                              {tx.type === 'earn' ? '+' : '-'}{tx.points} {tx.points === 1 ? 'sello' : 'sellos'}
                                            </span>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  </div>

                                </div>
                              </div>
                            );
                          })()}

                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* SECURITY PIN PAD LOCKSCREEN MODAL */}
      {isPinModalOpen && (
        <div className="fixed inset-0 bg-[#1C1A17]/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4">
          <div className="w-full max-w-xs bg-white rounded-3xl p-6 shadow-2xl border border-[#2D241E]/10 text-center space-y-6 animate-scaleUp">
            <div>
              <div className="w-12 h-12 bg-[#FAF7F2] text-[#C5A059] rounded-2xl flex items-center justify-center mx-auto border border-[#C5A059]/20 shadow-3xs">
                <Lock className="w-5 h-5 animate-pulse" />
              </div>
              <h3 className="font-serif italic text-base font-semibold text-brand-brown mt-3">Verificación de Personal</h3>
              <p className="font-sans text-[10px] text-stone-400 mt-1 uppercase tracking-wider font-bold">Introducir PIN de Seguridad</p>
            </div>
            
            {/* PIN Code indicators */}
            <div className="flex justify-center gap-3">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full border border-brand-brown/15 transition-all ${
                    enteredPin.length > idx ? 'bg-brand-gold scale-110 shadow-3xs' : 'bg-[#FAF7F2]'
                  }`}
                />
              ))}
            </div>

            {pinError && (
              <p className="font-sans text-[10px] text-rose-500 font-bold tracking-wide">{pinError}</p>
            )}

            {/* Complete responsive lock keyboard */}
            <div className="grid grid-cols-3 gap-2.5 max-w-[210px] mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  id={`pin-btn-${num}`}
                  onClick={() => handlePinKeypadPress(num)}
                  className="w-14 h-14 rounded-full bg-[#FAF7F2] border border-[#2D241E]/5 hover:bg-[#EADED2]/25 font-sans text-base font-bold text-brand-brown transition-all cursor-pointer flex items-center justify-center active:scale-90"
                >
                  {num}
                </button>
              ))}
              <button
                id="pin-btn-cancel"
                onClick={() => {
                  setEnteredPin('');
                  setPinError(null);
                  setIsPinModalOpen(false);
                }}
                className="w-14 h-14 font-sans text-[9px] font-bold uppercase tracking-widest text-[#2D241E]/50 hover:text-brand-brown cursor-pointer flex items-center justify-center"
              >
                Cerrar
              </button>
              <button
                id="pin-btn-0"
                onClick={() => handlePinKeypadPress('0')}
                className="w-14 h-14 rounded-full bg-[#FAF7F2] border border-[#2D241E]/5 hover:bg-[#EADED2]/25 font-sans text-base font-bold text-brand-brown transition-all cursor-pointer flex items-center justify-center active:scale-90"
              >
                0
              </button>
              <button
                id="pin-btn-delete"
                onClick={handlePinKeypadBackspace}
                className="w-14 h-14 font-sans text-[9px] font-bold uppercase tracking-widest text-[#2D241E]/50 hover:text-brand-brown cursor-pointer flex items-center justify-center"
              >
                Borrar
              </button>
            </div>
            <p className="font-sans text-[9px] text-[#2D241E]/40 italic">PIN de demostración por defecto: 1234</p>
          </div>
        </div>
      )}

      {/* STAFF EXCLUSIVE CONFIGURATION MODAL */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-[#1C1A17]/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4 overflow-y-auto">
          <div className="w-full max-w-sm bg-white rounded-[2rem] p-6 shadow-2xl border border-[#2D241E]/10 space-y-6 animate-scaleUp my-8 max-h-[90vh] overflow-y-auto scrollbar-none text-left">
            <div className="border-b border-[#2D241E]/5 pb-3">
              <h3 className="font-serif italic text-lg font-semibold text-brand-brown">Configuración de Marca</h3>
              <p className="font-sans text-[9px] text-stone-400 mt-0.5 uppercase tracking-wider font-bold">Personalizable por el Staff de Buttery</p>
            </div>

            {/* Símbolo de Sello */}
            <div className="space-y-2.5">
              <span className="block font-sans text-[8px] font-extrabold uppercase tracking-widest text-[#C5A059]">
                1. Símbolo del Sello (Planilla)
              </span>
              <div className="grid grid-cols-4 gap-2">
                {STAMP_PRESETS.map((p) => {
                  const isSelected = tempStamp === p.char;
                  return (
                    <button
                      key={p.char}
                      id={`preset-stamp-${p.name.toLowerCase()}`}
                      onClick={() => setTempStamp(p.char)}
                      className={`h-11 rounded-xl flex flex-col items-center justify-center border transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-[#EADED2]/40 border-[#C5A059] scale-105 shadow-3xs font-bold text-lg' 
                          : 'bg-[#FAF7F2] border-stone-200 text-stone-500 hover:border-stone-400 font-sans text-base'
                      }`}
                      title={p.name}
                    >
                      <span>{p.char}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Image Stamp Uploader */}
              <div className="pt-2.5 border-t border-brand-brown/5 space-y-2">
                <span className="block font-sans text-[8px] font-extrabold uppercase tracking-widest text-[#C5A059]">
                  O Sube una Imagen de Sello Personalizada:
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#FAF7F2] border border-stone-200 flex items-center justify-center relative overflow-hidden shrink-0">
                    {tempStamp && (tempStamp.startsWith('data:image/') || tempStamp.startsWith('http')) ? (
                      <img src={tempStamp} alt="Sello cargado" className="w-9 h-9 object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="text-xl text-stone-300">🖼️</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <label 
                      htmlFor="custom-stamp-upload-input" 
                      className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-sans text-[8px] font-bold uppercase tracking-wider cursor-pointer inline-block border border-stone-200"
                    >
                      Seleccionar Archivo
                    </label>
                    <input 
                      id="custom-stamp-upload-input"
                      type="file" 
                      accept="image/*" 
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            if (event.target?.result) {
                              const img = new Image();
                              img.onload = () => {
                                const maxDim = 120; // 120px is perfect size for stamp and very small
                                let width = img.width;
                                let height = img.height;
                                if (width > maxDim || height > maxDim) {
                                  if (width > height) {
                                    height = Math.round((height * maxDim) / width);
                                    width = maxDim;
                                  } else {
                                    width = Math.round((width * maxDim) / height);
                                    height = maxDim;
                                  }
                                }
                                const canvas = document.createElement('canvas');
                                canvas.width = width;
                                canvas.height = height;
                                const ctx = canvas.getContext('2d');
                                if (ctx) {
                                  ctx.drawImage(img, 0, 0, width, height);
                                  const compressedBase64 = canvas.toDataURL('image/png'); // png preserves transparency
                                  setTempStamp(compressedBase64);
                                } else {
                                  setTempStamp(event.target?.result as string);
                                }
                              };
                              img.src = event.target?.result as string;
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <p className="font-sans text-[8px] text-stone-400 mt-1">Recomendado: PNG fondo transparente (fino)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Combinaciones de Colores de Tema */}
            <div className="space-y-2.5">
              <span className="block font-sans text-[8px] font-extrabold uppercase tracking-widest text-[#C5A059]">
                2. Paleta de Color del Club
              </span>
              <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                {THEME_PRESETS.map((p) => {
                  const isSelected = tempBrown === p.brown && tempGold === p.gold && tempBg === p.bg;
                  return (
                    <button
                      key={p.name}
                      id={`preset-theme-${p.name.replace(/\s+/g, '-').toLowerCase()}`}
                      onClick={() => {
                        setTempBrown(p.brown);
                        setTempGold(p.gold);
                        setTempBg(p.bg);
                      }}
                      className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-[#EADED2]/30 border-[#C5A059] shadow-3xs font-semibold' 
                          : 'bg-[#FAF7F2]/60 border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      <span className="font-serif text-xs text-[#2D241E]">{p.name}</span>
                      <div className="flex gap-1.5 shrink-0">
                        <div className="w-5 h-5 rounded-full border border-black/10" style={{ backgroundColor: p.brown }} title="Color de marca" />
                        <div className="w-5 h-5 rounded-full border border-black/10" style={{ backgroundColor: p.gold }} title="Color acento" />
                        <div className="w-5 h-5 bg-stone-100 rounded-full border border-black/10" style={{ backgroundColor: p.bg }} title="Color fondo" />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom hex and color picker */}
              <div className="pt-2.5 border-t border-brand-brown/5 space-y-2">
                <span className="block font-sans text-[8px] font-extrabold uppercase tracking-widest text-[#C5A059]">
                  O Ingresa tus Propios Códigos de Color (HEX):
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="block text-[8px] font-sans font-semibold text-stone-500">Color Marca</label>
                    <div className="flex items-center gap-1.5">
                      <div className="relative w-6 h-6 rounded-md border border-stone-300 cursor-pointer shrink-0" style={{ backgroundColor: tempBrown }}>
                        <input 
                          type="color" 
                          value={tempBrown.startsWith('#') && tempBrown.length === 7 ? tempBrown : '#2D241E'}
                          onChange={(e) => setTempBrown(e.target.value)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                      <input 
                        type="text" 
                        maxLength={7}
                        value={tempBrown}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTempBrown(val);
                        }}
                        className="w-full bg-stone-50 rounded-lg px-1.5 py-1 text-[9px] font-mono text-brand-brown border border-stone-200 uppercase focus:border-brand-gold focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[8px] font-sans font-semibold text-stone-500">Color Acento</label>
                    <div className="flex items-center gap-1.5">
                      <div className="relative w-6 h-6 rounded-md border border-stone-300 cursor-pointer shrink-0" style={{ backgroundColor: tempGold }}>
                        <input 
                          type="color" 
                          value={tempGold.startsWith('#') && tempGold.length === 7 ? tempGold : '#C5A059'}
                          onChange={(e) => setTempGold(e.target.value)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                      <input 
                        type="text" 
                        maxLength={7}
                        value={tempGold}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTempGold(val);
                        }}
                        className="w-full bg-stone-50 rounded-lg px-1.5 py-1 text-[9px] font-mono text-brand-brown border border-stone-200 uppercase focus:border-brand-gold focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[8px] font-sans font-semibold text-stone-500">Color Fondo</label>
                    <div className="flex items-center gap-1.5">
                      <div className="relative w-6 h-6 rounded-md border border-stone-300 cursor-pointer shrink-0" style={{ backgroundColor: tempBg }}>
                        <input 
                          type="color" 
                          value={tempBg.startsWith('#') && tempBg.length === 7 ? tempBg : '#FAF7F2'}
                          onChange={(e) => setTempBg(e.target.value)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                      <input 
                        type="text" 
                        maxLength={7}
                        value={tempBg}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTempBg(val);
                        }}
                        className="w-full bg-stone-50 rounded-lg px-1.5 py-1 text-[9px] font-mono text-brand-brown border border-stone-200 uppercase focus:border-brand-gold focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Logo de la Marca */}
            <div className="space-y-2.5">
              <span className="block font-sans text-[8px] font-extrabold uppercase tracking-widest text-[#C5A059]">
                3. Logo de la Marca (Pantalla de Acceso)
              </span>
              <div className="bg-[#FAF7F2]/50 border border-stone-200/60 rounded-xl p-3 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl bg-white border border-stone-200 flex items-center justify-center relative overflow-hidden shrink-0">
                    {tempLogoUrl ? (
                      <img src={tempLogoUrl} alt="Logo temporal" className="max-w-[56px] max-h-[56px] object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="text-2xl text-stone-300">🏢</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <label 
                      htmlFor="custom-logo-upload-input" 
                      className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-sans text-[8px] font-bold uppercase tracking-wider cursor-pointer inline-block border border-stone-300"
                    >
                      Sube tu Logo (PNG, JPG, JPEG)
                    </label>
                    <input 
                      id="custom-logo-upload-input"
                      type="file" 
                      accept="image/png, image/jpeg, image/jpg" 
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            if (event.target?.result) {
                              const img = new Image();
                              img.onload = () => {
                                // Downscale to reasonable dimensions to fit inside DB comfortably (e.g. max width/height 300px)
                                const maxDim = 300;
                                let width = img.width;
                                let height = img.height;
                                if (width > maxDim || height > maxDim) {
                                  if (width > height) {
                                    height = Math.round((height * maxDim) / width);
                                    width = maxDim;
                                  } else {
                                    width = Math.round((width * maxDim) / height);
                                    height = maxDim;
                                  }
                                }
                                const canvas = document.createElement('canvas');
                                canvas.width = width;
                                canvas.height = height;
                                const ctx = canvas.getContext('2d');
                                if (ctx) {
                                  ctx.drawImage(img, 0, 0, width, height);
                                  const compressedBase64 = canvas.toDataURL('image/png');
                                  setTempLogoUrl(compressedBase64);
                                } else {
                                  setTempLogoUrl(event.target?.result as string);
                                }
                              };
                              img.src = event.target?.result as string;
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    {tempLogoUrl && (
                      <button 
                        onClick={() => setTempLogoUrl('')}
                        className="block text-[8px] font-semibold text-red-600 hover:underline uppercase tracking-wider cursor-pointer"
                      >
                        Restablecer a logo original
                      </button>
                    )}
                  </div>
                </div>

                {tempLogoUrl && (
                  <div className="space-y-1.5 pt-2 border-t border-brand-brown/5">
                    <div className="flex justify-between items-center text-[8px] font-sans font-extrabold uppercase tracking-widest text-stone-500">
                      <span>Altura del logo: {tempLogoHeight}px</span>
                      <span className="font-mono text-stone-400">Rango: 30px - 150px</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="range" 
                        min={30} 
                        max={150} 
                        value={tempLogoHeight} 
                        onChange={(e) => setTempLogoHeight(Number(e.target.value))}
                        className="w-full accent-brand-gold cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Editar PIN de Seguridad */}
            <div className="space-y-2.5">
              <label htmlFor="settings-pin-input" className="block font-sans text-[8px] font-extrabold uppercase tracking-widest text-[#C5A059]">
                4. Código PIN de Configuración (4 dígitos)
              </label>
              <input
                id="settings-pin-input"
                type="text"
                maxLength={4}
                value={tempPin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (val.length <= 4) setTempPin(val);
                }}
                className="w-full bg-stone-50 rounded-xl px-4 py-2 text-xs text-brand-brown outline-hidden border border-stone-200 focus:border-[#C5A059]"
                placeholder="Introduce 4 dígitos numéricos"
              />
            </div>

            {/* Acciones de Modal */}
            <div className="flex items-center gap-3 pt-3 border-t border-stone-100">
              <button
                id="settings-btn-cancel"
                onClick={() => setIsSettingsOpen(false)}
                className="flex-1 py-3 bg-stone-50 hover:bg-[#FAF7F2] text-stone-500 rounded-xl font-sans text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer border border-[#2D241E]/5 text-center"
              >
                Descartar
              </button>
              <button
                id="settings-btn-save"
                disabled={tempPin.length !== 4}
                onClick={() => {
                  onUpdateSettings(tempStamp, tempBrown, tempGold, tempBg, tempPin, tempLogoUrl, tempLogoHeight);
                  setIsSettingsOpen(false);
                  setFeedbackMsg({ text: '¡Configuración de marca actualizada de manera segura!', isError: false });
                  setTimeout(() => setFeedbackMsg(null), 3500);
                }}
                className={`flex-1 py-3 text-white rounded-xl font-sans text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer text-center ${
                  tempPin.length !== 4
                    ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                    : 'bg-brand-brown hover:bg-brand-gold'
                }`}
              >
                Guardar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
