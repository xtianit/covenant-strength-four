declare global {
    interface Window {
        PaystackPop: {
            setup(options: {
                key: string;
                email: string;
                amount: number;
                currency?: string;
                reference?: string;
                onClose?: () => void;
                callback?: (response: PaystackResponse) => void;
            }): {
                openIframe: () => void;
            };
        };
    }
}

export interface PaystackResponse {
    status: string;
    message: string;
    reference: string;
    trans?: string;
    transaction?: string;
}

export {};
