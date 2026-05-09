import { useState } from 'react';
import { Camera, Upload } from 'lucide-react';

interface ProfilePictureUploadProps {
  currentPicture?: string;
  onPictureChange: (url: string) => void;
  isEditing: boolean;
}

export default function ProfilePictureUpload({ currentPicture, onPictureChange, isEditing }: ProfilePictureUploadProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await fetch('/api/upload/profile-picture', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      onPictureChange(result.url);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  if (!isEditing) {
    return (
      <div className="profile-picture-display">
        {currentPicture ? (
          <img 
            src={currentPicture} 
            alt="Profile" 
            className="profile-picture-img"
          />
        ) : (
          <div className="profile-picture-placeholder">
            <Camera size={48} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="profile-picture-upload">
      <div className="profile-picture-container">
        {currentPicture ? (
          <img 
            src={currentPicture} 
            alt="Profile" 
            className="profile-picture-img"
          />
        ) : (
          <div className="profile-picture-placeholder">
            <Camera size={48} />
          </div>
        )}
        <label className="profile-picture-overlay">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            style={{ display: 'none' }}
          />
          <Upload size={24} />
          {uploading ? 'Uploading...' : 'Change Photo'}
        </label>
      </div>
    </div>
  );
}
