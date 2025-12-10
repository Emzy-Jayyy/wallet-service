export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    reference: string;
    amount: number;
    status: 'success' | 'failed' | 'abandoned';
    paid_at: string;
    channel: string;
    customer: {
      email: string;
    };
  };
}
