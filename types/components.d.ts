export interface ImageUploadProps {
  onImageUpload: (imagePath: string) => void;
  onModelUrlChange: (modelUrl: string | null) => void;
  onProgressUpdate: (imagePath: string, progress: number) => void;
}

export interface ImagePreviewProps {
  imagePaths: string[];
  selectedImage: string | null;
  onImageClick: (imagePath: string | null, modelUrl: string | null) => void;
  onImageRemove: (imagePath: string) => void;
  currentPage: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
  isExpanded?: boolean;
  processingImages: { [key: string]: number };
  setImagePaths: (paths: string[]) => void;
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
  imageUrl?: string;
  modelUrl?: string | null;
  isRotating?: boolean;
  zoom?: number;
  modelState?: ModelState;
  onModelStateChange?: (state: ModelState) => void;
  onLoad?: () => void;
  onError?: (error: any) => void;
  onProgress?: (progress: number) => void;
  scale?: [number, number, number];
}

export interface ProductControlsProps {
  isRotating: boolean;
  onRotateToggle: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onExpand?: () => void;
  onDownload?: () => void;
  hideExpand?: boolean;
  hideDownload?: boolean;
  isZoomToCursor?: boolean;
  onZoomModeToggle?: () => void;
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
  type: 'free' | 'subscription' | 'one_time';
  isLoading?: boolean;
  onPurchase: () => void;
  isLoggedIn?: boolean;
  loadingPlan: string | null | undefined;
} 