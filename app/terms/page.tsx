'use client';

import { Navbar } from '@/components/design/Navbar';
import { Footer } from '@/components/design/Footer';

export default function TermsOfService() {
    return (
        <div className="h-svh bg-background flex flex-col overflow-hidden">
            <Navbar />
            <div className="flex-grow overflow-auto scrollbar-hide">
                <div className="max-w-3xl mx-auto px-4 py-8 mt-12">
                    <div className="grid grid-cols-12 gap-8">
                        {/* Left side - Title */}
                        <div className="col-span-4 sticky top-0">
                            <div className="flex flex-col space-y-1">
                                <h1 className="text-xl font-semibold text-foreground">Terms of Service</h1>
                                <p className="text-xs text-muted-foreground">
                                    Our rules and guidelines
                                </p>
                            </div>
                        </div>

                        {/* Right side - Content */}
                        <div className="col-span-8 text-foreground text-xs">
                            <section className="mb-8 mt-4">
                                <h2 className="text-sm font-medium mb-4">— Acceptance of Terms</h2>
                                <p className="text-xs mb-2">By accessing and using psychoroid.com, you accept and agree to be bound by these Terms of Service.</p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-sm font-medium mb-4">— User accounts</h2>
                                <ul className="list-disc pl-6 mb-4 text-xs">
                                    <li>You must be at least 13 years old to use our services</li>
                                    <li>You are responsible for maintaining the security of your account</li>
                                    <li>You are responsible for all activities under your account</li>
                                    <li>You must provide accurate and complete information in your Dashboard section</li>
                                </ul>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-sm font-medium mb-4">— Intellectual property rights</h2>
                                <p className="text-xs mb-2">Users retain their rights to any content they submit, post, or display on psychoroid.com. By submitting content, you grant us a worldwide, non-exclusive license to use, reproduce, modify, and distribute the content.</p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-sm font-medium mb-4">— ROIDS and payments</h2>
                                <ul className="list-disc pl-6 mb-4 text-xs">
                                    <li>ROIDS are our virtual currency for using psychoroid.com services</li>
                                    <li>All purchases are final and non-refundable</li>
                                    <li>We reserve the right to modify ROIDS pricing</li>
                                    <li>You agree not to transfer or sell ROIDS to other users</li>
                                </ul>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-sm font-medium mb-4">— Prohibited activities</h2>
                                <p className="text-xs mb-2">You agree not to:</p>
                                <ul className="list-disc pl-6 mb-4 text-xs">
                                    <li>Violate any laws or regulations</li>
                                    <li>Infringe on intellectual property rights</li>
                                    <li>Upload malicious content or code</li>
                                    <li>Attempt to gain unauthorized access</li>
                                    <li>Use the service for illegal purposes</li>
                                </ul>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-sm font-medium mb-4">— Termination</h2>
                                <p className="text-xs mb-2">We reserve the right to terminate or suspend access to our services immediately, without prior notice or liability, for any reason whatsoever.</p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-sm font-medium mb-4">— Limitation of liability</h2>
                                <p className="text-xs mb-2">In no event shall psychoroid.com be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of the service.</p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-sm font-medium mb-4">— Contact information</h2>
                                <p className="text-xs mb-2">For any questions about these Terms, please contact us at: dev@psychoroid.com</p>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
} 