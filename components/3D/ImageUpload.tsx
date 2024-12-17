'use client'

import React, { useCallback, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/supabase'
import toast from 'react-hot-toast'
import { AuthModal } from '@/components/auth/AuthModal'
import { useUser } from '@/lib/contexts/UserContext'
import { ImageUploadProps } from '@/types/components'
import { ProductDetails } from '@/types/product'
import { PROGRESS_MESSAGES } from '@/lib/utils/progressMessages'
import { ChatInstance } from './ChatInstance'
import { motion, AnimatePresence } from 'framer-motion'

interface SavedProgresses {
  [key: string]: number;
}

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

  useEffect(() => {
    const loadSavedProgress = () => {
      const savedProgresses = Object.keys(localStorage)
        .filter(key => key.startsWith('progress_'))
        .reduce<{ [key: string]: number }>((acc, key) => {
          const imagePath = key.replace('progress_', '');
          const progress = parseFloat(localStorage.getItem(key) || '0');
          acc[imagePath] = progress;
          return acc;
        }, {});

      if (Object.keys(savedProgresses).length > 0) {
        Object.entries(savedProgresses).forEach(([imagePath, progress]) => {
          onProgressUpdate(imagePath, progress);
        });
      }
    };

    loadSavedProgress();
  }, [onProgressUpdate]);

  const generate3DModel = useCallback(async (imagePath: string, onProgress: (progress: number) => void): Promise<string> => {
    try {
      const imageUrl = `https://peyzpnmmgsxjydvpussg.supabase.co/storage/v1/object/public/product-images/${imagePath}`;

      // Initial upload - 0 to 10%
      onProgress(5);
      await new Promise(resolve => setTimeout(resolve, 500));
      onProgress(10);

      const imageResponse = await fetch(imageUrl)
      const imageBlob = await imageResponse.blob()
      const file = new File([imageBlob], imagePath, { type: imageBlob.type })

      // Processing image - 10 to 15%
      onProgress(15);

      const formData = new FormData()
      formData.append('image', file)

      // Image preprocessing - 15 to 25%
      onProgress(20);
      await new Promise(resolve => setTimeout(resolve, 500));
      onProgress(25);

      // Simplified progress tracking
      const updateProgress = (progress: number) => {
        onProgress(progress);
        localStorage.setItem(`progress_${imagePath}`, progress.toString());
      };

      updateProgress(25);

      const meshResponse = await fetch('http://localhost:8000/generate_mesh', {
        method: 'POST',
        body: formData,
      });

      if (!meshResponse.ok) {
        throw new Error(`Failed to generate 3D model: ${meshResponse.statusText}`);
      }

      updateProgress(90);
      const meshBlob = await meshResponse.blob();

      // Upload to Supabase storage
      const modelFileName = `${imagePath.split('.')[0]}.glb`
      const modelPath = `models/${modelFileName}`

      console.log('Uploading model to:', modelPath);

      const { data: modelData, error: modelError } = await supabase.storage
        .from('product-models')
        .upload(modelPath, meshBlob, {
          contentType: 'model/gltf-binary',
          cacheControl: '3600',
          upsert: true
        })

      if (modelError) {
        console.error('Failed to upload model:', modelError);
        throw modelError;
      }

      console.log('Model uploaded successfully:', modelData);

      const { data: { publicUrl: modelUrl } } = supabase.storage
        .from('product-models')
        .getPublicUrl(modelPath)

      // Create product record in database
      const { data: productData, error: productError } = await supabase
        .rpc('create_product', {
          p_name: 'New Product',
          p_description: 'Product description',
          p_image_path: imagePath,
          p_model_path: modelPath,
          p_user_id: user?.id
        })

      if (productError) {
        console.error('Error creating product:', productError)
        throw productError
      }

      updateProgress(100);
      localStorage.removeItem(`progress_${imagePath}`);
      return modelUrl;
    } catch (error) {
      console.error('Error in generate3DModel:', error);
      throw error;
    }
  }, [user]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!user) {
        setShowAuthModal(true)
        return
      }

      // Check if server is available
      try {
        const response = await fetch('http://localhost:8000/health')
        if (!response.ok) {
          toast.error('Server is currently offline. Please try again later.')
          return
        }
      } catch (error) {
        toast.error('Server is currently offline. Please try again later.')
        // Reset any partial uploads
        setImagePaths([])
        setModelUrl(null)
        return
      }

      setUploading(true)
      const files = event.target.files
      if (!files || files.length === 0) return

      const uploadPromises = Array.from(files).map(async (file, index) => {
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}_${index}.${fileExt}`
        const filePath = `${fileName}`
        let uploadedImagePath: string | null = null

        // Show initial upload toast
        const uploadToast = toast.loading('Starting upload...')
        onProgressUpdate(filePath, 5)

        try {
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(filePath, file)

          if (uploadError) {
            toast.error('Upload failed', { id: uploadToast })
            throw uploadError
          }

          if (uploadData) {
            toast.success('Upload complete', { id: uploadToast })
            uploadedImagePath = uploadData.path
            onImageUpload(uploadedImagePath)
            setImagePaths((prevImagePaths) => [...prevImagePaths, uploadedImagePath!])

            setIsLoading(true)
            const processingToast = toast.loading('Processing image...')

            try {
              const modelUrl = await generate3DModel(uploadedImagePath, (progress) => {
                onProgressUpdate(uploadedImagePath!, progress)
                toast.loading(getProgressMessage(progress), { id: processingToast })
              })

              setModelUrl(modelUrl)
              toast.success('3D model generated successfully!', { id: processingToast })

              const { data: productData, error: productError } = await supabase
                .rpc('create_product', {
                  p_name: 'New Product',
                  p_description: 'Product description',
                  p_image_path: uploadedImagePath,
                  p_model_path: modelUrl,
                  p_user_id: user.id
                })
                .single()

              if (productError) {
                // Clean up the uploaded image if product creation fails
                await supabase.storage
                  .from('product-images')
                  .remove([uploadedImagePath])
                console.error('Error creating product:', productError)
                throw new Error('Failed to create product')
              }

              return productData
            } catch (error) {
              // Clean up the uploaded image if processing fails
              if (uploadedImagePath) {
                await supabase.storage
                  .from('product-images')
                  .remove([uploadedImagePath])
              }
              throw error
            }
          }
        } catch (error) {
          // If any error occurs during the process, ensure we clean up
          if (uploadedImagePath) {
            await supabase.storage
              .from('product-images')
              .remove([uploadedImagePath])
          }
          throw error
        }
      })

      await Promise.all(uploadPromises)
    } catch (error) {
      console.error('Error uploading images:', error)
      toast.error('Error uploading images: ' + (error instanceof Error ? error.message : String(error)))
      // Reset states on error
      setImagePaths([])
      setModelUrl(null)
    } finally {
      setUploading(false)
      setIsLoading(false)
      if (event.target) {
        event.target.value = ''
      }
    }
  }, [onImageUpload, onProgressUpdate, generate3DModel, user])

  const getProgressMessage = (progress: number) => {
    const messageSet = PROGRESS_MESSAGES.find(set => progress <= set.threshold);
    if (!messageSet) return PROGRESS_MESSAGES[0].messages[0];
    return messageSet.messages[Math.floor(Math.random() * messageSet.messages.length)];
  };

  const handlePromptSubmit = async (prompt: string) => {
    // TODO: Implement prompt-based 3D mesh generation
    console.log('Generating 3D mesh from prompt:', prompt)
  }

  return (
    <>
      <div className="max-w-3xl mx-auto">
        <ChatInstance
          onFileSelect={handleFileUpload}
          isUploading={uploading}
          onPromptSubmit={handlePromptSubmit}
        />

        <AnimatePresence>
          {uploading && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="mt-2 mb-4"
            >
              <motion.p
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="text-gray-500 dark:text-gray-300 text-sm font-medium bg-black/50 px-3 py-1.5 rounded-none backdrop-blur-sm"
              >
                {getProgressMessage(currentProgress)}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  )
}

