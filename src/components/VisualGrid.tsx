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

  // Hardcoded encrypted PAT (generated separately)
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

  // helper to read file as base64
  const readFileAsBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve((e.target?.result as string).split(',')[1]);
    reader.onerror = () => reject(new Error('File read error'));
    reader.readAsDataURL(file);
  });

  // Upload multiple files to GitHub
  const uploadFiles = async () => {
    if (files.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one file to upload",
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

      // loop through all selected files
      for (const file of files) {
        if (!/\.(png|jpe?g|img)$/i.test(file.name)) continue;
        const base64Content = await readFileAsBase64(file);
         
        const response = await fetch(
           `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${folderPath}/${file.name}`,
           {
             method: 'PUT',
             headers: {
               Authorization: `token ${pat}`,
               'Content-Type': 'application/json',
               Accept: 'application/vnd.github.v3+json',
             },
             body: JSON.stringify({
               message: `Upload ${file.name}`,
               content: base64Content,
               sha: visuals.find(v => v.name === file.name)?.sha, // include sha for existing files
             }),
           }
         );
         
         if (!response.ok) {
           throw new Error(`Failed to upload ${file.name}: ${response.status} ${response.statusText}`);
         }
       }
       
       toast({
         title: "Success",
         description: "Files uploaded successfully",
       });
       setFiles([]); // clear files after upload
       fetchVisuals(pat); // refresh visuals
    } catch (err) {
      console.error('Upload files error:', err);
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
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragOver(false); };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setIsDragOver(false);
    const dropped = Array.from(e.dataTransfer.files as FileList)
      .filter((f: File) => /\.(png|jpe?g|img)$/i.test(f.name));
    if (dropped.length) { setFiles(dropped); toast({ title: 'Files ready', description: `Selected ${dropped.length} file(s)` }); }
    else { toast({ title: 'Invalid file type', description: 'Only PNG, JPG, JPEG, IMG files allowed', variant: 'destructive' }); }
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
        <div className="py-8 text-center">
          <h1 className="text-4xl font-extrabold text-slate-900">
            Visual Grid Sync
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Securely sync and manage your visuals
          </p>
        </div>

        {/* Authentication Section */}
        {!isAuthenticated && (
          <div className="mb-8 rounded-lg border bg-white p-6 shadow-md">
            <h2 className="text-2xl font-bold text-slate-800">
              Authenticate
            </h2>
            <p className="mt-2 text-slate-600">
              Enter your secret key to access your visuals
            </p>
            <div className="mt-4 flex gap-2">
              <Input
                type="password"
                placeholder="Secret Key"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={verifyKey}
                disabled={loading}
                className="flex-shrink-0"
              >
                {loading ? 'Verifying...' : 'Unlock'}
              </Button>
            </div>
          </div>
        )}

        {/* Visuals Grid */}
        {isAuthenticated && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {visuals.map((visual) => (
              <div key={visual.sha} className="group relative overflow-hidden rounded-lg border bg-white shadow-md">
                <img
                  src={visual.download_url}
                  alt={visual.name}
                  className="h-32 w-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
                />
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-slate-800">
                    {visual.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    SHA: {visual.sha}
                  </p>
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100">
                  <Button
                    onClick={() => setFullscreenImage(visual.download_url)}
                    className="rounded-full p-2 text-white shadow-md"
                  >
                    <img src="/icons/view.svg" alt="View" className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Fullscreen Image Modal */}
        {fullscreenImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
            <div className="relative max-w-3xl rounded-lg overflow-hidden shadow-lg">
              <img
                src={fullscreenImage}
                alt="Fullscreen Visual"
                className="w-full h-auto"
              />
              <Button
                onClick={() => setFullscreenImage(null)}
                className="absolute top-4 right-4 rounded-full bg-white p-2 shadow-md"
              >
                <X className="h-6 w-6 text-slate-700" />
              </Button>
            </div>
          </div>
        )}

        {/* Floating Upload Icon and Panel */}
        {isAuthenticated && (
          <div className="fixed bottom-4 right-4 z-50"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Button onClick={() => setShowUploadMenu(v => !v)} className="rounded-full p-3 shadow-lg bg-white">
              <Upload className="h-6 w-6 text-slate-700" />
            </Button>
            {(showUploadMenu || isDragOver) && (
              <Card className="mt-2 shadow-lg border-0 bg-white/90">
                <CardContent className="p-4 w-64">
                  <Input
                    type="file"
                    multiple
                    accept=".png,.jpg,.jpeg,.img"
                    onChange={e => {
                      const sel = Array.from(e.target.files || []).filter((f: File) => /\.(png|jpe?g|img)$/i.test(f.name));
                      setFiles(sel);
                    }}
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
