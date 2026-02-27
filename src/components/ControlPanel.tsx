import React from 'react';
import { Lock } from 'lucide-react';

interface SliderProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    disabled?: boolean;
    onChange: (v: number) => void;
    unit?: string;
}

const Slider: React.FC<SliderProps> = ({ label, value, min, max, step = 1, disabled, onChange, unit = '' }) => (
    <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center">
            <span className="text-xs font-medium" style={{ color: disabled ? 'var(--color-muted)' : 'var(--color-text)' }}>{label}</span>
            <span className="text-xs font-mono tabular-nums" style={{ color: disabled ? 'var(--color-border)' : 'var(--color-accent2)' }}>
                {value}{unit}
            </span>
        </div>
        <input
            type="range"
            min={min} max={max} step={step}
            value={value}
            disabled={disabled}
            onChange={e => onChange(Number(e.target.value))}
        />
    </div>
);

interface ControlPanelProps {
    gridW: number;
    gridH: number;
    aspectRatio: number | null;   // w/h ratio, null = not set
    brightness: number;
    contrast: number;
    saturation: number;
    vibrancy: number;
    locked: boolean;              // true once marking begins
    onGridWChange: (w: number) => void;
    onGridHChange: (h: number) => void;
    onBrightnessChange: (v: number) => void;
    onContrastChange: (v: number) => void;
    onSaturationChange: (v: number) => void;
    onVibrancyChange: (v: number) => void;
    linkAspectRatio: boolean;
    onLinkAspectRatioChange: (v: boolean) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
    gridW, gridH, aspectRatio,
    brightness, contrast, saturation, vibrancy,
    locked,
    onGridWChange, onGridHChange,
    onBrightnessChange, onContrastChange, onSaturationChange, onVibrancyChange,
    linkAspectRatio, onLinkAspectRatioChange,
}) => {
    const handleGridW = (v: number) => {
        onGridWChange(v);
        if (linkAspectRatio && aspectRatio !== null) {
            onGridHChange(Math.max(1, Math.round(v / aspectRatio)));
        }
    };

    const handleGridH = (v: number) => {
        onGridHChange(v);
        if (linkAspectRatio && aspectRatio !== null) {
            onGridWChange(Math.max(1, Math.round(v * aspectRatio)));
        }
    };

    return (
        <div className="flex flex-col gap-5">
            {/* Grid Size */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>Grid Size</h3>
                    <span className="text-xs font-mono" style={{ color: 'var(--color-accent2)' }}>{gridW}×{gridH} = {gridW * gridH} beads</span>
                </div>
                <div className="flex flex-col gap-2">
                    <Slider label="Width (px)" value={gridW} min={4} max={150} onChange={handleGridW} disabled={locked} />
                    <Slider label="Height (px)" value={gridH} min={4} max={150} onChange={handleGridH} disabled={locked} />
                </div>
                <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
                    <div
                        className="relative w-8 h-4 rounded-full transition-colors"
                        style={{ background: linkAspectRatio ? 'var(--color-accent)' : 'var(--color-border)' }}
                        onClick={() => !locked && onLinkAspectRatioChange(!linkAspectRatio)}
                    >
                        <div
                            className="absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform"
                            style={{ transform: linkAspectRatio ? 'translateX(18px)' : 'translateX(2px)' }}
                        />
                    </div>
                    <span className="text-xs" style={{ color: 'var(--color-muted)' }}>Lock aspect ratio</span>
                </label>
            </div>

            <div style={{ height: 1, background: 'var(--color-border)' }} />

            {/* Color Adjustments */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--color-muted)' }}>Color Adjustments</h3>
                    {locked && (
                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(251,191,36,0.12)', color: 'var(--color-warning)', border: '1px solid rgba(251,191,36,0.25)' }}>
                            <Lock size={9} /> Locked
                        </span>
                    )}
                </div>
                <div className="flex flex-col gap-3">
                    <Slider label="Brightness" value={brightness} min={10} max={200} disabled={locked} onChange={onBrightnessChange} unit="%" />
                    <Slider label="Contrast" value={contrast} min={10} max={200} disabled={locked} onChange={onContrastChange} unit="%" />
                    <Slider label="Saturation" value={saturation} min={0} max={300} disabled={locked} onChange={onSaturationChange} unit="%" />
                    <Slider label="Vibrancy" value={vibrancy} min={0} max={300} disabled={locked} onChange={onVibrancyChange} unit="%" />
                </div>
                {locked && (
                    <p className="text-xs mt-2" style={{ color: 'var(--color-muted)' }}>
                        Color adjustments are disabled once bead marking begins.
                    </p>
                )}
            </div>
        </div>
    );
};
