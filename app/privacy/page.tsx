'use client';

import { Navbar } from '@/components/design/Navbar';
import { Footer } from '@/components/design/Footer';

export default function PrivacyPolicy() {
    return (
        <div className="h-svh bg-background flex flex-col overflow-hidden">
            <Navbar />
            <div className="flex-grow overflow-auto scrollbar-hide">
                <div className="max-w-3xl mx-auto px-4 py-8 mt-16">
                    <div className="grid grid-cols-12 gap-8">
                        {/* Left side - Title */}
                        <div className="col-span-4">
                            <div className="flex flex-col space-y-1">
                                <h1 className="text-xl font-semibold text-foreground">Privacy</h1>
                                <p className="text-xs text-muted-foreground">
                                    Our privacy policy
                                </p>
                            </div>
                        </div>

                        {/* Right side - Content */}
                        <div className="col-span-8 text-foreground text-xs">
                            <section className="mb-8 mt-4">
                                <h2 className="text-sm font-medium mb-4">— Data Collection</h2>
                                <p className="text-xs mb-2">
                                    We collect essential account information (email, password), payment details for transactions, and the content you upload to generate 3D assets. This data is necessary to provide our services and improve your experience.
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-sm font-medium mb-4">— Data Usage</h2>
                                <p className="text-xs mb-2">
                                    Your data is used to provide our 3D generation services, process payments, and maintain your account. We analyze usage patterns to improve our AI models and user experience, always respecting your privacy.
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-sm font-medium mb-4">— Data Security</h2>
                                <p className="text-xs mb-2">
                                    We use industry-standard encryption and security measures to protect your data. Your 3D assets and personal information are stored securely, and access is strictly controlled.
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-sm font-medium mb-4">— Your Rights</h2>
                                <p className="text-xs mb-2">
                                    You can access, modify, or delete your data at any time through your Dashboard. You may also request a copy of your data or opt out of non-essential data collection by contacting our support team.
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-sm font-medium mb-4">— Contact</h2>
                                <p className="text-xs mb-2">
                                    For privacy concerns or data requests, contact us at dev@psychoroid.com. We typically respond within 48 hours.
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