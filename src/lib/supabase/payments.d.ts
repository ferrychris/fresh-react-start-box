import { CreatePaymentSessionParams } from './payments';

declare module './payments' {
  export const createPaymentSession: (
    params: CreatePaymentSessionParams
  ) => Promise<{
    success: boolean;
    checkoutUrl?: string;
    error?: unknown;
  }>;
}
