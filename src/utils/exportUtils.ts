// Export utilities: render pixel art to canvas and download as PNG

export interface ExportOptions {
    pixelColors: string[][];
    marked?: boolean[][];
    scale?: number;       // pixel scale factor, default 1
    showMarks?: boolean;
}

function renderToCanvas(opts: ExportOptions): HTMLCanvasElement {
    const { pixelColors, marked, scale = 1, showMarks = false } = opts;
    const rows = pixelColors.length;
    const cols = rows > 0 ? pixelColors[0].length : 0;
    const canvas = document.createElement('canvas');
    canvas.width = cols * scale;
    canvas.height = rows * scale;
    const ctx = canvas.getContext('2d')!;

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            ctx.fillStyle = pixelColors[row][col];
            ctx.fillRect(col * scale, row * scale, scale, scale);

            if (showMarks && marked && marked[row]?.[col]) {
                // Draw a semi-transparent green overlay
                ctx.fillStyle = 'rgba(34, 211, 160, 0.45)';
                ctx.fillRect(col * scale, row * scale, scale, scale);

                if (scale >= 6) {
                    // Draw a check mark for larger scales
                    ctx.strokeStyle = 'rgba(34, 211, 160, 0.95)';
                    ctx.lineWidth = Math.max(1, scale * 0.12);
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    const cx = col * scale + scale / 2;
                    const cy = row * scale + scale / 2;
                    const r = scale * 0.25;
                    ctx.beginPath();
                    ctx.moveTo(cx - r, cy);
                    ctx.lineTo(cx - r * 0.2, cy + r * 0.7);
                    ctx.lineTo(cx + r, cy - r * 0.6);
                    ctx.stroke();
                }
            }
        }
    }
    return canvas;
}

export function downloadPNG(opts: ExportOptions, filename: string): void {
    const canvas = renderToCanvas(opts);
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
}
