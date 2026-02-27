import { useState, useCallback, useRef } from 'react';

export interface ColorEntry {
    hex: string;
    count: number;
}

export interface PixelEngineResult {
    pixelColors: string[][];
    uniqueColors: ColorEntry[];
}

export interface AdjustmentParams {
    brightness: number;   // 50-150
    contrast: number;     // 50-150
    saturation: number;   // 0-200
    vibrancy: number;     // 0-200
}

function applyAdjustments(
    imageData: ImageData,
    { brightness, contrast, saturation, vibrancy }: AdjustmentParams
): ImageData {
    const data = new Uint8ClampedArray(imageData.data);

    const brightFactor = brightness / 100;
    const contrastFactor = (259 * ((contrast - 100) * 2.55 + 127.5)) / (255 * (259 - ((contrast - 100) * 2.55 + 127.5 - 127.5)));
    const satFactor = saturation / 100;
    const vibFactor = (vibrancy - 100) / 100;

    for (let i = 0; i < data.length; i += 4) {
        let r = data[i], g = data[i + 1], b = data[i + 2];

        // Brightness
        r *= brightFactor; g *= brightFactor; b *= brightFactor;

        // Contrast: S-curve around midpoint
        r = contrastFactor * (r - 127.5) + 127.5;
        g = contrastFactor * (g - 127.5) + 127.5;
        b = contrastFactor * (b - 127.5) + 127.5;

        r = Math.max(0, Math.min(255, r));
        g = Math.max(0, Math.min(255, g));
        b = Math.max(0, Math.min(255, b));

        // Saturation via luminance
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        r = lum + satFactor * (r - lum);
        g = lum + satFactor * (g - lum);
        b = lum + satFactor * (b - lum);

        // Vibrancy: boost low-saturation colors more
        if (vibrancy !== 100) {
            const maxC = Math.max(r, g, b);
            const minC = Math.min(r, g, b);
            const currentSat = maxC > 0 ? (maxC - minC) / maxC : 0;
            const boost = vibFactor * (1 - currentSat);
            const lum2 = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            r = lum2 + (1 + boost) * (r - lum2);
            g = lum2 + (1 + boost) * (g - lum2);
            b = lum2 + (1 + boost) * (b - lum2);
        }

        data[i] = Math.max(0, Math.min(255, Math.round(r)));
        data[i + 1] = Math.max(0, Math.min(255, Math.round(g)));
        data[i + 2] = Math.max(0, Math.min(255, Math.round(b)));
    }

    return new ImageData(data, imageData.width, imageData.height);
}

function extractPixelColors(
    img: HTMLImageElement,
    gridW: number,
    gridH: number,
    adjustments: AdjustmentParams
): PixelEngineResult {
    // Create off-screen canvas for full resolution
    const srcCanvas = document.createElement('canvas');
    srcCanvas.width = img.naturalWidth;
    srcCanvas.height = img.naturalHeight;
    const srcCtx = srcCanvas.getContext('2d', { willReadFrequently: true })!;
    srcCtx.drawImage(img, 0, 0);

    // Sample: for each grid cell, average the pixels in that region
    const pixelColors: string[][] = [];
    const colorMap = new Map<string, number>();

    const srcW = img.naturalWidth;
    const srcH = img.naturalHeight;

    // Apply adjustments to full-resolution first
    const fullData = srcCtx.getImageData(0, 0, srcW, srcH);
    const adjData = applyAdjustments(fullData, adjustments);
    srcCtx.putImageData(adjData, 0, 0);

    // Downscale to grid using a small canvas
    const dstCanvas = document.createElement('canvas');
    dstCanvas.width = gridW;
    dstCanvas.height = gridH;
    const dstCtx = dstCanvas.getContext('2d', { willReadFrequently: true })!;
    dstCtx.imageSmoothingEnabled = true;
    dstCtx.imageSmoothingQuality = 'high';
    dstCtx.drawImage(srcCanvas, 0, 0, gridW, gridH);

    const gridData = dstCtx.getImageData(0, 0, gridW, gridH);
    const d = gridData.data;

    for (let row = 0; row < gridH; row++) {
        const rowArr: string[] = [];
        for (let col = 0; col < gridW; col++) {
            const idx = (row * gridW + col) * 4;
            const r = d[idx], g = d[idx + 1], b = d[idx + 2];
            const hex = '#' + [r, g, b].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
            rowArr.push(hex);
            colorMap.set(hex, (colorMap.get(hex) ?? 0) + 1);
        }
        pixelColors.push(rowArr);
    }

    const uniqueColors: ColorEntry[] = Array.from(colorMap.entries())
        .map(([hex, count]) => ({ hex, count }))
        .sort((a, b) => b.count - a.count);

    return { pixelColors, uniqueColors };
}

export function usePixelEngine() {
    const [result, setResult] = useState<PixelEngineResult | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const imgRef = useRef<HTMLImageElement | null>(null);

    const process = useCallback((
        img: HTMLImageElement,
        gridW: number,
        gridH: number,
        adjustments: AdjustmentParams
    ) => {
        imgRef.current = img;
        setIsProcessing(true);
        // Use setTimeout to not block the UI thread
        setTimeout(() => {
            try {
                const r = extractPixelColors(img, gridW, gridH, adjustments);
                setResult(r);
            } finally {
                setIsProcessing(false);
            }
        }, 0);
    }, []);

    const reprocess = useCallback((
        gridW: number,
        gridH: number,
        adjustments: AdjustmentParams
    ) => {
        if (!imgRef.current) return;
        process(imgRef.current, gridW, gridH, adjustments);
    }, [process]);

    return { result, isProcessing, process, reprocess };
}
