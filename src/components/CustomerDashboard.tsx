import { useState } from 'react';
import {
  LogOut,
  History,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Gift,
  Sparkles,
  ChevronRight,
  QrCode as QrCodeIcon,
  Check,
  Croissant,
} from 'lucide-react';
import QRCode from 'qrcode';
import { useEffect, useRef } from 'react';
import { User, Transaction, RewardItem, QRVoucher } from '../types';
import butteryLogoGold from '../assets/buttery_logo_gold.png';
import butteryStorefront from '../assets/buttery_storefront.jpg';

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
  const [activeTab, setActiveTab] = useState<'card' | 'history' | 'qr'>('card');
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (activeTab === 'qr' && qrCanvasRef.current && user.qrCode) {
      QRCode.toCanvas(qrCanvasRef.current, user.qrCode, {
        width: 220,
        margin: 2,
        color: { dark: '#1C2117', light: '#FDFBF7' }
      });
    }
  }, [activeTab, user.qrCode]);

  const userTransactions = transactions
    .filter((t) => t.userId === user.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const stampCount = Math.min(10, Math.max(0, user.points));
  const remaining = 10 - stampCount;

  const bannerUrl = cardBgUrl || butteryStorefront;

  const isStampFilled = (idx: number) => stampCount >= idx + 1;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#FAF7F2] text-[#1C2117] overflow-hidden font-sans">

      {/* ── Header ── */}
      <div className="px-6 pt-7 pb-2 flex items-start justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-full bg-[#2D4A2E] flex items-center justify-center flex-shrink-0">
            <span className="font-serif font-medium text-[#FAF7F2] text-lg leading-none">{user.name.charAt(0)}</span>
          </div>
          <div>
            <p className="font-sans text-[9px] uppercase tracking-[0.28em] text-[#1C2117]/50 font-bold leading-none">Miembro</p>
            <h2 className="font-serif font-medium text-[#1C2117] text-xl mt-1.5 leading-none">{user.name}</h2>
          </div>
        </div>

        <button
          id="logout-btn"
          onClick={onLogout}
          className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-[#1C2117]/6 text-[#1C2117]/40 hover:text-[#1C2117] transition-all cursor-pointer"
          title="Cerrar Sesión"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* ── Progress hero ── */}
      <div className="px-6 pt-6 pb-5">
        <p className="font-sans text-[9px] uppercase tracking-[0.3em] text-[#1C2117]/50 font-bold">
          Buttery &middot; Polanco
        </p>
        <div className="flex items-baseline gap-1 mt-2.5">
          <span className="font-serif font-medium text-[3.5rem] leading-none tracking-tight text-[#1C2117]">
            {String(stampCount).padStart(2, '0')}
          </span>
          <span className="font-serif font-normal text-4xl leading-none tracking-tight text-[#1C2117]/25">
            /10
          </span>
        </div>
        <p className="font-sans text-sm text-[#1C2117]/60 mt-3 leading-snug">
          {stampCount === 10
            ? '¡Planilla completa! Reclama tu cortesía en mostrador.'
            : `${remaining} ${remaining === 1 ? 'visita más' : 'visitas más'} para tu repostería de cortesía.`}
        </p>
      </div>

      <div className="mx-6 h-px bg-[#1C2117]/10" />

      {/* ── Tab bar ── */}
      <div className="px-6 pt-5 pb-1">
        <div className="bg-[#EDE6DA] p-1 rounded-full flex">
          {(['card', 'history', 'qr'] as const).map((tab) => {
            const labels = { card: 'Tarjeta', history: 'Historial', qr: 'Mi QR' };
            const ids = { card: 'tab-card-btn', history: 'tab-history-btn', qr: 'tab-qr-btn' };
            return (
              <button
                key={tab}
                id={ids[tab]}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 font-sans text-[10px] font-bold uppercase tracking-[0.18em] rounded-full cursor-pointer transition-all ${
                  activeTab === tab
                    ? 'bg-[#FDFBF7] text-[#1C2117] shadow-sm'
                    : 'text-[#1C2117]/45 hover:text-[#1C2117]/70'
                }`}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Card Tab ── */}
      {activeTab === 'card' && (
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="flex-1 overflow-y-auto px-6 pt-6 pb-28 space-y-7">

            {/* Stamps section header */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="font-sans text-[9px] uppercase tracking-[0.25em] text-[#1C2117]/50 font-bold">Sellos</p>
                <p className="font-sans text-[9px] uppercase tracking-[0.25em] text-[#1C2117]/50 font-bold">Sello por visita</p>
              </div>

              {/* Stamp grid */}
              <div className="grid grid-cols-5 gap-3.5">
                {Array.from({ length: 10 }).map((_, idx) => {
                  const filled = isStampFilled(idx);
                  const isLast = idx === 9;
                  return (
                    <div
                      key={idx}
                      className={`aspect-square rounded-full overflow-hidden flex items-center justify-center transition-all ${
                        filled
                          ? 'bg-[#2D4A2E]'
                          : isLast
                            ? 'bg-[#FDFBF7] border-2 border-dashed border-[#C5A059]'
                            : 'bg-[#FDFBF7] border border-[#1C2117]/12'
                      }`}
                    >
                      {filled ? (
                        stampSymbol && (stampSymbol.startsWith('data:image/') || stampSymbol.startsWith('http')) ? (
                          <img src={stampSymbol} alt="Sello" className="w-full h-full object-cover select-none" referrerPolicy="no-referrer" />
                        ) : (
                          <Check className="w-5 h-5 text-[#FAF7F2]" strokeWidth={3} />
                        )
                      ) : isLast ? (
                        <Gift className="w-4 h-4 text-[#C5A059]" />
                      ) : (
                        <span className="w-1 h-1 rounded-full bg-[#1C2117]/20" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Next reward card */}
            <button
              type="button"
              id="next-reward-card"
              onClick={() => setActiveTab('qr')}
              className="w-full bg-[#FDFBF7] border border-[#1C2117]/10 rounded-2xl p-4 flex items-center justify-between text-left hover:border-[#C5A059] transition-colors cursor-pointer shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-[#F6EEDF] flex items-center justify-center flex-shrink-0">
                  <Gift className="w-[18px] h-[18px] text-[#B08D4F]" />
                </div>
                <div>
                  <p className="font-sans text-[9px] uppercase tracking-[0.25em] text-[#1C2117]/50 font-bold">Próxima recompensa</p>
                  <p className="font-serif font-medium text-base text-[#1C2117] mt-1">Repostería o café de cortesía</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#1C2117]/30 flex-shrink-0" />
            </button>

            {/* Storefront photo */}
            <div className="w-full rounded-2xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
              <img
                src={bannerUrl}
                alt="Buttery Polanco"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

          </div>

          {/* Fixed bottom CTA: Mostrar mi QR */}
          <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 pt-8 bg-gradient-to-t from-[#FAF7F2] via-[#FAF7F2]/90 to-transparent">
            <button
              id="show-qr-btn"
              onClick={() => setActiveTab('qr')}
              className="w-full bg-[#2D4A2E] hover:bg-[#243B25] text-[#FAF7F2] py-4 rounded-2xl font-sans font-bold uppercase tracking-[0.2em] text-xs transition-colors flex items-center justify-between px-5 cursor-pointer shadow-lg"
            >
              <span className="flex items-center gap-3">
                <QrCodeIcon className="w-4 h-4" />
                Mostrar mi QR
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── History Tab ── */}
      {activeTab === 'history' && (
        <div className="flex-1 flex flex-col px-6 pt-6 space-y-4 overflow-y-auto pb-10">
          <h3 className="font-sans text-[9px] uppercase tracking-[0.25em] text-[#1C2117]/50 font-bold flex items-center gap-2">
            <History className="w-3.5 h-3.5" />
            Historial de visitas
          </h3>

          {userTransactions.length > 0 ? (
            <div className="space-y-2.5">
              {userTransactions.map((tx) => (
                <div
                  key={tx.id}
                  id={`tx-card-${tx.id}`}
                  className="p-4 bg-[#FDFBF7] border border-[#1C2117]/10 rounded-2xl flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                      tx.type === 'earn'
                        ? 'bg-[#2D4A2E] text-[#FAF7F2]'
                        : 'bg-[#EDE6DA] text-[#1C2117]/40'
                    }`}>
                      {tx.type === 'earn' ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <span className="font-sans font-medium text-xs text-[#1C2117] block line-clamp-1">{tx.description}</span>
                      <div className="flex items-center gap-1.5 text-[10px] text-[#1C2117]/40 font-medium mt-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(tx.timestamp).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>

                  <span className={`font-sans font-bold text-xs flex-shrink-0 ml-3 ${
                    tx.type === 'earn' ? 'text-[#2D4A2E]' : 'text-[#1C2117]/35'
                  }`}>
                    {tx.type === 'earn' ? '+' : '-'}{tx.points} {tx.points === 1 ? 'sello' : 'sellos'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-14 px-6 bg-[#FDFBF7] border border-[#1C2117]/10 rounded-2xl flex flex-col items-center justify-center space-y-2.5 shadow-sm">
              <Croissant className="w-10 h-10 text-[#C5A059]/40" />
              <p className="font-serif font-medium text-base text-[#1C2117]/60">{"Aún no hay movimientos"}</p>
              <p className="font-sans text-xs text-[#1C2117]/40 text-center">Tus primeras visitas y canjes se listarán aquí.</p>
            </div>
          )}
        </div>
      )}

      {/* ── QR Tab ── */}
      {activeTab === 'qr' && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12 gap-7">

          <img
            src={butteryLogoGold}
            alt="Buttery"
            className="h-14 w-auto object-contain select-none"
            draggable={false}
          />

          <div className="bg-[#FDFBF7] rounded-3xl px-6 pt-6 pb-7 flex flex-col items-center gap-5 border border-[#1C2117]/10 shadow-sm w-full max-w-xs">
            <div className="bg-[#FAF7F2] rounded-2xl p-3 border border-[#1C2117]/8">
              <canvas ref={qrCanvasRef} />
            </div>

            <div className="text-center space-y-1.5">
              <p className="font-serif font-medium text-[#1C2117] text-lg leading-snug">{user.name}</p>
              <p className="font-sans text-[9px] font-bold uppercase tracking-[0.2em] text-[#B08D4F]">
                Código: {user.qrCode}
              </p>
            </div>
          </div>

          <p className="font-sans text-xs text-[#1C2117]/50 text-center leading-relaxed max-w-xs">
            Muestra este código en mostrador al pagar. El staff sumará tu sello de visita al instante.
          </p>
        </div>
      )}

      {/* ── 10 Stamps Completion Modal ── */}
      {stampCount === 10 && (
        <div
          id="stamps-completed-modal"
          className="fixed inset-0 z-50 bg-[#1C2117]/60 backdrop-blur-sm flex items-center justify-center p-6 animate-fadeIn"
        >
          <div
            className="w-full max-w-sm bg-[#FDFBF7] rounded-[2rem] p-8 text-center space-y-6 flex flex-col items-center shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#C5A059]" />

            <div className="relative my-2">
              <div className="w-24 h-24 bg-[#F6EEDF] rounded-full flex items-center justify-center relative">
                <Croissant className="w-12 h-12 text-[#B08D4F]" />
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-sans text-[9px] tracking-[0.3em] font-bold text-[#1C2117]/45 uppercase block">
                Planilla Completada
              </span>
              <h3 className="font-serif text-3xl font-medium tracking-tight text-[#1C2117] leading-tight">
                {`¡Felicidades, ${user.name}!`}
              </h3>
              <p className="font-sans text-xs text-[#1C2117]/55 leading-relaxed max-w-xs mt-2">
                Has reunido tus <strong className="text-[#1C2117]">10 sellos</strong> de visita. Muestra esta pantalla en mostrador de <strong className="text-[#1C2117]">Buttery</strong> para recibir tu repostería o café de cortesía.
              </p>
            </div>

            <div className="w-full pt-2">
              <button
                id="claim-reward-btn"
                onClick={() => { if (onClaimCompletedCard) onClaimCompletedCard(); }}
                className="w-full py-4 bg-[#2D4A2E] hover:bg-[#243B25] text-[#FAF7F2] rounded-2xl font-sans text-xs font-bold tracking-[0.2em] uppercase transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Registrar Canje con el Staff
              </button>

              <p className="font-sans text-[10px] text-[#1C2117]/40 mt-3 font-medium">
                Al presionar este botón, tu planilla se reiniciará a 0 sellos.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}