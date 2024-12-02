'use client'

import React, { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface ImageUploadProps {
  onImageUpload: (imagePath: string) => void
}

export function ImageUpload({ onImageUpload }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)
      const file = event.target.files?.[0]
      if (!file) return

      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw new Error('Error getting user: ' + userError.message)
      if (!user) throw new Error('No user found')

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file)

      if (error) throw error

      if (data) {
        const imagePath = data.path
        onImageUpload(imagePath)

        const { data: productData, error: productError } = await supabase
          .rpc('create_product', {
            p_name: 'New Product',
            p_description: 'Product description',
            p_image_path: imagePath,
          })
          .single()

        if (productError) {
          console.error('Error creating product:', productError)
          throw new Error('Failed to create product')
        }

        toast.success('Image uploaded successfully')
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Error uploading image: ' + (error instanceof Error ? error.message : String(error)))
    } finally {
      setUploading(false)
    }
  }, [onImageUpload])

  return (
    <div className="w-full">
      <label
        htmlFor="image-upload"
        className={`w-full h-64 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        <span className="text-lg text-gray-500">
          {uploading ? 'Uploading...' : 'Click or drag to upload product image'}
        </span>
        <input
          id="image-upload"
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleFileUpload}
          disabled={uploading}
        />
      </label>
      <p className="mt-2 text-sm text-gray-500 text-center">
        Supported formats: JPG, PNG (max 5MB)
      </p>
    </div>
  )
}

