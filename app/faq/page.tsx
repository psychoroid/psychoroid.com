'use client';

import { Navbar } from '@/components/design/Navbar';
import { Footer } from '@/components/design/Footer';

export default function FAQPage() {
    return (
        <div className="h-svh bg-background flex flex-col overflow-hidden">
            <Navbar />
            <div className="flex-grow overflow-hidden">
                <div className="max-w-3xl mx-auto px-4 py-8 mt-16">
                    <div className="grid grid-cols-12 gap-8">
                        {/* Left side - Title */}
                        <div className="col-span-4">
                            <div className="flex flex-col space-y-1">
                                <h1 className="text-xl font-semibold text-foreground">FAQ</h1>
                                <p className="text-xs text-muted-foreground">
                                    Common questions
                                </p>
                            </div>
                        </div>

                        {/* Right side - Content */}
                        <div className="col-span-8 text-foreground text-xs">
                            <section className="mb-8 mt-4">
                                <h2 className="text-sm font-medium mb-4">— What is psychoroid.com?</h2>
                                <p className="text-xs mb-2">
                                    psychoroid.com is an AI-powered 3D Toolkit platform that converts text and 2D images into high-quality 3D assets.
                                    Built for creators, game developers, and 3D enthusiasts, our platform makes 3D creation accessible to everyone.
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-sm font-medium mb-4">— How do credits work?</h2>
                                <p className="text-xs mb-2">
                                    Credits (ROIDS) are our virtual currency used to generate 3D assets. Each conversion task costs a certain amount of credits.
                                    Free users on sign-up receive 200 ROIDS, while subscribers receive monthly ROIDS based on their plan.
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-sm font-medium mb-4">— What file formats are supported?</h2>
                                <p className="text-xs mb-2">
                                    For input, we support JPG and PNG files up to 5MB. Output formats include GLB, GLTF, and USDZ,
                                    making our models compatible with most 3D software and platforms.
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-sm font-medium mb-4">— Are my assets secure?</h2>
                                <p className="text-xs mb-2">
                                    Yes, we take data security seriously. Your assets are stored securely, and we will never share
                                    your data or use it for training without your explicit consent.
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-sm font-medium mb-4">— Can I use the models commercially?</h2>
                                <p className="text-xs mb-2">
                                    Yes. Paid subscribers own full rights to their generated models. Free users receive a CC BY 4.0 license,
                                    allowing commercial use with attribution to Psychoroid Studios.
                                </p>
                            </section>

                            <section className="mb-8">
                                <h2 className="text-sm font-medium mb-4">— How do I manage my subscription?</h2>
                                <p className="text-xs mb-2">
                                    You can manage your subscription, including upgrades and cancellations, from your account settings in your Dashboard.
                                    Changes to subscriptions take effect immediately and cancelations are processed at the end of the current billing period. There are no refunds except in cases of fraud.
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