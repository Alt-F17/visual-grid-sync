
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

  // Calculate grid columns based on number of items
  const getGridColumns = (count: number) => {
    if (count === 0) return 'grid-cols-1';
    if (count === 1) return 'grid-cols-1';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 9) return 'grid-cols-3';
    if (count <= 16) return 'grid-cols-4';
    return 'grid-cols-5';
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

  const handleFullscreenClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFullscreenVisual(null);
  };

  return (
    <>
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-foreground mb-2">Visual Supports</h1>
            <p className="text-muted-foreground">Upload and organize your visual documents</p>
          </div>

          {visuals.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-border rounded-lg">
              <div className="text-center">
                <Upload className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No visuals yet</h3>
                <p className="text-muted-foreground mb-6">Upload your first visual support to get started</p>
                <label className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg cursor-pointer hover:bg-primary/90 transition-colors">
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
              "grid gap-4 md:gap-6 auto-rows-fr",
              getGridColumns(visuals.length)
            )}>
              {visuals.map((visual) => (
                <div
                  key={visual.id}
                  className="group relative bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-border"
                  onClick={() => toggleFullscreen(visual)}
                >
                  <div className="aspect-square overflow-hidden">
                    {visual.filename.endsWith('.pdf') ? (
                      <div className="w-full h-full bg-red-50 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-red-600 text-2xl mb-2">📄</div>
                          <p className="text-sm text-red-600 font-medium">PDF Document</p>
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
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-card-foreground line-clamp-2">
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
          <div className="fixed bottom-6 right-6">
            <label className="flex items-center justify-center w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg cursor-pointer hover:bg-primary/90 transition-all duration-200 hover:scale-105">
              <Upload className="w-6 h-6" />
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
          <div className="fixed bottom-6 left-6 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg">
            Uploading...
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {fullscreenVisual && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 cursor-pointer"
          onClick={handleFullscreenClick}
        >
          <div className="relative max-w-full max-h-full p-4">
            {fullscreenVisual.filename.endsWith('.pdf') ? (
              <div className="bg-white p-8 rounded-lg text-center">
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
                onClick={(e) => e.stopPropagation()}
              />
            )}
            <div className="absolute bottom-4 left-4 right-4 text-center">
              <p className="text-white text-lg font-medium bg-black bg-opacity-50 px-4 py-2 rounded-lg">
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
