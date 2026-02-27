import React, { useCallback, useRef, useState } from 'react';
import { Upload, ImageIcon } from 'lucide-react';

interface UploadPanelProps {
    onImageLoad: (img: HTMLImageElement, file: File) => void;
}

const ACCEPTED = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];

export const UploadPanel: React.FC<UploadPanelProps> = ({ onImageLoad }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFile = useCallback((file: File) => {
        if (!ACCEPTED.includes(file.type)) {
            setError('Please upload a PNG, JPG, JPEG, or WebP image.');
            return;
        }
        setError(null);
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            URL.revokeObjectURL(url);
            onImageLoad(img, file);
        };
        img.onerror = () => setError('Failed to load image.');
        img.src = url;
    }, [onImageLoad]);

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
        e.target.value = '';
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
    };

    return (
        <div
            className={`drop-zone flex flex-col items-center justify-center gap-4 p-10 text-center cursor-pointer select-none ${isDragging ? 'drag-over' : ''}`}
            style={{ minHeight: 260 }}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
        >
            <input ref={inputRef} type="file" accept={ACCEPTED.join(',')} className="hidden" onChange={onFileChange} />
            <div className="flex items-center justify-center w-20 h-20 rounded-full" style={{ background: 'rgba(108,99,255,0.12)', border: '2px solid rgba(108,99,255,0.3)' }}>
                {isDragging
                    ? <ImageIcon size={36} style={{ color: 'var(--color-accent)' }} />
                    : <Upload size={36} style={{ color: 'var(--color-accent)' }} />
                }
            </div>
            <div>
                <p className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
                    {isDragging ? 'Drop to upload' : 'Upload your photo'}
                </p>
                <p className="text-sm mt-1" style={{ color: 'var(--color-muted)' }}>
                    Drag & drop or click — PNG, JPG, JPEG, WebP
                </p>
            </div>
            {error && (
                <p className="text-sm px-3 py-1 rounded-md" style={{ color: '#f87171', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)' }}>
                    {error}
                </p>
            )}
        </div>
    );
};
