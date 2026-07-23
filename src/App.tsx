import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  Check,
  CheckCircle,
  AlertCircle,
  Info,
  Eye,
  EyeOff,
} from 'lucide-react';
import { User, Transaction, RewardItem, QRVoucher, UserRole } from './types';
import { SEED_USERS, SEED_TRANSACTIONS, SEED_VOUCHERS, REWARDS } from './data';
import CustomerDashboard from './components/CustomerDashboard';
import StaffDashboard from './components/StaffDashboard';
import QRCameraScanner from './components/QRCameraScanner';
import butteryLogoGold from './assets/buttery_logo_gold.png';
import butteryStorefront from './assets/buttery_storefront.jpg';
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
                    setBrandBrown(dbSettings.brand_brown || '#1C2117');
                    setBrandGold(dbSettings.brand_gold || '#C5A059');
                    setBrandBg(dbSettings.brand_bg || '#FAF7F2');
            setSettingsPin(dbSettings.settings_pin || '1234');
            setLogoUrl(dbSettings.logo_url || '');
            setLogoHeight(dbSettings.logo_height !== undefined && dbSettings.logo_height !== null ? Number(dbSettings.logo_height) : 40);
            setCardBgUrl(dbSettings.card_bg_url || 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80');

                    localStorage.setItem('buttery_stamp_symbol', dbSettings.stamp_symbol || '🥐');
                    localStorage.setItem('buttery_brand_brown', dbSettings.brand_brown || '#1C2117');
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
  const [brandBrown, setBrandBrown] = useState<string>(() => localStorage.getItem('buttery_brand_brown') || '#1C2117');
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

  // PWA (Progressive Web App) Install Prompt Handler
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(() => {
    return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
  });

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      console.log('beforeinstallprompt event was fired');
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
      setIsInstallable(false);
      showToast('¡Buttery instalada con éxito en tu pantalla de inicio!', 'success');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIOS) {
        showToast('En iOS/Safari, pulsa el botón "Compartir" y selecciona "Agregar al inicio".', 'info');
      } else {
        showToast('Para instalar, abre el menú del navegador y selecciona "Instalar aplicación".', 'info');
      }
      return;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`PWA installation outcome: ${outcome}`);
      if (outcome === 'accepted') {
        setIsStandalone(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
      }
    } catch (err) {
      console.error('Error during PWA prompt:', err);
    }
  };

  // Dynamic PWA Manifest & Apple Touch Icon Injection
  useEffect(() => {
    let manifestLink = document.querySelector('link[rel="manifest"]');
    if (!manifestLink) {
      manifestLink = document.createElement('link');
      manifestLink.setAttribute('rel', 'manifest');
      document.head.appendChild(manifestLink);
    }

    const manifestData = {
      name: "Buttery Loyalty",
      short_name: "Buttery",
      description: "Planilla de sellos digital para Buttery, Polanco CDMX",
      start_url: "/",
      display: "standalone",
      background_color: brandBg || "#FAF7F2",
      theme_color: "#FAF7F2",
      orientation: "portrait",
      icons: [
        {
          src: logoUrl || butteryLogoGold,
          sizes: "any",
          type: logoUrl && logoUrl.startsWith('data:image/svg+xml') ? "image/svg+xml" : (logoUrl && logoUrl.startsWith('data:image/png') ? "image/png" : "image/svg+xml"),
          purpose: "any maskable"
        }
      ]
    };

    const stringManifest = JSON.stringify(manifestData);
    const blob = new Blob([stringManifest], { type: 'application/json' });
    const manifestURL = URL.createObjectURL(blob);

    manifestLink.setAttribute('href', manifestURL);

    let appleTouchLink = document.querySelector('link[rel="apple-touch-icon"]');
    if (!appleTouchLink) {
      appleTouchLink = document.createElement('link');
      appleTouchLink.setAttribute('rel', 'apple-touch-icon');
      document.head.appendChild(appleTouchLink);
    }
    appleTouchLink.setAttribute('href', logoUrl || butteryLogoGold);

    // Set the browser theme-color meta tag (colors the iOS Safari status bar /
    // overscroll area). Keep it neutral off-white so pulling past the page edge
    // never reveals the old green.
    let themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeColorMeta) {
      themeColorMeta = document.createElement('meta');
      themeColorMeta.setAttribute('name', 'theme-color');
      document.head.appendChild(themeColorMeta);
    }
    themeColorMeta.setAttribute('content', '#FAF7F2');

    // Ensure the root document background (revealed by overscroll bounce) is neutral.
    document.documentElement.style.backgroundColor = '#FAF7F2';
    document.body.style.backgroundColor = '#FAF7F2';

    return () => {
      URL.revokeObjectURL(manifestURL);
    };
  }, [logoUrl, brandBg, brandGold]);

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
  const [showPassword, setShowPassword] = useState(false);
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
      }, 2500);
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
      description: 'Sello de bienvenida · Buttery Polanco',
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

  // Register a new staff member (called from the PIN-gated settings "Equipo" section).
  // Supports both individual accounts and a shared account — the supervisor just
  // provides a name, email, and password. Returns an error string on failure, or
  // null on success, so the settings UI can show inline feedback.
  const handleRegisterStaff = (name: string, email: string, password: string): string | null => {
    const cleanName = name.trim();
    const emailLower = email.trim().toLowerCase();

    if (!cleanName) return 'Ingresa un nombre para el miembro del staff.';
    if (!emailLower || !emailLower.includes('@')) return 'Ingresa un correo electrónico válido.';
    if (password.length < 4) return 'La contraseña debe tener al menos 4 caracteres.';

    // If the email already exists as staff, treat it as updating the shared password
    // rather than erroring — this makes the "one shared email all use" flow natural.
    const existing = users.find(u => u.email === emailLower);
    if (existing) {
      if (existing.role !== 'staff') {
        return 'Ese correo ya está registrado como socio (cliente).';
      }
      // Update the shared/existing staff password
      const updatedUsers = users.map(u =>
        u.id === existing.id ? { ...u, name: cleanName, password } : u
      );
      setUsers(updatedUsers);

      if (isSupabaseConfigured && supabase) {
        supabase.from('profiles').update({ name: cleanName, password }).eq('id', existing.id)
          .then(({ error }) => { if (error) console.error('Supabase Error update staff:', error); });
      }
      return null;
    }

    // Create a brand-new staff account
    const newStaff: User = {
      id: `s_${Date.now()}`,
      name: cleanName,
      email: emailLower,
      role: 'staff',
      points: 0,
      qrCode: `BUTTERY-STAFF-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      password
    };

    setUsers(prev => [...prev, newStaff]);

    if (isSupabaseConfigured && supabase) {
      supabase.from('profiles').insert([{
        id: newStaff.id,
        name: newStaff.name,
        email: newStaff.email,
        role: newStaff.role,
        points: newStaff.points,
        qr_code: newStaff.qrCode,
        created_at: newStaff.createdAt,
        password: newStaff.password
      }]).then(({ error }) => { if (error) console.error('Supabase Error insert staff:', error); });
    }

    return null;
  };

  // Remove a staff member (supervisor action from the "Equipo" section).
  const handleRemoveStaff = (staffId: string) => {
    // Never allow removing the currently logged-in supervisor.
    if (currentUser && currentUser.id === staffId) return;
    setUsers(prev => prev.filter(u => u.id !== staffId));

    if (isSupabaseConfigured && supabase) {
      supabase.from('profiles').delete().eq('id', staffId)
        .then(({ error }) => { if (error) console.error('Supabase Error delete staff:', error); });
    }
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

  // Toggle helper for the Iniciar sesión / Registrarse tabs
  const switchAuthTab = (registering: boolean) => {
    setIsRegistering(registering);
    setAuthError(null);
    setNameInput('');
    setEmailInput('');
    setPasswordInput('');
    setConfirmPasswordInput('');
    setShowPassword(false);
  };

  // Helper arrays for simulator to run in QR camera scanner modal
  const simulatedClientQRs = users
    .filter(u => u.role === 'client')
    .map(u => ({ name: u.name, qrCode: u.qrCode, points: Math.min(10, u.points) }));

  const activeVouchers = vouchers.filter(v => !v.isUsed);

  // Shared brand logo — Buttery gold script wordmark.
  // Transparent PNG, so it sits on the cream form panel and the photo hero alike.
  // Place the file at src/assets/buttery_logo_gold.png
  const BrandLogo = () => (
    <img
      src={butteryLogoGold}
      alt="Buttery"
      className="h-10 md:h-12 w-auto object-contain select-none"
      draggable={false}
    />
  );

  return (
      <div className={`font-sans selection:bg-[#EDE6DA] selection:text-[#1C2117] min-h-screen flex flex-col ${
        currentUser?.role === 'client' ? 'bg-[#FAF7F2] items-center justify-start' : ''
      }`}>
      
      {/* Toast Notification message */}
      {successToast && (
        <div
          id="success-toast"
          style={{ animation: 'slideUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) both' }}
          className={`fixed top-6 left-4 right-4 mx-auto max-w-sm z-50 px-5 py-3.5 rounded-2xl flex items-center gap-3 shadow-2xl border ${
            successToast.type === 'error'
              ? 'bg-rose-600 border-rose-500/30 text-white'
              : successToast.type === 'info'
                ? 'bg-[#1C2117] border-white/10 text-white'
                : 'bg-[#2D4A2E] border-white/10 text-white'
          }`}
        >
          {successToast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-white/80 flex-shrink-0" />
          ) : successToast.type === 'info' ? (
            <Info className="w-4 h-4 text-white/80 flex-shrink-0" />
          ) : (
            <CheckCircle className="w-4 h-4 text-white/80 flex-shrink-0" />
          )}
          <span className="font-sans text-xs font-semibold tracking-wide">{successToast.message}</span>
        </div>
      )}

      {/* Main Core Outer Container Wrapper */}
      <div className="w-full">

        {/* The screen itself */}
        <div 
          id="pwa-screen"
          className={`w-full bg-brand-bg overflow-hidden flex flex-col min-h-screen ${
            currentUser?.role === 'client' ? 'md:max-w-sm md:mx-auto md:shadow-2xl' : ''
          }`}
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
                onRegisterStaff={handleRegisterStaff}
                onRemoveStaff={handleRemoveStaff}
              />
            )
          ) : (
            /* ══════════════════════════════════════════════════════════
               LOGIN & ACCOUNT PORTAL — Buttery warm editorial design
               Mobile: single cream column. Desktop: storefront photo + form.
               ══════════════════════════════════════════════════════════ */
            <div className="flex-1 flex min-h-screen bg-[#FAF7F2]">

              {/* ── LEFT PANEL (desktop only): storefront photo hero ── */}
              <div className="hidden md:flex md:w-1/2 relative flex-col justify-between p-12 lg:p-16 overflow-hidden">
                {/* Storefront photograph */}
                <img
                  src={butteryStorefront}
                  alt="Buttery Polanco"
                  className="absolute inset-0 w-full h-full object-cover"
                  draggable={false}
                />
                {/* Warm dark scrim so the type stays legible */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#1C2117]/75 via-[#1C2117]/60 to-[#1C2117]/85" />

                {/* Top: logo */}
                <div className="relative z-10">
                  <BrandLogo />
                </div>

                {/* Middle: hero copy */}
                <div className="relative z-10 max-w-md">
                  <p className="font-sans text-[10px] font-bold uppercase tracking-[0.35em] text-[#D9C08A] mb-7">
                    Repostería &middot; Café de especialidad
                  </p>
                  <h1 className="font-serif font-medium text-5xl lg:text-6xl leading-[1.1] text-[#FAF7F2]">
                    Hornear.<br />
                    Compartir.<br />
                    Volver.
                  </h1>
                  <p className="font-sans text-sm text-[#FAF7F2]/70 mt-7 leading-relaxed max-w-sm">
                    Acumula un sello en cada visita y disfruta tu repostería
                    de cortesía. Tu planilla, siempre en tu bolsillo.
                  </p>

                  {/* Reward highlight */}
                  <div className="mt-10 border-l-2 border-[#C5A059] pl-5">
                    <p className="font-sans text-[9px] font-bold uppercase tracking-[0.3em] text-[#D9C08A] mb-2">
                      Tu recompensa
                    </p>
                    <p className="font-serif text-xl text-[#FAF7F2]">
                      Repostería o café de cortesía
                    </p>
                    <p className="font-sans text-xs text-[#FAF7F2]/60 mt-1">
                      Al completar 10 sellos
                    </p>
                  </div>
                </div>

                {/* Bottom: footer */}
                <p className="relative z-10 font-sans text-[9px] font-bold uppercase tracking-[0.3em] text-[#FAF7F2]/50">
                  Polanco &middot; Ciudad de México
                </p>
              </div>

              {/* ── RIGHT PANEL / MOBILE FULL SCREEN: cream form ── */}
              <div className="flex-1 flex flex-col justify-center px-7 py-12 md:px-14 lg:px-20 bg-[#FAF7F2]">
                <div className="w-full max-w-md mx-auto md:mx-0">

                  {/* Mobile-only logo (desktop shows it in the hero panel) */}
                  <div className="md:hidden mb-8">
                    <BrandLogo />
                  </div>

                  {/* Heading */}
                  <div className="mb-8">
                    <p className="font-sans text-[10px] font-bold uppercase tracking-[0.3em] text-[#1C2117]/55">
                      Polanco &middot; CDMX
                    </p>
                    <h2 className="font-serif font-medium text-[2.5rem] md:text-5xl text-[#1C2117] leading-[1.1] mt-4">
                      {loginRole === 'client'
                        ? (isRegistering ? 'Únete al club' : 'Bienvenido de nuevo')
                        : 'Acceso Staff'
                      }
                    </h2>
                    <p className="font-sans text-sm text-[#1C2117]/60 mt-3 leading-relaxed">
                      {loginRole === 'client'
                        ? (isRegistering
                            ? 'Regístrate hoy y estrena tu planilla con un sello de bienvenida.'
                            : 'Inicia sesión para ver tu planilla y canjear tus visitas.')
                        : 'Consola interna exclusiva para el personal de Buttery.'
                      }
                    </p>
                  </div>

                  {/* Segmented tab toggle (clients only) */}
                  {loginRole === 'client' && (
                    <div className="bg-[#EDE6DA] rounded-full p-1 flex mb-7">
                      <button
                        type="button"
                        id="tab-login"
                        onClick={() => switchAuthTab(false)}
                        className={`flex-1 py-2.5 rounded-full font-sans text-sm font-semibold transition-all cursor-pointer ${
                          !isRegistering
                            ? 'bg-[#FDFBF7] text-[#1C2117] shadow-sm'
                            : 'bg-transparent text-[#1C2117]/50 hover:text-[#1C2117]/75'
                        }`}
                      >
                        Iniciar sesión
                      </button>
                      <button
                        type="button"
                        id="tab-register"
                        onClick={() => switchAuthTab(true)}
                        className={`flex-1 py-2.5 rounded-full font-sans text-sm font-semibold transition-all cursor-pointer ${
                          isRegistering
                            ? 'bg-[#FDFBF7] text-[#1C2117] shadow-sm'
                            : 'bg-transparent text-[#1C2117]/50 hover:text-[#1C2117]/75'
                        }`}
                      >
                        Registrarse
                      </button>
                    </div>
                  )}

                  {authError && (
                    <div className="bg-[#FBEDEA] border border-[#D9A196] p-3 rounded-xl text-[#8C3A28] text-xs text-center font-sans mb-5">
                      {authError}
                    </div>
                  )}

                  {/* SIGN IN FORM */}
                  {!isRegistering ? (
                    <form onSubmit={handleLogin} className="space-y-5">

                      {/* Email */}
                      <div className="space-y-2">
                        <label htmlFor="login-email" className="font-sans text-[10px] font-bold uppercase tracking-[0.22em] text-[#1C2117]/65">
                          Correo electrónico
                        </label>
                        <input
                          id="login-email"
                          type="email"
                          placeholder="ejemplo@correo.com"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          required
                          className="w-full bg-[#FDFBF7] border border-[#1C2117]/12 rounded-2xl py-4 px-5 text-sm text-[#1C2117] placeholder:text-[#1C2117]/35 focus:outline-none focus:border-[#C5A059] transition-colors shadow-sm"
                        />
                      </div>

                      {/* Password */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label htmlFor="login-password" className="font-sans text-[10px] font-bold uppercase tracking-[0.22em] text-[#1C2117]/65">
                            Contraseña
                          </label>
                          {loginRole === 'client' && (
                            <span className="font-sans text-xs font-semibold text-[#B08D4F] cursor-pointer hover:underline transition-colors">
                              ¿Olvidaste tu contraseña?
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <input
                            id="login-password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Tu contraseña"
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            required
                            className="w-full bg-[#FDFBF7] border border-[#1C2117]/12 rounded-2xl py-4 pl-5 pr-12 text-sm text-[#1C2117] placeholder:text-[#1C2117]/35 focus:outline-none focus:border-[#C5A059] transition-colors shadow-sm"
                          />
                          <button
                            type="button"
                            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-5 top-1/2 -translate-y-1/2 text-[#1C2117]/35 hover:text-[#1C2117]/70 transition-colors cursor-pointer"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Submit */}
                      <button
                        type="submit"
                        id="login-submit-btn"
                        className="w-full bg-[#2D4A2E] hover:bg-[#243B25] text-[#FAF7F2] py-4 rounded-2xl font-sans font-bold uppercase tracking-[0.22em] text-xs transition-colors flex items-center justify-center gap-2.5 group cursor-pointer shadow-sm mt-1"
                      >
                        <span>Iniciar Sesión</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </button>

                      {loginRole === 'client' && (
                        <>
                          {/* Register prompt */}
                          <p className="text-center font-sans text-sm text-[#1C2117]/60 pt-1">
                            ¿Aún no eres miembro?{' '}
                            <button
                              type="button"
                              id="toggle-register-btn"
                              onClick={() => switchAuthTab(true)}
                              className="font-bold text-[#1C2117] underline underline-offset-2 hover:text-[#2D4A2E] cursor-pointer transition-colors"
                            >
                              Regístrate aquí
                            </button>
                          </p>

                          {/* Divider */}
                          <div className="flex items-center gap-4 py-1">
                            <div className="h-px flex-1 bg-[#1C2117]/12" />
                            <span className="font-sans text-xs text-[#1C2117]/40 font-medium">O</span>
                            <div className="h-px flex-1 bg-[#1C2117]/12" />
                          </div>

                          {/* Ver mi planilla */}
                          <button
                            type="button"
                            id="view-card-btn"
                            onClick={() => showToast('Inicia sesión con tu cuenta para abrir tu planilla digital.', 'info')}
                            className="w-full bg-[#FDFBF7] border border-[#1C2117]/12 hover:border-[#C5A059] text-[#1C2117] py-4 rounded-2xl font-sans font-semibold text-sm transition-colors flex items-center justify-center gap-2.5 cursor-pointer shadow-sm"
                          >
                            <Check className="w-4 h-4 text-[#B08D4F]" strokeWidth={2.5} />
                            <span>Ver mi planilla</span>
                          </button>

                          {/* Terms footer */}
                          <p className="text-center font-sans text-xs text-[#1C2117]/50 pt-3 leading-relaxed">
                            Al continuar aceptas nuestros{' '}
                            <span className="underline underline-offset-2 cursor-pointer hover:text-[#1C2117] transition-colors">Términos</span>
                            {' '}y{' '}
                            <span className="underline underline-offset-2 cursor-pointer hover:text-[#1C2117] transition-colors">Política de Privacidad</span>.
                          </p>
                        </>
                      )}
                    </form>
                  ) : (
                    /* REGISTRATION FORM */
                    <form onSubmit={handleSignUp} className="space-y-5">
                      <div className="space-y-2">
                        <label htmlFor="register-name" className="font-sans text-[10px] font-bold uppercase tracking-[0.22em] text-[#1C2117]/65">
                          Nombre completo
                        </label>
                        <input
                          id="register-name"
                          type="text"
                          placeholder="Tu nombre y apellido"
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                          required
                          className="w-full bg-[#FDFBF7] border border-[#1C2117]/12 rounded-2xl py-4 px-5 text-sm text-[#1C2117] placeholder:text-[#1C2117]/35 focus:outline-none focus:border-[#C5A059] transition-colors shadow-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="register-email" className="font-sans text-[10px] font-bold uppercase tracking-[0.22em] text-[#1C2117]/65">
                          Correo electrónico
                        </label>
                        <input
                          id="register-email"
                          type="email"
                          placeholder="ejemplo@correo.com"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          required
                          className="w-full bg-[#FDFBF7] border border-[#1C2117]/12 rounded-2xl py-4 px-5 text-sm text-[#1C2117] placeholder:text-[#1C2117]/35 focus:outline-none focus:border-[#C5A059] transition-colors shadow-sm"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label htmlFor="register-password" className="font-sans text-[10px] font-bold uppercase tracking-[0.22em] text-[#1C2117]/65">
                            Contraseña
                          </label>
                          <input
                            id="register-password"
                            type="password"
                            placeholder="Mín. 4 car."
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            required
                            className="w-full bg-[#FDFBF7] border border-[#1C2117]/12 rounded-2xl py-4 px-5 text-sm text-[#1C2117] placeholder:text-[#1C2117]/35 focus:outline-none focus:border-[#C5A059] transition-colors shadow-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <label htmlFor="register-confirm-password" className="font-sans text-[10px] font-bold uppercase tracking-[0.22em] text-[#1C2117]/65">
                            Confirmar
                          </label>
                          <input
                            id="register-confirm-password"
                            type="password"
                            placeholder="Repite"
                            value={confirmPasswordInput}
                            onChange={(e) => setConfirmPasswordInput(e.target.value)}
                            required
                            className="w-full bg-[#FDFBF7] border border-[#1C2117]/12 rounded-2xl py-4 px-5 text-sm text-[#1C2117] placeholder:text-[#1C2117]/35 focus:outline-none focus:border-[#C5A059] transition-colors shadow-sm"
                          />
                        </div>
                      </div>

                      <p className="font-sans text-xs text-[#8A6D3B] font-semibold bg-[#F6EEDF] border border-[#C5A059]/30 rounded-2xl p-3.5 flex items-center justify-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                        Sello de bienvenida: ¡tu primera visita registrada!
                      </p>

                      <button
                        type="submit"
                        id="register-submit-btn"
                        className="w-full bg-[#2D4A2E] hover:bg-[#243B25] text-[#FAF7F2] py-4 rounded-2xl font-sans font-bold uppercase tracking-[0.22em] text-xs transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-2.5 group"
                      >
                        <span>Registrarme y Empezar</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </button>

                      {/* Login prompt */}
                      <p className="text-center font-sans text-sm text-[#1C2117]/60">
                        ¿Ya eres miembro?{' '}
                        <button
                          type="button"
                          onClick={() => switchAuthTab(false)}
                          className="font-bold text-[#1C2117] underline underline-offset-2 hover:text-[#2D4A2E] cursor-pointer transition-colors"
                        >
                          Inicia sesión
                        </button>
                      </p>

                      {/* Terms footer */}
                      <p className="text-center font-sans text-xs text-[#1C2117]/50 pt-1 leading-relaxed">
                        Al continuar aceptas nuestros{' '}
                        <span className="underline underline-offset-2 cursor-pointer hover:text-[#1C2117] transition-colors">Términos</span>
                        {' '}y{' '}
                        <span className="underline underline-offset-2 cursor-pointer hover:text-[#1C2117] transition-colors">Política de Privacidad</span>.
                      </p>
                    </form>
                  )}

                </div>
              </div>

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