import { useState, useCallback } from 'react';

export type MarkGrid = boolean[][];

function cloneGrid(grid: MarkGrid): MarkGrid {
    return grid.map(row => [...row]);
}

function createGrid(rows: number, cols: number): MarkGrid {
    return Array.from({ length: rows }, () => new Array(cols).fill(false));
}

export interface MarkingState {
    marked: MarkGrid;
    markedCount: number;
    totalCount: number;
    canUndo: boolean;
    canRedo: boolean;
    nextUnmarked: [number, number] | null;
    togglePixel: (row: number, col: number) => void;
    markByColor: (hex: string, pixelColors: string[][], markValue?: boolean) => void;
    markRect: (r1: number, c1: number, r2: number, c2: number, markValue?: boolean) => void;
    undo: () => void;
    redo: () => void;
    reset: (rows: number, cols: number) => void;
    markAll: () => void;
    unmarkAll: () => void;
}

export function useMarkingState(initialRows = 0, initialCols = 0): MarkingState {
    const [marked, setMarked] = useState<MarkGrid>(() => createGrid(initialRows, initialCols));
    const [undoStack, setUndoStack] = useState<MarkGrid[]>([]);
    const [redoStack, setRedoStack] = useState<MarkGrid[]>([]);

    const pushUndo = useCallback((prev: MarkGrid) => {
        setUndoStack(s => [...s.slice(-49), cloneGrid(prev)]);
        setRedoStack([]);
    }, []);

    const togglePixel = useCallback((row: number, col: number) => {
        setMarked(prev => {
            pushUndo(prev);
            const next = cloneGrid(prev);
            if (next[row]) next[row][col] = !next[row][col];
            return next;
        });
    }, [pushUndo]);

    const markByColor = useCallback((hex: string, pixelColors: string[][], markValue = true) => {
        setMarked(prev => {
            pushUndo(prev);
            const next = cloneGrid(prev);
            for (let r = 0; r < pixelColors.length; r++) {
                for (let c = 0; c < pixelColors[r].length; c++) {
                    if (pixelColors[r][c] === hex) next[r][c] = markValue;
                }
            }
            return next;
        });
    }, [pushUndo]);

    const markRect = useCallback((r1: number, c1: number, r2: number, c2: number, markValue = true) => {
        const minR = Math.min(r1, r2), maxR = Math.max(r1, r2);
        const minC = Math.min(c1, c2), maxC = Math.max(c1, c2);
        setMarked(prev => {
            pushUndo(prev);
            const next = cloneGrid(prev);
            for (let r = minR; r <= maxR; r++) {
                for (let c = minC; c <= maxC; c++) {
                    if (next[r]) next[r][c] = markValue;
                }
            }
            return next;
        });
    }, [pushUndo]);

    const undo = useCallback(() => {
        setUndoStack(prev => {
            if (prev.length === 0) return prev;
            const newStack = [...prev];
            const snapshot = newStack.pop()!;
            setMarked(cur => {
                setRedoStack(r => [...r.slice(-49), cloneGrid(cur)]);
                return snapshot;
            });
            return newStack;
        });
    }, []);

    const redo = useCallback(() => {
        setRedoStack(prev => {
            if (prev.length === 0) return prev;
            const newStack = [...prev];
            const snapshot = newStack.pop()!;
            setMarked(cur => {
                setUndoStack(u => [...u.slice(-49), cloneGrid(cur)]);
                return snapshot;
            });
            return newStack;
        });
    }, []);

    const reset = useCallback((rows: number, cols: number) => {
        setMarked(createGrid(rows, cols));
        setUndoStack([]);
        setRedoStack([]);
    }, []);

    const markAll = useCallback(() => {
        setMarked(prev => {
            pushUndo(prev);
            return prev.map(row => row.map(() => true));
        });
    }, [pushUndo]);

    const unmarkAll = useCallback(() => {
        setMarked(prev => {
            pushUndo(prev);
            return prev.map(row => row.map(() => false));
        });
    }, [pushUndo]);

    // Compute derived values
    let markedCount = 0;
    let totalCount = 0;
    let nextUnmarked: [number, number] | null = null;

    for (let r = 0; r < marked.length; r++) {
        for (let c = 0; c < marked[r].length; c++) {
            totalCount++;
            if (marked[r][c]) {
                markedCount++;
            } else if (!nextUnmarked) {
                nextUnmarked = [r, c];
            }
        }
    }

    return {
        marked,
        markedCount,
        totalCount,
        canUndo: undoStack.length > 0,
        canRedo: redoStack.length > 0,
        nextUnmarked,
        togglePixel,
        markByColor,
        markRect,
        undo,
        redo,
        reset,
        markAll,
        unmarkAll,
    };
}
