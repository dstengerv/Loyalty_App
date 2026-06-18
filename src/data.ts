import { User, RewardItem, Transaction, QRVoucher } from './types';

// Default Cliente (Demo)
export const DEFAULT_CLIENT: User = {
  id: 'c1',
  name: 'Sofía Martínez',
  email: 'sofia.polanco@gmail.com',
  role: 'client',
  points: 6, // 6 Stamps out of 10
  qrCode: 'BUTTERY-CLIENT-SOFIA',
  createdAt: '2026-05-10T12:00:00Z',
  password: '1234',
};

// Default Staff (Demo)
export const DEFAULT_STAFF: User = {
  id: 's1',
  name: 'Carlos (Barista)',
  email: 'staff@buttery.mx',
  role: 'staff',
  points: 0,
  qrCode: 'BUTTERY-STAFF-CARLOS',
  createdAt: '2026-01-15T08:00:00Z',
  password: '1234',
};

// Initial users collection in database (backed up to localStorage)
export const SEED_USERS: User[] = [
  DEFAULT_CLIENT,
  DEFAULT_STAFF,
  {
    id: 'c2',
    name: 'Mateo Obregón',
    email: 'mateo@hotmail.com',
    role: 'client',
    points: 9, // 9 Stamps
    qrCode: 'BUTTERY-CLIENT-MATEO',
    createdAt: '2026-05-18T14:30:00Z',
    password: '1234',
  },
  {
    id: 'c3',
    name: 'Andrea Ruiz',
    email: 'andrea.ruiz@outlook.com',
    role: 'client',
    points: 2, // 2 Stamps
    qrCode: 'BUTTERY-CLIENT-ANDREA',
    createdAt: '2026-06-01T10:15:00Z',
    password: '1234',
  }
];

// Available Rewards in Buttery (cost in stamps/sellos)
export const REWARDS: RewardItem[] = [
  {
    id: 'r1',
    title: 'Café de Especialidad Gratis',
    pointsCost: 3, // Costs 3 stamps
    description: 'Cualquier café caliente o helado preparado por nuestros baristas en Polanco.',
    category: 'cafe',
    imagePlaceholderColor: 'bg-amber-100',
  },
  {
    id: 'r2',
    title: 'Cruasán de Mantequilla',
    pointsCost: 5, // Costs 5 stamps
    description: 'Nuestra icónica masa hojaldrada horneada fresca cada mañana con mantequilla de alta calidad.',
    category: 'panaderia',
    imagePlaceholderColor: 'bg-orange-100',
  },
  {
    id: 'r3',
    title: 'Scon de Lavanda & Arándano',
    pointsCost: 7, // Costs 7 stamps
    description: 'Scon crujiente acompañado de mermelada artesanal de frutos del bosque.',
    category: 'panaderia',
    imagePlaceholderColor: 'bg-pink-100',
  },
  {
    id: 'r4',
    title: 'Pan Francés Buttery',
    pointsCost: 10, // Costs 10 stamps (completed card)
    description: 'Pan brioche infusionado en cardamomo, bañado con crema de vainilla de Papantla y compota de frutos rojos.',
    category: 'desayuno',
    imagePlaceholderColor: 'bg-yellow-100',
  },
  {
    id: 'r5',
    title: 'Brunch Completo Polanco',
    pointsCost: 10, // Costs 10 stamps
    description: 'Huevos benedictinos con salmón curado, jugo prensado en frío de tu elección y café de especialidad doble.',
    category: 'desayuno',
    imagePlaceholderColor: 'bg-emerald-100',
  }
];

// Initial Transactions (represent visits / stamp adjustments)
export const SEED_TRANSACTIONS: Transaction[] = [
  {
    id: 't1',
    userId: 'c1',
    userName: 'Sofía Martínez',
    points: 1,
    type: 'earn',
    description: 'Visita registrada - Sello #5 asignado',
    timestamp: '2026-06-08T15:24:00Z',
    staffName: 'Carlos (Barista)',
  },
  {
    id: 't2',
    userId: 'c1',
    userName: 'Sofía Martínez',
    points: 3,
    type: 'redeem',
    description: 'Canje de Sello: Café de Especialidad Gratis',
    timestamp: '2026-06-08T15:26:00Z',
    staffName: 'Carlos (Barista)',
  },
  {
    id: 't3',
    userId: 'c1',
    userName: 'Sofía Martínez',
    points: 1,
    type: 'earn',
    description: 'Visita registrada - Sello #6 asignado',
    timestamp: '2026-06-09T09:45:00Z',
    staffName: 'Ana (Caja)',
  },
  {
    id: 't4',
    userId: 'c2',
    userName: 'Mateo Obregón',
    points: 1,
    type: 'earn',
    description: 'Visita registrada - Sello de consumo',
    timestamp: '2026-06-09T18:12:00Z',
    staffName: 'Carlos (Barista)',
  }
];

// Pre-generated Point Vouchers (stamps vouchers now!)
export const SEED_VOUCHERS: QRVoucher[] = [
  {
    code: 'BUTTERY-VOUCHER-POLANCO-1',
    points: 1, // 1 stamp
    description: 'Boleto cortesía: 1 Sello',
    isUsed: false,
    createdAt: '2026-06-09T12:00:00Z'
  },
  {
    code: 'BUTTERY-VOUCHER-DESAYUNO-2',
    points: 2, // 2 stamps
    description: 'Boleto especial: 2 Sellos',
    isUsed: false,
    createdAt: '2026-06-09T12:10:00Z'
  },
  {
    code: 'BUTTERY-VOUCHER-BIENVENIDA-1',
    points: 1, // 1 stamp welcome
    description: 'Sello de Bienvenida',
    isUsed: false,
    createdAt: '2026-06-09T12:15:00Z'
  }
];
