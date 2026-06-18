import { useState } from 'react';
import { 
  LogOut, 
  Sparkles, 
  QrCode, 
  History, 
  Gift, 
  MapPin, 
  Coffee, 
  Utensils, 
  Check, 
  Camera, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock,
  Award,
  Maximize2
} from 'lucide-react';
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
}: CustomerDashboardProps) {
  const [activeTab, setActiveTab] = useState<'card' | 'history'>('card');
  const [fullscreenQr, setFullscreenQr] = useState<boolean>(false);

  // Filter transactions for this user
  const userTransactions = transactions
    .filter((t) => t.userId === user.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Clamp the stamp count between 0 and 10
  const stampCount = Math.min(10, Math.max(0, user.points));

  // Generate QR Server URL for the customer code
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(user.qrCode)}`;

  return (
    <div className="flex-1 flex flex-col h-full bg-brand-bg text-brand-brown pb-10">
      
      {/* Upper header */}
      <div className="bg-brand-bg/95 backdrop-blur-md border-b border-brand-brown/5 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-brand-gold flex items-center justify-center shadow-xs">
            <span className="font-serif italic font-bold text-white text-sm">{user.name.charAt(0)}</span>
          </div>
          <div>
            <p className="font-sans text-[8px] uppercase tracking-[0.2em] text-brand-gold font-bold">Tarjeta de Lealtad</p>
            <h2 className="font-serif italic font-semibold text-brand-brown text-base mt-px">{user.name}</h2>
          </div>
        </div>

        <button
          id="logout-btn"
          onClick={onLogout}
          className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-stone-100 text-stone-400 hover:text-brand-brown transition-all cursor-pointer"
          title="Cerrar Sesión"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Main tab selections */}
      <div className="mx-6 mt-6">
        <div className="bg-[#F4F1EC] p-1 rounded-full flex border border-stone-200/40">
          <button
            id="tab-card-btn"
            onClick={() => setActiveTab('card')}
            className={`flex-1 py-2 font-sans text-[10px] font-bold uppercase tracking-widest rounded-full cursor-pointer transition-all ${
              activeTab === 'card' 
                ? 'bg-white text-brand-brown shadow-2xs border border-brand-brown/5' 
                : 'text-stone-400 hover:text-stone-700'
            }`}
          >
            Tarjeta
          </button>
          <button
            id="tab-history-btn"
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 font-sans text-[10px] font-bold uppercase tracking-widest rounded-full cursor-pointer transition-all ${
              activeTab === 'history' 
                ? 'bg-white text-brand-brown shadow-2xs border border-brand-brown/5' 
                : 'text-stone-400 hover:text-stone-700'
            }`}
          >
            Historial
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <div className="px-6 mt-6 flex-1 flex flex-col">
        {activeTab === 'card' && (
          <div className="flex-1 flex flex-col space-y-6">
            
            {/* Logo and QR Code Display Panel (No stamp count) */}
            <div 
              id="qr-display-panel"
              className="w-full bg-white rounded-3xl p-6 border border-brand-brown/10 shadow-3xs flex flex-col items-center justify-center text-center space-y-5"
            >
              {/* Restaurant Logo */}
              <div className="flex flex-col items-center">
                <img 
                  src={butteryLogo}
                  alt="Buttery Logo"
                  className="h-10 w-auto object-contain select-none mb-1 mix-blend-multiply"
                  referrerPolicy="no-referrer"
                />
                <p className="font-sans text-[8px] tracking-[0.15em] text-[#C5A059] font-bold uppercase">
                  Polanco · Ciudad de México
                </p>
                <div className="h-[1px] w-8 bg-brand-gold/30 mt-3"></div>
              </div>

              {/* Framed QR Code */}
              <div className="flex flex-col items-center space-y-3 w-full">
                <button
                  id="magnify-qr-btn"
                  onClick={() => setFullscreenQr(true)}
                  className="w-40 h-40 bg-brand-bg p-4 rounded-2xl border border-brand-brown/5 shadow-inner hover:scale-[1.01] hover:border-brand-gold/30 transition-all cursor-pointer flex items-center justify-center relative group"
                >
                  <img 
                    src={qrCodeUrl} 
                    alt="Socio Buttery QR" 
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-brand-brown/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                    <span className="bg-white/95 text-brand-brown text-[8px] font-bold tracking-wider uppercase px-2.5 py-1.5 rounded-lg shadow-sm border border-brand-brown/5 flex items-center gap-1">
                      <Maximize2 className="w-3 h-3 text-brand-gold" />
                      Ampliar
                    </span>
                  </div>
                </button>
                
                <div>
                  <h4 className="font-serif text-xs font-semibold text-brand-brown">{user.name}</h4>
                  <p className="font-sans text-[9px] text-[#2D241E]/40 font-bold tracking-widest uppercase mt-0.5 font-mono">
                    Socio: {user.qrCode}
                  </p>
                </div>
              </div>
            </div>

            {/* Visual 10-Stamp Card Grid */}
            <div className="bg-white p-5 rounded-3xl border border-[#2D241E]/10 space-y-4 shadow-3xs">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-serif text-sm font-semibold text-brand-brown">Mi Planilla de Sellos</h3>
                  <p className="font-sans text-[10px] text-stone-500">Muestra tu código QR al personal para registrar tu visita. ¡Junta 10 sellos y disfruta tu regalo especial!</p>
                </div>
                <span className="font-serif italic font-bold text-brand-gold text-sm whitespace-nowrap ml-2">{stampCount} / 10</span>
              </div>

              <div className="grid grid-cols-5 gap-3 pt-1">
                {Array.from({ length: 10 }).map((_, idx) => {
                  const stampNum = idx + 1;
                  const isStamped = stampCount >= stampNum;
                  return (
                    <div 
                      key={idx}
                      className="flex flex-col items-center gap-1"
                    >
                      <div 
                        className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                          isStamped 
                            ? 'bg-[#EADED2]/35 border-2 border-brand-gold shadow-2xs rotate-3 scale-105' 
                            : 'border-2 border-dashed border-stone-200 text-stone-300 bg-brand-bg'
                        }`}
                      >
                        {isStamped ? (
                          stampSymbol && (stampSymbol.startsWith('data:image/') || stampSymbol.startsWith('http')) ? (
                            <img src={stampSymbol} alt="Sello" className="w-8 h-8 object-contain select-none animate-scaleUp" referrerPolicy="no-referrer" />
                          ) : (
                            <span className="text-xl filter drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.1)] leading-none select-none animate-scaleUp">{stampSymbol || '🥐'}</span>
                          )
                        ) : (
                          <span className="font-sans text-[9px] font-bold text-stone-400">{stampNum}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Explanatory Info Card */}
            <div className="bg-white rounded-2xl p-4 border border-brand-gold/15 flex items-center justify-between shadow-3xs">
              <div className="space-y-1">
                <span className="font-sans text-[8px] uppercase tracking-wider text-white bg-brand-gold inline-block px-1.5 py-0.5 font-bold">Buttery Club</span>
                <h4 className="font-serif text-xs font-semibold text-brand-brown">¡Tu recompensa espera!</h4>
                <p className="font-sans text-[10px] text-stone-500">Completa tus 10 visitas de fidelidad para obtener una pieza de repostería artesanal recién horneada o café de cortesía.</p>
              </div>
              <Gift className="w-8 h-8 text-brand-gold stroke-1.5 flex-shrink-0 ml-3" />
            </div>

          </div>
        )}

        {activeTab === 'history' && (
          <div className="flex-1 flex flex-col space-y-4 pb-8">
            <h3 className="font-serif text-lg font-medium text-brand-brown flex items-center gap-2">
              <History className="w-4 h-4 text-brand-gold" />
              Historial de Visitas
            </h3>

            {userTransactions.length > 0 ? (
              <div className="space-y-2.5">
                {userTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    id={`tx-card-${tx.id}`}
                    className="p-3.5 bg-white border border-brand-brown/5 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                        tx.type === 'earn' 
                          ? 'bg-brand-bg text-brand-gold border-brand-gold/20' 
                          : 'bg-stone-50 text-stone-450 border-stone-100'
                      }`}>
                        {tx.type === 'earn' ? (
                          <ArrowDownLeft className="w-4 h-4" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <span className="font-serif italic text-xs text-brand-brown block line-clamp-1">{tx.description}</span>
                        <div className="flex items-center gap-1.5 text-[9px] text-stone-400 font-medium font-mono mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(tx.timestamp).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>

                    <span className={`font-sans font-bold text-xs ${
                      tx.type === 'earn' ? 'text-brand-brown' : 'text-stone-400'
                    }`}>
                      {tx.type === 'earn' ? '+' : '-'}{tx.points} {tx.points === 1 ? 'sello' : 'sellos'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 px-6 bg-white border rounded-2xl flex flex-col items-center justify-center space-y-2">
                <Coffee className="w-10 h-10 text-stone-300 stroke-1" />
                <p className="font-serif italic text-xs text-brand-brown">Aún no hay movimientos</p>
                <p className="font-sans text-[10px] text-stone-450 text-center">Tus primeras visitas y canjes de cortesía se listarán en esta sección.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fullscreen QR Code enlargement modal */}
      {fullscreenQr && (
        <div 
          id="qr-fullscreen-modal"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-6 animate-fadeIn"
          onClick={() => setFullscreenQr(false)}
        >
          <div 
            className="w-full max-w-sm bg-white rounded-[2rem] p-6 text-center space-y-6 flex flex-col items-center shadow-2xl scale-100 select-none animate-scaleUp border border-brand-gold/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex justify-between items-center px-1">
              <div className="flex items-center gap-1.55">
                <img 
                  src={butteryLogo}
                  alt="Buttery Logo"
                  className="h-7 w-auto object-contain select-none mix-blend-multiply"
                  referrerPolicy="no-referrer"
                />
              </div>
              <button 
                onClick={() => setFullscreenQr(false)}
                className="font-sans text-[10px] font-bold uppercase tracking-wider text-stone-400 hover:text-brand-brown cursor-pointer"
              >
                Cerrar
              </button>
            </div>

            <div className="w-56 h-56 bg-stone-50 p-4 border border-[#2D241E]/5 rounded-2xl shadow-inner flex items-center justify-center">
              <img 
                src={qrCodeUrl} 
                alt="Loyalty QR Big" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="space-y-1">
              <h4 className="font-serif text-sm font-semibold text-[#2D241E]">{user.name}</h4>
              <p className="font-sans text-[10px] text-brand-gold font-bold font-mono tracking-wider">CÓDIGO: {user.qrCode}</p>
            </div>

            <p className="font-sans text-[10px] text-stone-500 leading-relaxed max-w-xs">
              Muestra este código exclusivo de membresía en caja al ordenar en Buttery Polanco. El staff sumará tu sello de visita al instante.
            </p>
          </div>
        </div>
      )}

      {/* 10 Stamps Completion Celebratory Pop Up Screen */}
      {stampCount === 10 && (
        <div 
          id="stamps-completed-modal"
          className="fixed inset-0 z-50 bg-[#1C1A17]/85 backdrop-blur-md flex items-center justify-center p-6 animate-fadeIn"
        >
          <div 
            className="w-full max-w-sm bg-white rounded-[2.5rem] p-8 text-center space-y-6 flex flex-col items-center shadow-2xl scale-100 select-none animate-scaleUp border border-brand-gold/30 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top gold ambient light ribbon */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-gold via-yellow-400 to-brand-gold"></div>

            {/* Pulsing Croissant Illustration Hero */}
            <div className="relative my-2">
              <div className="absolute inset-0 bg-brand-gold/15 rounded-full blur-xl scale-150 animate-pulse"></div>
              <div className="w-24 h-24 bg-gradient-to-br from-brand-bg to-[#EADED2] rounded-full flex items-center justify-center shadow-lg border border-brand-gold/30 relative">
                {stampSymbol && (stampSymbol.startsWith('data:image/') || stampSymbol.startsWith('http')) ? (
                  <img src={stampSymbol} alt="Sello" className="w-14 h-14 object-contain select-none animate-pulse" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-5xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)] leading-none select-none animate-pulse">{stampSymbol || '🥐'}</span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <span className="font-sans text-[9px] tracking-[0.25em] font-extrabold text-[#C5A059] uppercase block">
                Planilla Completada
              </span>
              <h3 className="font-serif italic text-2xl font-semibold text-brand-brown leading-tight">
                ¡Felicidades, {user.name}!
              </h3>
              <p className="font-sans text-[11px] text-brand-brown/75 leading-relaxed max-w-xs mt-2">
                Has reunido tus <strong>10 sellos</strong> de visita. Muestra esta pantalla dorada de recompensa al staff de <strong>Buttery Polanco</strong> para recibir tu pan o bebida de cortesía de la casa.
              </p>
            </div>

            <div className="w-full pt-2">
              <button
                id="claim-reward-btn"
                onClick={() => {
                  if (onClaimCompletedCard) {
                    onClaimCompletedCard();
                  }
                }}
                className="w-full py-4 bg-brand-brown hover:bg-brand-gold text-brand-bg rounded-2xl font-sans text-xs font-bold tracking-widest uppercase shadow-md transition-all active:scale-[0.98] cursor-pointer hover:shadow-lg flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-brand-gold fill-brand-gold" />
                Registrar Canje con el Staff
              </button>
              
              <p className="font-sans text-[9px] text-stone-400 mt-3 font-medium">
                Al presionar este botón, tu planilla se reiniciará a 0 sellos.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
