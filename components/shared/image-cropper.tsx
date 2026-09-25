import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new window.Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
): Promise<File> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas is empty'));
        return;
      }
      resolve(new File([blob], 'cropped.jpeg', { type: 'image/jpeg' }));
    }, 'image/jpeg', 0.9);
  });
}

interface ImageCropperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  onCropComplete: (croppedFile: File) => void;
  aspect?: number;
}

export function ImageCropper({ open, onOpenChange, imageSrc, onCropComplete, aspect = 2.05 }: ImageCropperProps) {
  const { language } = useLanguage();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropCompleteHandler = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setIsProcessing(true);
    try {
      const file = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(file);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{language === 'ku' ? 'بڕینی وێنەکە (Crop)' : 'Crop Image'}</DialogTitle>
        </DialogHeader>
        
        <div className="relative w-full h-[300px] bg-slate-900 rounded-xl overflow-hidden mt-2">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onCropComplete={onCropCompleteHandler}
            onZoomChange={setZoom}
          />
        </div>
        
        <div className="mt-4 px-2 space-y-3">
          <div className="text-sm font-medium">{language === 'ku' ? 'نزیککردنەوە (Zoom)' : 'Zoom'}</div>
          <Slider
            value={[zoom]}
            min={1}
            max={3}
            step={0.1}
            onValueChange={(v) => setZoom(v[0])}
          />
        </div>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            {language === 'ku' ? 'پاشگەزبوونەوە' : 'Cancel'}
          </Button>
          <Button onClick={handleSave} disabled={isProcessing}>
            {isProcessing && <Loader2 className="h-4 w-4 animate-spin me-1.5" />}
            {language === 'ku' ? 'بڕین و بارکردن' : 'Crop & Upload'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
