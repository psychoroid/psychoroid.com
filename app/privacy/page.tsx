'use client';

import { Navbar } from '@/components/design/Navbar';
import { Footer } from '@/components/design/Footer';

export default function PrivacyPolicy() {
    return (
        <div className="h-svh bg-background flex flex-col overflow-hidden">
            <Navbar />
            <div className="flex-grow overflow-auto scrollbar-hide">
                <div className="max-w-3xl mx-auto px-4 py-8 mt-12">
                    <div className="grid grid-cols-12 gap-8">
                        {/* Left side - Title */}
                        <div className="col-span-4 sticky top-0">
                            <div className="flex flex-col space-y-1">
                                <h1 className="text-xl font-semibold text-foreground">Privacy Policy</h1>
                                <p className="text-xs text-muted-foreground">
                                    How we handle your data
                                </p>
                            </div>
                        </div>

                        {/* Right side - Content */}
                        <div className="col-span-8 text-foreground text-xs">
                            <section className="mb-8 mt-4">
                                <h2 className="text-sm font-medium mb-4">— Information we collect</h2>
                                <p className="text-xs mb-2">We collect information that you provide directly to us, including:</p>
                                <ul className="list-disc pl-6 mb-4 text-xs">
                                    <li>Account information (name, email, password)</li>
                                    <li>Payment information</li>
                                    <li>User-generated content and uploads</li>
                                    <li>Communication preferences</li>
                                </ul>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-sm font-medium mb-4">— How we use your information</h2>
                                <p className="text-xs mb-2">We use the collected information to:</p>
                                <ul className="list-disc pl-6 mb-4 text-xs">
                                    <li>Provide and maintain our services</li>
                                    <li>Process your transactions</li>
                                    <li>Send you service-related communications</li>
                                    <li>Improve and optimize our platform</li>
                                    <li>Protect against fraud and unauthorized access</li>
                                </ul>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-sm font-medium mb-4">— Data storage and security</h2>
                                <p className="text-xs mb-2">We implement appropriate security measures to protect your personal information. Your data is stored securely using industry-standard encryption and security practices.</p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-sm font-medium mb-4">— Your rights</h2>
                                <p className="text-xs mb-2">You have the right to:</p>
                                <ul className="list-disc pl-6 mb-4 text-xs">
                                    <li>Access your personal data</li>
                                    <li>Correct inaccurate data</li>
                                    <li>Request deletion of your data</li>
                                    <li>Object to data processing</li>
                                    <li>Data portability</li>
                                </ul>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-sm font-medium mb-4">— Contact us</h2>
                                <p className="text-xs mb-2">If you have any questions about this Privacy Policy, please contact us at: dev@psychoroid.com</p>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
} 