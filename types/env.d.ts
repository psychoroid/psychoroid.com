declare global {
    namespace NodeJS {
        interface ProcessEnv {
            NEXT_PUBLIC_SUPABASE_URL: string
            NEXT_PUBLIC_SUPABASE_ANON_KEY: string
            SUPABASE_SERVICE_ROLE_KEY: string
            NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string
            STRIPE_SECRET_KEY: string
            STRIPE_WEBHOOK_SECRET: string
            HUGGINGFACE_API_KEY: string
            NEXT_PUBLIC_HUGGINGFACE_MODEL: string
            NEXT_PUBLIC_APP_URL: string
            BUN_ENV: 'development' | 'production' | 'test'
        }
    }
}

export {} 