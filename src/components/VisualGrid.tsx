import React, { useState, useEffect } from 'react';
import CryptoJS from 'crypto-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Lock, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Define types for TypeScript
interface Visual {
  name: string;
  download_url: string;
  sha: string;
}

const VisualGrid: React.FC = () => {
  // State declarations
  const [visuals, setVisuals] = useState<Visual[]>([]);
  const [secretKey, setSecretKey] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [files, setFiles] = useState<File[]>([]);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [showUploadMenu, setShowUploadMenu] = useState<boolean>(false);
  const { toast } = useToast();

  // Hardcoded encrypted PAT
  const encryptedPAT = 'U2FsdGVkX19oWeTSn+eeUryDHjI/zyXp8SViwjPqi104hlQa8cVVClKREJ81ugeV5Ye8+6BsWaboTRuItKaHuQ==';
  const repoOwner = 'Alt-F17';
  const repoName = 'visual-grid-sync';
  const folderPath = 'visuals';

  // Decrypt PAT using the provided secret key
  const decryptPAT = (key: string): string | null => {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedPAT, key);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (err) {
      console.error('Decryption error:', err);
      return null;
    }
  };

  // Fetch visuals from GitHub
  const fetchVisuals = async (pat: string) => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${folderPath}`,
        {
          headers: {
            Authorization: `token ${pat}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch visuals: ${response.status} ${response.statusText}`);
      }
      
      const data: Visual[] = await response.json();
      const imageFiles = data.filter((item) => /\.(jpg|jpeg|png|pdf)$/i.test(item.name));
      setVisuals(imageFiles);
      
      toast({
        title: "Success",
        description: `Loaded ${imageFiles.length} visuals`,
      });
    } catch (err) {
      console.error('Fetch visuals error:', err);
      toast({
        title: "Error",
        description: "Failed to fetch visuals from GitHub",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Verify the secret key by attempting a lightweight API call
  const verifyKey = async () => {
    if (!secretKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a secret key",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const pat = decryptPAT(secretKey);
      if (!pat) {
        toast({
          title: "Error",
          description: "Invalid secret key",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(`https://api.github.com/user`, {
        headers: {
          Authorization: `token ${pat}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (response.ok) {
        setIsAuthenticated(true);
        toast({
          title: "Success",
          description: "Authentication successful",
        });
        await fetchVisuals(pat);
      } else {
        throw new Error(`Authentication failed: ${response.status}`);
      }
    } catch (err) {
      console.error('Verify key error:', err);
      toast({
        title: "Error",
        description: "Authentication failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Upload multiple files to GitHub
  const uploadFiles = async () => {
    if (files.length === 0) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    if (!secretKey.trim()) {
      toast({
        title: "Error",
        description: "Secret key is required for upload",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const pat = decryptPAT(secretKey);
      if (!pat) {
        toast({
          title: "Error",
          description: "Invalid secret key",
          variant: "destructive",
        });
        return;
      }

      // helper: read file as base64
      const toBase64 = (f: File) => new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = e => res((e.target?.result as string).split(',')[1]);
        r.onerror = () => rej('Read error');
        r.readAsDataURL(f);
      });
      
      // upload each file
      for (const f of files) {
        const base64Content = await toBase64(f);
        
         const response = await fetch(
           `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${folderPath}/${f.name}`,
           {
             method: 'PUT',
             headers: {
               Authorization: `token ${pat}`,
               Accept: 'application/vnd.github.v3+json',
             },
             body: JSON.stringify({ message: `Upload ${f.name}`, content: base64Content }),
           }
         );

         if (!response.ok) throw new Error(`Upload failed: ${response.status}`);

         toast({
           title: "Success",
           description: `${f.name} uploaded successfully`,
         });
       }
      
      // refresh grid
      await fetchVisuals(pat);
      setFiles([]);
    } catch (err) {
      console.error('Upload error:', err);
      toast({
        title: "Error",
        description: "Failed to upload files",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle drag and drop events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type.startsWith('image/') || droppedFile.type === 'application/pdf')) {
      setFiles([droppedFile]);
      toast({
        title: "File selected",
        description: `${droppedFile.name} is ready to upload`,
      });
    } else {
      toast({
        title: "Invalid file type",
        description: "Please drop an image or PDF file",
        variant: "destructive",
      });
    }
  };

  // Handle fullscreen view with zoom animation
  const openFullscreen = (url: string) => {
    try {
      setFullscreenImage(url);
    } catch (err) {
      console.error('Fullscreen error:', err);
      toast({
        title: "Error",
        description: "Failed to open fullscreen view",
        variant: "destructive",
      });
    }
  };

  const closeFullscreen = () => {
    try {
      setFullscreenImage(null);
    } catch (err) {
      console.error('Close fullscreen error:', err);
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Visual Grid</h1>
        </div>

        {/* Authentication Section */}
        {!isAuthenticated && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-md mx-auto shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="mx-auto w-16 h-16 bg-black rounded-full flex items-center justify-center mb-4 shadow-lg">
                    <Lock className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Access Required</h2>
                  <p className="text-slate-600">Enter your secret key to continue</p>
                </div>
                <div className="space-y-6">
                  <div className="relative">
                    <Input
                      type="password"
                      value={secretKey}
                      onChange={(e) => setSecretKey(e.target.value)}
                      placeholder="Enter secret key"
                      className="w-full h-12 text-center text-lg tracking-wider border-2 border-slate-200 focus:border-blue-500 transition-colors"
                      onKeyPress={(e) => e.key === 'Enter' && verifyKey()}
                    />
                  </div>
                  <Button 
                    onClick={verifyKey} 
                    disabled={loading || !secretKey.trim()}
                    className="w-full h-12 text-lg font-medium bg-black hover:bg-gray-800 text-white transition-all duration-200 shadow-lg"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Authenticating...
                      </div>
                    ) : 'Unlock Access'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Visuals Grid */}
        {isAuthenticated && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 auto-rows-fr max-h-[60vh] overflow-auto">
            {visuals.map((visual) => (
              <Card key={visual.sha} className="group relative overflow-hidden hover:shadow-lg transition-all duration-300 border-0 bg-white/90">
                <CardContent className="p-0 aspect-square">
                  {visual.name.endsWith('.pdf') ? (
                    <div 
                      className="w-full h-full bg-red-50 flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
                      onClick={() => openFullscreen(visual.download_url)}
                    >
                      <span className="text-red-600 text-xs font-medium">PDF</span>
                    </div>
                  ) : (
                    <img
                      src={visual.download_url}
                      alt={visual.name}
                      className="w-full h-full object-cover cursor-pointer transition-transform hover:scale-105 zoom-click"
                      onClick={() => openFullscreen(visual.download_url)}
                      onError={(e) => {
                        console.error('Image load error:', e);
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-2 text-slate-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-600"></div>
              Processing...
            </div>
          </div>
        )}

        {/* Empty State */}
        {isAuthenticated && !loading && visuals.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500">No visuals found. Upload your first visual to get started!</p>
          </div>
        )}

        {/* Fullscreen View */}
        {fullscreenImage && (
          <div 
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 animate-zoom-in cursor-pointer"
            onClick={closeFullscreen}
          >
            <img 
              src={fullscreenImage} 
              alt="Fullscreen view" 
              className="max-w-full max-h-full object-contain animate-scale-in cursor-pointer"
              onClick={closeFullscreen}
              onError={(e) => {
                console.error('Fullscreen image error:', e);
                closeFullscreen();
                toast({
                  title: "Error",
                  description: "Failed to load image",
                  variant: "destructive",
                });
              }}
            />
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-4 right-4 bg-white/90 hover:bg-white"
              onClick={(e) => {
                e.stopPropagation();
                closeFullscreen();
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Floating Upload Icon and Panel */}
        {isAuthenticated && (
          <div className="fixed bottom-4 right-4 z-50">
            <Button
              onClick={() => setShowUploadMenu(v => !v)}
              className="rounded-full p-3 shadow-lg bg-white"
            >
              <Upload className="h-6 w-6 text-slate-700" />
            </Button>
            {(showUploadMenu || isDragOver) && (
              <Card className="mt-2 shadow-lg border-0 bg-white/90">
                <CardContent className="p-4 w-64">
                  <Input
                    type="file"
                    multiple
                    accept=".png,.jpg,.jpeg,.img"
                    onChange={e => setFiles(Array.from(e.target.files || []).filter(f => /\.(png|jpe?g|img)$/i.test(f.name)))}
                    className="w-full cursor-pointer"
                  />
                  <Button
                    onClick={uploadFiles}
                    disabled={loading || files.length === 0}
                    className="mt-2 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  >
                    <Upload className="h-4 w-4" />
                    {loading ? 'Uploading...' : `Upload (${files.length})`}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualGrid;
