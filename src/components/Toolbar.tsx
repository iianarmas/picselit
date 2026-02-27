import React, { useState } from 'react';
import {
    Undo2, Redo2, Grid, EyeOff, Eye, Navigation, Download,
    ChevronDown, Trash2, CheckSquare, Square
} from 'lucide-react';

interface ToolbarProps {
    canUndo: boolean;
    canRedo: boolean;
    showGrid: boolean;
    previewMode: boolean;
    hasData: boolean;
    markedCount: number;
    totalCount: number;
    onUndo: () => void;
    onRedo: () => void;
    onToggleGrid: () => void;
    onTogglePreview: () => void;
    onNextBead: () => void;
    onDownloadPlain: () => void;
    onDownloadMarked: () => void;
    onDownloadScaled: () => void;
    onMarkAll: () => void;
    onUnmarkAll: () => void;
    onResetImage: () => void;
    onSave?: () => void;
    onOpenProjects?: () => void;
    isSaving?: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
    canUndo, canRedo, showGrid, previewMode, hasData,
    markedCount, totalCount,
    onUndo, onRedo, onToggleGrid, onTogglePreview, onNextBead,
    onDownloadPlain, onDownloadMarked, onDownloadScaled,
    onMarkAll, onUnmarkAll, onResetImage,
    onSave, onOpenProjects, isSaving,
}) => {
    const [downloadOpen, setDownloadOpen] = useState(false);
    const [batchOpen, setBatchOpen] = useState(false);

    const pct = totalCount > 0 ? Math.round((markedCount / totalCount) * 100) : 0;

    return (
        <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto hide-scrollbar whitespace-nowrap"
            style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>

            {/* Undo / Redo */}
            <div className="flex items-center">
                <button
                    disabled={!canUndo || !hasData}
                    onClick={onUndo}
                    className="toolbar-btn tooltip"
                    title="Undo"
                    style={{
                        padding: '6px 8px', borderRadius: '8px 0 0 8px',
                        background: canUndo ? 'var(--color-surface2)' : 'transparent',
                        border: '1px solid var(--color-border)',
                        color: canUndo ? 'var(--color-text)' : 'var(--color-border)',
                        cursor: canUndo ? 'pointer' : 'not-allowed',
                        transition: 'background 0.15s',
                    }}
                >
                    <Undo2 size={15} />
                </button>
                <button
                    disabled={!canRedo || !hasData}
                    onClick={onRedo}
                    className="toolbar-btn tooltip"
                    title="Redo"
                    style={{
                        padding: '6px 8px', borderRadius: '0 8px 8px 0',
                        background: canRedo ? 'var(--color-surface2)' : 'transparent',
                        border: '1px solid var(--color-border)', borderLeft: 'none',
                        color: canRedo ? 'var(--color-text)' : 'var(--color-border)',
                        cursor: canRedo ? 'pointer' : 'not-allowed',
                    }}
                >
                    <Redo2 size={15} />
                </button>
            </div>

            <div style={{ width: 1, height: 28, background: 'var(--color-border)' }} />

            {/* Grid toggle */}
            <button
                onClick={onToggleGrid}
                disabled={!hasData}
                title={showGrid ? 'Hide grid' : 'Show grid'}
                style={{
                    padding: '6px 10px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 5,
                    background: showGrid ? 'rgba(108,99,255,0.15)' : 'var(--color-surface2)',
                    border: `1px solid ${showGrid ? 'rgba(108,99,255,0.4)' : 'var(--color-border)'}`,
                    color: showGrid ? 'var(--color-accent2)' : 'var(--color-muted)',
                    cursor: hasData ? 'pointer' : 'not-allowed', fontSize: 12, transition: 'all 0.15s',
                }}
            >
                <Grid size={14} /> Grid
            </button>

            {/* Preview toggle */}
            <button
                onClick={onTogglePreview}
                disabled={!hasData}
                title={previewMode ? 'Show marks' : 'Hide marks (preview)'}
                style={{
                    padding: '6px 10px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 5,
                    background: previewMode ? 'rgba(251,191,36,0.12)' : 'var(--color-surface2)',
                    border: `1px solid ${previewMode ? 'rgba(251,191,36,0.4)' : 'var(--color-border)'}`,
                    color: previewMode ? 'var(--color-warning)' : 'var(--color-muted)',
                    cursor: hasData ? 'pointer' : 'not-allowed', fontSize: 12, transition: 'all 0.15s',
                }}
            >
                {previewMode ? <EyeOff size={14} /> : <Eye size={14} />}
                {previewMode ? 'Marks hidden' : 'Preview'}
            </button>

            {/* Next bead */}
            <button
                onClick={onNextBead}
                disabled={!hasData || markedCount === totalCount}
                title="Go to next unmarked bead"
                style={{
                    padding: '6px 10px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 5,
                    background: 'var(--color-surface2)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-muted)',
                    cursor: (hasData && markedCount < totalCount) ? 'pointer' : 'not-allowed', fontSize: 12,
                }}
            >
                <Navigation size={14} /> Next bead
            </button>

            {/* Batch operations dropdown */}
            <div className="relative">
                <button
                    onClick={() => setBatchOpen(v => !v)}
                    disabled={!hasData}
                    style={{
                        padding: '6px 10px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 5,
                        background: 'var(--color-surface2)', border: '1px solid var(--color-border)',
                        color: 'var(--color-muted)', cursor: hasData ? 'pointer' : 'not-allowed', fontSize: 12,
                    }}
                >
                    <CheckSquare size={14} /> Batch <ChevronDown size={12} />
                </button>
                {batchOpen && (
                    <div className="absolute top-full left-0 mt-1 z-50 py-1 rounded-lg shadow-2xl"
                        style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)', minWidth: 150 }}>
                        <button className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:brightness-125"
                            style={{ color: 'var(--color-success)' }}
                            onClick={() => { onMarkAll(); setBatchOpen(false); }}>
                            <CheckSquare size={13} /> Mark all
                        </button>
                        <button className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:brightness-125"
                            style={{ color: '#f87171' }}
                            onClick={() => { onUnmarkAll(); setBatchOpen(false); }}>
                            <Square size={13} /> Unmark all
                        </button>
                    </div>
                )}
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Progress */}
            {hasData && (
                <div className="flex items-center gap-2 mr-2 border-r pr-4" style={{ borderColor: 'var(--color-border)' }}>
                    <div className="text-xs font-mono" style={{ color: 'var(--color-muted)' }}>{markedCount}/{totalCount}</div>
                    <div className="w-24 h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
                        <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, background: pct === 100 ? 'var(--color-success)' : 'var(--color-accent)' }}
                        />
                    </div>
                    <div className="text-xs font-mono" style={{ color: pct === 100 ? 'var(--color-success)' : 'var(--color-accent2)' }}>{pct}%</div>
                </div>
            )}

            {/* Projects & Save */}
            <div className="flex items-center gap-2 mr-2">
                <button
                    onClick={onOpenProjects}
                    className="toolbar-btn text-xs font-medium"
                    style={{
                        padding: '6px 10px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 5,
                        background: 'transparent', border: '1px solid var(--color-border)',
                        color: 'var(--color-text)', cursor: 'pointer', transition: 'all 0.15s',
                    }}
                >
                    <Grid size={14} /> My Projects
                </button>
                <button
                    onClick={onSave}
                    disabled={!hasData || isSaving}
                    className="toolbar-btn text-xs font-medium text-white shadow-sm hover:opacity-90"
                    style={{
                        padding: '6px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 5,
                        background: 'linear-gradient(135deg, var(--color-accent2), var(--color-accent))',
                        border: 'none', cursor: (hasData && !isSaving) ? 'pointer' : 'not-allowed',
                        opacity: (hasData && !isSaving) ? 1 : 0.6, transition: 'all 0.15s',
                    }}
                >
                    {isSaving ? <Navigation className="animate-spin" size={14} /> : <CheckSquare size={14} />}
                    {isSaving ? 'Saving...' : 'Save'}
                </button>
            </div>

            {/* Download dropdown */}
            <div className="relative">
                <button
                    onClick={() => setDownloadOpen(v => !v)}
                    disabled={!hasData}
                    className="btn-gradient text-white text-sm flex items-center gap-2"
                    style={{
                        padding: '6px 12px', borderRadius: 8,
                        cursor: hasData ? 'pointer' : 'not-allowed',
                        opacity: hasData ? 1 : 0.4,
                    }}
                >
                    <Download size={14} /> Export <ChevronDown size={12} />
                </button>
                {downloadOpen && (
                    <div className="absolute top-full right-0 mt-1 z-50 py-1 rounded-lg shadow-2xl"
                        style={{ background: 'var(--color-surface2)', border: '1px solid var(--color-border)', minWidth: 200 }}>
                        <button className="w-full text-left px-3 py-2 text-sm hover:brightness-125"
                            style={{ color: 'var(--color-text)' }}
                            onClick={() => { onDownloadPlain(); setDownloadOpen(false); }}>
                            📷 PNG — Plain pixel art
                        </button>
                        <button className="w-full text-left px-3 py-2 text-sm hover:brightness-125"
                            style={{ color: 'var(--color-text)' }}
                            onClick={() => { onDownloadMarked(); setDownloadOpen(false); }}>
                            ✅ PNG — With bead marks
                        </button>
                        <button className="w-full text-left px-3 py-2 text-sm hover:brightness-125"
                            style={{ color: 'var(--color-text)' }}
                            onClick={() => { onDownloadScaled(); setDownloadOpen(false); }}>
                            🖨️ PNG — Scaled ×8 for print
                        </button>
                    </div>
                )}
            </div>

            {/* Reset image */}
            <button
                onClick={onResetImage}
                title="Upload a new image"
                style={{
                    padding: '6px 8px', borderRadius: 8,
                    background: 'transparent', border: '1px solid var(--color-border)',
                    color: '#f87171', cursor: 'pointer',
                }}
            >
                <Trash2 size={14} />
            </button>

            {/* Close dropdowns on outside click */}
            {(downloadOpen || batchOpen) && (
                <div className="fixed inset-0 z-40" onClick={() => { setDownloadOpen(false); setBatchOpen(false); }} />
            )}
        </div>
    );
};
