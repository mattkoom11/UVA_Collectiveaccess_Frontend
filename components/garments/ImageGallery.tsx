"use client";

import { useState, useCallback, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, DownloadCloud } from "lucide-react";

interface ImageGalleryProps {
  images: string[];
  title?: string;
  startIndex?: number;
  onClose?: () => void;
}

export default function ImageGallery({ 
  images, 
  title = "Image Gallery",
  startIndex = 0,
  onClose 
}: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [pinchStart, setPinchStart] = useState<number | null>(null);
  const [swipeHintVisible, setSwipeHintVisible] = useState(false);

  const currentImage = images[currentIndex];

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setIsZoomed(false);
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  }, [images.length]);

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setIsZoomed(false);
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  }, [images.length]);

  const handleZoomIn = useCallback(() => {
    setZoomLevel((prev) => Math.min(prev + 0.5, 5));
    setIsZoomed(true);
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel((prev) => {
      const newZoom = Math.max(prev - 0.5, 1);
      if (newZoom === 1) {
        setIsZoomed(false);
        setPosition({ x: 0, y: 0 });
      }
      return newZoom;
    });
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      } else if (e.key === "ArrowLeft") {
        handlePrevious();
      } else if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "+" || e.key === "=") {
        handleZoomIn();
      } else if (e.key === "-") {
        handleZoomOut();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, handlePrevious, handleNext, handleZoomIn, handleZoomOut]);

  const handleResetZoom = () => {
    setZoomLevel(1);
    setIsZoomed(false);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isZoomed) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && isZoomed) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Show swipe hint only on touch devices; auto-dismiss after 2 seconds
  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) {
      setSwipeHintVisible(true);
      const t = setTimeout(() => setSwipeHintVisible(false), 2000);
      return () => clearTimeout(t);
    }
  }, []);

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setSwipeHintVisible(false);
    if (e.touches.length === 1) {
      setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    } else if (e.touches.length === 2) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setPinchStart(distance);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStart !== null) {
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const scale = distance / pinchStart;
      setZoomLevel(Math.max(1, Math.min(5, zoomLevel * scale)));
      setPinchStart(distance);
      setIsZoomed(zoomLevel * scale > 1);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart && e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStart.x;
      const deltaY = touch.clientY - touchStart.y;
      
      // Swipe left/right to navigate (if not zoomed)
      if (!isZoomed && Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX > 0) {
          handlePrevious();
        } else {
          handleNext();
        }
      }
    }
    setTouchStart(null);
    setPinchStart(null);
  };

  const handleDownload = () => {
    if (currentImage) {
      const link = document.createElement("a");
      link.href = currentImage;
      link.download = `garment-image-${currentIndex + 1}.jpg`;
      link.click();
    }
  };

  const handleDownloadAll = async () => {
    // Download all images as a zip (requires JSZip library for full implementation)
    // For now, download them sequentially
    for (let i = 0; i < images.length; i++) {
      if (images[i]) {
        const link = document.createElement("a");
        link.href = images[i];
        link.download = `garment-image-${i + 1}.jpg`;
        link.click();
        // Small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
  };

  if (images.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 text-zinc-300 hover:text-white transition-colors p-2"
        aria-label="Close gallery"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Image container */}
      <div className="relative w-full h-full flex items-center justify-center p-4">
        {/* Previous button */}
        {images.length > 1 && (
          <button
            onClick={handlePrevious}
            className="absolute left-4 z-10 text-zinc-300 hover:text-white transition-colors p-3 bg-black/50 rounded-full hover:bg-black/70"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Image */}
        <div
          className="relative max-w-full max-h-full overflow-hidden cursor-move touch-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="transition-transform duration-200"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoomLevel})`,
              transformOrigin: "center center",
            }}
          >
            {currentImage ? (
              <img
                src={currentImage}
                alt={`${title} - Image ${currentIndex + 1}`}
                className="max-w-full max-h-[90vh] object-contain"
                draggable={false}
              />
            ) : (
              <div className="w-[800px] h-[600px] bg-zinc-900 flex items-center justify-center">
                <p className="text-zinc-500">Image {currentIndex + 1}</p>
              </div>
            )}
          </div>
        </div>

        {/* Next button */}
        {images.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute right-4 z-10 text-zinc-300 hover:text-white transition-colors p-3 bg-black/50 rounded-full hover:bg-black/70"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Swipe hint — mobile only, auto-dismisses after 2s or on first touch */}
      {swipeHintVisible && (
        <div className="pointer-events-none absolute bottom-16 inset-x-0 flex justify-center z-10">
          <span className="bg-black/60 text-white/80 text-xs px-4 py-1.5 rounded-full tracking-widest uppercase">
            ← swipe →
          </span>
        </div>
      )}

      {/* Controls bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-black/70 backdrop-blur-sm px-6 py-3 rounded-lg flex items-center gap-4">
        {/* Image counter */}
        <div className="text-sm text-zinc-300 font-light">
          {currentIndex + 1} / {images.length}
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-2 border-l border-r border-zinc-700 px-4">
          <button
            onClick={handleZoomOut}
            disabled={zoomLevel <= 1}
            className="text-zinc-300 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="text-xs text-zinc-400 min-w-[3rem] text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            disabled={zoomLevel >= 5}
            className="text-zinc-300 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          {isZoomed && (
            <button
              onClick={handleResetZoom}
              className="ml-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Reset
            </button>
          )}
        </div>

        {/* Download buttons */}
        <div className="flex items-center gap-2 border-l border-zinc-700 pl-4">
          <button
            onClick={handleDownload}
            className="text-zinc-300 hover:text-white transition-colors"
            aria-label="Download current image"
            title="Download current image"
          >
            <Download className="w-5 h-5" />
          </button>
          {images.length > 1 && (
            <button
              onClick={handleDownloadAll}
              className="text-zinc-300 hover:text-white transition-colors"
              aria-label="Download all images"
              title="Download all images"
            >
              <DownloadCloud className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Keyboard hints */}
        <div className="text-xs text-zinc-500 font-light border-l border-zinc-700 pl-4">
          <span className="hidden md:inline">← → Navigate</span>
          <span className="hidden md:inline ml-2">+ - Zoom</span>
          <span className="hidden md:inline ml-2">ESC Close</span>
        </div>
      </div>

      {/* Thumbnail strip (optional, for many images) */}
      {images.length > 1 && images.length <= 10 && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 flex gap-2 max-w-4xl overflow-x-auto px-4">
          {images.map((img, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index);
                handleResetZoom();
              }}
              className={`flex-shrink-0 w-16 h-16 border-2 transition-all ${
                index === currentIndex
                  ? "border-zinc-300 scale-110"
                  : "border-zinc-700 hover:border-zinc-500"
              }`}
            >
              {img ? (
                <img
                  src={img}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-xs text-zinc-500">
                  {index + 1}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

