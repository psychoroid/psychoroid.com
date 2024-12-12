'use client';

import { Navbar } from '@/components/design/Navbar';
import { Footer } from '@/components/design/Footer';

export default function TermsOfService() {
    return (
        <div className="h-svh bg-background flex flex-col overflow-hidden">
            <Navbar />
            <div className="flex-grow overflow-auto scrollbar-hide">
                <div className="max-w-3xl mx-auto px-4 py-8 mt-16">
                    <div className="grid grid-cols-12 gap-8">
                        {/* Left side - Title */}
                        <div className="col-span-4">
                            <div className="flex flex-col space-y-1">
                                <h1 className="text-xl font-semibold text-foreground">Terms</h1>
                                <p className="text-xs text-muted-foreground">
                                    Terms and conditions
                                </p>
                            </div>
                        </div>

                        {/* Right side - Content */}
                        <div className="col-span-8 text-foreground text-xs">
                            <section className="mb-8 mt-4">
                                <h2 className="text-sm font-medium mb-4">— Service Terms</h2>
                                <p className="text-xs mb-2">
                                    By using psychoroid.com, you agree to these terms and our privacy policy. Our services are available to users 13 years or older, and you must provide accurate account information.
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-sm font-medium mb-4">— Content Rights</h2>
                                <p className="text-xs mb-2">
                                    Paid subscribers own full rights to their generated 3D models. Free tier users receive a CC BY 4.0 license, requiring attribution to psychoroid.com for commercial use. You retain rights to your original uploaded content.
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-sm font-medium mb-4">— Credits & Payments</h2>
                                <p className="text-xs mb-2">
                                    ROIDS credits are non-transferable and non-refundable. Subscription payments are processed at the start of each billing period. Cancellations take effect at the period end. There are no refunds except in cases of fraud.
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-sm font-medium mb-4">— Usage Rules</h2>
                                <p className="text-xs mb-2">
                                    You agree not to misuse our services, upload malicious content, or attempt unauthorized access. We reserve the right to suspend accounts that violate these terms or engage in fraudulent activity.
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-sm font-medium mb-4">— Service Changes</h2>
                                <p className="text-xs mb-2">
                                    We may modify our services or terms with notice. Continued use after changes constitutes acceptance. For questions about these terms, contact{' '}
                                    <a
                                        href="mailto:dev@psychoroid.com"
                                        className="text-blue-500 dark:text-blue-400 hover:underline"
                                    >
                                        dev@psychoroid.com
                                    </a>
                                    .
                                </p>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
} 