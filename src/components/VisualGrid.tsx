
import React, { useState, useEffect } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Visual {
  id: string;
  url: string;
  description: string;
  filename: string;
}

const VisualGrid = () => {
  const [visuals, setVisuals] = useState<Visual[]>([]);
  const [fullscreenVisual, setFullscreenVisual] = useState<Visual | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Load visuals from localStorage on component mount
  useEffect(() => {
    const savedVisuals = localStorage.getItem('visual-supports');
    if (savedVisuals) {
      setVisuals(JSON.parse(savedVisuals));
    }
  }, []);

  // Save visuals to localStorage whenever visuals change
  useEffect(() => {
    localStorage.setItem('visual-supports', JSON.stringify(visuals));
  }, [visuals]);

  // Calculate grid layout based on screen space and number of items
  const getGridLayout = (count: number) => {
    if (count === 0) return { cols: 'grid-cols-1', rows: 'grid-rows-1' };
    if (count === 1) return { cols: 'grid-cols-1', rows: 'grid-rows-1' };
    if (count <= 2) return { cols: 'grid-cols-2', rows: 'grid-rows-1' };
    if (count <= 4) return { cols: 'grid-cols-2', rows: 'grid-rows-2' };
    if (count <= 6) return { cols: 'grid-cols-3', rows: 'grid-rows-2' };
    if (count <= 9) return { cols: 'grid-cols-3', rows: 'grid-rows-3' };
    if (count <= 12) return { cols: 'grid-cols-4', rows: 'grid-rows-3' };
    if (count <= 16) return { cols: 'grid-cols-4', rows: 'grid-rows-4' };
    return { cols: 'grid-cols-5', rows: 'grid-rows-4' };
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setIsUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check if file is an image or PDF
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        continue;
      }

      // Create file URL
      const url = URL.createObjectURL(file);
      
      // Generate description based on filename
      const description = file.name
        .replace(/\.[^/.]+$/, '') // Remove extension
        .replace(/[-_]/g, ' ') // Replace dashes and underscores with spaces
        .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize first letter of each word

      const newVisual: Visual = {
        id: `${Date.now()}-${i}`,
        url,
        description,
        filename: file.name
      };

      setVisuals(prev => [...prev, newVisual]);
    }

    setIsUploading(false);
    // Clear the input
    event.target.value = '';
  };

  const toggleFullscreen = (visual: Visual) => {
    setFullscreenVisual(fullscreenVisual?.id === visual.id ? null : visual);
  };

  const closeFullscreen = () => {
    setFullscreenVisual(null);
  };

  const gridLayout = getGridLayout(visuals.length);

  return (
    <>
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        {/* Header - Fixed height */}
        <div className="flex-shrink-0 p-4 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-1">Visual Supports</h1>
          <p className="text-sm text-muted-foreground">Upload and organize your visual documents</p>
        </div>

        {/* Main content area - Fills remaining space */}
        <div className="flex-1 px-4 pb-4 min-h-0">
          {visuals.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg">
              <div className="text-center">
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No visuals yet</h3>
                <p className="text-muted-foreground mb-6">Upload your first visual support to get started</p>
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg cursor-pointer hover:bg-primary/90 transition-colors">
                  <Upload className="w-4 h-4" />
                  Upload Files
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
              </div>
            </div>
          ) : (
            <div className={cn(
              "h-full grid gap-2 auto-rows-fr",
              gridLayout.cols,
              gridLayout.rows
            )}>
              {visuals.map((visual) => (
                <div
                  key={visual.id}
                  className="group relative bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-border hover:scale-[1.02] flex flex-col"
                  onClick={() => toggleFullscreen(visual)}
                >
                  <div className="flex-1 overflow-hidden">
                    {visual.filename.endsWith('.pdf') ? (
                      <div className="w-full h-full bg-red-50 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-red-600 text-xl mb-1">📄</div>
                          <p className="text-xs text-red-600 font-medium">PDF</p>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={visual.url}
                        alt={visual.description}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    )}
                  </div>
                  <div className="flex-shrink-0 p-2">
                    <h3 className="text-xs font-medium text-card-foreground line-clamp-2">
                      {visual.description}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload Button - Fixed position */}
        {visuals.length > 0 && (
          <div className="fixed bottom-4 right-4">
            <label className="flex items-center justify-center w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-lg cursor-pointer hover:bg-primary/90 transition-all duration-200 hover:scale-105">
              <Upload className="w-5 h-5" />
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isUploading}
              />
            </label>
          </div>
        )}

        {/* Loading indicator */}
        {isUploading && (
          <div className="fixed bottom-4 left-4 bg-primary text-primary-foreground px-3 py-2 rounded-lg shadow-lg animate-fade-in text-sm">
            Uploading...
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {fullscreenVisual && (
        <div
          className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 cursor-pointer animate-fade-in p-4"
          onClick={closeFullscreen}
        >
          <div className="relative w-full h-full flex items-center justify-center animate-scale-in">
            {fullscreenVisual.filename.endsWith('.pdf') ? (
              <div className="bg-white p-8 rounded-lg text-center max-w-md">
                <div className="text-6xl mb-4">📄</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">PDF Document</h2>
                <p className="text-gray-600">{fullscreenVisual.description}</p>
                <p className="text-sm text-gray-500 mt-2">Click anywhere to close</p>
              </div>
            ) : (
              <img
                src={fullscreenVisual.url}
                alt={fullscreenVisual.description}
                className="max-w-full max-h-full object-contain"
              />
            )}
            <div className="absolute bottom-8 left-8 right-8 text-center">
              <p className="text-white text-lg font-medium bg-black bg-opacity-60 px-4 py-2 rounded-lg backdrop-blur-sm">
                {fullscreenVisual.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VisualGrid;
