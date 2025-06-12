import React, { useState, useEffect } from 'react';
import CryptoJS from 'crypto-js';
import './VisualGrid.css'; // Assume a CSS file for styling

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
  const [file, setFile] = useState<File | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  // Hardcoded encrypted PAT (generated separately)
  const encryptedPAT = 'U2FsdGVkX19Xz5Qz7X8z5Qz7X8z5Qz7X8z5Qz7X8z5Qz7X8z5Qz7X8z5Qz7X8z5Q=='; // Example encrypted value
  const repoOwner = 'your-username';
  const repoName = 'your-repo';
  const folderPath = 'visuals'; // Folder in repo where visuals are stored

  // Decrypt PAT using the provided secret key
  const decryptPAT = (key: string): string | null => {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedPAT, key);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (err) {
      return null;
    }
  };

  // Fetch visuals from GitHub
  const fetchVisuals = async (pat: string) => {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${folderPath}`,
        {
          headers: {
            Authorization: `token ${pat}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch visuals');
      const data: Visual[] = await response.json();
      setVisuals(data.filter((item) => /\.(jpg|jpeg|png|pdf)$/i.test(item.name)));
    } catch (err) {
      setError('Error fetching visuals');
    }
  };

  // Verify the secret key by attempting a lightweight API call
  const verifyKey = async () => {
    const pat = decryptPAT(secretKey);
    if (!pat) {
      setError('Invalid secret key');
      return;
    }
    try {
      const response = await fetch(`https://api.github.com/user`, {
        headers: {
          Authorization: `token ${pat}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });
      if (response.ok) {
        setIsAuthenticated(true);
        setError('');
        fetchVisuals(pat);
      } else {
        setError('Authentication failed');
      }
    } catch (err) {
      setError('Error verifying key');
    }
  };

  // Upload a file to GitHub
  const uploadFile = async () => {
    if (!file || !isAuthenticated) return;
    const pat = decryptPAT(secretKey);
    if (!pat) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      const base64Content = content.split(',')[1]; // Remove data URL prefix

      try {
        const response = await fetch(
          `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${folderPath}/${file.name}`,
          {
            method: 'PUT',
            headers: {
              Authorization: `token ${pat}`,
              Accept: 'application/vnd.github.v3+json',
            },
            body: JSON.stringify({
              message: `Upload ${file.name}`,
              content: base64Content,
            }),
          }
        );
        if (!response.ok) throw new Error('Upload failed');
        fetchVisuals(pat); // Refresh visuals
        setFile(null);
      } catch (err) {
        setError('Error uploading file');
      }
    };
    reader.readAsDataURL(file);
  };

  // Delete a file from GitHub
  const deleteFile = async (sha: string, fileName: string) => {
    if (!isAuthenticated) return;
    const pat = decryptPAT(secretKey);
    if (!pat) return;

    try {
      const response = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${folderPath}/${fileName}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `token ${pat}`,
            Accept: 'application/vnd.github.v3+json',
          },
          body: JSON.stringify({
            message: `Delete ${fileName}`,
            sha,
          }),
        }
      );
      if (!response.ok) throw new Error('Delete failed');
      fetchVisuals(pat); // Refresh visuals
    } catch (err) {
      setError('Error deleting file');
    }
  };

  // Handle fullscreen view
  const openFullscreen = (url: string) => setFullscreenImage(url);
  const closeFullscreen = () => setFullscreenImage(null);

  return (
    <div className="visual-grid-container">
      <h1>Visual Grid</h1>

      {/* Secret Key Input */}
      {!isAuthenticated && (
        <div className="auth-section">
          <input
            type="password"
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            placeholder="Enter secret key"
          />
          <button onClick={verifyKey}>Submit</button>
          {error && <p className="error">{error}</p>}
        </div>
      )}

      {/* Upload Section */}
      {isAuthenticated && (
        <div className="upload-section">
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <button onClick={uploadFile} disabled={!file}>
            Upload
          </button>
          {error && <p className="error">{error}</p>}
        </div>
      )}

      {/* Visuals Grid */}
      {isAuthenticated && (
        <div className="grid">
          {visuals.map((visual) => (
            <div key={visual.sha} className="grid-item">
              {visual.name.endsWith('.pdf') ? (
                <embed src={visual.download_url} type="application/pdf" width="100" height="100" />
              ) : (
                <img
                  src={visual.download_url}
                  alt={visual.name}
                  onClick={() => openFullscreen(visual.download_url)}
                />
              )}
              <button onClick={() => deleteFile(visual.sha, visual.name)}>Delete</button>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen View */}
      {fullscreenImage && (
        <div className="fullscreen" onClick={closeFullscreen}>
          <img src={fullscreenImage} alt="Fullscreen view" />
        </div>
      )}
    </div>
  );
};

export default VisualGrid;
