import { useState, useCallback, useRef, useEffect } from 'react';

export interface ZoomPanState {
    scale: number;
    offsetX: number;
    offsetY: number;
}

export interface ZoomPanHandlers {
    onWheel: (e: React.WheelEvent<HTMLCanvasElement>) => void;
    onPointerDown: (e: React.PointerEvent<HTMLCanvasElement>) => void;
    onPointerMove: (e: React.PointerEvent<HTMLCanvasElement>) => void;
    onPointerUp: (e: React.PointerEvent<HTMLCanvasElement>) => void;
    onTouchStart: (e: React.TouchEvent<HTMLCanvasElement>) => void;
    onTouchMove: (e: React.TouchEvent<HTMLCanvasElement>) => void;
    onTouchEnd: (e: React.TouchEvent<HTMLCanvasElement>) => void;
    resetView: () => void;
    panToCell: (row: number, col: number, gridW: number, gridH: number, canvasW: number, canvasH: number) => void;
    /** Convert canvas pixel coords to grid cell coords */
    canvasToGrid: (cx: number, cy: number) => [number, number];
    isDragging: boolean;
    isSpacePressed: boolean;
    state: ZoomPanState;
}

const MIN_SCALE = 0.05;
const MAX_SCALE = 32;

export function useZoomPan(
    cellSize: number,
): ZoomPanHandlers {
    const [state, setState] = useState<ZoomPanState>({ scale: 1, offsetX: 0, offsetY: 0 });
    const dragRef = useRef<{ startX: number; startY: number; startOX: number; startOY: number } | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isSpacePressed, setIsSpacePressed] = useState(false);

    // Track spacebar for panning
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && !e.repeat && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
                e.preventDefault();
                setIsSpacePressed(true);
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault();
                setIsSpacePressed(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    const onWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        setState(prev => {
            const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
            const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev.scale * factor));
            // Zoom towards mouse position
            const newOffsetX = mouseX - (mouseX - prev.offsetX) * (newScale / prev.scale);
            const newOffsetY = mouseY - (mouseY - prev.offsetY) * (newScale / prev.scale);
            return { scale: newScale, offsetX: newOffsetX, offsetY: newOffsetY };
        });
    }, []);

    const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
        if (e.button === 1 || e.button === 2 || e.altKey || isSpacePressed) {
            // Middle click, right click, alt+click, or space+click = pan
            e.currentTarget.setPointerCapture(e.pointerId);
            dragRef.current = {
                startX: e.clientX,
                startY: e.clientY,
                startOX: state.offsetX,
                startOY: state.offsetY,
            };
            setIsDragging(true);
        }
    }, [state.offsetX, state.offsetY, isSpacePressed]);

    const onPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!dragRef.current) return;
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        setState(prev => ({
            ...prev,
            offsetX: dragRef.current!.startOX + dx,
            offsetY: dragRef.current!.startOY + dy,
        }));
    }, []);

    const onPointerUp = useCallback((_e: React.PointerEvent<HTMLCanvasElement>) => {
        dragRef.current = null;
        setIsDragging(false);
    }, []);

    const initialTouchRef = useRef<{ dist: number, scale: number, cx: number, cy: number, ox: number, oy: number } | null>(null);

    const onTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
        if (e.touches.length === 2) {
            const rect = e.currentTarget.getBoundingClientRect();
            const t1 = e.touches[0];
            const t2 = e.touches[1];
            const p1 = { x: t1.clientX - rect.left, y: t1.clientY - rect.top };
            const p2 = { x: t2.clientX - rect.left, y: t2.clientY - rect.top };

            const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
            const cx = (p1.x + p2.x) / 2;
            const cy = (p1.y + p2.y) / 2;

            initialTouchRef.current = {
                dist,
                scale: state.scale,
                cx, cy,
                ox: state.offsetX,
                oy: state.offsetY
            };
        } else {
            initialTouchRef.current = null;
        }
    }, [state]);

    const onTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
        if (e.touches.length === 2 && initialTouchRef.current) {
            const rect = e.currentTarget.getBoundingClientRect();
            const t1 = e.touches[0];
            const t2 = e.touches[1];
            const p1 = { x: t1.clientX - rect.left, y: t1.clientY - rect.top };
            const p2 = { x: t2.clientX - rect.left, y: t2.clientY - rect.top };

            const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
            const cx = (p1.x + p2.x) / 2;
            const cy = (p1.y + p2.y) / 2;

            const init = initialTouchRef.current;
            const distRatio = dist / init.dist;

            const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, init.scale * distRatio));

            const newOffsetX = cx - (init.cx - init.ox) * (newScale / init.scale);
            const newOffsetY = cy - (init.cy - init.oy) * (newScale / init.scale);

            setState({ scale: newScale, offsetX: newOffsetX, offsetY: newOffsetY });
        }
    }, []);

    const onTouchEnd = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
        if (e.touches.length < 2) {
            initialTouchRef.current = null;
        }
    }, []);

    const resetView = useCallback(() => {
        setState({ scale: 1, offsetX: 0, offsetY: 0 });
    }, []);

    const panToCell = useCallback((
        row: number, col: number,
        gridW: number, gridH: number,
        canvasW: number, canvasH: number
    ) => {
        setState(prev => {
            const totalW = gridW * cellSize * prev.scale;
            const totalH = gridH * cellSize * prev.scale;
            void totalW; void totalH;
            const cellX = (col + 0.5) * cellSize * prev.scale;
            const cellY = (row + 0.5) * cellSize * prev.scale;
            return {
                ...prev,
                offsetX: canvasW / 2 - cellX,
                offsetY: canvasH / 2 - cellY,
            };
        });
    }, [cellSize]);

    const canvasToGrid = useCallback((cx: number, cy: number): [number, number] => {
        const col = Math.floor((cx - state.offsetX) / (cellSize * state.scale));
        const row = Math.floor((cy - state.offsetY) / (cellSize * state.scale));
        return [row, col];
    }, [state.offsetX, state.offsetY, state.scale, cellSize]);

    return {
        onWheel,
        onPointerDown,
        onPointerMove,
        onPointerUp,
        onTouchStart,
        onTouchMove,
        onTouchEnd,
        resetView,
        panToCell,
        canvasToGrid,
        isDragging,
        isSpacePressed,
        state,
    };
}
