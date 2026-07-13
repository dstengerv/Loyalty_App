import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Mail, 
  User as UserIcon, 
  Sparkles, 
  Coffee, 
  ChevronRight, 
  QrCode, 
  CheckCircle,
  Clock,
  AlertCircle,
  Info
} from 'lucide-react';
import { User, Transaction, RewardItem, QRVoucher, UserRole } from './types';
import { SEED_USERS, SEED_TRANSACTIONS, SEED_VOUCHERS, REWARDS } from './data';
import CustomerDashboard from './components/CustomerDashboard';
import StaffDashboard from './components/StaffDashboard';
import QRCameraScanner from './components/QRCameraScanner';
import butteryLogo from './assets/buttery_logo.svg';
import { supabase, isSupabaseConfigured } from './lib/supabase';


export default function App() {
  // Application Data States
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('buttery_users');
    const parsed: User[] = saved ? JSON.parse(saved) : SEED_USERS;
    return parsed.map(u => u.role === 'client' && u.points > 10 ? { ...u, points: 10 } : u);
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('buttery_transactions');
    const parsed: Transaction[] = saved ? JSON.parse(saved) : SEED_TRANSACTIONS;
    return parsed.map(t => {
      if (t.points > 10) {
        return {
          ...t,
          points: t.type === 'earn' ? 1 : 10,
          description: t.description
            .replace(/\+50\s*sellos|\+120\s*sellos/gi, '+1 sello')
            .replace(/-80\s*sellos|-50\s*sellos/gi, '-10 sellos')
            .replace('Canjeó recompensa: Café de Especialidad Gratis', 'Canjeó cortesía registrada por staff en mostrador')
            .replace('Canje: Café de Especialidad Gratis', 'Canjeó cortesía registrada por staff en mostrador')
            .replace('Desayuno Buttery Signature - Polanco CDMX', 'Consumo en barra - Sello de visita')
            .replace('Consumo ticket #4392 - Barra Especial Polanco', 'Consumo en barra - Sello de visita')
        };
      }
      return t;
    });
  });

  const [vouchers, setVouchers] = useState<QRVoucher[]>(() => {
    const saved = localStorage.getItem('buttery_vouchers');
    return saved ? JSON.parse(saved) : SEED_VOUCHERS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('buttery_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Supabase states
  const [supabaseLoading, setSupabaseLoading] = useState<boolean>(false);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);
  const [supabaseStatus, setSupabaseStatus] = useState<'unconfigured' | 'connecting' | 'success' | 'table_error' | 'error'>(() => {
    return isSupabaseConfigured ? 'connecting' : 'unconfigured';
  });

  // Pull data from Supabase on startup if configured
  useEffect(() => {
    async function loadSupabaseData() {
      if (!isSupabaseConfigured || !supabase) {
        setSupabaseStatus('unconfigured');
        return;
      }

      setSupabaseLoading(true);
      setSupabaseStatus('connecting');
      setSupabaseError(null);

      try {
        // Fetch profiles
        const { data: dbProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*');

        if (profilesError) throw profilesError;

        // Fetch transactions
        const { data: dbTransactions, error: txError } = await supabase
          .from('transactions')
          .select('*');

        if (txError) throw txError;

        // Fetch vouchers
        const { data: dbVouchers, error: vouchersError } = await supabase
          .from('vouchers')
          .select('*');

        if (vouchersError) throw vouchersError;

        // Fetch settings safely
        try {
          const { data: dbSettings, error: settingsError } = await supabase
            .from('app_settings')
            .select('*')
            .eq('id', 'default')
            .maybeSingle();

          if (!settingsError && dbSettings) {
            setStampSymbol(dbSettings.stamp_symbol || '🥐');
            setBrandBrown(dbSettings.brand_brown || '#2D241E');
            setBrandGold(dbSettings.brand_gold || '#C5A059');
            setBrandBg(dbSettings.brand_bg || '#FAF7F2');
            setSettingsPin(dbSettings.settings_pin || '1234');
            setLogoUrl(dbSettings.logo_url || '');
            setLogoHeight(dbSettings.logo_height !== undefined && dbSettings.logo_height !== null ? Number(dbSettings.logo_height) : 40);
            setCardBgUrl(dbSettings.card_bg_url || 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80');

            localStorage.setItem('buttery_stamp_symbol', dbSettings.stamp_symbol || '🥐');
            localStorage.setItem('buttery_brand_brown', dbSettings.brand_brown || '#2D241E');
            localStorage.setItem('buttery_brand_gold', dbSettings.brand_gold || '#C5A059');
            localStorage.setItem('buttery_brand_bg', dbSettings.brand_bg || '#FAF7F2');
            localStorage.setItem('buttery_settings_pin', dbSettings.settings_pin || '1234');
            localStorage.setItem('buttery_logo_url', dbSettings.logo_url || '');
            localStorage.setItem('buttery_logo_height', (dbSettings.logo_height !== undefined && dbSettings.logo_height !== null ? dbSettings.logo_height : 40).toString());
            localStorage.setItem('buttery_card_bg_url', dbSettings.card_bg_url || 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80');
          }
        } catch (settingsErr) {
          console.warn('Fallback: Could not fetch app_settings table or it is not provisioned yet.', settingsErr);
        }

        // Map data
        const mappedUsers: User[] = (dbProfiles || []).map(p => ({
          id: p.id,
          name: p.name,
          email: p.email,
          role: p.role as UserRole,
          points: p.points,
          qrCode: p.qr_code,
          createdAt: p.created_at,
          password: p.password || '1234'
        }));

        const mappedTxs: Transaction[] = (dbTransactions || []).map(t => ({
          id: t.id,
          userId: t.user_id,
          userName: t.user_name,
          points: t.points,
          type: t.type as 'earn' | 'redeem',
          description: t.description,
          timestamp: t.timestamp,
          staffName: t.staff_name
        }));

        const mappedVouchers: QRVoucher[] = (dbVouchers || []).map(v => ({
          code: v.code,
          points: v.points,
          description: v.description,
          isUsed: v.is_used,
          createdAt: v.created_at
        }));

        setUsers(mappedUsers);
        setTransactions(mappedTxs);
        setVouchers(mappedVouchers);
        setSupabaseStatus('success');

        // Refresh currently logged in session data
        const savedCurrentUser = localStorage.getItem('buttery_current_user');
        if (savedCurrentUser) {
          const parsedUser = JSON.parse(savedCurrentUser);
          const freshUser = mappedUsers.find(u => u.id === parsedUser.id);
          if (freshUser) {
            setCurrentUser(freshUser);
          }
        }
      } catch (err: any) {
        console.error('Error fetching from Supabase:', err);
        setSupabaseError(err.message || 'Error de conexión');
        if (err.code === '42P01') {
          setSupabaseStatus('table_error');
        } else {
          setSupabaseStatus('error');
        }
      } finally {
        setSupabaseLoading(false);
      }
    }

    loadSupabaseData();
  }, []);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('buttery_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('buttery_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('buttery_vouchers', JSON.stringify(vouchers));
  }, [vouchers]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('buttery_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('buttery_current_user');
    }
  }, [currentUser]);

  // Dynamic Brand Theme & Config States
  const [stampSymbol, setStampSymbol] = useState<string>(() => localStorage.getItem('buttery_stamp_symbol') || '🥐');
  const [brandBrown, setBrandBrown] = useState<string>(() => localStorage.getItem('buttery_brand_brown') || '#2D241E');
  const [brandGold, setBrandGold] = useState<string>(() => localStorage.getItem('buttery_brand_gold') || '#C5A059');
  const [brandBg, setBrandBg] = useState<string>(() => localStorage.getItem('buttery_brand_bg') || '#FAF7F2');
  const [settingsPin, setSettingsPin] = useState<string>(() => localStorage.getItem('buttery_settings_pin') || '1234');
  const [logoUrl, setLogoUrl] = useState<string>(() => localStorage.getItem('buttery_logo_url') || '');
  const [logoHeight, setLogoHeight] = useState<number>(() => {
    const saved = localStorage.getItem('buttery_logo_height');
    return saved ? parseInt(saved, 10) : 40;
  });
  const [cardBgUrl, setCardBgUrl] = useState<string>(() => localStorage.getItem('buttery_card_bg_url') || 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80');

  const handleUpdateSettings = async (stamp: string, brown: string, gold: string, bg: string, newPin: string, logo: string, height: number, newCardBgUrl: string) => {
    setStampSymbol(stamp);
    setBrandBrown(brown);
    setBrandGold(gold);
    setBrandBg(bg);
    setSettingsPin(newPin);
    setLogoUrl(logo);
    setLogoHeight(height);
    setCardBgUrl(newCardBgUrl);
    localStorage.setItem('buttery_stamp_symbol', stamp);
    localStorage.setItem('buttery_brand_brown', brown);
    localStorage.setItem('buttery_brand_gold', gold);
    localStorage.setItem('buttery_brand_bg', bg);
    localStorage.setItem('buttery_settings_pin', newPin);
    localStorage.setItem('buttery_logo_url', logo);
    localStorage.setItem('buttery_logo_height', height.toString());
    localStorage.setItem('buttery_card_bg_url', newCardBgUrl);

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('app_settings')
          .upsert({
            id: 'default',
            stamp_symbol: stamp,
            brand_brown: brown,
            brand_gold: gold,
            brand_bg: bg,
            settings_pin: newPin,
            logo_url: logo,
            logo_height: height,
            card_bg_url: newCardBgUrl,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });

        if (error) {
          console.error('Error saving settings to Supabase:', error);
          showToast('Guardado localmente, pero falló en la base de datos', 'error');
        } else {
          showToast('¡Configuración sincronizada con la base de datos!', 'success');
        }
      } catch (err) {
        console.error('Database connection exception saving settings:', err);
        showToast('Guardado localmente, pero falló la sincronización', 'error');
      }
    } else {
      showToast('¡Configuración de marca aplicada correctamente!', 'success');
    }
  };

  // View States
  const [currentPath, setCurrentPath] = useState<string>(() => {
    const path = window.location.pathname;
    const hash = window.location.hash;
    const search = window.location.search;
    
    if (hash.includes('staff') || search.includes('role=staff') || search.includes('staff')) {
      return '/staff';
    }
    if (hash.includes('customer') || search.includes('role=customer') || search.includes('customer')) {
      return '/customer';
    }
    return path;
  });

  // Sync with browser navigation
  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      const search = window.location.search;
      
      if (hash.includes('staff') || search.includes('role=staff') || search.includes('staff')) {
        setCurrentPath('/staff');
      } else if (hash.includes('customer') || search.includes('role=customer') || search.includes('customer')) {
        setCurrentPath('/customer');
      } else {
        setCurrentPath(path);
      }
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const navigateTo = (newPath: string) => {
    const isStaff = newPath.includes('staff');
    const hashValue = isStaff ? '#staff' : '#customer';
    window.location.hash = hashValue;
    setCurrentPath(newPath);
  };

  const loginRole: UserRole = currentPath.startsWith('/staff') ? 'staff' : 'client';
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [scannerOpen, setScannerOpen] = useState<boolean>(false);

  // Form Inputs
  const [nameInput, setNameInput] = useState<string>('');
  const [emailInput, setEmailInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState<string>('');

  // Authentication error message
  const [authError, setAuthError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Helper to show elegant full-screen safe messages
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setSuccessToast({ message, type });
  };

  // Automatically clear toast whenever it gets set
  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => {
        setSuccessToast(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  // Login handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    
    const userEmail = emailInput.trim().toLowerCase();
    const found = users.find(u => u.email === userEmail && u.role === loginRole);
    
    if (!found) {
      setAuthError(`No se encontró ningún ${loginRole === 'client' ? 'socio' : 'miembro de staff'} con este correo de prueba.`);
      return;
    }

    // Validate Password
    const savedPassword = found.password || '1234';
    if (passwordInput !== savedPassword) {
      setAuthError("La contraseña ingresada es incorrecta. Por favor, de nuevo.");
      return;
    }

    // Success Authentication
    setCurrentUser(found);
    showToast(`¡Bienvenido de vuelta, ${found.name}!`, 'success');

    // Reset inputs
    setEmailInput('');
    setPasswordInput('');
  };

  // Sign up handler
  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!nameInput.trim()) {
      setAuthError("Por favor, ingresa tu nombre de socio.");
      return;
    }
    if (!emailInput.trim() || !emailInput.includes('@')) {
      setAuthError("Por favor, ingresa un correo electrónico válido.");
      return;
    }
    if (passwordInput.length < 4) {
      setAuthError("Establece una contraseña de al menos 4 caracteres.");
      return;
    }
    if (passwordInput !== confirmPasswordInput) {
      setAuthError("Las contraseñas no coinciden.");
      return;
    }

    const emailLower = emailInput.trim().toLowerCase();
    const exists = users.some(u => u.email === emailLower);
    if (exists) {
      setAuthError("Este correo electrónico ya está registrado como socio.");
      return;
    }

    const newCode = `BUTTERY-CLIENT-${Math.floor(1000 + Math.random() * 9000)}`;

    const newUser: User = {
      id: `c_${Date.now()}`,
      name: nameInput.trim(),
      email: emailLower,
      role: 'client',
      points: 1, // 1 welcome stamp!
      qrCode: newCode,
      createdAt: new Date().toISOString(),
      password: passwordInput
    };

    // Update state
    setUsers(prev => [...prev, newUser]);
    
    // Auto login
    setCurrentUser(newUser);

    // Welcome Transaction
    const welcomeTx: Transaction = {
      id: `tx_welcome_${Date.now()}`,
      userId: newUser.id,
      userName: newUser.name,
      points: 1,
      type: 'earn',
      description: 'Sello de Bienvenida Buttery Club Polanco',
      timestamp: new Date().toISOString()
    };
    setTransactions(prev => [...prev, welcomeTx]);

    // Supabase Sync
    if (isSupabaseConfigured && supabase) {
      supabase.from('profiles').insert([{
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        points: newUser.points,
        qr_code: newUser.qrCode,
        created_at: newUser.createdAt,
        password: newUser.password
      }]).then(({ error }) => { if (error) console.error('Supabase Error profile:', error); });

      supabase.from('transactions').insert([{
        id: welcomeTx.id,
        user_id: welcomeTx.userId,
        user_name: welcomeTx.userName,
        points: welcomeTx.points,
        type: welcomeTx.type,
        description: welcomeTx.description,
        timestamp: welcomeTx.timestamp,
        staff_name: welcomeTx.staffName || null
      }]).then(({ error }) => { if (error) console.error('Supabase Error transaction:', error); });
    }

    showToast(`¡Cuenta creada! ¡Estrenas tu tarjeta con 1 sello de cortesía!`, 'success');

    // Reset inputs
    setNameInput('');
    setEmailInput('');
    setPasswordInput('');
    setConfirmPasswordInput('');
    setIsRegistering(false);
  };

  // Points Add (for Staff scans)
  const handleAddPointsFromStaff = (userQrCode: string, points: number, description: string) => {
    const targetUserIndex = users.findIndex(u => u.qrCode === userQrCode && u.role === 'client');
    if (targetUserIndex === -1) {
      showToast("No se localizó al socio correspondiente para ese código QR.", "error");
      return;
    }

    const targetUser = users[targetUserIndex];

    const updatedUsers = [...users];
    
    // Calculate final next points clamped to maximum 10
    let nextPoints = Math.min(10, targetUser.points + points);
    let reachedTen = nextPoints === 10;

    updatedUsers[targetUserIndex] = {
      ...targetUser,
      points: nextPoints
    };

    setUsers(updatedUsers);

    // Record Transaction
    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      userId: targetUser.id,
      userName: targetUser.name,
      points: points,
      type: 'earn',
      description: reachedTen ? `${description} (¡Alcanzó 10 sellos! Listo para canje)` : description,
      timestamp: new Date().toISOString(),
      staffName: currentUser?.name || 'Barista Buttery'
    };

    setTransactions(prev => [...prev, newTx]);

    // Supabase Sync
    if (isSupabaseConfigured && supabase) {
      supabase.from('profiles').update({ points: nextPoints }).eq('id', targetUser.id).then(({ error }) => {
        if (error) console.error('Supabase Error update points:', error);
      });

      supabase.from('transactions').insert([{
        id: newTx.id,
        user_id: newTx.userId,
        user_name: newTx.userName,
        points: newTx.points,
        type: newTx.type,
        description: newTx.description,
        timestamp: newTx.timestamp,
        staff_name: newTx.staffName || null
      }]).then(({ error }) => {
        if (error) console.error('Supabase Error transaction:', error);
      });
    }

    // If currently logged in user is the target client, let's sync their user points state
    if (currentUser && currentUser.id === targetUser.id) {
      setCurrentUser(updatedUsers[targetUserIndex]);
    }

    // Interactive Toast Confirmation
    if (reachedTen) {
      showToast(`¡Mágica visita! ${targetUser.name} ha alcanzado 10/10 sellos. ¡Felicidades! Ahora puede reclamar su Pan de cortesía.`, "success");
    } else {
      showToast(`¡Excelente! Has registrado +1 sello para ${targetUser.name}. (${nextPoints}/10 sellos)`, "success");
    }
  };

  // Points Voucher Code scan (for Client scans a printed QR voucher code)
  const handleVoucherScannedByClient = (scannedCode: string) => {
    if (!currentUser) return;

    // Check if voucher code exists
    const voucherIndex = vouchers.findIndex(v => v.code === scannedCode);
    if (voucherIndex === -1) {
      // Maybe the scanned code was actually standard client QR code instead? Let's check:
      if (scannedCode.startsWith("BUTTERY-CLIENT-")) {
        showToast("¡Ese es un código de cliente, no un boleto de sellos! Únicamente el personal puede escanear tu tarjeta.", "error");
      } else {
        showToast("Código QR inválido o expirado. Inténtalo de nuevo.", "error");
      }
      setScannerOpen(false);
      return;
    }

    const voucher = vouchers[voucherIndex];
    if (voucher.isUsed) {
      showToast("Este código QR ya fue canjeado anteriormente por otro socio.", "error");
      setScannerOpen(false);
      return;
    }

    // Update voucher used status
    const updatedVouchers = [...vouchers];
    updatedVouchers[voucherIndex] = {
      ...voucher,
      isUsed: true
    };
    setVouchers(updatedVouchers);

    // Update user points
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
      const updatedUsers = [...users];
      let nextPoints = Math.min(10, currentUser.points + voucher.points);
      let reachedTen = nextPoints === 10;
      
      updatedUsers[userIndex] = {
        ...currentUser,
        points: nextPoints
      };
      setUsers(updatedUsers);
      setCurrentUser(updatedUsers[userIndex]);

      // Record Transaction
      const newTx: Transaction = {
        id: `tx_voucher_${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        points: voucher.points,
        type: 'earn',
        description: reachedTen ? `Canje de cupón: ${voucher.description} (¡Alcanzó 10 sellos! Listo para canje)` : `Canje de cupón: ${voucher.description}`,
        timestamp: new Date().toISOString()
      };
      setTransactions(prev => [...prev, newTx]);

      // Supabase Sync
      if (isSupabaseConfigured && supabase) {
        supabase.from('vouchers').update({ is_used: true }).eq('code', voucher.code).then(({ error }) => {
          if (error) console.error('Supabase Error voucher:', error);
        });

        supabase.from('profiles').update({ points: nextPoints }).eq('id', currentUser.id).then(({ error }) => {
          if (error) console.error('Supabase Error points:', error);
        });

        supabase.from('transactions').insert([{
          id: newTx.id,
          user_id: newTx.userId,
          user_name: newTx.userName,
          points: newTx.points,
          type: newTx.type,
          description: newTx.description,
          timestamp: newTx.timestamp,
          staff_name: newTx.staffName || null
        }]).then(({ error }) => {
          if (error) console.error('Supabase Error transaction:', error);
        });
      }

      if (reachedTen) {
        showToast("¡Felicidades! Has completado tu planilla de 10 sellos. Abre tu Tarjeta para registrar tu canje.", "success");
      } else {
        showToast(`¡Cupón canjeado con éxito! Sumaste ${voucher.points} ${voucher.points === 1 ? 'sello' : 'sellos'}.`, "success");
      }
    }
    
    setScannerOpen(false);
  };

  // Staff scans Client QR code
  const handleClientQrScannedByStaff = (scannedCode: string) => {
    const matchedClient = users.find(u => u.qrCode === scannedCode && u.role === 'client');
    if (!matchedClient) {
      // Check if it's a voucher instead
      if (scannedCode.startsWith("BUTTERY-VOUCHER-")) {
        showToast("Este es un boleto de sellos para clientes, por favor selecciona una tarjeta de socio para escanear.", "error");
      } else {
        showToast(`Código no reconocido en el sistema.`, "error");
      }
      setScannerOpen(false);
      return;
    }

    // Every scan of the QR code awards exactly 1 stamp!
    const defaultPointsAward = 1;
    handleAddPointsFromStaff(scannedCode, defaultPointsAward, "Sello de visita por escaneo de código QR");
    setScannerOpen(false);
  };

  // Generate a voucher with points
  const handleGeneratePointsVoucher = (points: number, description: string) => {
    const newVCode = `BUTTERY-VOUCHER-${Math.floor(100000 + Math.random() * 900000)}`;
    const newVoucher: QRVoucher = {
      code: newVCode,
      points: points,
      description: description,
      isUsed: false,
      createdAt: new Date().toISOString()
    };
    setVouchers(prev => [...prev, newVoucher]);

    // Supabase Sync
    if (isSupabaseConfigured && supabase) {
      supabase.from('vouchers').insert([{
        code: newVoucher.code,
        points: newVoucher.points,
        description: newVoucher.description,
        is_used: newVoucher.isUsed,
        created_at: newVoucher.createdAt
      }]).then(({ error }) => {
        if (error) console.error('Supabase Error insert voucher:', error);
      });
    }
  };

  // Redeem reward
  const handleRedeemReward = (reward: RewardItem) => {
    if (!currentUser) return;
    
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1 && currentUser.points >= reward.pointsCost) {
      const updatedUsers = [...users];
      const nextPoints = currentUser.points - reward.pointsCost;
      updatedUsers[userIndex] = {
        ...currentUser,
        points: nextPoints
      };
      setUsers(updatedUsers);
      setCurrentUser(updatedUsers[userIndex]);

      // Record transaction
      const newTx: Transaction = {
        id: `tx_redeem_${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        points: reward.pointsCost,
        type: 'redeem',
        description: `Canjeó recompensa: ${reward.title}`,
        timestamp: new Date().toISOString()
      };
      setTransactions(prev => [...prev, newTx]);

      // Supabase Sync
      if (isSupabaseConfigured && supabase) {
        supabase.from('profiles').update({ points: nextPoints }).eq('id', currentUser.id).then(({ error }) => {
          if (error) console.error('Supabase Error points:', error);
        });

        supabase.from('transactions').insert([{
          id: newTx.id,
          user_id: newTx.userId,
          user_name: newTx.userName,
          points: newTx.points,
          type: newTx.type,
          description: newTx.description,
          timestamp: newTx.timestamp,
          staff_name: newTx.staffName || null
        }]).then(({ error }) => {
          if (error) console.error('Supabase Error transaction:', error);
        });
      }
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsRegistering(false);
    if (currentPath.startsWith('/staff')) {
      navigateTo('/staff');
    } else {
      navigateTo('/customer');
    }
  };

  const handleClaimCompletedCard = () => {
    if (!currentUser) return;

    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
      const updatedUsers = [...users];
      updatedUsers[userIndex] = {
        ...currentUser,
        points: 0
      };
      setUsers(updatedUsers);
      setCurrentUser(updatedUsers[userIndex]);

      // Record transaction
      const newTx: Transaction = {
        id: `tx_claim_${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        points: 10,
        type: 'redeem',
        description: `Canjeó planilla completa: Repostería o café de cortesía`,
        timestamp: new Date().toISOString()
      };
      setTransactions(prev => [...prev, newTx]);

      // Supabase Sync
      if (isSupabaseConfigured && supabase) {
        supabase.from('profiles').update({ points: 0 }).eq('id', currentUser.id).then(({ error }) => {
          if (error) console.error('Supabase Error reset points:', error);
        });

        supabase.from('transactions').insert([{
          id: newTx.id,
          user_id: newTx.userId,
          user_name: newTx.userName,
          points: newTx.points,
          type: newTx.type,
          description: newTx.description,
          timestamp: newTx.timestamp,
          staff_name: newTx.staffName || null
        }]).then(({ error }) => {
          if (error) console.error('Supabase Error transaction:', error);
        });
      }
      
      showToast(`¡Felicidades! Canjeado con éxito. Tu planilla ha regresado a 0 sellos.`, 'success');
    }
  };

  const handleResetClientStamps = (userQrCode: string) => {
    const userIndex = users.findIndex(u => u.qrCode === userQrCode && u.role === 'client');
    if (userIndex !== -1) {
      const targetUser = users[userIndex];
      const updatedUsers = [...users];
      updatedUsers[userIndex] = {
        ...targetUser,
        points: 0
      };
      setUsers(updatedUsers);

      // Record transaction
      const newTx: Transaction = {
        id: `tx_reset_${Date.now()}`,
        userId: targetUser.id,
        userName: targetUser.name,
        points: 10,
        type: 'redeem',
        description: `Canjeó cortesía registrada por staff en mostrador`,
        timestamp: new Date().toISOString(),
        staffName: currentUser?.name || 'Staff Buttery'
      };
      setTransactions(prev => [...prev, newTx]);

      // Supabase Sync
      if (isSupabaseConfigured && supabase) {
        supabase.from('profiles').update({ points: 0 }).eq('id', targetUser.id).then(({ error }) => {
          if (error) console.error('Supabase Error reset points:', error);
        });

        supabase.from('transactions').insert([{
          id: newTx.id,
          user_id: newTx.userId,
          user_name: newTx.userName,
          points: newTx.points,
          type: newTx.type,
          description: newTx.description,
          timestamp: newTx.timestamp,
          staff_name: newTx.staffName || null
        }]).then(({ error }) => {
          if (error) console.error('Supabase Error transaction:', error);
        });
      }
      
      showToast(`¡Éxito! Se registró el canje de ${targetUser.name}. Su tarjeta regresó a 0 sellos.`, 'success');
    }
  };

  // Helper arrays for simulator to run in QR camera scanner modal
  const simulatedClientQRs = users
    .filter(u => u.role === 'client')
    .map(u => ({ name: u.name, qrCode: u.qrCode, points: Math.min(10, u.points) }));

  const activeVouchers = vouchers.filter(v => !v.isUsed);

  return (
    <div className="min-h-screen bg-[#F3EFE9] flex flex-col justify-center items-center py-6 px-4 font-sans selection:bg-amber-100 selection:text-amber-900">
      
      {/* Toast Notification message */}
      {successToast && (
        <div 
          id="success-toast" 
          className={`fixed top-6 right-6 z-50 max-w-sm p-4 rounded-2xl flex items-center gap-3 shadow-xl border animate-fadeIn ${
            successToast.type === 'error' 
              ? 'bg-rose-50 border-rose-200 text-rose-900' 
              : successToast.type === 'info' 
                ? 'bg-blue-50 border-blue-200 text-blue-900' 
                : 'bg-stone-900 border-white/15 text-white'
          }`}
        >
          {successToast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
          ) : successToast.type === 'info' ? (
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />
          ) : (
            <CheckCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
          )}
          <span className="font-sans text-xs font-semibold">{successToast.message}</span>
        </div>
      )}

      {/* Main Core Outer Container Wrapper */}
      <div className={`w-full transition-all duration-300 ${
        currentUser?.role === 'staff' ? 'max-w-5xl' : 'max-w-xl'
      }`}>

        {/* The screen itself */}
        <div 
          id="pwa-screen"
          className="w-full bg-brand-bg overflow-hidden flex flex-col rounded-3xl border border-[#1C1A17]/10 shadow-lg min-h-[780px]"
          style={{
            '--color-brand-brown': brandBrown,
            '--color-brand-gold': brandGold,
            '--color-brand-bg': brandBg,
          } as React.CSSProperties}
        >
          {/* APPLICATION SWITCHBOARD ROUTER */}
          {currentUser ? (
            currentUser.role === 'client' ? (
              <CustomerDashboard
                user={currentUser}
                transactions={transactions}
                rewards={REWARDS}
                vouchers={vouchers}
                onScanPurchaseCode={() => setScannerOpen(true)}
                onRedeemReward={handleRedeemReward}
                onLogout={handleLogout}
                onClaimCompletedCard={handleClaimCompletedCard}
                stampSymbol={stampSymbol}
                cardBgUrl={cardBgUrl}
              />
            ) : (
              <StaffDashboard
                staffUser={currentUser}
                registeredUsers={users}
                transactions={transactions}
                vouchers={vouchers}
                onOpenScanner={() => setScannerOpen(true)}
                onAddPoints={handleAddPointsFromStaff}
                onGenerateVoucher={handleGeneratePointsVoucher}
                onLogout={handleLogout}
                onResetClientStamps={handleResetClientStamps}
                stampSymbol={stampSymbol}
                brandBrown={brandBrown}
                brandGold={brandGold}
                brandBg={brandBg}
                settingsPin={settingsPin}
                logoUrl={logoUrl}
                logoHeight={logoHeight}
                cardBgUrl={cardBgUrl}
                onUpdateSettings={handleUpdateSettings}
              />
            )
          ) : (
            /* LOGIN & ACCOUNT PORTAL SCREENS */
            <div className="flex-1 flex flex-col justify-between py-8 px-6 text-brand-brown overflow-y-auto">
              
              {/* BRAND LOGO HEADER */}
              <div className="text-center py-6 relative overflow-hidden">
                <div className="flex flex-col items-center">
                  {logoUrl ? (
                    <img 
                      src={logoUrl}
                      alt="Brand Logo"
                      style={{ height: `${logoHeight}px` }}
                      className="w-auto object-contain select-none"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <img 
                      src={butteryLogo}
                      alt="Buttery Logo"
                      className="h-30 w-auto object-contain select-none mix-blend-multiply"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <h1 className="font-serif italic text-3xl font-light text-[#2D241E]/80 tracking-tight leading-none mt-4">
                  </h1>
                </div>
                <p className="font-sans text-[9px] tracking-widest text-[#C5A059] font-bold uppercase mt-3">
                  POLANCO · CIUDAD DE MÉXICO
                </p>
                <div className="h-[1px] w-12 bg-brand-brown/15 mx-auto mt-4"></div>
              </div>

              {/* CORE FORM WRAPPER CARD */}
              <div className="space-y-6 flex-1 flex flex-col justify-center">

                {/* Form header prompt */}
                <div className="text-center">
                  <h2 className="font-serif text-3xl font-normal text-brand-brown">
                    {loginRole === 'client' 
                      ? (isRegistering ? 'Únete al Club' : 'Bienvenido')
                      : 'Acceso Staff'
                    }
                  </h2>
                  <p className="font-sans text-xs text-stone-550 mt-1 leading-relaxed max-w-[320px] mx-auto">
                    {loginRole === 'client'
                      ? (isRegistering ? 'Regístrate hoy y recibe un obsequio especial de 50 puntos de bienvenida.' : 'Inicia sesión para acumular tus visitas y canjearlas por productos gratis.')
                      : 'Consola interna de barra exclusiva para baristas y personal de servicio en Polanco.'
                    }
                  </p>
                </div>

                {authError && (
                  <div className="bg-brand-bg border border-red-200 p-3 rounded-lg text-red-700 text-xs text-center font-serif italic">
                    {authError}
                  </div>
                )}

                {/* SIGN IN FORM (With editorial fine border inputs) */}
                {!isRegistering ? (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-widest font-bold text-stone-400 px-1">Correo Electrónico</label>
                      <div className="relative">
                        <Mail className="absolute left-1 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-brown/30" />
                        <input
                          id="login-email"
                          type="email"
                          placeholder={loginRole === 'client' ? 'ejemplo@correo.com' : 'staff@buttery.mx'}
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          required
                          className="w-full border-b border-brand-brown/20 py-2.5 pl-8 pr-1 focus:border-brand-gold outline-hidden transition-colors text-base font-serif italic text-brand-brown placeholder:text-stone-300 placeholder:font-sans placeholder:not-italic"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[9px] uppercase tracking-widest font-bold text-stone-400 px-1">Contraseña</label>
                        <span className="text-[9px] uppercase tracking-widest font-bold text-brand-gold cursor-help hover:underline">Demo</span>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-1 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-brown/30" />
                        <input
                          id="login-password"
                          type="password"
                          placeholder="••••••••"
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          required
                          className="w-full border-b border-brand-brown/20 py-2.5 pl-8 pr-1 focus:border-brand-gold outline-hidden transition-colors text-base text-brand-brown tracking-widest placeholder:text-stone-300"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      id="login-submit-btn"
                      className="w-full mt-6 bg-brand-brown text-white py-4 font-bold uppercase tracking-[0.25em] text-xs hover:bg-brand-gold transition-colors flex items-center justify-center gap-2 group cursor-pointer"
                    >
                      <span>Iniciar Sesión</span>
                      <ChevronRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </form>
                ) : (
                  /* CUSTOMER SIGN UP / REGISTRATION FORM */
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-widest font-bold text-stone-400 px-1">Nombre Completo</label>
                      <div className="relative">
                        <UserIcon className="absolute left-1 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-brown/30" />
                        <input
                          id="register-name"
                          type="text"
                          placeholder="Tu primer nombre y apellido"
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                          required
                          className="w-full border-b border-brand-brown/20 py-2 pl-8 pr-1 focus:border-brand-gold outline-hidden transition-colors text-base font-serif italic text-brand-brown placeholder:text-stone-300 placeholder:font-sans placeholder:not-italic"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-widest font-bold text-stone-400 px-1">Correo Electrónico</label>
                      <div className="relative">
                        <Mail className="absolute left-1 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-brown/30" />
                        <input
                          id="register-email"
                          type="email"
                          placeholder="ejemplo@decorreo.com"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          required
                          className="w-full border-b border-brand-brown/20 py-2 pl-8 pr-1 focus:border-brand-gold outline-hidden transition-colors text-base font-serif italic text-brand-brown placeholder:text-stone-300 placeholder:font-sans placeholder:not-italic"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest font-bold text-stone-400 px-1">Contraseña</label>
                        <input
                          id="register-password"
                          type="password"
                          placeholder="Min 4 car."
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          required
                          className="w-full border-b border-brand-brown/20 py-2 px-1 focus:border-brand-gold outline-hidden transition-colors text-sm font-sans tracking-widest text-brand-brown placeholder:text-stone-300"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest font-bold text-stone-400 px-1">Confirmar</label>
                        <input
                          id="register-confirm-password"
                          type="password"
                          placeholder="Repite pass"
                          value={confirmPasswordInput}
                          onChange={(e) => setConfirmPasswordInput(e.target.value)}
                          required
                          className="w-full border-b border-brand-brown/20 py-2 px-1 focus:border-brand-gold outline-hidden transition-colors text-sm font-sans tracking-widest text-brand-brown placeholder:text-stone-300"
                        />
                      </div>
                    </div>

                    <p className="text-[10px] font-sans text-brand-gold font-bold bg-brand-bg border border-brand-gold/20 rounded-lg p-2 flex items-center justify-center gap-1.5 mt-2">
                      <Sparkles className="w-3.5 h-3.5" />
                      Regalo de apertura: ¡50 puntos de bienvenida!
                    </p>

                    <button
                      type="submit"
                      id="register-submit-btn"
                      className="w-full mt-2 bg-brand-brown text-white py-4 font-bold uppercase tracking-[0.25em] text-xs hover:bg-brand-gold transition-colors flex items-center justify-center gap-2 group cursor-pointer"
                    >
                      Registrarme y Recibir Puntos
                    </button>
                  </form>
                )}

                {/* Sign up toggle for client role */}
                {loginRole === 'client' && (
                  <div className="text-center pt-2">
                    <button
                      id="toggle-register-btn"
                      onClick={() => {
                        setIsRegistering(!isRegistering);
                        setAuthError(null);
                      }}
                      className="font-sans text-xs font-bold text-brand-brown border-b border-brand-brown/20 hover:border-brand-brown/60 pb-0.5 cursor-pointer"
                    >
                      {isRegistering ? '¿Ya eres miembro? Inicia Sesión' : '¿Aún no eres miembro? Regístrate aquí'}
                    </button>
                  </div>
                )}
              </div>

              {/* Secure production login without demo selector list */}
            </div>
          )}

          {/* REALTIME SYSTEM CAMERA AND MOCK SCANNER POPUP MODAL */}
          {scannerOpen && currentUser && (
            <QRCameraScanner
              title={currentUser.role === 'client' ? 'Escanear Ticket o Cupón' : 'Escanear Tarjeta de Socio'}
              subtitle={
                currentUser.role === 'client' 
                  ? 'Alinea la cámara de tu celular con el código QR impreso en tu ticket o bono.'
                  : 'Sostén la cámara frente a la tarjeta móvil del cliente para registrar su visita.'
              }
              role={currentUser.role}
              simulatedVouchers={activeVouchers}
              simulatedClientQRs={simulatedClientQRs}
              onScanSuccess={
                currentUser.role === 'client' 
                  ? handleVoucherScannedByClient 
                  : handleClientQrScannedByStaff
              }
              onClose={() => setScannerOpen(false)}
            />
          )}

        </div>

      </div>

    </div>
  );
}
