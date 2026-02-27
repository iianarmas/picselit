import React, {
    useRef, useEffect, useCallback, useState
} from 'react';
import { useZoomPan } from '../hooks/useZoomPan';

interface PixelCanvasProps {
    pixelColors: string[][];
    marked: boolean[][];
    highlightedColor: string | null;
    nextUnmarked: [number, number] | null;
    showGrid: boolean;
    previewMode: boolean;
    onTogglePixel: (row: number, col: number) => void;
    onMarkRect: (r1: number, c1: number, r2: number, c2: number) => void;
    /** Ref-callback so App can call panToCell */
    onRegisterPanToNext: (fn: () => void) => void;
}

const CELL = 20; // base cell size in canvas pixels (before zoom)

interface Rect { r1: number; c1: number; r2: number; c2: number }

export const PixelCanvas: React.FC<PixelCanvasProps> = ({
    pixelColors, marked, highlightedColor, nextUnmarked,
    showGrid, previewMode, onTogglePixel, onMarkRect, onRegisterPanToNext,
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [canvasSize, setCanvasSize] = useState({ w: 800, h: 600 });

    const rows = pixelColors.length;
    const cols = rows > 0 ? pixelColors[0].length : 0;

    const zoom = useZoomPan(CELL);
    const { state: zp, onWheel, onPointerDown, onPointerMove, onPointerUp, canvasToGrid, panToCell } = zoom;

    // Rect selection state
    const [rectStart, setRectStart] = useState<[number, number] | null>(null);
    const [rectEnd, setRectEnd] = useState<[number, number] | null>(null);
    const [isRectSelecting, setIsRectSelecting] = useState(false);

    // Register pan callback
    useEffect(() => {
        onRegisterPanToNext(() => {
            if (nextUnmarked && canvasRef.current) {
                const [r, c] = nextUnmarked;
                panToCell(r, c, cols, rows, canvasSize.w, canvasSize.h);
            }
        });
    }, [nextUnmarked, panToCell, cols, rows, canvasSize, onRegisterPanToNext]);

    // Resize observer
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const ro = new ResizeObserver(entries => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                setCanvasSize({ w: Math.floor(width), h: Math.floor(height) });
            }
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // Drawing
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (rows === 0 || cols === 0) return;

        const { scale, offsetX, offsetY } = zp;
        const cs = CELL * scale;

        ctx.save();
        ctx.translate(offsetX, offsetY);

        // 1) Pixel fill
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const x = c * cs, y = r * cs;
                ctx.fillStyle = pixelColors[r][c];
                ctx.fillRect(x, y, cs, cs);
            }
        }

        // 2) Grid overlay
        if (showGrid && cs >= 3) {
            ctx.strokeStyle = 'rgba(0,0,0,0.25)';
            ctx.lineWidth = Math.max(0.5, 0.5 * scale);
            ctx.beginPath();
            for (let r = 0; r <= rows; r++) {
                ctx.moveTo(0, r * cs);
                ctx.lineTo(cols * cs, r * cs);
            }
            for (let c = 0; c <= cols; c++) {
                ctx.moveTo(c * cs, 0);
                ctx.lineTo(c * cs, rows * cs);
            }
            ctx.stroke();
        }

        // 3) Mark overlay
        if (!previewMode) {
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (!marked[r]?.[c]) continue;
                    const x = c * cs, y = r * cs;
                    // Green overlay
                    ctx.fillStyle = 'rgba(34,211,160,0.38)';
                    ctx.fillRect(x, y, cs, cs);
                    // Check mark (visible at cs >= 6)
                    if (cs >= 6) {
                        ctx.strokeStyle = 'rgba(34, 211, 160, 0.9)';
                        ctx.lineWidth = Math.max(1, cs * 0.1);
                        ctx.lineCap = 'round';
                        ctx.lineJoin = 'round';
                        const mx = x + cs / 2, my = y + cs / 2;
                        const r2 = cs * 0.22;
                        ctx.beginPath();
                        ctx.moveTo(mx - r2, my);
                        ctx.lineTo(mx - r2 * 0.1, my + r2 * 0.8);
                        ctx.lineTo(mx + r2, my - r2 * 0.7);
                        ctx.stroke();
                    }
                }
            }
        }

        // 4) Highlight overlay (selected color or rect selection)
        if (highlightedColor) {
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    if (pixelColors[r][c] !== highlightedColor) {
                        ctx.fillStyle = 'rgba(0,0,0,0.5)';
                        ctx.fillRect(c * cs, r * cs, cs, cs);
                    } else {
                        // yellow border
                        ctx.strokeStyle = '#fbbf24';
                        ctx.lineWidth = Math.max(1, scale * 0.8);
                        ctx.strokeRect(c * cs + ctx.lineWidth / 2, r * cs + ctx.lineWidth / 2, cs - ctx.lineWidth, cs - ctx.lineWidth);
                    }
                }
            }
        }

        // 5) Next unmarked highlight (pulsing yellow rim — we just draw once)
        if (nextUnmarked && !previewMode) {
            const [nr, nc] = nextUnmarked;
            const x = nc * cs, y = nr * cs;
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = Math.max(1.5, scale * 1.2);
            ctx.strokeRect(x + ctx.lineWidth / 2, y + ctx.lineWidth / 2, cs - ctx.lineWidth, cs - ctx.lineWidth);
        }

        // 6) Rect selection rubber band
        if (isRectSelecting && rectStart && rectEnd) {
            const [r1, c1] = rectStart;
            const [r2, c2] = rectEnd;
            const minR = Math.min(r1, r2), maxR = Math.max(r1, r2);
            const minC = Math.min(c1, c2), maxC = Math.max(c1, c2);
            ctx.fillStyle = 'rgba(108,99,255,0.18)';
            ctx.fillRect(minC * cs, minR * cs, (maxC - minC + 1) * cs, (maxR - minR + 1) * cs);
            ctx.strokeStyle = 'rgba(108,99,255,0.85)';
            ctx.lineWidth = Math.max(1, scale * 0.7);
            ctx.setLineDash([4, 3]);
            ctx.strokeRect(minC * cs, minR * cs, (maxC - minC + 1) * cs, (maxR - minR + 1) * cs);
            ctx.setLineDash([]);
        }

        ctx.restore();
    }, [
        pixelColors, marked, zp, showGrid, previewMode,
        highlightedColor, nextUnmarked, isRectSelecting, rectStart, rectEnd,
        rows, cols,
    ]);

    // Pointer interaction for pixel toggle / rect select
    const pointerDownPos = useRef<{ x: number; y: number; time: number } | null>(null);
    const hasMoved = useRef(false);

    const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
        if (e.button === 1 || e.button === 2 || e.altKey) {
            onPointerDown(e);
            return;
        }
        if (e.button !== 0) return;
        if (rows === 0) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;
        pointerDownPos.current = { x: cx, y: cy, time: Date.now() };
        hasMoved.current = false;

        const [r, c] = canvasToGrid(cx, cy);
        if (r >= 0 && r < rows && c >= 0 && c < cols) {
            setRectStart([r, c]);
            setRectEnd([r, c]);
            setIsRectSelecting(false);
        }
        e.currentTarget.setPointerCapture(e.pointerId);
    }, [onPointerDown, canvasToGrid, rows, cols]);

    const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
        onPointerMove(e);
        if (!pointerDownPos.current || rows === 0) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;
        const dx = cx - pointerDownPos.current.x;
        const dy = cy - pointerDownPos.current.y;
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) hasMoved.current = true;

        if (hasMoved.current && rectStart) {
            const [r, c] = canvasToGrid(cx, cy);
            const clampedR = Math.max(0, Math.min(rows - 1, r));
            const clampedC = Math.max(0, Math.min(cols - 1, c));
            setRectEnd([clampedR, clampedC]);
            setIsRectSelecting(true);
        }
    }, [onPointerMove, canvasToGrid, rows, cols, rectStart]);

    const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
        onPointerUp(e);
        if (!pointerDownPos.current || rows === 0) return;

        if (!hasMoved.current && rectStart) {
            // Single tap → toggle pixel
            onTogglePixel(rectStart[0], rectStart[1]);
        } else if (isRectSelecting && rectStart && rectEnd) {
            // Rect select → mark rect
            onMarkRect(rectStart[0], rectStart[1], rectEnd[0], rectEnd[1]);
        }

        pointerDownPos.current = null;
        setRectStart(null);
        setRectEnd(null);
        setIsRectSelecting(false);
    }, [onPointerUp, rows, rectStart, rectEnd, isRectSelecting, onTogglePixel, onMarkRect]);

    const handleContextMenu = (e: React.MouseEvent) => e.preventDefault();

    const isEmpty = rows === 0;

    return (
        <div ref={containerRef} className="canvas-container flex-1 w-full h-full"
            style={{ position: 'relative', overflow: 'hidden' }}>
            <canvas
                ref={canvasRef}
                width={canvasSize.w}
                height={canvasSize.h}
                style={{ display: 'block', width: canvasSize.w, height: canvasSize.h, cursor: isRectSelecting ? 'crosshair' : 'default' }}
                onWheel={onWheel}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onContextMenu={handleContextMenu}
            />

            {isEmpty && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-sm" style={{ color: 'var(--color-border)' }}>Upload an image to start</p>
                </div>
            )}

            {/* Zoom indicator */}
            {!isEmpty && (
                <div className="absolute bottom-3 right-3 text-xs font-mono px-2 py-1 rounded"
                    style={{ background: 'rgba(15,17,23,0.75)', color: 'var(--color-muted)', backdropFilter: 'blur(4px)' }}>
                    {Math.round(zp.scale * 100)}% · scroll to zoom · alt+drag to pan · drag to select
                </div>
            )}
        </div>
    );
};
