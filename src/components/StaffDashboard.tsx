import React, { useState } from 'react';
import {
  LogOut,
  QrCode,
  User,
  Check,
  Users,
  Camera,
  Clock,
  Search,
  Gift,
  Settings,
  Lock,
  AlertCircle,
  Plus,
  History,
  ChevronLeft,
  Upload,
  RotateCcw,
  UserPlus,
  Trash2,
  Mail,
  Shield,
} from 'lucide-react';
import { User as UserType, Transaction, RewardItem, QRVoucher } from '../types';
import butteryStorefront from '../assets/buttery_storefront.jpg';

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
  settingsPin: string;
  logoUrl: string;
  logoHeight: number;
  cardBgUrl: string;
  onUpdateSettings: (stamp: string, newPin: string, logoUrl: string, logoHeight: number, cardBgUrl: string) => void;
  onRegisterStaff?: (name: string, email: string, password: string) => string | null;
  onRemoveStaff?: (staffId: string) => void;
}

// "HACE X DÍAS" helper for last visit labels
function daysAgoLabel(dateStr?: string): string {
  if (!dateStr) return 'Sin visitas';
  const then = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - then.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  return `Hace ${diffDays} días`;
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
  settingsPin,
  logoUrl,
  logoHeight,
  cardBgUrl,
  onUpdateSettings,
  onRegisterStaff,
  onRemoveStaff,
}: StaffDashboardProps) {
  // Tabs: 'control' (check-in / scan) and 'users' (CRM list)
  const [activeTab, setActiveTab] = useState<'control' | 'users'>('control');

  // Settings & Security PIN States
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [tempStamp, setTempStamp] = useState<string>(stampSymbol);
  const [tempPin, setTempPin] = useState<string>(settingsPin);
  const [tempLogoUrl, setTempLogoUrl] = useState<string>(logoUrl);
  const [tempLogoHeight, setTempLogoHeight] = useState<number>(logoHeight);
  const [tempCardBgUrl, setTempCardBgUrl] = useState<string>(cardBgUrl);

  // Staff registration form state (Equipo section)
  const [newStaffName, setNewStaffName] = useState<string>('');
  const [newStaffEmail, setNewStaffEmail] = useState<string>('');
  const [newStaffPassword, setNewStaffPassword] = useState<string>('');
  const [staffFormError, setStaffFormError] = useState<string | null>(null);
  const [staffFormSuccess, setStaffFormSuccess] = useState<string | null>(null);

  const handleStaffRegisterSubmit = () => {
    setStaffFormError(null);
    setStaffFormSuccess(null);
    if (!onRegisterStaff) return;
    const err = onRegisterStaff(newStaffName, newStaffEmail, newStaffPassword);
    if (err) {
      setStaffFormError(err);
      return;
    }
    setStaffFormSuccess(`Acceso guardado para ${newStaffEmail.trim().toLowerCase()}.`);
    setNewStaffName('');
    setNewStaffEmail('');
    setNewStaffPassword('');
    setTimeout(() => setStaffFormSuccess(null), 3500);
  };



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
        setTempPin(settingsPin);
        setTempLogoUrl(logoUrl);
        setTempLogoHeight(logoHeight);
        setTempCardBgUrl(cardBgUrl);
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
  const [crmFilter, setCrmFilter] = useState<'all' | 'near' | 'ready'>('all');
  const [selectedCustomerPageId, setSelectedCustomerPageId] = useState<string | null>(null);

  // Manual code entry (Escanear tab)
  const [manualCodeOpen, setManualCodeOpen] = useState<boolean>(false);
  const [manualCode, setManualCode] = useState<string>('');

  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; isError: boolean } | null>(null);

  const handleManualCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = manualCode.trim();
    if (!code) return;
    onAddPoints(code, 1, 'Sello de visita por código ingresado manualmente');
    setManualCode('');
    setManualCodeOpen(false);
  };

  // Recent activity feed (latest 6 transactions)
  const recentActivity = [...transactions]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 6);

  // Filter out staff roles from customer directory
  const clientUsers = registeredUsers.filter((u) => u.role === 'client');
  const accumulatingCount = clientUsers.filter(u => u.points > 0 && u.points < 10).length;
  const readyCount = clientUsers.filter(u => u.points === 10).length;

  const pad2 = (n: number) => String(n).padStart(2, '0');

  const activeClientPage = selectedCustomerPageId
    ? registeredUsers.find((u) => u.id === selectedCustomerPageId)
    : null;

  /* ══════════════════════════════════════════
     CLIENT DETAIL PAGE ("Expediente")
     ══════════════════════════════════════════ */
  if (activeClientPage) {
    const userTxs = transactions.filter(t => t.userId === activeClientPage.id);
    const stamps = Math.min(10, Math.max(0, activeClientPage.points));
    const isCompleted = stamps === 10;
    const init = activeClientPage.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const sortedTxs = [...userTxs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const lastVisitTx = sortedTxs.find(tx => tx.type === 'earn');
    const lastVisitDate = lastVisitTx
      ? new Date(lastVisitTx.timestamp).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : 'Sin visitas registradas';
    const rewardsCashedCount = userTxs.filter(t => t.type === 'redeem').length;
    const registeredSince = activeClientPage.createdAt
      ? new Date(activeClientPage.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
      : 'No disponible';

    return (
      <div className="flex-1 flex flex-col h-full bg-[#FAF7F2] text-[#1C2117] font-sans pb-10">
        {/* Navigation & Header */}
        <div className="bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#1C2117]/8 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <button
            id="detail-back-button"
            onClick={() => setSelectedCustomerPageId(null)}
            className="flex items-center gap-2 font-sans text-[10px] font-bold uppercase tracking-[0.15em] text-[#1C2117] hover:text-[#1C2117]/60 cursor-pointer transition-all bg-[#FDFBF7] px-3.5 py-2 rounded-xl border border-[#1C2117]/10"
          >
            ← Volver a Socios
          </button>
          <div className="text-right">
            <p className="font-sans text-[9px] uppercase tracking-[0.25em] text-[#1C2117]/45 font-bold">Expediente de Socio</p>
          </div>
        </div>

        <div className="px-6 mt-6 space-y-5 overflow-y-auto max-h-[calc(100vh-120px)]">
          {/* Client header card */}
          <div className="p-6 bg-[#FDFBF7] rounded-2xl border border-[#1C2117]/10">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center font-sans text-sm font-bold shrink-0 ${
                isCompleted ? 'bg-[#C5A059] text-[#1C2117]' : 'bg-[#EDE6DA] text-[#1C2117]'
              }`}>
                {init}
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
                  <h3 className="font-sans text-xl font-semibold tracking-tight text-[#1C2117] truncate">{activeClientPage.name}</h3>
                  {isCompleted && (
                    <span className="inline-flex self-center sm:self-start text-[8px] font-sans font-bold uppercase tracking-[0.15em] text-[#8A6D3B] bg-[#F6EEDF] px-2.5 py-1 rounded-full shrink-0 items-center gap-1">
                      <Gift className="w-2.5 h-2.5" /> Listo
                    </span>
                  )}
                </div>
                <p className="font-sans text-xs text-[#1C2117]/45 block truncate">{activeClientPage.email}</p>
                <div className="pt-1 flex flex-wrap gap-2 justify-center sm:justify-start">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#1C2117]/55 bg-[#EDE6DA] px-2 py-1 rounded-md">
                    {activeClientPage.qrCode}
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-[#1C2117]/55 bg-[#EDE6DA] px-2 py-1 rounded-md">
                    Registro: {registeredSince}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Left: stamp sheet + actions */}
            <div className="space-y-5">
              {/* Stamp sheet */}
              <div className="bg-[#FDFBF7] p-5 rounded-2xl border border-[#1C2117]/10 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="block text-[9px] font-sans font-bold uppercase tracking-[0.25em] text-[#1C2117]/45">
                    Planilla de visitas
                  </span>
                  <span className="font-sans font-semibold text-[#1C2117] text-sm">
                    {pad2(stamps)} / 10
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-2.5">
                  {Array.from({ length: 10 }).map((_, idx) => {
                    const isStamped = stamps >= idx + 1;
                    return (
                      <div
                        key={idx}
                        className={`aspect-square rounded-full flex items-center justify-center transition-all ${
                          isStamped
                            ? 'bg-[#2D4A2E]'
                            : 'bg-[#FDFBF7] border border-[#1C2117]/12'
                        }`}
                      >
                        {isStamped ? (
                          <Check className="w-4 h-4 text-white" strokeWidth={3} />
                        ) : (
                          <span className="w-1 h-1 rounded-full bg-[#1C2117]/20" />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="w-full h-1 bg-[#EDE6DA] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${isCompleted ? 'bg-[#C5A059]' : 'bg-[#2D4A2E]'}`}
                    style={{ width: `${stamps * 10}%` }}
                  ></div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-[#FDFBF7] p-5 rounded-2xl border border-[#1C2117]/10 space-y-3">
                <span className="block text-[9px] font-sans font-bold uppercase tracking-[0.25em] text-[#1C2117]/45">
                  Acciones
                </span>

                <button
                  id="add-stamp-detail-page-btn"
                  disabled={isCompleted}
                  onClick={() => {
                    onAddPoints(activeClientPage.qrCode, 1, 'Sello de visita registrado desde Expediente');
                  }}
                  className={`w-full py-3.5 rounded-xl font-sans text-[10px] font-bold uppercase tracking-[0.18em] transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    isCompleted
                      ? 'bg-[#EDE6DA] text-[#1C2117]/30 cursor-not-allowed'
                      : 'bg-[#2D4A2E] hover:bg-[#243B25] text-[#FAF7F2]'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Registrar visita (sello)</span>
                </button>

                {isCompleted && onResetClientStamps && (
                  <button
                    id="reset-detail-page-btn"
                    onClick={() => {
                      onResetClientStamps(activeClientPage.qrCode);
                    }}
                    className="w-full py-3.5 bg-[#C5A059] hover:bg-[#B08D4F] text-[#1C2117] rounded-xl font-sans text-[10px] font-bold uppercase tracking-[0.18em] transition-all cursor-pointer flex items-center justify-center gap-2"
                    title="Entrega cortesía y reinicia su tarjeta a 0 visitas."
                  >
                    <Gift className="w-3.5 h-3.5" />
                    <span>Canjear cortesía y renovar planilla</span>
                  </button>
                )}
              </div>

              {/* Account summary */}
              <div className="bg-[#FDFBF7] p-5 rounded-2xl border border-[#1C2117]/10 space-y-3">
                <span className="block text-[9px] font-sans font-bold uppercase tracking-[0.25em] text-[#1C2117]/45">
                  Resumen de cuenta
                </span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-[#FAF7F2] rounded-xl">
                    <span className="block text-[8px] font-sans font-bold text-[#1C2117]/40 uppercase tracking-[0.15em] mb-1">Cortesías canjeadas</span>
                    <span className="font-sans font-semibold text-[#1C2117] text-sm">{rewardsCashedCount}</span>
                  </div>
                  <div className="p-3 bg-[#FAF7F2] rounded-xl">
                    <span className="block text-[8px] font-sans font-bold text-[#1C2117]/40 uppercase tracking-[0.15em] mb-1">Última visita</span>
                    <span className="font-sans font-medium text-[#1C2117]/70 text-[11px] block truncate">{lastVisitDate}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: transactions log */}
            <div className="bg-[#FDFBF7] p-5 rounded-2xl border border-[#1C2117]/10 space-y-4 self-start">
              <span className="block text-[9px] font-sans font-bold uppercase tracking-[0.25em] text-[#1C2117]/45">
                Historial de operaciones
              </span>

              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {sortedTxs.length === 0 ? (
                  <p className="font-sans text-[#1C2117]/40 text-xs text-center py-8">
                    No hay transacciones registradas aún para este socio.
                  </p>
                ) : (
                  sortedTxs.map((tx) => (
                    <div key={tx.id} className="p-3 border-b border-[#1C2117]/6 flex justify-between items-center text-xs last:border-0">
                      <div className="space-y-0.5 pr-2 min-w-0 text-left">
                        <span className="font-sans font-medium text-[#1C2117] block truncate leading-snug">
                          {tx.description}
                        </span>
                        <span className="block text-[9px] text-[#1C2117]/40 font-mono">
                          {new Date(tx.timestamp).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} · {tx.staffName || 'Staff'}
                        </span>
                      </div>
                      <span className={`font-sans font-bold shrink-0 text-xs ${tx.type === 'earn' ? 'text-[#1C2117]' : 'text-[#1C2117]/35'}`}>
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
    );
  }

  /* ══════════════════════════════════════════
     MAIN STAFF CONSOLE
     ══════════════════════════════════════════ */
  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAF7F2] text-[#1C2117] font-sans pb-10">

      {/* ── Header ── */}
      <div className="px-6 md:px-10 lg:px-16 pt-6 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-[#2D4A2E] flex items-center justify-center flex-shrink-0">
            <span className="font-sans font-semibold text-white text-base leading-none">{staffUser.name.charAt(0)}</span>
          </div>
          <div>
            <p className="font-sans text-[9px] uppercase tracking-[0.25em] text-[#1C2117]/45 font-bold leading-none">Consola Staff</p>
            <h2 className="font-serif font-medium text-[#1C2117] text-xl mt-1 leading-none">
              {staffUser.name} <span className="text-[#1C2117]/40 font-normal">&middot; Recepción</span>
            </h2>
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
            className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-[#1C2117]/5 text-[#1C2117]/40 hover:text-[#1C2117] transition-all cursor-pointer"
            title="Configuración"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            id="staff-logout-btn"
            onClick={onLogout}
            className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-[#1C2117]/5 text-[#1C2117]/40 hover:text-[#1C2117] transition-all cursor-pointer"
            title="Cerrar Sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Hero + stats ── */}
      <div className="px-6 md:px-10 lg:px-16 pt-8">
        <p className="font-sans text-[9px] uppercase tracking-[0.3em] text-[#1C2117]/45 font-bold">
          Buttery &middot; Polanco
        </p>
        <h1 className="font-serif font-medium text-4xl md:text-5xl tracking-tight leading-[1.1] mt-3">
          <span className="text-[#1C2117]">Sellos y socios,</span><br />
          <span className="text-[#1C2117]/30">en un solo lugar.</span>
        </h1>

        <div className="flex gap-14 mt-8">
          <div>
            <p className="font-sans text-[9px] uppercase tracking-[0.25em] text-[#1C2117]/45 font-bold">Socios</p>
            <p className="font-serif font-medium text-3xl tracking-tight text-[#1C2117] mt-1.5">{pad2(clientUsers.length)}</p>
          </div>
          <div>
            <p className="font-sans text-[9px] uppercase tracking-[0.25em] text-[#1C2117]/45 font-bold">Acumulando</p>
            <p className="font-serif font-medium text-3xl tracking-tight text-[#1C2117] mt-1.5">{pad2(accumulatingCount)}</p>
          </div>
          <div>
            <p className="font-sans text-[9px] uppercase tracking-[0.25em] text-[#1C2117]/45 font-bold">Por premiar</p>
            <p className="font-serif font-medium text-3xl tracking-tight text-[#C5A059] mt-1.5">{pad2(readyCount)}</p>
          </div>
        </div>

        <div className="h-px bg-[#1C2117]/8 mt-8" />
      </div>

      {/* ── Tab bar ── */}
      <div className="px-6 md:px-10 lg:px-16 mt-6">
        <div className="bg-[#EDE6DA] p-1 rounded-xl inline-flex w-full md:w-auto">
          <button
            id="staff-tab-control-btn"
            onClick={() => setActiveTab('control')}
            className={`flex-1 md:flex-none md:px-14 py-2.5 font-sans text-[10px] font-bold uppercase tracking-[0.18em] rounded-lg cursor-pointer transition-all ${
              activeTab === 'control'
                ? 'bg-[#FDFBF7] text-[#1C2117] shadow-sm'
                : 'text-[#1C2117]/45 hover:text-[#1C2117]/70'
            }`}
          >
            Escanear
          </button>
          <button
            id="staff-tab-users-btn"
            onClick={() => setActiveTab('users')}
            className={`flex-1 md:flex-none md:px-14 py-2.5 font-sans text-[10px] font-bold uppercase tracking-[0.18em] rounded-lg cursor-pointer transition-all ${
              activeTab === 'users'
                ? 'bg-[#FDFBF7] text-[#1C2117] shadow-sm'
                : 'text-[#1C2117]/45 hover:text-[#1C2117]/70'
            }`}
          >
            Socios &middot; {clientUsers.length}
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div
          style={{ animation: 'slideUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) both' }}
          className={`fixed top-6 left-4 right-4 mx-auto max-w-sm z-50 px-5 py-3.5 rounded-2xl flex items-center gap-3 shadow-2xl border ${
            feedbackMsg.isError
              ? 'bg-rose-600 border-rose-500/30 text-white'
              : 'bg-[#2D4A2E] border-white/10 text-[#FAF7F2]'
          }`}
        >
          {feedbackMsg.isError ? (
            <AlertCircle className="w-4 h-4 text-white/80 flex-shrink-0" />
          ) : (
            <Check className="w-4 h-4 text-white/80 flex-shrink-0" />
          )}
          <span className="font-sans text-xs font-semibold tracking-wide">{feedbackMsg.text}</span>
        </div>
      )}

      {/* ── Tab panels ── */}
      <div className="px-6 md:px-10 lg:px-16 mt-6 flex-1 flex flex-col">

        {/* ═ ESCANEAR / CHECK-IN ═ */}
        {activeTab === 'control' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

            {/* Left: Check-in card */}
            <div className="p-8 md:p-10 bg-[#FDFBF7] rounded-2xl border border-[#1C2117]/10 text-center space-y-5">
              <div className="relative w-fit mx-auto">
                <div className="w-24 h-24 bg-[#2D4A2E] text-[#FAF7F2] rounded-full flex items-center justify-center">
                  <QrCode className="w-9 h-9" />
                </div>
                <span className="absolute top-1 right-0 w-3 h-3 bg-[#C5A059] rounded-full border-2 border-white" />
              </div>

              <div className="space-y-2">
                <p className="font-sans text-[9px] uppercase tracking-[0.3em] text-[#1C2117]/45 font-bold">Check-in</p>
                <h3 className="font-sans text-2xl font-semibold tracking-tight text-[#1C2117]">Escanear membresía</h3>
                <p className="font-sans text-xs text-[#1C2117]/50 leading-relaxed max-w-xs mx-auto">
                  Pide al socio abrir su planilla y apunta la cámara al QR. El sello se suma al instante.
                </p>
              </div>

              <button
                id="staff-open-scanner-btn"
                onClick={onOpenScanner}
                className="w-full max-w-xs mx-auto bg-[#2D4A2E] hover:bg-[#243B25] text-[#FAF7F2] font-sans text-xs font-bold uppercase tracking-[0.2em] py-4 px-4 rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-2.5"
              >
                <Camera className="w-4 h-4" />
                Abrir cámara
              </button>

              {!manualCodeOpen ? (
                <button
                  type="button"
                  id="manual-code-toggle-btn"
                  onClick={() => setManualCodeOpen(true)}
                  className="font-sans text-xs text-[#1C2117]/55 hover:text-[#1C2117] underline underline-offset-4 decoration-[#1C2117]/20 hover:decoration-[#1C2117] transition-colors cursor-pointer"
                >
                  Ingresar código manualmente
                </button>
              ) : (
                <form onSubmit={handleManualCodeSubmit} className="max-w-xs mx-auto flex gap-2">
                  <input
                    id="manual-code-input"
                    type="text"
                    autoFocus
                    placeholder="Código de membresía"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    className="flex-1 bg-[#FDFBF7] border border-[#1C2117]/15 rounded-xl py-2.5 px-3.5 text-xs text-[#1C2117] placeholder:text-[#1C2117]/35 focus:outline-none focus:border-[#1C2117] transition-colors font-mono uppercase"
                  />
                  <button
                    type="submit"
                    id="manual-code-submit-btn"
                    className="bg-[#2D4A2E] hover:bg-[#243B25] text-[#FAF7F2] px-4 rounded-xl font-sans text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors"
                  >
                    Sumar
                  </button>
                </form>
              )}
            </div>

            {/* Right: Recent activity */}
            <div className="pt-2">
              <div className="flex items-center justify-between pb-4">
                <p className="font-sans text-[9px] uppercase tracking-[0.3em] text-[#1C2117]/45 font-bold">Actividad reciente</p>
                <Clock className="w-4 h-4 text-[#1C2117]/30" />
              </div>

              {recentActivity.length === 0 ? (
                <div className="py-12 text-center border-t border-[#1C2117]/8">
                  <p className="font-sans text-xs text-[#1C2117]/40">Aún no hay actividad registrada.</p>
                </div>
              ) : (
                <div>
                  {recentActivity.map((tx) => {
                    const txUser = registeredUsers.find(u => u.id === tx.userId);
                    const isReady = txUser?.points === 10;
                    return (
                      <div
                        key={tx.id}
                        className="py-4 border-t border-[#1C2117]/8 flex items-center justify-between gap-4"
                      >
                        <div className="min-w-0">
                          <p className="font-sans font-semibold text-sm text-[#1C2117] truncate">{tx.userName}</p>
                          <p className="font-sans text-xs text-[#1C2117]/50 truncate mt-0.5">
                            {isReady
                              ? '10 / 10 · Lista para canjear'
                              : `${tx.type === 'earn' ? '+' : '-'}${tx.points} ${tx.points === 1 ? 'sello' : 'sellos'}`}
                          </p>
                        </div>
                        {isReady ? (
                          <span className="flex items-center gap-1.5 text-[9px] font-sans font-bold uppercase tracking-[0.15em] text-[#8A6D3B] bg-[#F6EEDF] px-3 py-1.5 rounded-full shrink-0">
                            <Gift className="w-3 h-3" /> Lista
                          </span>
                        ) : (
                          <span className="w-7 h-7 rounded-full bg-[#2D4A2E] flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ═ SOCIOS / CRM ═ */}
        {activeTab === 'users' && (
          <div className="flex-1 flex flex-col space-y-5">

            <p className="font-sans text-[9px] uppercase tracking-[0.3em] text-[#1C2117]/45 font-bold flex items-center gap-2">
              <Users className="w-3.5 h-3.5" />
              CRM de Socios
            </p>

            {/* Search + filters */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1C2117]/35 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, correo o membresía..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#EDE6DA] rounded-xl pl-11 pr-4 py-3 border-none text-sm text-[#1C2117] outline-none placeholder:text-[#1C2117]/40 focus:ring-1 focus:ring-[#1C2117]/20"
                />
              </div>

              <div className="flex bg-[#EDE6DA] p-1 rounded-xl">
                {(['all', 'near', 'ready'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setCrmFilter(filter)}
                    className={`px-4 py-2 rounded-lg font-sans text-[9px] font-bold uppercase tracking-[0.15em] cursor-pointer transition-all ${
                      crmFilter === filter
                        ? 'bg-[#2D4A2E] text-[#FAF7F2]'
                        : 'text-[#1C2117]/45 hover:text-[#1C2117]/70'
                    }`}
                  >
                    {filter === 'all' ? 'Todos' : filter === 'near' ? 'Cerca' : 'Listos'}
                  </button>
                ))}
              </div>
            </div>

            {/* Client list */}
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
                  <div className="p-10 text-center border-t border-[#1C2117]/8">
                    <p className="font-sans text-xs text-[#1C2117]/40">No se encontraron socios con los criterios de búsqueda.</p>
                  </div>
                );
              }

              return (
                <div className="border-t border-[#1C2117]/8">
                  {matchedClients.map((client) => {
                    const userTxs = transactions.filter(t => t.userId === client.id);
                    const stamps = Math.min(10, Math.max(0, client.points));
                    const isCompleted = stamps === 10;
                    const init = client.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                    const sortedTxs = [...userTxs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                    const lastVisitTx = sortedTxs.find(tx => tx.type === 'earn');
                    const lastVisitLabel = daysAgoLabel(lastVisitTx?.timestamp);

                    return (
                      <div
                        key={client.id}
                        className="py-4 border-b border-[#1C2117]/8 grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 items-center"
                      >
                        {/* Avatar + name + email */}
                        <div className="md:col-span-4 flex items-center gap-3.5">
                          <button
                            id={`client-avatar-btn-${client.id}`}
                            onClick={() => setSelectedCustomerPageId(client.id)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-sans text-[11px] font-bold shrink-0 transition-all hover:scale-105 cursor-pointer ${
                              isCompleted ? 'bg-[#C5A059] text-[#1C2117]' : 'bg-[#EDE6DA] text-[#1C2117]'
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
                                className="font-sans text-sm font-semibold text-[#1C2117] hover:underline truncate text-left cursor-pointer"
                                title="Ver expediente del socio"
                              >
                                {client.name}
                              </button>
                              {isCompleted && (
                                <span className="flex items-center gap-1 text-[8px] font-sans font-bold uppercase tracking-[0.15em] text-[#8A6D3B] bg-[#F6EEDF] px-2 py-0.5 rounded-full shrink-0">
                                  <Gift className="w-2.5 h-2.5" /> Listo
                                </span>
                              )}
                            </div>
                            <span className="font-sans text-xs text-[#1C2117]/45 block truncate mt-0.5">{client.email}</span>
                          </div>
                        </div>

                        {/* Membership code */}
                        <div className="md:col-span-2 hidden md:block">
                          <span className="font-mono text-[10px] uppercase tracking-wider text-[#1C2117]/50 truncate">
                            {client.qrCode}
                          </span>
                        </div>

                        {/* Progress + last visit */}
                        <div className="md:col-span-4">
                          <div className="flex items-center justify-between gap-4">
                            <span className={`font-mono text-[10px] uppercase tracking-wider ${isCompleted ? 'text-[#8A6D3B] font-bold' : 'text-[#1C2117]/70'}`}>
                              {pad2(stamps)} / 10
                            </span>
                            <span className="font-mono text-[9px] uppercase tracking-wider text-[#1C2117]/40">
                              {lastVisitLabel}
                            </span>
                          </div>
                          <div className="w-full h-[3px] bg-[#EDE6DA] rounded-full overflow-hidden mt-2">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${isCompleted ? 'bg-[#C5A059]' : 'bg-[#2D4A2E]'}`}
                              style={{ width: `${stamps * 10}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="md:col-span-2 flex items-center justify-start md:justify-end gap-2">
                          {isCompleted && onResetClientStamps ? (
                            <button
                              id={`quick-crm-reset-${client.id}`}
                              onClick={() => onResetClientStamps(client.qrCode)}
                              className="px-4 py-2 bg-[#C5A059] hover:bg-[#B08D4F] text-[#1C2117] rounded-xl font-sans text-[9px] font-bold uppercase tracking-[0.15em] transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                              title="Entrega cortesía y reinicia su tarjeta a 0 visitas."
                            >
                              <Gift className="w-3 h-3" />
                              <span>Canjear</span>
                            </button>
                          ) : (
                            <button
                              id={`quick-crm-stamp-${client.id}`}
                              onClick={() => onAddPoints(client.qrCode, 1, 'Sello de visita registrado desde CRM')}
                              className="px-4 py-2 bg-[#FDFBF7] border border-[#1C2117]/15 hover:border-[#1C2117]/40 text-[#1C2117] rounded-xl font-sans text-[9px] font-bold uppercase tracking-[0.15em] transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Sello</span>
                            </button>
                          )}

                          <button
                            id={`details-toggle-${client.id}`}
                            onClick={() => setSelectedCustomerPageId(client.id)}
                            className="w-9 h-9 rounded-xl border border-[#1C2117]/15 text-[#1C2117]/40 hover:text-[#1C2117] hover:border-[#1C2117]/40 transition-colors flex items-center justify-center cursor-pointer shrink-0"
                            title="Ver expediente completo del socio"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                        </div>

                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* ── SECURITY PIN PAD MODAL ── */}
      {isPinModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4">
          <div className="w-full max-w-xs bg-[#FDFBF7] rounded-3xl p-6 shadow-2xl text-center space-y-6 animate-scaleUp">
            <div>
              <div className="w-12 h-12 bg-[#EDE6DA] text-[#1C2117] rounded-2xl flex items-center justify-center mx-auto">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-sans text-base font-semibold tracking-tight text-[#1C2117] mt-3">Verificación de Personal</h3>
              <p className="font-sans text-[9px] text-[#1C2117]/45 mt-1 uppercase tracking-[0.2em] font-bold">Introducir PIN de seguridad</p>
            </div>

            {/* PIN Code indicators */}
            <div className="flex justify-center gap-3">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-3.5 h-3.5 rounded-full transition-all ${
                    enteredPin.length > idx ? 'bg-[#2D4A2E] scale-110' : 'bg-[#EDE6DA]'
                  }`}
                />
              ))}
            </div>

            {pinError && (
              <p className="font-sans text-[10px] text-rose-500 font-bold tracking-wide">{pinError}</p>
            )}

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2.5 max-w-[210px] mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  id={`pin-btn-${num}`}
                  onClick={() => handlePinKeypadPress(num)}
                  className="w-14 h-14 rounded-full bg-[#FAF7F2] border border-[#1C2117]/8 hover:bg-[#EDE6DA] font-sans text-base font-semibold text-[#1C2117] transition-all cursor-pointer flex items-center justify-center active:scale-90"
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
                className="w-14 h-14 font-sans text-[9px] font-bold uppercase tracking-[0.15em] text-[#1C2117]/45 hover:text-[#1C2117] cursor-pointer flex items-center justify-center"
              >
                Cerrar
              </button>
              <button
                id="pin-btn-0"
                onClick={() => handlePinKeypadPress('0')}
                className="w-14 h-14 rounded-full bg-[#FAF7F2] border border-[#1C2117]/8 hover:bg-[#EDE6DA] font-sans text-base font-semibold text-[#1C2117] transition-all cursor-pointer flex items-center justify-center active:scale-90"
              >
                0
              </button>
              <button
                id="pin-btn-delete"
                onClick={handlePinKeypadBackspace}
                className="w-14 h-14 font-sans text-[9px] font-bold uppercase tracking-[0.15em] text-[#1C2117]/45 hover:text-[#1C2117] cursor-pointer flex items-center justify-center"
              >
                Borrar
              </button>
            </div>
            <p className="font-sans text-[9px] text-[#1C2117]/35">PIN de demostración por defecto: 1234</p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          STAFF CONFIGURATION — full-page brand settings
          ══════════════════════════════════════════ */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-[#FAF7F2] overflow-y-auto animate-fadeIn">
          <div className="max-w-2xl mx-auto px-6 md:px-10 pb-40">

            {/* Top bar */}
            <div className="flex items-center justify-between pt-7">
              <button
                id="settings-btn-back"
                onClick={() => setIsSettingsOpen(false)}
                className="flex items-center gap-1.5 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#1C2117] hover:text-[#1C2117]/55 cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Staff
              </button>
              <span className="font-sans text-[10px] font-bold uppercase tracking-[0.25em] text-[#1C2117]/45">Admin</span>
            </div>

            {/* Heading */}
            <div className="pt-8">
              <p className="font-sans text-[9px] uppercase tracking-[0.3em] text-[#1C2117]/45 font-bold">
                Buttery &middot; Polanco
              </p>
              <h1 className="font-serif font-medium text-4xl md:text-5xl tracking-tight leading-[1.1] mt-3">
                <span className="text-[#1C2117]">Configuración</span><br />
                <span className="text-[#1C2117]/30">de marca</span>
              </h1>
              <p className="font-sans text-sm text-[#1C2117]/55 mt-4 leading-relaxed max-w-md">
                Personaliza el sello, la paleta y los recursos visuales del programa de lealtad de Buttery.
              </p>
            </div>

            <div className="h-px bg-[#1C2117]/8 mt-8" />

            {/* ── 01 · Stamp symbol ── */}
            <section className="pt-10">
              <div className="flex items-start justify-between gap-4">
                <h2 className="font-sans text-xl font-semibold tracking-tight text-[#1C2117] flex items-baseline gap-3">
                  <span className="font-mono text-[11px] font-bold text-[#1C2117]/35 tracking-normal">01</span>
                  Símbolo del sello
                </h2>
                <p className="font-sans text-[9px] uppercase tracking-[0.18em] text-[#1C2117]/40 font-bold text-right leading-relaxed max-w-[140px] pt-1.5">
                  Reemplaza la palomita en los sellos llenos
                </p>
              </div>

              {/* Custom Image Stamp Uploader */}
              <div className="mt-8">
                <span className="block font-sans text-[9px] font-bold uppercase tracking-[0.2em] text-[#1C2117]/45">
                  Imagen del sello (opcional)
                </span>
                <div className="flex items-center gap-4 mt-4">
                  <div className="w-16 h-16 rounded-full bg-[#FDFBF7] border border-[#1C2117]/12 flex items-center justify-center relative overflow-hidden shrink-0">
                    {tempStamp && (tempStamp.startsWith('data:image/') || tempStamp.startsWith('http')) ? (
                      <img src={tempStamp} alt="Sello cargado" className="w-12 h-12 object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      <Upload className="w-5 h-5 text-[#1C2117]/30" />
                    )}
                  </div>
                  <div className="flex-1">
                    <label
                      htmlFor="custom-stamp-upload-input"
                      className="px-5 py-2.5 bg-[#FDFBF7] border border-[#1C2117]/15 hover:border-[#1C2117]/40 text-[#1C2117] rounded-full font-sans text-[10px] font-bold uppercase tracking-[0.15em] cursor-pointer inline-block transition-colors"
                    >
                      Seleccionar archivo
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
                                const maxDim = 120;
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
                    <p className="font-sans text-[11px] text-[#1C2117]/45 mt-2">PNG con fondo transparente. Si lo dejas vacío, se usa una palomita.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* ── 02 · Brand logo ── */}
            <section className="pt-12">
              <div className="flex items-start justify-between gap-4">
                <h2 className="font-sans text-xl font-semibold tracking-tight text-[#1C2117] flex items-baseline gap-3">
                  <span className="font-mono text-[11px] font-bold text-[#1C2117]/35 tracking-normal">02</span>
                  Logo de la marca
                </h2>
                <p className="font-sans text-[9px] uppercase tracking-[0.18em] text-[#1C2117]/40 font-bold text-right leading-relaxed max-w-[150px] pt-1.5">
                  Pantalla de acceso y encabezados
                </p>
              </div>

              <div className="bg-[#FDFBF7] border border-[#1C2117]/10 rounded-2xl p-5 space-y-4 mt-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-2xl bg-[#FAF7F2] border border-[#1C2117]/10 flex items-center justify-center relative overflow-hidden shrink-0">
                    {tempLogoUrl ? (
                      <img src={tempLogoUrl} alt="Logo temporal" className="max-w-[64px] max-h-[64px] object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="font-serif italic text-sm text-[#1C2117]/40">buttery</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <label
                      htmlFor="custom-logo-upload-input"
                      className="px-5 py-2.5 bg-[#FDFBF7] border border-[#1C2117]/15 hover:border-[#1C2117]/40 text-[#1C2117] rounded-full font-sans text-[10px] font-bold uppercase tracking-[0.15em] cursor-pointer inline-block transition-colors"
                    >
                      Sube tu logo (PNG, JPG)
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
                        className="flex items-center gap-1.5 text-[10px] font-bold text-[#B08D4F] hover:underline uppercase tracking-[0.15em] cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" /> Restablecer original
                      </button>
                    )}
                  </div>
                </div>

                {tempLogoUrl && (
                  <div className="space-y-2 pt-4 border-t border-[#1C2117]/8">
                    <div className="flex justify-between items-center text-[9px] font-sans font-bold uppercase tracking-[0.15em] text-[#1C2117]/50">
                      <span>Altura del logo</span>
                      <span className="font-mono text-[#1C2117] text-xs">{tempLogoHeight}px</span>
                    </div>
                    <input
                      type="range"
                      min={30}
                      max={150}
                      value={tempLogoHeight}
                      onChange={(e) => setTempLogoHeight(Number(e.target.value))}
                      className="w-full accent-[#2D4A2E] cursor-pointer"
                    />
                    <div className="flex justify-between font-mono text-[9px] text-[#1C2117]/35">
                      <span>30px</span>
                      <span>150px</span>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* ── 03 · Card image ── */}
            <section className="pt-12">
              <div className="flex items-start justify-between gap-4">
                <h2 className="font-sans text-xl font-semibold tracking-tight text-[#1C2117] flex items-baseline gap-3">
                  <span className="font-mono text-[11px] font-bold text-[#1C2117]/35 tracking-normal">03</span>
                  Imagen de la tarjeta
                </h2>
                <p className="font-sans text-[9px] uppercase tracking-[0.18em] text-[#1C2117]/40 font-bold text-right leading-relaxed max-w-[150px] pt-1.5">
                  Se muestra en la tarjeta digital del socio
                </p>
              </div>

              <div className="mt-6 space-y-4">
                <div className="w-full rounded-2xl overflow-hidden border border-[#1C2117]/10 bg-[#EDE6DA] relative" style={{ aspectRatio: '16/10' }}>
                  <img
                    src={tempCardBgUrl || butteryStorefront}
                    alt="Vista previa de tarjeta"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute top-3 left-3 font-sans text-[9px] text-white font-bold uppercase tracking-[0.15em] bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    Vista previa
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="block font-sans text-[9px] font-bold text-[#1C2117]/45 uppercase tracking-[0.15em]">
                    URL de imagen (https://...)
                  </label>
                  <input
                    id="card-bg-url-input"
                    type="url"
                    value={tempCardBgUrl}
                    onChange={(e) => setTempCardBgUrl(e.target.value)}
                    placeholder="https://ejemplo.com/imagen.jpg"
                    className="w-full bg-[#FDFBF7] rounded-xl px-4 py-3 text-sm text-[#1C2117] outline-none border border-[#1C2117]/12 focus:border-[#1C2117] placeholder:text-[#1C2117]/30"
                  />
                </div>
              </div>
            </section>

            {/* ── 04 · PIN ── */}
            <section className="pt-12">
              <div className="flex items-start justify-between gap-4">
                <h2 className="font-sans text-xl font-semibold tracking-tight text-[#1C2117] flex items-baseline gap-3">
                  <span className="font-mono text-[11px] font-bold text-[#1C2117]/35 tracking-normal">04</span>
                  PIN de configuración
                </h2>
                <p className="font-sans text-[9px] uppercase tracking-[0.18em] text-[#1C2117]/40 font-bold text-right leading-relaxed max-w-[140px] pt-1.5">
                  Protege el acceso a esta pantalla
                </p>
              </div>

              <input
                id="settings-pin-input"
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={tempPin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (val.length <= 4) setTempPin(val);
                }}
                className="w-full max-w-[200px] mt-6 bg-[#FDFBF7] rounded-xl px-5 py-3.5 text-lg font-mono tracking-[0.4em] text-[#1C2117] outline-none border border-[#1C2117]/12 focus:border-[#1C2117] text-center"
                placeholder="0000"
              />
              <p className="font-sans text-[11px] text-[#1C2117]/40 mt-2">4 dígitos numéricos</p>
            </section>

            {/* ── 05 · Equipo (staff accounts) ── */}
            <section className="pt-12">
              <div className="flex items-start justify-between gap-4">
                <h2 className="font-sans text-xl font-semibold tracking-tight text-[#1C2117] flex items-baseline gap-3">
                  <span className="font-mono text-[11px] font-bold text-[#1C2117]/35 tracking-normal">05</span>
                  Equipo
                </h2>
                <p className="font-sans text-[9px] uppercase tracking-[0.18em] text-[#1C2117]/40 font-bold text-right leading-relaxed max-w-[150px] pt-1.5">
                  Cuentas con acceso a la consola staff
                </p>
              </div>

              {/* Register new staff form */}
              <div className="bg-[#FDFBF7] border border-[#1C2117]/10 rounded-2xl p-5 space-y-4 mt-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#2D4A2E] flex items-center justify-center shrink-0">
                    <UserPlus className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-sans text-sm font-semibold text-[#1C2117] leading-none">Registrar acceso de staff</p>
                    <p className="font-sans text-[11px] text-[#1C2117]/45 mt-1 leading-none">Crea una cuenta individual o una compartida para todo el equipo.</p>
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  <div className="space-y-1.5">
                    <label htmlFor="new-staff-name" className="font-sans text-[9px] font-bold uppercase tracking-[0.15em] text-[#1C2117]/45">Nombre o etiqueta</label>
                    <input
                      id="new-staff-name"
                      type="text"
                      placeholder="Ej. Carlos · Barra, o 'Equipo Polanco'"
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      className="w-full bg-[#FAF7F2] border border-[#1C2117]/12 rounded-xl py-3 px-4 text-sm text-[#1C2117] placeholder:text-[#1C2117]/35 focus:outline-none focus:border-[#1C2117] transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="new-staff-email" className="font-sans text-[9px] font-bold uppercase tracking-[0.15em] text-[#1C2117]/45">Correo electrónico</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1C2117]/30" />
                      <input
                        id="new-staff-email"
                        type="email"
                        placeholder="staff@buttery.mx"
                        value={newStaffEmail}
                        onChange={(e) => setNewStaffEmail(e.target.value)}
                        className="w-full bg-[#FAF7F2] border border-[#1C2117]/12 rounded-xl py-3 pl-11 pr-4 text-sm text-[#1C2117] placeholder:text-[#1C2117]/35 focus:outline-none focus:border-[#1C2117] transition-colors"
                      />
                    </div>
                    <p className="font-sans text-[10px] text-[#1C2117]/40">
                      Para un acceso compartido, usa un solo correo que todo el equipo conozca. Si el correo ya existe, se actualizará su contraseña.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="new-staff-password" className="font-sans text-[9px] font-bold uppercase tracking-[0.15em] text-[#1C2117]/45">Contraseña</label>
                    <input
                      id="new-staff-password"
                      type="text"
                      placeholder="Mínimo 4 caracteres"
                      value={newStaffPassword}
                      onChange={(e) => setNewStaffPassword(e.target.value)}
                      className="w-full bg-[#FAF7F2] border border-[#1C2117]/12 rounded-xl py-3 px-4 text-sm text-[#1C2117] placeholder:text-[#1C2117]/35 focus:outline-none focus:border-[#1C2117] transition-colors font-mono"
                    />
                  </div>

                  {staffFormError && (
                    <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-700 text-xs font-sans">
                      {staffFormError}
                    </div>
                  )}
                  {staffFormSuccess && (
                    <div className="bg-[#F6EEDF] border border-[#C5A059]/25 p-3 rounded-xl text-[#8A6D3B] text-xs font-sans flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />
                      {staffFormSuccess}
                    </div>
                  )}

                  <button
                    type="button"
                    id="register-staff-btn"
                    onClick={handleStaffRegisterSubmit}
                    className="w-full bg-[#2D4A2E] hover:bg-[#243B25] text-[#FAF7F2] py-3.5 rounded-xl font-sans text-[10px] font-bold uppercase tracking-[0.18em] transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Guardar acceso de staff
                  </button>
                </div>
              </div>

              {/* Existing staff list */}
              {(() => {
                const staffMembers = registeredUsers.filter(u => u.role === 'staff');
                return (
                  <div className="mt-4 space-y-2">
                    <p className="font-sans text-[9px] font-bold uppercase tracking-[0.15em] text-[#1C2117]/45 px-1">
                      Cuentas actuales ({staffMembers.length})
                    </p>
                    {staffMembers.map((member) => {
                      const isSelf = member.id === staffUser.id;
                      return (
                        <div
                          key={member.id}
                          className="bg-[#FDFBF7] border border-[#1C2117]/10 rounded-xl px-4 py-3 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-[#EDE6DA] flex items-center justify-center shrink-0">
                              <Shield className="w-4 h-4 text-[#1C2117]/55" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-sans text-sm font-semibold text-[#1C2117] truncate flex items-center gap-2">
                                {member.name}
                                {isSelf && (
                                  <span className="text-[8px] font-bold uppercase tracking-[0.15em] text-[#1C2117]/40 bg-[#EDE6DA] px-1.5 py-0.5 rounded-full shrink-0">Tú</span>
                                )}
                              </p>
                              <p className="font-sans text-xs text-[#1C2117]/45 truncate">{member.email}</p>
                            </div>
                          </div>
                          {onRemoveStaff && !isSelf && (
                            <button
                              id={`remove-staff-${member.id}`}
                              onClick={() => onRemoveStaff(member.id)}
                              className="w-9 h-9 rounded-xl border border-[#1C2117]/12 text-[#1C2117]/40 hover:text-rose-600 hover:border-rose-200 transition-colors flex items-center justify-center cursor-pointer shrink-0"
                              title="Eliminar acceso"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </section>
          </div>

          {/* Sticky footer actions */}
          <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-[#FAF7F2] via-[#FAF7F2] to-transparent pt-10 pb-6 z-10">
            <div className="max-w-2xl mx-auto px-6 md:px-10 flex items-center gap-3">
              <button
                id="settings-btn-cancel"
                onClick={() => setIsSettingsOpen(false)}
                className="flex-1 py-4 bg-[#FDFBF7] border border-[#1C2117]/15 hover:border-[#1C2117]/40 text-[#1C2117]/70 rounded-full font-sans text-[11px] font-bold uppercase tracking-[0.2em] transition-colors cursor-pointer text-center"
              >
                Descartar
              </button>
              <button
                id="settings-btn-save"
                disabled={tempPin.length !== 4}
                onClick={() => {
                  onUpdateSettings(tempStamp, tempPin, tempLogoUrl, tempLogoHeight, tempCardBgUrl);
                  setIsSettingsOpen(false);
                  setFeedbackMsg({ text: '¡Configuración de marca actualizada de manera segura!', isError: false });
                  setTimeout(() => setFeedbackMsg(null), 2500);
                }}
                className={`flex-[1.4] py-4 rounded-full font-sans text-[11px] font-bold uppercase tracking-[0.2em] transition-colors cursor-pointer text-center ${
                  tempPin.length !== 4
                    ? 'bg-[#EDE6DA] text-[#1C2117]/30 cursor-not-allowed'
                    : 'bg-[#2D4A2E] hover:bg-[#243B25] text-[#FAF7F2]'
                }`}
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}