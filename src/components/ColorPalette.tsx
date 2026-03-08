import React, { useState } from 'react';
import type { ColorEntry } from '../hooks/usePixelEngine';
import { Search, ChevronDown, ChevronUp } from 'lucide-react';
import type { ColorMappings } from '../hooks/useColorMappings';

interface ColorPaletteProps {
    uniqueColors: ColorEntry[];
    totalPixels: number;
    marked: boolean[][];
    pixelColors: string[][];
    highlightedColor: string | null;
    mappings: ColorMappings;
    onHighlightColor: (hex: string | null) => void;
    onMarkByColor: (hex: string, markValue: boolean) => void;
    onSetMapping: (hex: string, code: string) => void;
}

function getMarkedCountForColor(hex: string, pixelColors: string[][], marked: boolean[][]): number {
    let count = 0;
    for (let r = 0; r < pixelColors.length; r++) {
        for (let c = 0; c < pixelColors[r].length; c++) {
            if (pixelColors[r][c] === hex && marked[r]?.[c]) count++;
        }
    }
    return count;
}

function luminance(hex: string): number {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export const ColorPalette: React.FC<ColorPaletteProps> = ({
    uniqueColors, totalPixels, marked, pixelColors,
    highlightedColor, mappings, onHighlightColor, onMarkByColor, onSetMapping
}) => {
    const [search, setSearch] = useState('');
    const [codeSearch, setCodeSearch] = useState('');
    const [sortBy, setSortBy] = useState<'count' | 'hex'>('count');
    const [sortAsc, setSortAsc] = useState(false);

    const filtered = uniqueColors
        .filter(c => {
            const hexMatch = c.hex.toLowerCase().includes(search.toLowerCase());
            const code = (mappings[c.hex.toLowerCase()] || '').toLowerCase();
            const codeMatch = code.includes(codeSearch.toLowerCase());
            return hexMatch && codeMatch;
        })
        .sort((a, b) => {
            let cmp = sortBy === 'count' ? b.count - a.count : a.hex.localeCompare(b.hex);
            return sortAsc ? -cmp : cmp;
        });

    const toggleSort = (col: 'count' | 'hex') => {
        if (sortBy === col) setSortAsc(v => !v);
        else { setSortBy(col); setSortAsc(false); }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>
                    Color Palette
                </h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(108,99,255,0.14)', color: 'var(--color-accent2)', border: '1px solid rgba(108,99,255,0.25)' }}>
                    {uniqueColors.length} colors
                </span>
            </div>

            {/* Search */}
            <div className="flex gap-2 mb-2">
                <div className="relative flex-1">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search hex..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-7 pr-2 py-1.5 text-xs rounded-lg outline-none"
                        style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                    />
                </div>
                <div className="relative flex-1">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--color-muted)' }} />
                    <input
                        type="text"
                        placeholder="Search code..."
                        value={codeSearch}
                        onChange={e => setCodeSearch(e.target.value)}
                        className="w-full pl-7 pr-2 py-1.5 text-xs rounded-lg outline-none"
                        style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                    />
                </div>
            </div>

            {/* Column headers */}
            <div className="flex text-xs mb-1 px-1" style={{ color: 'var(--color-muted)' }}>
                <span className="w-6" />
                <button className="flex-1 text-left flex items-center gap-1" onClick={() => toggleSort('hex')}>
                    Hex {sortBy === 'hex' ? (sortAsc ? <ChevronUp size={10} /> : <ChevronDown size={10} />) : null}
                </button>
                <button className="flex items-center gap-1" onClick={() => toggleSort('count')}>
                    Count {sortBy === 'count' ? (sortAsc ? <ChevronUp size={10} /> : <ChevronDown size={10} />) : null}
                </button>
            </div>

            {/* Color rows */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-0.5" style={{ minHeight: 0 }}>
                {filtered.length === 0 && (
                    <p className="text-center text-xs py-4" style={{ color: 'var(--color-muted)' }}>No colors found</p>
                )}
                {filtered.map(({ hex, count }) => {
                    const markedCount = getMarkedCountForColor(hex, pixelColors, marked);
                    const isHighlighted = highlightedColor === hex;
                    const allMarked = markedCount === count;
                    const textColor = luminance(hex) > 0.4 ? '#000' : '#fff';

                    return (
                        <div
                            key={hex}
                            className="color-row flex items-center gap-2 px-1 py-1 rounded-lg cursor-pointer group"
                            style={{
                                background: isHighlighted ? 'rgba(108,99,255,0.12)' : 'transparent',
                                border: isHighlighted ? '1px solid rgba(108,99,255,0.3)' : '1px solid transparent',
                            }}
                            onClick={() => onHighlightColor(isHighlighted ? null : hex)}
                        >
                            {/* Swatch */}
                            <div
                                className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center text-xs font-bold"
                                style={{ background: hex, color: textColor, fontSize: 8 }}
                            >
                                {markedCount === count && count > 0 ? '✓' : ''}
                            </div>
                            {/* Hex + progress */}
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-xs font-mono" style={{ color: 'var(--color-text)' }}>{hex.toUpperCase()}</span>
                                        <input
                                            type="text"
                                            placeholder="Code"
                                            value={mappings[hex.toLowerCase()] || ''}
                                            onChange={e => onSetMapping(hex, e.target.value.toUpperCase())}
                                            onClick={e => e.stopPropagation()}
                                            className="w-12 px-1 py-0 text-[10px] font-bold rounded border outline-none text-center"
                                            style={{
                                                background: 'var(--color-bg)',
                                                borderColor: 'var(--color-border)',
                                                color: 'var(--color-accent2)',
                                            }}
                                            maxLength={4}
                                        />
                                    </div>
                                    <div className="text-right">
                                        {allMarked ? (
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                                                style={{ background: 'rgba(34,211,160,0.15)', color: 'var(--color-success)', border: '1px solid rgba(34,211,160,0.3)' }}>
                                                DONE
                                            </span>
                                        ) : (
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] font-mono leading-none" style={{ color: 'var(--color-text)' }}>
                                                    {markedCount}/{count}
                                                </span>
                                                <span className="text-[9px] font-mono leading-none mt-0.5" style={{ color: 'var(--color-muted)' }}>
                                                    {count - markedCount} left
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {/* Progress bar: markedCount / count */}
                                <div className="h-1 rounded-full mt-0.5 overflow-hidden" style={{ background: 'var(--color-border)' }}>
                                    <div
                                        className="h-full rounded-full transition-all"
                                        style={{ width: `${count > 0 ? (markedCount / count) * 100 : 0}%`, background: 'var(--color-success)' }}
                                    />
                                </div>
                            </div>
                            {/* Mark all / unmark all button */}
                            <button
                                className="text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                                style={{
                                    background: allMarked ? 'rgba(248,113,113,0.15)' : 'rgba(34,211,160,0.15)',
                                    color: allMarked ? '#f87171' : 'var(--color-success)',
                                    border: `1px solid ${allMarked ? 'rgba(248,113,113,0.3)' : 'rgba(34,211,160,0.3)'}`,
                                    fontSize: 10,
                                }}
                                onClick={e => { e.stopPropagation(); onMarkByColor(hex, !allMarked); }}
                                title={allMarked ? 'Unmark all of this color' : 'Mark all of this color'}
                            >
                                {allMarked ? 'Unmark' : 'Mark all'}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Footer summary */}
            {uniqueColors.length > 0 && (
                <div className="mt-2 pt-2 flex justify-between text-xs" style={{ borderTop: '1px solid var(--color-border)', color: 'var(--color-muted)' }}>
                    <span>{totalPixels} total beads</span>
                    <span style={{ color: 'var(--color-success)' }}>
                        {marked.flat().filter(Boolean).length} done
                    </span>
                </div>
            )}
        </div>
    );
};
