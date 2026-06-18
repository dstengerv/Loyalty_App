import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, Plus, Sparkles, Check, RefreshCw, X } from 'lucide-react';
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
  const [scanFeedback, setScanFeedback] = useState<string | null>(null);

  // Initialize camera scanner if requested
  useEffect(() => {
    if (useCamera) {
      setCameraError(null);
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
              // Beep sound effect simulated via audio if possible or visual
              setScanFeedback("¡Código escaneado con éxito!");
              setTimeout(() => {
                if (scannerRef.current && scannerRef.current.isScanning) {
                  scannerRef.current.stop()
                    .then(() => {
                      onScanSuccess(decodedText);
                    })
                    .catch((err) => {
                      console.error("Error stopping qr scanner:", err);
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
            console.error("Error starting camera qr scanner:", err);
            setCameraError(
              "No se pudo acceder a la cámara trasera. Asegúrate de otorgar los permisos necesarios o utiliza un simulador abajo."
            );
            setUseCamera(false);
          });

        } catch (err: any) {
          console.error("Error starting camera qr scanner:", err);
          cameraErrorCheck();
        }
      }, 300);

      const cameraErrorCheck = () => {
        setCameraError(
          "No se pudo acceder a la cámara. Asegúrate de dar los permisos necesarios o utiliza el simulador rápido abajo."
        );
        setUseCamera(false);
      };

      return () => {
        clearTimeout(timer);
        if (scannerRef.current) {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().catch((e) => console.log("Error stopping scanner on unmount: ", e));
          }
          scannerRef.current = null;
        }
      };
    }
  }, [useCamera, onScanSuccess]);

  const handleSimulatedScan = (code: string) => {
    setScanFeedback("¡Procesando código de prueba...!");
    // Soft delay for ultra realism
    setTimeout(() => {
      onScanSuccess(code);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-brand-brown/70 backdrop-blur-xs md:justify-center md:items-center p-4">
      <div 
        id="scanner-modal"
        className="w-full max-w-md bg-[#FAF7F2] rounded-t-3xl md:rounded-3xl border border-brand-brown/10 shadow-2xl overflow-hidden text-brand-brown flex flex-col max-h-[85vh] md:max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-brand-brown/5 flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg font-semibold text-brand-brown flex items-center gap-2">
              <Camera className="w-5 h-5 text-brand-gold" />
              {title}
            </h3>
            <p className="font-sans text-xs text-stone-500 mt-0.5">{subtitle}</p>
          </div>
          <button 
            id="close-scanner-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content area */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center">
          
          {scanFeedback ? (
            <div className="w-full py-16 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-brand-gold flex items-center justify-center animate-bounce scale-110">
                <Check className="w-8 h-8 text-white" />
              </div>
              <p className="font-serif italic font-medium text-brand-brown text-base">{scanFeedback}</p>
              <p className="font-sans text-xs text-stone-400">Actualizando tu balance...</p>
            </div>
          ) : useCamera ? (
            <div className="w-full flex flex-col items-center">
              <div id="reader" className="w-full max-w-[280px] overflow-hidden rounded-2xl border border-stone-200 bg-black"></div>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center space-y-6">
              {/* Camera trigger */}
              <div className="w-full bg-white p-5 rounded-2xl border border-brand-brown/5 flex flex-col items-center text-center space-y-3 shadow-3xs">
                <div className="w-12 h-12 rounded-full bg-[#FAF7F2] text-brand-gold border border-brand-gold/20 flex items-center justify-center shadow-xs">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-serif text-sm font-semibold text-brand-brown">Cámara del Dispositivo</h4>
                  <p className="font-sans text-xs text-stone-500 mt-1">Sostén tu celular frente al código para escanear en tiempo real.</p>
                </div>
                {cameraError && (
                  <p className="font-sans text-xs text-center text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100 max-w-xs">{cameraError}</p>
                )}
                <button
                  id="activate-camera-btn"
                  onClick={() => setUseCamera(true)}
                  className="w-full bg-brand-brown hover:bg-brand-gold text-white font-sans text-[10px] font-bold uppercase tracking-widest py-3 px-4 rounded-xl cursor-pointer transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  Activar Cámara Web
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#FAF7F2] border-t border-brand-brown/5 flex justify-end">
          <button
            id="close-scanner-footer-btn"
            onClick={onClose}
            className="font-sans text-[10px] font-bold uppercase tracking-widest text-[#2D241E]/60 hover:text-[#2D241E] py-2 px-4 cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
