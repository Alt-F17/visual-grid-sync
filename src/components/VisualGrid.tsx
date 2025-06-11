import React, { useState, useEffect } from 'react';
import { Loader2, AlertTriangle, Upload, Trash2 } from 'lucide-react'; // Added Loader2 and AlertTriangle for states
import { cn } from '@/lib/utils';

// CONFIGURATION: Set your GitHub repository details here
const GITHUB_REPO_OWNER = 'Alt-F17';
const GITHUB_REPO_NAME = 'visual-grid-sync';
const GITHUB_VISUALS_PATH = 'visuals'; // The path to the directory containing your visuals

interface Visual {
  id: string; // Will use file's SHA from GitHub API
  url: string; // Will use file's download_url
  description: string;
  filename: string;
}

// --- GitHub API Response Type (for safety) ---
interface GitHubFile {
  type: 'file' | 'dir';
  name: string;
  path: string;
  sha: string;
  download_url: string;
}

const VisualGrid = () => {
  const [visuals, setVisuals] = useState<Visual[]>([]);
  const [fullscreenVisual, setFullscreenVisual] = useState<Visual | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Changed from isUploading to isLoading
  const [error, setError] = useState<string | null>(null);

  // Fetch visuals from GitHub on component mount
  useEffect(() => {
    const fetchVisualsFromRepo = async () => {
      setIsLoading(true);
      setError(null);
      const apiUrl = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${GITHUB_VISUALS_PATH}`;

      try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch from GitHub: ${response.statusText} (Is the repo public and the path correct?)`);
        }
        const files: GitHubFile[] = await response.json();

        // Regex for allowed extensions
        const allowedExtensions = /\.(jpe?g|png|gif|webp|bmp|svg|pdf)$/i;

        const fetchedVisuals = files
          .filter(file => file.type === 'file' && allowedExtensions.test(file.name))
          .map((file) => ({
            id: file.sha,
            url: file.download_url,
            filename: file.name,
            description: file.name
              .replace(/\.[^/.]+$/, '') // Remove extension
              .replace(/[-_]/g, ' ') // Replace dashes/underscores
              .replace(/\b\w/g, l => l.toUpperCase()), // Capitalize words
          }));

        setVisuals(fetchedVisuals);

      } catch (err: any) {
        console.error("Error fetching visuals:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVisualsFromRepo();
  }, []); // Empty dependency array means this runs only once on mount

  // Calculate grid layout (no changes needed)
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

  const toggleFullscreen = (visual: Visual) => {
    setFullscreenVisual(fullscreenVisual?.id === visual.id ? null : visual);
  };

  const closeFullscreen = () => {
    setFullscreenVisual(null);
  };

  const gridLayout = getGridLayout(visuals.length);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="h-full flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 text-muted-foreground animate-spin mb-4" />
          <h3 className="text-lg font-semibold text-foreground">Loading Visuals...</h3>
          <p className="text-muted-foreground">Fetching from GitHub repository</p>
        </div>
      );
    }

    if (error) {
       return (
        <div className="h-full flex flex-col items-center justify-center bg-destructive/10 border-2 border-dashed border-destructive rounded-lg p-4">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-destructive-foreground mb-2">Failed to Load Visuals</h3>
          <p className="text-sm text-center text-muted-foreground max-w-md">{error}</p>
        </div>
      );
    }

    if (visuals.length === 0) {
      return (
        <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg">
          <div className="text-center">
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No visuals found</h3>
            <p className="text-muted-foreground">The configured GitHub directory is empty or contains no supported files.</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className={cn("h-full grid gap-2 auto-rows-fr", gridLayout.cols, gridLayout.rows)}>
        {visuals.map((visual) => (
          <div
            key={visual.id}
            className="group relative bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer border border-border hover:scale-[1.02] flex flex-col"
            onClick={() => toggleFullscreen(visual)}
          >
            {/* The delete button is removed as we are in a read-only mode */}
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
    );
  };


  return (
    <>
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        {/* Header (no change) */}
        <div className="flex-shrink-0 p-4 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-1">Visual Supports</h1>
          <p className="text-sm text-muted-foreground">Loaded from a GitHub Repository</p>
        </div>

        {/* Main content area */}
        <div className="flex-1 px-4 pb-4 min-h-0">
          {renderContent()}
        </div>
      </div>
      
      {/* Fullscreen Modal (no change) */}
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
