import { useState } from "react";
import { Camera, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProfilePhotoUploadProps {
  onPhotoChange: (photo: File | null) => void;
  currentPhoto?: File | null;
}

const ProfilePhotoUpload = ({ onPhotoChange, currentPhoto }: ProfilePhotoUploadProps) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      onPhotoChange(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removePhoto = () => {
    setPreview(null);
    onPhotoChange(null);
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-medium text-foreground mb-2">Add Your Profile Photo</h3>
        <p className="text-muted-foreground">Help others recognize you in the community</p>
      </div>

      <div className="flex justify-center">
        {preview ? (
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-accent/20 shadow-lg">
              <img 
                src={preview} 
                alt="Profile preview" 
                className="w-full h-full object-cover"
              />
            </div>
            <Button
              size="sm"
              variant="destructive"
              className="absolute -top-2 -right-2 rounded-full w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={removePhoto}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div
            className={`
              w-64 h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center
              transition-all duration-300 cursor-pointer hover-lift
              ${isDragging 
                ? 'border-accent bg-accent/5' 
                : 'border-border hover:border-accent/50 hover:bg-accent/5'
              }
            `}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => document.getElementById('photo-upload')?.click()}
          >
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                {isDragging ? (
                  <Upload className="w-6 h-6 text-accent" />
                ) : (
                  <Camera className="w-6 h-6 text-accent" />
                )}
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  {isDragging ? 'Drop your photo here' : 'Upload a photo'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Drag & drop or click to browse
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <input
        id="photo-upload"
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
      />

      {!preview && (
        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={() => document.getElementById('photo-upload')?.click()}
            className="hover:bg-accent/5 hover:border-accent"
          >
            <Camera className="w-4 h-4 mr-2" />
            Choose Photo
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProfilePhotoUpload;