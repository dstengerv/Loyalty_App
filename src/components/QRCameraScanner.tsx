import { useEffect, useRef, useState } from 'react';
import { Camera, Check, X, QrCode, ScanLine } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { QRVoucher } from '../types';

interface QRCameraScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
  title: string;
  subtitle: string;
  role: 'client' | 'staff'; // Staff scans client QR, Client scans voucher QR
  simulatedVouchers?: QRVoucher[]; // List of vouchers available for client to scan
  simulatedClientQRs?: { name: string; qrCode: string; points: number }[]; // List of client QRs for staff to scan
}

export default function QRCameraScanner({
  onScanSuccess,
  onClose,
  title,
  subtitle,
  role,
  simulatedVouchers = [],
  simulatedClientQRs = [],
}: QRCameraScannerProps) {
  const [useCamera, setUseCamera] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const [scanFeedback, setScanFeedback] = useState<string | null>(null);

  // Manual code entry
  const [manualCode, setManualCode] = useState<string>('');

  // Initialize camera scanner if requested
  useEffect(() => {
    if (useCamera) {
      setCameraError(null);
      isProcessingRef.current = false;
      // Wait for DOM node to be ready
      const timer = setTimeout(() => {
        try {
          const html5QrCode = new Html5Qrcode('reader');
          scannerRef.current = html5QrCode;

          html5QrCode.start(
            { facingMode: 'environment' }, // Forzar cámara trasera del celular
            {
              fps: 10,
              qrbox: { width: 220, height: 220 },
              aspectRatio: 1.0,
            },
            (decodedText) => {
              if (isProcessingRef.current) return;
              isProcessingRef.current = true;

              setScanFeedback('¡Código escaneado con éxito!');
              setTimeout(() => {
                if (scannerRef.current && scannerRef.current.isScanning) {
                  scannerRef.current.stop()
                    .then(() => {
                      onScanSuccess(decodedText);
                    })
                    .catch((err) => {
                      console.error('Error stopping qr scanner:', err);
                      onScanSuccess(decodedText);
                    });
                } else {
                  onScanSuccess(decodedText);
                }
              }, 1000);
            },
            () => {
              // Ignorar callbacks fallidos de escaneo continuo para evitar spam logs
            }
          ).catch((err) => {
            console.error('Error starting camera qr scanner:', err);
            setCameraError(
              'No se pudo acceder a la cámara trasera. Otorga los permisos necesarios o ingresa el código manualmente.'
            );
            setUseCamera(false);
          });

        } catch (err: any) {
          console.error('Error starting camera qr scanner:', err);
          setCameraError(
            'No se pudo acceder a la cámara. Otorga los permisos necesarios o ingresa el código manualmente.'
          );
          setUseCamera(false);
        }
      }, 300);

      return () => {
        clearTimeout(timer);
        if (scannerRef.current) {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().catch((e) => console.log('Error stopping scanner on unmount: ', e));
          }
          scannerRef.current = null;
        }
      };
    }
  }, [useCamera, onScanSuccess]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = manualCode.trim();
    if (!code) return;
    setScanFeedback('Procesando código...');
    setTimeout(() => {
      onScanSuccess(code);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-sm md:justify-center md:items-center p-0 md:p-4 font-sans">
      <div
        id="scanner-modal"
        className="w-full max-w-md bg-[#FAF7F2] rounded-t-[2rem] md:rounded-[2rem] shadow-2xl overflow-hidden text-[#1C2117] flex flex-col max-h-[88vh] md:max-h-[90vh] animate-scaleUp"
      >
        {/* Grab handle (mobile) */}
        <div className="md:hidden pt-3 pb-1 flex justify-center">
          <div className="w-10 h-1 rounded-full bg-[#1C2117]/15" />
        </div>

        {/* Header */}
        <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-sans text-[9px] uppercase tracking-[0.3em] text-[#1C2117]/45 font-bold">Check-in</p>
            <h3 className="font-serif text-xl font-medium tracking-tight text-[#1C2117] mt-1">
              {title}
            </h3>
            <p className="font-sans text-xs text-[#1C2117]/50 mt-1 leading-relaxed">{subtitle}</p>
          </div>
          <button
            id="close-scanner-btn"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#FDFBF7] border border-[#1C2117]/10 hover:border-[#1C2117]/30 flex items-center justify-center text-[#1C2117]/50 hover:text-[#1C2117] cursor-pointer transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content area */}
        <div className="px-6 pb-2 overflow-y-auto flex-1 flex flex-col items-center">

          {scanFeedback ? (
            /* ── Success state ── */
            <div className="w-full py-16 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#2D4A2E] flex items-center justify-center">
                <Check className="w-8 h-8 text-white" strokeWidth={2.5} />
              </div>
              <p className="font-serif font-medium text-[#1C2117] text-lg">{scanFeedback}</p>
              <p className="font-sans text-xs text-[#1C2117]/45">Actualizando su planilla de sellos...</p>
            </div>
          ) : useCamera ? (
            /* ── Live camera ── */
            <div className="w-full flex flex-col items-center py-2">
              <div className="relative w-full max-w-[300px]">
                <div id="reader" className="w-full overflow-hidden rounded-2xl bg-black aspect-square"></div>
                {/* Corner framing overlay */}
                <div className="pointer-events-none absolute inset-0 rounded-2xl">
                  <span className="absolute top-3 left-3 w-7 h-7 border-t-2 border-l-2 border-white/80 rounded-tl-lg" />
                  <span className="absolute top-3 right-3 w-7 h-7 border-t-2 border-r-2 border-white/80 rounded-tr-lg" />
                  <span className="absolute bottom-3 left-3 w-7 h-7 border-b-2 border-l-2 border-white/80 rounded-bl-lg" />
                  <span className="absolute bottom-3 right-3 w-7 h-7 border-b-2 border-r-2 border-white/80 rounded-br-lg" />
                </div>
              </div>
              <p className="font-sans text-xs text-[#1C2117]/50 mt-4 flex items-center gap-2">
                <ScanLine className="w-3.5 h-3.5" />
                Alinea el código QR dentro del recuadro
              </p>
              <button
                id="stop-camera-btn"
                onClick={() => {
                  if (scannerRef.current && scannerRef.current.isScanning) {
                    scannerRef.current.stop().catch(() => {});
                  }
                  setUseCamera(false);
                }}
                className="mt-4 font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-[#1C2117]/55 hover:text-[#1C2117] underline underline-offset-4 decoration-[#1C2117]/20 hover:decoration-[#1C2117] cursor-pointer transition-colors"
              >
                Detener cámara
              </button>
            </div>
          ) : (
            /* ── Idle: camera trigger + manual entry ── */
            <div className="w-full flex flex-col items-center space-y-5 py-2">

              {/* Camera trigger card */}
              <div className="w-full bg-[#FDFBF7] p-7 rounded-2xl border border-[#1C2117]/10 flex flex-col items-center text-center space-y-4">
                <div className="relative w-fit">
                  <div className="w-20 h-20 rounded-full bg-[#2D4A2E] text-[#FAF7F2] flex items-center justify-center">
                    <QrCode className="w-8 h-8" />
                  </div>
                  <span className="absolute top-0 right-0 w-3 h-3 bg-[#C5A059] rounded-full border-2 border-[#FDFBF7]" />
                </div>
                <div>
                  <h4 className="font-serif text-lg font-medium tracking-tight text-[#1C2117]">Cámara del dispositivo</h4>
                  <p className="font-sans text-xs text-[#1C2117]/50 mt-1.5 leading-relaxed max-w-xs">
                    {role === 'staff'
                      ? 'Apunta la cámara a la planilla del socio para registrar su visita en tiempo real.'
                      : 'Sostén tu celular frente al código para escanearlo en tiempo real.'}
                  </p>
                </div>

                {cameraError && (
                  <p className="font-sans text-xs text-center text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-100 max-w-xs">{cameraError}</p>
                )}

                <button
                  id="activate-camera-btn"
                  onClick={() => setUseCamera(true)}
                  className="w-full max-w-xs bg-[#2D4A2E] hover:bg-[#243B25] text-[#FAF7F2] font-sans text-xs font-bold uppercase tracking-[0.2em] py-4 px-4 rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-2.5"
                >
                  <Camera className="w-4 h-4" />
                  Activar cámara
                </button>
              </div>

              {/* Manual entry */}
              <div className="w-full">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px flex-1 bg-[#1C2117]/10" />
                  <span className="font-sans text-[9px] uppercase tracking-[0.2em] text-[#1C2117]/40 font-bold">O ingresa el código</span>
                  <div className="h-px flex-1 bg-[#1C2117]/10" />
                </div>
                <form onSubmit={handleManualSubmit} className="flex gap-2">
                  <input
                    id="manual-scan-input"
                    type="text"
                    placeholder={role === 'staff' ? 'Código de membresía' : 'Código del cupón'}
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    className="flex-1 bg-[#FDFBF7] border border-[#1C2117]/15 rounded-xl py-3 px-4 text-sm text-[#1C2117] placeholder:text-[#1C2117]/35 focus:outline-none focus:border-[#1C2117] transition-colors font-mono uppercase min-w-0"
                  />
                  <button
                    type="submit"
                    id="manual-scan-submit"
                    disabled={!manualCode.trim()}
                    className={`px-5 rounded-xl font-sans text-[10px] font-bold uppercase tracking-[0.15em] transition-colors shrink-0 ${
                      manualCode.trim()
                        ? 'bg-[#2D4A2E] hover:bg-[#243B25] text-[#FAF7F2] cursor-pointer'
                        : 'bg-[#EDE6DA] text-[#1C2117]/30 cursor-not-allowed'
                    }`}
                  >
                    Enviar
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!scanFeedback && (
          <div className="px-6 py-4 flex justify-end">
            <button
              id="close-scanner-footer-btn"
              onClick={onClose}
              className="font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-[#1C2117]/50 hover:text-[#1C2117] py-2 px-4 cursor-pointer transition-colors"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}