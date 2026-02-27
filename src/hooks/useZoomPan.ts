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
        resetView,
        panToCell,
        canvasToGrid,
        isDragging,
        isSpacePressed,
        state,
    };
}
