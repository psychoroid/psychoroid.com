'use client';

import React, { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface ImageUploadProps {
  onImageUpload: (image: string) => void;
}

interface Product {
  id: string;
  name: string;
  description: string;
  image_path: string;
}

export function ImageUpload({ onImageUpload }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file) return;

      // Upload to Supabase Storage
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (error) throw error;

      if (data) {
        const imagePath = data.path;
        const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(imagePath);
        onImageUpload(imagePath);

        // Create a product record using the RPC function
        const { data: productData, error: productError } = await supabase
          .rpc('create_product', {
            p_name: 'New Product',
            p_description: 'Product description',
            p_image_path: imagePath,
          })
          .single();

        if (productError) {
          console.error('Error creating product:', productError);
          throw new Error('Failed to create product');
        }

        toast.success('Image uploaded successfully');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Error uploading image');
    } finally {
      setUploading(false);
    }
  }, [onImageUpload]);

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="flex flex-col items-center">
        <label
          htmlFor="image-upload"
          className={`w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span className="text-sm text-gray-500">
            {uploading ? 'Uploading...' : 'Upload product image'}
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
        <p className="mt-2 text-xs text-gray-500">
          Supported formats: JPG, PNG (max 5MB)
        </p>
      </div>
    </div>
  );
}