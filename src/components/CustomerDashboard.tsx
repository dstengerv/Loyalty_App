import { useState } from 'react';
import { 
  LogOut, 
  History, 
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Coffee,
  RefreshCw,
  Gift,
  Sparkles,
  X
} from 'lucide-react';
import QRCode from 'qrcode';
import { useEffect, useRef } from 'react';
import { User, Transaction, RewardItem, QRVoucher } from '../types';
import butteryLogo from '../assets/buttery_logo.svg';

interface CustomerDashboardProps {
  user: User;
  transactions: Transaction[];
  rewards: RewardItem[];
  vouchers: QRVoucher[];
  onScanPurchaseCode: () => void;
  onRedeemReward: (reward: RewardItem) => void;
  onLogout: () => void;
  onClaimCompletedCard?: () => void;
  stampSymbol?: string;
  cardBgUrl?: string;
}

export default function CustomerDashboard({
  user,
  transactions,
  rewards,
  vouchers,
  onScanPurchaseCode,
  onRedeemReward,
  onLogout,
  onClaimCompletedCard,
  stampSymbol,
  cardBgUrl,
}: CustomerDashboardProps) {
  const [activeTab, setActiveTab] = useState<'card' | 'history'>('card');
  const [showQrModal, setShowQrModal] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (showQrModal && qrCanvasRef.current && user.qrCode) {
      QRCode.toCanvas(qrCanvasRef.current, user.qrCode, {
        width: 220,
        margin: 2,
        color: { dark: '#2D241E', light: '#FAF7F2' }
      });
    }
  }, [showQrModal, user.qrCode]);

  // Filter transactions for this user
  const userTransactions = transactions
    .filter((t) => t.userId === user.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Clamp the stamp count between 0 and 10
  const stampCount = Math.min(10, Math.max(0, user.points));

  const DEFAULT_CARD_BG = 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80';
  const bannerUrl = cardBgUrl || DEFAULT_CARD_BG;

  const isStampFilled = (idx: number) => stampCount >= idx + 1;

  return (
    <div className="flex-1 flex flex-col h-full text-white overflow-hidden" style={{ background: 'linear-gradient(175deg, #6B8F6B 0%, #4A6B4A 50%, #3D5C3D 100%)' }}>

      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#C5A059] flex items-center justify-center shadow">
            <span className="font-serif italic font-bold text-white text-sm leading-none">{user.name.charAt(0)}</span>
          </div>
          <div>
            <p className="font-sans text-[8px] uppercase tracking-[0.2em] text-[#C5A059] font-bold leading-none">Tarjeta de Lealtad</p>
            <h2 className="font-serif italic font-semibold text-white text-base mt-0.5 leading-none">{user.name}</h2>
          </div>
        </div>

        <button
          id="logout-btn"
          onClick={onLogout}
          className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer"
          title="Cerrar Sesión"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Tab bar */}
      <div className="mx-5 mb-4">
        <div className="bg-white/10 p-1 rounded-full flex border border-white/10">
          <button
            id="tab-card-btn"
            onClick={() => setActiveTab('card')}
            className={`flex-1 py-2 font-sans text-[10px] font-bold uppercase tracking-widest rounded-full cursor-pointer transition-all ${
              activeTab === 'card'
                ? 'bg-white text-[#4A6B4A] shadow'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Tarjeta
          </button>
          <button
            id="tab-history-btn"
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 font-sans text-[10px] font-bold uppercase tracking-widest rounded-full cursor-pointer transition-all ${
              activeTab === 'history'
                ? 'bg-white text-[#4A6B4A] shadow'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Historial
          </button>
        </div>
      </div>

      {/* Card Tab */}
      {activeTab === 'card' && (
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          <div className="overflow-y-auto px-5 space-y-5 pb-2">

            {/* Banner card with logo overlay */}
            {/* Outer wrapper allows the logo circle to overflow the banner bottom */}
            <div className="relative w-full">
              <div className="relative w-full rounded-2xl overflow-hidden" style={{ aspectRatio: '16/7' }}>
                {/* Background photo */}
                <img
                  src={bannerUrl}
                  alt="Tarjeta de lealtad"
                  className="absolute inset-0 w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                {/* Dark overlay for contrast */}
                <div className="absolute inset-0 bg-black/25" />

                {/* Pill labels */}
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                  <span className="bg-[#C5A059] text-white font-sans text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                    Sello por visita
                  </span>
                  <span className="bg-black/50 backdrop-blur-sm text-white font-sans text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                    Premio a los 10 sellos
                  </span>
                </div>
              </div>


            </div>

            {/* Reward label */}
            <div className="text-center">
              <p className="font-serif italic font-semibold text-white text-sm leading-snug">
                Recompensa: <span className="text-[#C5A059]">¡Tu recompensa espera!</span>
              </p>
            </div>

          {/* Stamp grid */}
          <div className="space-y-3">
            <div className="grid grid-cols-5 gap-2.5">
              {Array.from({ length: 10 }).map((_, idx) => {
                const filled = isStampFilled(idx);
                const stampNum = idx + 1;
                return (
                  <div
                    key={idx}
                    className={`aspect-square rounded-full overflow-hidden flex items-center justify-center border-2 transition-all ${
                      filled
                        ? 'border-[#C5A059] bg-[#4A6B4A]'
                        : 'border-white/20 bg-white/5'
                    }`}
                  >
                    {filled ? (
                      stampSymbol && (stampSymbol.startsWith('data:image/') || stampSymbol.startsWith('http')) ? (
                        <img src={stampSymbol} alt="Sello" className="w-full h-full object-cover select-none" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-lg leading-none select-none filter drop-shadow-sm">{stampSymbol || <Coffee className="w-5 h-5 text-[#C5A059]" />}</span>
                      )
                    ) : (
                      stampNum === 10 ? (
                        <Gift className="w-4 h-4 text-white/25" />
                      ) : (
                        <Coffee className="w-4 h-4 text-white/20" />
                      )
                    )}
                  </div>
                );
              })}
            </div>

            <p className="text-center font-sans text-[11px] text-white/60 font-medium">
              {stampCount} de 10 sellos acumulados
            </p>
          </div>

          </div>

          {/* Sticky ACUMULAR SELLO button — opens customer's own QR code for staff to scan */}
          <div className="px-5 pb-6 pt-3" style={{ background: 'linear-gradient(to top, #3D5C3D, transparent)' }}>
            <button
              id="scan-qr-btn"
              onClick={() => setShowQrModal(true)}
              className="w-full bg-[#3D5C3D] hover:bg-[#344E34] text-white font-sans text-xs font-bold uppercase tracking-widest py-4 rounded-2xl cursor-pointer transition-colors shadow-lg flex items-center justify-center gap-2.5 border border-white/10"
            >
              <RefreshCw className="w-4 h-4 text-[#C5A059]" />
              Acumular Sello
            </button>
          </div>

        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="flex-1 flex flex-col px-5 space-y-4 overflow-y-auto pb-32">
          <h3 className="font-serif text-base font-medium text-white flex items-center gap-2">
            <History className="w-4 h-4 text-[#C5A059]" />
            Historial de Visitas
          </h3>

          {userTransactions.length > 0 ? (
            <div className="space-y-2.5">
              {userTransactions.map((tx) => (
                <div
                  key={tx.id}
                  id={`tx-card-${tx.id}`}
                  className="p-3.5 bg-white/8 border border-white/10 rounded-xl flex items-center justify-between backdrop-blur-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                      tx.type === 'earn'
                        ? 'bg-[#C5A059]/15 text-[#C5A059] border-[#C5A059]/20'
                        : 'bg-white/8 text-white/40 border-white/10'
                    }`}>
                      {tx.type === 'earn' ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <span className="font-serif italic text-xs text-white block line-clamp-1">{tx.description}</span>
                      <div className="flex items-center gap-1.5 text-[9px] text-white/40 font-medium font-mono mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(tx.timestamp).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>

                  <span className={`font-sans font-bold text-xs ${
                    tx.type === 'earn' ? 'text-[#C5A059]' : 'text-white/40'
                  }`}>
                    {tx.type === 'earn' ? '+' : '-'}{tx.points} {tx.points === 1 ? 'sello' : 'sellos'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 px-6 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center space-y-2">
              <Coffee className="w-10 h-10 text-white/20 stroke-1" />
              <p className="font-serif italic text-xs text-white/60">Aún no hay movimientos</p>
              <p className="font-sans text-[10px] text-white/40 text-center">Tus primeras visitas y canjes de cortesía se listarán aquí.</p>
            </div>
          )}
        </div>
      )}



      {/* Customer QR Code Modal — centered popup */}
      {showQrModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setShowQrModal(false)}
        >
          <div
            className="w-full max-w-xs bg-white rounded-3xl px-6 pt-5 pb-7 flex flex-col items-center gap-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: logo left, CERRAR right */}
            <div className="w-full flex items-center justify-between">
              <img
                src="/buttery-logo-transparent.png"
                alt="Buttery"
                className="h-7 w-auto object-contain select-none"
                referrerPolicy="no-referrer"
              />
              <button
                onClick={() => setShowQrModal(false)}
                className="font-sans text-[10px] font-bold uppercase tracking-widest text-[#2D241E]/50 hover:text-[#2D241E] transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>

            {/* QR canvas */}
            <div className="bg-stone-50 rounded-2xl p-3 border border-stone-100 shadow-inner">
              <canvas ref={qrCanvasRef} />
            </div>

            {/* Name + code */}
            <div className="text-center space-y-1">
              <p className="font-serif italic font-bold text-[#2D241E] text-base leading-snug">{user.name}</p>
              <p className="font-sans text-[9px] font-extrabold uppercase tracking-[0.18em] text-[#C5A059]">
                Código: {user.qrCode}
              </p>
            </div>

            {/* Instruction */}
            <p className="font-sans text-[10px] text-[#2D241E]/50 text-center leading-relaxed px-2">
              Muestra este código exclusivo de membresía en caja al ordenar en Buttery Polanco. El staff sumará tu sello de visita al instante.
            </p>
          </div>
        </div>
      )}

      {/* 10 Stamps Completion Modal */}
      {stampCount === 10 && (
        <div
          id="stamps-completed-modal"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-6 animate-fadeIn"
        >
          <div
            className="w-full max-w-sm bg-[#4A6B4A] rounded-[2.5rem] p-8 text-center space-y-6 flex flex-col items-center shadow-2xl border border-[#C5A059]/30 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#C5A059] via-yellow-400 to-[#C5A059]" />

            <div className="relative my-2">
              <div className="absolute inset-0 bg-[#C5A059]/15 rounded-full blur-xl scale-150 animate-pulse" />
              <div className="w-24 h-24 bg-[#5C7A5C] rounded-full flex items-center justify-center shadow-lg border border-[#C5A059]/30 relative">
                {stampSymbol && (stampSymbol.startsWith('data:image/') || stampSymbol.startsWith('http')) ? (
                  <img src={stampSymbol} alt="Sello" className="w-14 h-14 object-contain select-none animate-pulse" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-5xl leading-none select-none animate-pulse">{stampSymbol || '🥐'}</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-sans text-[9px] tracking-[0.25em] font-extrabold text-[#C5A059] uppercase block">
                Planilla Completada
              </span>
              <h3 className="font-serif italic text-2xl font-semibold text-white leading-tight">
                ¡Felicidades, {user.name}!
              </h3>
              <p className="font-sans text-[11px] text-white/70 leading-relaxed max-w-xs mt-2">
                Has reunido tus <strong>10 sellos</strong> de visita. Muestra esta pantalla al staff de <strong>Buttery Polanco</strong> para recibir tu pan o bebida de cortesía.
              </p>
            </div>

            <div className="w-full pt-2">
              <button
                id="claim-reward-btn"
                onClick={() => { if (onClaimCompletedCard) onClaimCompletedCard(); }}
                className="w-full py-4 bg-[#C5A059] hover:bg-[#B38C46] text-white rounded-2xl font-sans text-xs font-bold tracking-widest uppercase shadow-md transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-white fill-white" />
                Registrar Canje con el Staff
              </button>

              <p className="font-sans text-[9px] text-white/40 mt-3 font-medium">
                Al presionar este botón, tu planilla se reiniciará a 0 sellos.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
