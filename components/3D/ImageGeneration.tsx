import React, { useState, useCallback, useEffect } from 'react';
import { generateImage } from '@/lib/fal.ai/fal';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import Image from 'next/image';
import { toast } from 'sonner';
import { ChatInstance } from './ChatInstance';
import { useTheme } from 'next-themes';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/lib/contexts/TranslationContext';
import { t } from '@/lib/i18n/translations';
import { PromptTranslator } from './PromptTranslator';
import { supabase } from '@/lib/supabase/supabase';
import { compressImage } from '@/lib/utils/imageCompression';

interface ImageGenerationProps {
    onImageSelect: (imageUrl: string, prompt: string) => void;
    numImages?: number;
    user?: any;
    setShowAuthModal?: (show: boolean) => void;
}

export function ImageGeneration({ onImageSelect, numImages = 4, user, setShowAuthModal }: ImageGenerationProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);
    const [generatedImages, setGeneratedImages] = useState<Array<{ url: string }>>([]);
    const [currentPrompt, setCurrentPrompt] = useState<string>('');
    const [inputValue, setInputValue] = useState('');
    const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
    const { theme } = useTheme();
    const [isProcessing, setIsProcessing] = useState(false);
    const { currentLanguage } = useTranslation();
    const [translatedPrompt, setTranslatedPrompt] = useState<string>('');
    const [generationProgress, setGenerationProgress] = useState(0);

    // Progress animation effect
    useEffect(() => {
        if (isGenerating) {
            setGenerationProgress(0);
            let progress = 0;
            const interval = setInterval(() => {
                progress += 1;
                if (progress <= 90) {
                    setGenerationProgress(progress);
                }
            }, 70); // 6 seconds to reach 90% (60ms * 90 steps = 5.4s, plus buffer)

            return () => {
                clearInterval(interval);
            };
        } else {
            // When generation is complete, quickly fill the remaining progress
            setGenerationProgress(100);
            const timeout = setTimeout(() => {
                setGenerationProgress(0);
            }, 500);
            return () => clearTimeout(timeout);
        }
    }, [isGenerating]);

    const handleCloseModal = useCallback(() => {
        if (generatedImages.length > 0 && !isGenerating) {
            setShowCloseConfirm(true);
        } else {
            setShowModal(false);
        }
    }, [generatedImages.length, isGenerating]);

    const handleConfirmClose = useCallback(() => {
        setShowCloseConfirm(false);
        setShowModal(false);
        setGeneratedImages([]);
        setCurrentPrompt('');
        setInputValue('');
        setSelectedImageUrl(null);
    }, []);

    const handlePromptSubmit = useCallback(async (prompt: string) => {
        if (!prompt.trim()) return;

        try {
            if (!user) {
                setShowAuthModal?.(true);
                return;
            }

            // Fast-fail ROIDS check
            const { data: userRoids, error: roidsError } = await supabase
                .from('user_roids')
                .select('balance')
                .eq('user_id', user.id)
                .single();

            if (roidsError || !userRoids || userRoids.balance < 5) {
                toast.error('Insufficient ROIDS balance', {
                    description: 'You need 5 ROIDS to generate images'
                });
                return;
            }

            setIsGenerating(true);
            setShowModal(true);
            setCurrentPrompt(prompt);
            setSelectedImageUrl(null);

            // Parallel processing: translation and prompt cleaning
            const [cleanPrompt, translatedPrompt] = await Promise.all([
                Promise.resolve(prompt.replace(/\b(3d|3D|three dimensional|3-d)\b/g, '').trim()),
                currentLanguage !== 'en' ?
                    fetch('/api/translate', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Priority': 'high'
                        },
                        body: JSON.stringify({
                            text: prompt,
                            sourceLang: currentLanguage
                        })
                    }).then(res => res.json())
                        .then(data => data.translation || prompt)
                        .catch(() => prompt) :
                    Promise.resolve(prompt)
            ]);

            setTranslatedPrompt(translatedPrompt);

            const result = await generateImage({
                prompt: translatedPrompt,
                num_images: 4,
                image_size: "square_hd",
                guidance_scale: 7.5,
                num_inference_steps: 30
            });

            await supabase.rpc('deduct_roids', {
                p_user_id: user.id,
                p_amount: 5,
                p_description: 'Image generation cost'
            });

            // Set progress to 100% before showing images
            setGenerationProgress(100);
            await new Promise(resolve => setTimeout(resolve, 300)); // Small delay for smooth transition

            setGeneratedImages(result.images);
        } catch (error) {
            console.error('Error generating images:', error);
            toast.error('Failed to generate images. Please try again.');
            setShowModal(false);
        } finally {
            setIsGenerating(false);
        }
    }, [user, setShowAuthModal, currentLanguage]);

    const handleImageClick = useCallback((imageUrl: string) => {
        setSelectedImageUrl(imageUrl === selectedImageUrl ? null : imageUrl);
    }, [selectedImageUrl]);

    const handleImageSelect = useCallback(async () => {
        if (!selectedImageUrl) return;

        try {
            setIsProcessing(true);

            // Compress image before sending
            const compressedImageUrl = await compressImage(selectedImageUrl);

            setShowModal(false);
            onImageSelect(compressedImageUrl, translatedPrompt || currentPrompt);

            // Reset states
            setGeneratedImages([]);
            setCurrentPrompt('');
            setInputValue('');
            setSelectedImageUrl(null);
        } catch (error) {
            console.error('Error processing generated image:', error);
            toast.error('Failed to process the generated image');
        } finally {
            setIsProcessing(false);
        }
    }, [selectedImageUrl, onImageSelect, currentPrompt, translatedPrompt]);

    return (
        <>
            <div className="max-w-3xl mx-auto px-2 sm:px-0 relative">
                <ChatInstance
                    onPromptSubmit={handlePromptSubmit}
                    isUploading={isGenerating}
                    showPreview={false}
                    user={user}
                    setShowAuthModal={setShowAuthModal}
                    onFileSelect={() => { }}
                    value={inputValue}
                    onChange={setInputValue}
                />
                {currentPrompt && currentLanguage !== 'en' && (
                    <div className="mt-2 text-sm text-muted-foreground">
                        <div className="flex flex-col space-y-1">
                            <span className="font-medium">{t(currentLanguage, 'ui.prompt.original')}:</span>
                            <span>{currentPrompt}</span>
                            {translatedPrompt && (
                                <>
                                    <span className="font-medium mt-1">{t(currentLanguage, 'ui.prompt.translated')}:</span>
                                    <span>{translatedPrompt}</span>
                                </>
                            )}
                        </div>
                    </div>
                )}
                {currentPrompt && (
                    <PromptTranslator
                        originalPrompt={currentPrompt}
                        onTranslatedPrompt={setTranslatedPrompt}
                        className="mt-2"
                        sourceLang={currentLanguage}
                    />
                )}
            </div>

            <Dialog open={showModal} onOpenChange={handleCloseModal}>
                <DialogContent className="max-w-[600px] p-4 bg-background/25 backdrop-blur-md border-none rounded-none" hideClose>
                    <DialogTitle className="sr-only">Generated Images</DialogTitle>
                    <div className="relative">
                        <div className={`grid grid-cols-2 md:grid-cols-${numImages === 2 ? '2' : '4'} gap-4 p-4`}>
                            {isGenerating ? (
                                <div className="col-span-full flex flex-col items-center justify-center py-8 space-y-3 pointer-events-none" tabIndex={-1}>
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <p className="text-sm">{t(currentLanguage, 'ui.imageGeneration.generating')}</p>
                                    </div>
                                    <div className="w-full max-w-[200px] space-y-2">
                                        <div className="w-full bg-accent h-1">
                                            <div
                                                className="bg-green-500 h-1 transition-all duration-300"
                                                style={{
                                                    width: `${generationProgress}%`,
                                                    transition: 'width 0.5s ease-in-out'
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                generatedImages.map((image, index) => (
                                    <div
                                        key={index}
                                        className={`relative cursor-pointer group ${selectedImageUrl === image.url ? 'ring-2 ring-foreground' : ''}`}
                                        onClick={() => handleImageClick(image.url)}
                                    >
                                        <Image
                                            src={image.url}
                                            alt={`Generated image ${index + 1}`}
                                            width={512}
                                            height={512}
                                            className={`w-full h-auto transition-opacity ${selectedImageUrl === image.url ? 'opacity-100' : 'group-hover:opacity-90'}`}
                                        />
                                        <div
                                            className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 border-gray-400 flex items-center justify-center
                                                ${selectedImageUrl === image.url ? 'bg-transparent' : ''}`}
                                        >
                                            {selectedImageUrl === image.url && (
                                                <div className="w-4 h-4 rounded-full bg-gray-400" />
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {!isGenerating && generatedImages.length > 0 && (
                            <div className="flex justify-center p-4">
                                <Button
                                    onClick={handleImageSelect}
                                    disabled={!selectedImageUrl}
                                    variant="outline"
                                    size="default"
                                    className="hover:bg-foreground hover:text-background transition-colors rounded-none text-xs font-medium px-4"
                                >
                                    {t(currentLanguage, 'ui.imageGeneration.useSelectedImage')}
                                </Button>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
                <AlertDialogContent className="rounded-none">
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {t(currentLanguage, 'ui.imageGeneration.closeConfirm.title')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {t(currentLanguage, 'ui.imageGeneration.closeConfirm.description')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-none" onClick={() => setShowCloseConfirm(false)}>
                            {t(currentLanguage, 'ui.imageGeneration.closeConfirm.cancel')}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="rounded-none bg-red-500 hover:bg-red-600"
                            onClick={handleConfirmClose}
                        >
                            {t(currentLanguage, 'ui.imageGeneration.closeConfirm.close')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}