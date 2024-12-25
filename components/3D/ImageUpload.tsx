'use client'

import React, { useCallback, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/supabase'
import { toast } from 'sonner'
import { AuthModal } from '@/components/auth/AuthModal'
import { useUser } from '@/lib/contexts/UserContext'
import { ImageUploadProps } from '@/types/components'
import { ProductDetails } from '@/types/product'
import { PROGRESS_MESSAGES, AVERAGE_PROCESSING_TIME, ProgressMessage } from '@/lib/utils/progressMessages'
import { ChatInstance } from './ChatInstance'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from '@/lib/contexts/TranslationContext'
import { t } from '@/lib/i18n/translations'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { generateAssetMetadata } from '@/lib/utils/assetNaming'

interface SavedProgresses {
  [key: string]: number;
}

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png']
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB in bytes

export function ImageUpload({ onImageUpload, onModelUrlChange, onProgressUpdate }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const { user } = useUser()
  const [isLoading, setIsLoading] = useState(false)
  const [imagePaths, setImagePaths] = useState<string[]>([])
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [modelUrl, setModelUrl] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [currentProgress, setCurrentProgress] = useState(0)
  const [processingImages, setProcessingImages] = useState<{ [key: string]: number }>({})
  const { currentLanguage } = useTranslation()
  const router = useRouter()
  const [processingStartTime, setProcessingStartTime] = useState<number | null>(null);
  const [currentMessage, setCurrentMessage] = useState<string>('');
  const [currentTimeRange, setCurrentTimeRange] = useState<number>(-1);

  useEffect(() => {
    if (!selectedImage) return;

    let isMounted = true;

    const fetchProductDetails = async () => {
      try {
        const { data: productDetails, error: productDetailsError } = await supabase
          .rpc('get_product_details', {
            p_image_path: selectedImage
          })
          .single<ProductDetails>();

        if (!isMounted) return;

        if (productDetailsError) {
          console.error('Error fetching product details:', productDetailsError);
          return;
        }

        if (productDetails?.model_path) {
          onModelUrlChange(productDetails.model_path);
        }
      } catch (error) {
        console.error('Error in fetchProductDetails:', error);
      }
    };

    fetchProductDetails();

    return () => {
      isMounted = false;
    };
  }, [selectedImage, onModelUrlChange]);

  const onImageClick = useCallback((imagePath: string) => {
    setSelectedImage(imagePath);
  }, []);

  const onImageRemove = useCallback((imagePath: string) => {
    setImagePaths(prev => prev.filter(path => path !== imagePath));

    if (selectedImage === imagePath) {
      setSelectedImage(null);
      onModelUrlChange(null);
    }
  }, [selectedImage, onModelUrlChange]);

  const onPageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const updateProgress = useCallback((imagePath: string, progress: number) => {
    setProcessingImages(prev => ({
      ...prev,
      [imagePath]: progress
    }))
    onProgressUpdate(imagePath, progress)
  }, [onProgressUpdate])

  const generate3DModel = useCallback(async (imagePath: string, onProgress: (progress: number) => void): Promise<string> => {
    const checkServerHealth = async () => {
      try {
        const response = await fetch('http://localhost:8000/health')
        if (!response.ok) {
          throw new Error('Server is offline')
        }
        return true
      } catch (error) {
        toast.error(t(currentLanguage, 'ui.server.offline'), {
          description: t(currentLanguage, 'ui.server.offline_description')
        })
        return false
      }
    }

    try {
      if (!user) throw new Error('Not authenticated');

      // Check server health before proceeding
      const isServerHealthy = await checkServerHealth()
      if (!isServerHealthy) {
        throw new Error('Server is offline')
      }

      // Get the image from storage
      const imageUrl = `https://peyzpnmmgsxjydvpussg.supabase.co/storage/v1/object/public/product-images/${imagePath}`;
      const imageResponse = await fetch(imageUrl);
      const imageBlob = await imageResponse.blob();

      // Create a File object from the blob
      const fileName = imagePath.split('/').pop() || 'image.jpg';
      const file = new File([imageBlob], fileName, {
        type: imageBlob.type || 'image/jpeg'
      });

      // Create model path
      const modelPath = `${user.id}/${Date.now()}_${fileName.split('.')[0]}.glb`;

      // Create form data
      const formData = new FormData();
      formData.append('image', file);

      // Send to server
      const meshResponse = await fetch('http://localhost:8000/generate_mesh', {
        method: 'POST',
        body: formData
      });

      if (!meshResponse.ok) {
        const errorData = await meshResponse.json();
        console.error('Server response:', errorData);
        throw new Error(`Failed to generate 3D model: ${meshResponse.statusText} - ${JSON.stringify(errorData)}`);
      }

      onProgress(90);
      const meshBlob = await meshResponse.blob();

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('product-models')
        .upload(modelPath, meshBlob, {
          contentType: 'model/gltf-binary',
          upsert: true
        });

      if (uploadError) throw uploadError;

      onProgress(90);
      return modelPath;

    } catch (error: any) {
      console.error('Error in generate3DModel:', error);
      if (error.message.includes('Server is offline')) {
        throw error;
      }
      throw new Error(t(currentLanguage, 'ui.model.generation_failed'));
    }
  }, [user, currentLanguage]);

  const isValidFile = useCallback((file: File): { valid: boolean; error?: string } => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return { valid: false, error: t(currentLanguage, 'ui.upload.invalid_format_msg') }
    }

    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: t(currentLanguage, 'ui.upload.file_too_large') }
    }

    return { valid: true }
  }, [currentLanguage]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const resetStates = () => {
      setUploading(false)
      setIsLoading(false)
      setProcessingStartTime(null)
      setCurrentTimeRange(-1)
      setCurrentMessage('')
      if (event.target) {
        event.target.value = ''
      }
    }

    const checkServerHealth = async () => {
      try {
        const response = await fetch('http://localhost:8000/health')
        if (!response.ok) {
          throw new Error('Server is offline')
        }
        return true
      } catch (error) {
        toast.error(t(currentLanguage, 'ui.server.offline'), {
          description: t(currentLanguage, 'ui.server.offline_description')
        })
        resetStates()
        return false
      }
    }

    try {
      if (!user) {
        setShowAuthModal(true);
        return;
      }

      // Check user's ROIDS balance before proceeding
      const { data: userRoids, error: roidsError } = await supabase
        .from('user_roids')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (roidsError) {
        toast.error('Error checking ROIDS balance');
        resetStates();
        return;
      }

      if (!userRoids || userRoids.balance < 25) {
        toast.error('Insufficient ROIDS balance', {
          description: 'You need 25 ROIDS to generate a 3D model'
        });
        resetStates();
        return;
      }

      const files = event.target.files;
      if (!files || files.length === 0) return;

      // Filter out invalid files
      const validFiles = Array.from(files).filter(file => {
        const validation = isValidFile(file);
        if (!validation.valid && validation.error) {
          toast.error(validation.error);
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) {
        resetStates()
        return;
      }

      const uploadPromises = validFiles.map(async (file, index) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}_${index}.${fileExt}`;
        const filePath = `${fileName}`;

        try {
          // Check server health before starting upload
          const isServerHealthy = await checkServerHealth()
          if (!isServerHealthy) {
            resetStates()
            return;
          }

          setUploading(true);
          // Upload the image to Supabase storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(filePath, file);

          if (uploadError) {
            toast.error(t(currentLanguage, 'ui.upload.failed'));
            resetStates()
            throw uploadError;
          }

          if (uploadData) {
            setIsLoading(true);

            // Create initial product record with just the image
            const { data: initialProduct, error: initialProductError } = await supabase.rpc('create_product', {
              p_name: 'Processing...',
              p_description: 'Generated from image',
              p_image_path: filePath,
              p_model_path: null,
              p_user_id: user.id
            });

            if (initialProductError) {
              console.error('Initial product creation error:', initialProductError);
              throw initialProductError;
            }

            try {
              const modelUrl = await generate3DModel(filePath, (progress) => {
                onProgressUpdate(filePath, progress);
              });

              // Generate metadata for the update
              const metadata = generateAssetMetadata();

              // Update the product with model path, name, and tags
              const { data: updatedProduct, error: updateError } = await supabase.rpc('update_product', {
                p_image_path: filePath,
                p_model_path: modelUrl,
                p_user_id: user.id,
                p_name: metadata.name,
                p_tags: metadata.tags
              });

              if (updateError) {
                console.error('Error updating product:', updateError);
                throw new Error('Failed to update product');
              }

              setImagePaths(prev => [...prev, filePath]);
              onImageUpload(filePath);
              router.push(`/studio?image=${filePath}&model=${modelUrl}`);

              return updatedProduct;
            } catch (error: any) {
              console.error('Error during 3D processing:', error);
              if (error.message.includes('Server is offline')) {
                // Delete the uploaded image since we couldn't process it
                await supabase.storage
                  .from('product-images')
                  .remove([filePath]);
              } else {
                toast.error(t(currentLanguage, 'ui.upload.processing_failed'));
              }
              resetStates()
            }
          }
        } catch (error) {
          console.error('Error during upload:', error);
          toast.error(t(currentLanguage, 'ui.upload.error') + String(error));
          resetStates()
        }
      });

      await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error(t(currentLanguage, 'ui.upload.error_multiple') + String(error));
    } finally {
      resetStates()
    }
  }, [
    onImageUpload,
    onProgressUpdate,
    generate3DModel,
    user,
    currentLanguage,
    router,
    isValidFile
  ]);

  // Update the progress message based on elapsed time
  useEffect(() => {
    if (!uploading) {
      setProcessingStartTime(null);
      setCurrentTimeRange(-1);
      setCurrentMessage('');
      return;
    }

    if (!processingStartTime) {
      setProcessingStartTime(Date.now());
      const randomIndex = Math.floor(Math.random() * PROGRESS_MESSAGES[0].messages.length);
      setCurrentMessage(PROGRESS_MESSAGES[0].messages[randomIndex]);
      setCurrentTimeRange(0);
    }

    const intervalId = setInterval(() => {
      const elapsedTime = Date.now() - (processingStartTime || Date.now());
      const newTimeRangeIndex = PROGRESS_MESSAGES.findIndex(
        set => elapsedTime >= set.timeRange[0] && elapsedTime < set.timeRange[1]
      );

      if (newTimeRangeIndex !== -1 && newTimeRangeIndex !== currentTimeRange) {
        const messageSet = PROGRESS_MESSAGES[newTimeRangeIndex];
        const randomIndex = Math.floor(Math.random() * messageSet.messages.length);
        setCurrentMessage(messageSet.messages[randomIndex]);
        setCurrentTimeRange(newTimeRangeIndex);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [uploading, processingStartTime, currentTimeRange]);

  const handlePromptSubmit = async (prompt: string) => {
    if (!user) {
      setShowAuthModal(true)
      return
    }

    // TODO: Implement prompt-based 3D mesh generation
    console.log('Generating 3D mesh from prompt:', prompt)
  }

  return (
    <>
      <div className="max-w-3xl mx-auto px-2 sm:px-0 relative">
        <ChatInstance
          onFileSelect={handleFileUpload}
          isUploading={uploading}
          onPromptSubmit={handlePromptSubmit}
          showPreview={false}
          user={user}
          setShowAuthModal={setShowAuthModal}
        />
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {uploading && currentMessage && (
        <div className="fixed bottom-40 left-0 right-0 flex justify-center">
          <div className="flex items-center gap-2 px-4 py-2 text-sm bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm border border-black/10 dark:border-white/10 text-black dark:text-white shadow-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>{currentMessage}</span>
          </div>
        </div>
      )}
    </>
  )
}

