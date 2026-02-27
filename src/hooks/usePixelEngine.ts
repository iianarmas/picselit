import { useState, useCallback, useRef } from 'react';
import { buildPaletteSync, applyPaletteSync, utils } from 'image-q';

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
    targetColors: number; // 0 for unlimited, 2-256 limit
    colorSimilarity: number; // 0-100 similarity distance threshold
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

    // --- Color Simplification ---
    if (adjustments.targetColors > 0 || adjustments.colorSimilarity > 0) {
        // Collect points for image-q
        const rgbaArray = new Uint8Array(gridW * gridH * 4);
        for (let r = 0; r < gridH; r++) {
            for (let c = 0; c < gridW; c++) {
                const hex = pixelColors[r][c];
                const rv = parseInt(hex.slice(1, 3), 16);
                const gv = parseInt(hex.slice(3, 5), 16);
                const bv = parseInt(hex.slice(5, 7), 16);
                const idx = (r * gridW + c) * 4;
                rgbaArray[idx] = rv;
                rgbaArray[idx + 1] = gv;
                rgbaArray[idx + 2] = bv;
                rgbaArray[idx + 3] = 255;
            }
        }

        const inPointContainer = utils.PointContainer.fromUint8Array(rgbaArray, gridW, gridH);

        const paletteOpts: any = {};
        if (adjustments.targetColors > 0) {
            paletteOpts.colors = adjustments.targetColors;
        }

        let processedContainer = inPointContainer;
        if (adjustments.targetColors > 0) {
            // Apply quantization
            const palette = buildPaletteSync([inPointContainer], paletteOpts);
            processedContainer = applyPaletteSync(inPointContainer, palette);
        }

        // Apply similarity grouping manually if requested
        let finalPixels = processedContainer.toUint8Array();
        if (adjustments.colorSimilarity > 0) {
            const threshold = (adjustments.colorSimilarity / 100) * 441.67; // max RGB distance
            const colorCounts = new Map<string, number>();
            const parsedColors: { hex: string, r: number, g: number, b: number, count: number }[] = [];

            for (let i = 0; i < finalPixels.length; i += 4) {
                const hex = '#' + [finalPixels[i], finalPixels[i + 1], finalPixels[i + 2]].map(v => v.toString(16).padStart(2, '0')).join('');
                colorCounts.set(hex, (colorCounts.get(hex) || 0) + 1);
            }
            colorCounts.forEach((count, hex) => {
                parsedColors.push({
                    hex,
                    count,
                    r: parseInt(hex.slice(1, 3), 16),
                    g: parseInt(hex.slice(3, 5), 16),
                    b: parseInt(hex.slice(5, 7), 16)
                });
            });
            // Sort by frequency descending
            parsedColors.sort((a, b) => b.count - a.count);

            const mergeMap = new Map<string, string>();
            for (let i = 0; i < parsedColors.length; i++) {
                const c1 = parsedColors[i];
                if (mergeMap.has(c1.hex)) continue;
                mergeMap.set(c1.hex, c1.hex);
                for (let j = i + 1; j < parsedColors.length; j++) {
                    const c2 = parsedColors[j];
                    if (mergeMap.has(c2.hex)) continue;
                    const dist = Math.sqrt(Math.pow(c1.r - c2.r, 2) + Math.pow(c1.g - c2.g, 2) + Math.pow(c1.b - c2.b, 2));
                    if (dist < threshold) {
                        mergeMap.set(c2.hex, c1.hex);
                    }
                }
            }

            for (let i = 0; i < finalPixels.length; i += 4) {
                const origHex = '#' + [finalPixels[i], finalPixels[i + 1], finalPixels[i + 2]].map(v => v.toString(16).padStart(2, '0')).join('');
                const mergedHex = mergeMap.get(origHex) || origHex;
                finalPixels[i] = parseInt(mergedHex.slice(1, 3), 16);
                finalPixels[i + 1] = parseInt(mergedHex.slice(3, 5), 16);
                finalPixels[i + 2] = parseInt(mergedHex.slice(5, 7), 16);
            }
        }

        colorMap.clear();
        for (let r = 0; r < gridH; r++) {
            for (let c = 0; c < gridW; c++) {
                const idx = (r * gridW + c) * 4;
                const rv = finalPixels[idx];
                const gv = finalPixels[idx + 1];
                const bv = finalPixels[idx + 2];
                const hex = '#' + [rv, gv, bv].map(v => v.toString(16).padStart(2, '0')).join('');
                pixelColors[r][c] = hex;
                colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
            }
        }
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
