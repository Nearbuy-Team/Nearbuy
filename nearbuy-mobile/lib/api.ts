import Constants from 'expo-constants';
import { Platform } from 'react-native';

const explicitUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/$/, '');
const expoHostUri = Constants.expoConfig?.hostUri ?? Constants.platform?.hostUri;
const expoHost = expoHostUri?.replace(/^https?:\/\//, '').split(':')[0];
const webHost = Platform.OS === 'web' ? globalThis.location?.hostname : undefined;

export const API_BASE_URL =
  explicitUrl ||
  (expoHost
    ? `http://${expoHost}:8080`
    : Platform.OS === 'android'
      ? 'http://10.0.2.2:8080'
      : `http://${webHost || 'localhost'}:8080`);

export const resolveApiUrl = (path?: string | null) =>
  path
    ? path.startsWith('http://') || path.startsWith('https://')
      ? path
      : `${API_BASE_URL}${path}`
    : undefined;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type ApiOptions = Omit<RequestInit, 'body'> & {
  token?: string | null;
  body?: unknown;
};

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  if (options.body !== undefined) headers.set('Content-Type', 'application/json');
  if (options.token) headers.set('Authorization', `Bearer ${options.token}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError(`Cannot reach Nearbuy at ${API_BASE_URL}`, 0);
  }

  const raw = await response.text();
  let payload: unknown = undefined;
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = raw;
    }
  }

  if (!response.ok) {
    const message =
      typeof payload === 'string'
        ? payload
        : payload && typeof payload === 'object' && 'message' in payload
          ? String((payload as { message: unknown }).message)
          : `Request failed (${response.status})`;
    throw new ApiError(message, response.status);
  }

  return payload as T;
}

export interface ApiUser {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  trustScore: number;
  idVerified: boolean;
  createdAt: string;
}

export interface PublicUser {
  id: number;
  fullName: string;
  trustScore: number;
  idVerified: boolean;
}

export type ListingType = 'GOOD' | 'SERVICE' | 'RENTAL';
export type ListingStatus = 'ACTIVE' | 'PAUSED' | 'SOLD';

export interface ApiListing {
  id: number;
  sellerId: number;
  title: string;
  description: string | null;
  type: ListingType;
  price: number;
  status: ListingStatus;
  viewCount: number;
  chatCount: number;
  createdAt: string;
  imageUrls: string[];
}

export interface CreateListingInput {
  title: string;
  description: string;
  type: ListingType;
  price: number;
  imageUrls?: string[];
}

export interface ListingImageAsset {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
  file?: Blob;
}

export interface ApiMessage {
  id: number;
  listingId: number;
  senderId: number;
  receiverId: number;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export type OrderStatus = 'PENDING' | 'PAID' | 'COMPLETED' | 'CANCELLED';

export interface ApiOrder {
  id: number;
  listingId: number;
  buyerId: number;
  sellerId: number;
  amount: number;
  itemAmount: number;
  serviceFee: number;
  status: OrderStatus;
  createdAt: string;
  paymentProvider: string | null;
  paymentReference: string | null;
}

export type TransactionType = 'CREDIT' | 'DEBIT' | 'ESCROW_HOLD' | 'ESCROW_RELEASE';

export interface ApiWalletTransaction {
  id: number;
  userId: number;
  orderId: number | null;
  type: TransactionType;
  amount: number;
  description: string;
  createdAt: string;
}

export interface ApiNotification {
  id: number;
  userId: number;
  title: string;
  body: string;
  route: string | null;
  read: boolean;
  createdAt: string;
}

export interface ApiPaymentMethod {
  id: number;
  userId: number;
  type: 'MOBILE_MONEY' | 'CARD';
  provider: string;
  lastFour: string;
  defaultMethod: boolean;
  createdAt: string;
}

export interface ApiReview {
  id: number;
  orderId: number;
  listingId: number;
  reviewerId: number;
  reviewedUserId: number;
  rating: number;
  comment: string;
  createdAt: string;
}

export const authApi = {
  register: (body: { fullName: string; email: string; phone: string; password: string }) =>
    apiRequest<ApiUser>('/api/auth/register', { method: 'POST', body }),
  verifyOtp: (email: string, otpCode: string) =>
    apiRequest<ApiUser>('/api/auth/verify-otp', { method: 'POST', body: { email, otpCode } }),
  resendVerification: (email: string) =>
    apiRequest<string>('/api/auth/resend-verification', { method: 'POST', body: { email } }),
  login: (email: string, password: string) =>
    apiRequest<{ token: string }>('/api/auth/login', { method: 'POST', body: { email, password } }),
  requestPasswordReset: (email: string) =>
    apiRequest<string>('/api/auth/request-password-reset', { method: 'POST', body: { email } }),
  resetPassword: (email: string, otpCode: string, newPassword: string) =>
    apiRequest<string>('/api/auth/reset-password', {
      method: 'POST',
      body: { email, otpCode, newPassword },
    }),
};

export const usersApi = {
  me: (token: string) => apiRequest<ApiUser>('/api/users/me', { token }),
  publicProfile: (token: string, userId: number) =>
    apiRequest<PublicUser>(`/api/users/${userId}`, { token }),
};

export const listingsApi = {
  all: (token: string) => apiRequest<ApiListing[]>('/api/listings', { token }),
  mine: (token: string) => apiRequest<ApiListing[]>('/api/listings/mine', { token }),
  get: (token: string, id: number) => apiRequest<ApiListing>(`/api/listings/${id}`, { token }),
  create: (token: string, body: CreateListingInput) =>
    apiRequest<ApiListing>('/api/listings', { method: 'POST', token, body }),
  uploadImage: async (token: string, asset: ListingImageAsset) => {
    const form = new FormData();
    const file =
      asset.file ??
      ({
        uri: asset.uri,
        name: asset.fileName || `listing-${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      } as unknown as Blob);
    form.append('file', file);

    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}/api/listings/images`, {
        method: 'POST',
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
        body: form,
      });
    } catch {
      throw new ApiError(`Cannot reach Nearbuy at ${API_BASE_URL}`, 0);
    }
    const raw = await response.text();
    if (!response.ok)
      throw new ApiError(raw || `Upload failed (${response.status})`, response.status);
    return JSON.parse(raw) as { url: string };
  },
  setStatus: (token: string, id: number, status: ListingStatus) =>
    apiRequest<ApiListing>(`/api/listings/${id}/status`, { method: 'PATCH', token, body: status }),
  remove: (token: string, id: number) =>
    apiRequest<void>(`/api/listings/${id}`, { method: 'DELETE', token }),
};

export const chatsApi = {
  mine: (token: string) => apiRequest<ApiMessage[]>('/api/chats', { token }),
  conversation: (token: string, listingId: number, otherUserId: number) =>
    apiRequest<ApiMessage[]>(`/api/chats/${listingId}?otherUserId=${otherUserId}`, { token }),
  send: (token: string, body: { listingId: number; receiverId: number; content: string }) =>
    apiRequest<ApiMessage>('/api/chats', { method: 'POST', token, body }),
};

export const paymentsApi = {
  createOrder: (token: string, listingId: number) =>
    apiRequest<ApiOrder>('/api/orders', { method: 'POST', token, body: { listingId } }),
  payOrder: (token: string, orderId: number) =>
    apiRequest<ApiOrder>(`/api/orders/${orderId}/pay`, { method: 'POST', token }),
  initializeOrderPayment: (token: string, orderId: number) =>
    apiRequest<{
      provider: 'SANDBOX' | 'PAYSTACK';
      authorizationUrl: string | null;
      reference: string | null;
    }>(`/api/orders/${orderId}/payment/initialize`, { method: 'POST', token }),
  verifyOrderPayment: (token: string, orderId: number, reference: string) =>
    apiRequest<ApiOrder>(`/api/orders/${orderId}/payment/verify`, {
      method: 'POST',
      token,
      body: { reference },
    }),
  completeOrder: (token: string, orderId: number) =>
    apiRequest<ApiOrder>(`/api/orders/${orderId}/complete`, { method: 'POST', token }),
  orders: (token: string) => apiRequest<ApiOrder[]>('/api/orders/mine', { token }),
  sales: (token: string) => apiRequest<ApiOrder[]>('/api/orders/sales', { token }),
  walletBalance: (token: string) =>
    apiRequest<{ balance: number }>('/api/wallet/balance', { token }),
  walletTransactions: (token: string) =>
    apiRequest<ApiWalletTransaction[]>('/api/wallet/transactions', { token }),
  topUp: (token: string, amount: number) =>
    apiRequest<ApiWalletTransaction>('/api/wallet/top-up', {
      method: 'POST',
      token,
      body: { amount },
    }),
  withdraw: (token: string, amount: number) =>
    apiRequest<ApiWalletTransaction>('/api/wallet/withdraw', {
      method: 'POST',
      token,
      body: { amount },
    }),
};

export const notificationsApi = {
  all: (token: string) => apiRequest<ApiNotification[]>('/api/notifications', { token }),
  markRead: (token: string, id: number) =>
    apiRequest<ApiNotification>(`/api/notifications/${id}/read`, { method: 'PATCH', token }),
  registerPushToken: (token: string, pushToken: string, platform: string) =>
    apiRequest('/api/notifications/push-token', {
      method: 'POST',
      token,
      body: { token: pushToken, platform },
    }),
};

export const paymentMethodsApi = {
  all: (token: string) => apiRequest<ApiPaymentMethod[]>('/api/payment-methods', { token }),
  addMobileMoney: (token: string, provider: string, phone: string) =>
    apiRequest<ApiPaymentMethod>('/api/payment-methods/mobile-money', {
      method: 'POST',
      token,
      body: { provider, phone },
    }),
  setDefault: (token: string, id: number) =>
    apiRequest<ApiPaymentMethod>(`/api/payment-methods/${id}/default`, { method: 'PATCH', token }),
  remove: (token: string, id: number) =>
    apiRequest<void>(`/api/payment-methods/${id}`, { method: 'DELETE', token }),
};

export const reviewsApi = {
  mine: (token: string) => apiRequest<ApiReview[]>('/api/reviews/mine', { token }),
  forUser: (token: string, userId: number) =>
    apiRequest<ApiReview[]>(`/api/reviews/user/${userId}`, { token }),
  create: (token: string, orderId: number, rating: number, comment: string) =>
    apiRequest<ApiReview>('/api/reviews', {
      method: 'POST',
      token,
      body: { orderId, rating, comment },
    }),
};

export const formatGhs = (amount: number) =>
  `GHS ${Number(amount).toLocaleString('en-GH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
