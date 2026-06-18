/**
 * Types for the Buttery Loyalty Application
 */

export type UserRole = 'client' | 'staff';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  points: number;
  qrCode: string; // User's unique loyalty scan code
  createdAt: string;
  password?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  points: number;
  type: 'earn' | 'redeem';
  description: string;
  timestamp: string;
  staffName?: string;
}

export interface RewardItem {
  id: string;
  title: string;
  pointsCost: number;
  description: string;
  category: 'cafe' | 'panaderia' | 'desayuno';
  imagePlaceholderColor: string; // Tailwind background color string
}

export interface ActiveSession {
  user: User;
}

// Points QR vouchers that staff can generate or users can scan
export interface QRVoucher {
  code: string; // e.g. BUTTERY-VOUCHER-HASH
  points: number;
  description: string;
  isUsed: boolean;
  createdAt: string;
}
