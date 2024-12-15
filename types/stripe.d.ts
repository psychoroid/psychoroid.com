export interface StripeEvent {
    id: string;
    type: string;
    data: {
        object: {
            id: string;
            metadata: {
                userId?: string;
                user_id?: string;
                type?: string;
                plan?: string;
                credits?: string;
            };
            status?: string;
            customer?: string;
            subscription?: string;
            canceled_at?: number;
            current_period_end?: number;
            current_period_start?: number;
            items?: {
                data: Array<{
                    price: {
                        unit_amount?: number;
                    };
                }>;
            };
            latest_invoice?: string;
            [key: string]: any;
        };
    };
}

export interface StripeSessionMetadata {
    userId: string;
    type: 'subscription' | 'custom_purchase';
    plan?: string;
    credits?: string;
}

export interface StripeCheckoutData {
    package: string;
    userId: string;
    credits?: number;
    price?: string;
    metadata: StripeSessionMetadata;
}

export interface StripeSubscriptionPrices {
    automate: string | undefined;
    scale: string | undefined;
    [key: string]: string | undefined;
}

export interface StripePortalResponse {
    url: string;
    error?: string;
}

export interface StripeCheckoutResponse {
    sessionId: string;
    error?: string;
} 