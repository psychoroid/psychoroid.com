export interface ImageUploadProps {
  onImageUpload: (imagePath: string) => void;
  onModelUrlChange: (modelUrl: string | null) => void;
  onProgressUpdate: (imagePath: string, progress: number) => void;
}

export interface ImagePreviewProps {
  imagePaths: string[];
  selectedImage: string | null;
  onImageClick: (imagePath: string, modelUrl: string) => void;
  onImageRemove: (imagePath: string) => void;
  currentPage: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
  isExpanded?: boolean;
  processingImages: { [key: string]: number };
}

export interface ProductViewerProps {
  imagePath?: string | null;
  modelUrl?: string | null;
  isRotating?: boolean;
  zoom?: number;
  isExpanded?: boolean;
  onClose?: () => void;
}

export interface ModelState {
  rotation: [number, number, number];
  position: [number, number, number];
  scale: [number, number, number];
}

export interface ProductProps {
  imageUrl?: string | null;
  modelUrl?: string | null;
  isRotating?: boolean;
  zoom?: number;
  modelState?: ModelState;
  onModelStateChange?: (state: ModelState) => void;
}

export interface ProductControlsProps {
  isRotating: boolean;
  onRotateToggle: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onExpand?: () => void;
  hideExpand?: boolean;
}

export interface PricingCardProps {
  name: string;
  price: number;
  discountedPrice?: number;
  period?: string;
  yearlyPrice?: number;
  credits: number;
  features: string[];
  description: string;
  subtitle?: string;
  onPurchase?: () => void;
} 