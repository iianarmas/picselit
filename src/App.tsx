import { useState, useCallback, useRef, useEffect } from 'react';
import { UploadPanel } from './components/UploadPanel';
import { ControlPanel } from './components/ControlPanel';
import { PixelCanvas } from './components/PixelCanvas';
import { ColorPalette } from './components/ColorPalette';
import { Toolbar } from './components/Toolbar';
import { usePixelEngine } from './hooks/usePixelEngine';
import { useMarkingState } from './hooks/useMarkingState';
import { downloadPNG } from './utils/exportUtils';
import { Layers, Settings, Palette, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

const DEFAULT_GRID_W = 32;
const DEFAULT_GRID_H = 32;

type Tab = 'settings' | 'palette';

export default function App() {
  // Image + engine
  const [imageLoaded, setImageLoaded] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const { result, isProcessing, process, reprocess } = usePixelEngine();

  // Grid settings
  const [gridW, setGridW] = useState(DEFAULT_GRID_W);
  const [gridH, setGridH] = useState(DEFAULT_GRID_H);
  const [linkAspect, setLinkAspect] = useState(true);

  // Color adjustments
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [vibrancy, setVibrancy] = useState(100);

  // UI state
  const [showGrid, setShowGrid] = useState(true);
  const [previewMode, setPreviewMode] = useState(false);
  const [highlightedColor, setHighlightedColor] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('settings');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Marking
  const marking = useMarkingState();
  const adjustmentsLocked = marking.markedCount > 0;

  // Pan-to-next callback ref
  const panToNextRef = useRef<(() => void) | null>(null);

  // Reprocess debounce
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerReprocess = useCallback((w: number, h: number, adj: {
    brightness: number; contrast: number; saturation: number; vibrancy: number;
  }) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      reprocess(w, h, adj);
    }, 120);
  }, [reprocess]);

  // When result changes, reset marking
  useEffect(() => {
    if (result) {
      marking.reset(result.pixelColors.length, result.pixelColors[0]?.length ?? 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  const handleImageLoad = useCallback((img: HTMLImageElement) => {
    const ratio = img.naturalWidth / img.naturalHeight;
    setAspectRatio(ratio);
    const w = DEFAULT_GRID_W;
    const h = Math.max(1, Math.round(w / ratio));
    setGridW(w);
    setGridH(h);
    setImageLoaded(true);
    setHighlightedColor(null);
    process(img, w, h, { brightness: 100, contrast: 100, saturation: 100, vibrancy: 100 });
    setBrightness(100); setContrast(100); setSaturation(100); setVibrancy(100);
  }, [process]);

  const handleReset = () => {
    setImageLoaded(false);
    setAspectRatio(null);
    setHighlightedColor(null);
    marking.reset(0, 0);
    setGridW(DEFAULT_GRID_W);
    setGridH(DEFAULT_GRID_H);
    setBrightness(100); setContrast(100); setSaturation(100); setVibrancy(100);
  };

  // Slider change handlers (only if not locked)
  const handleBrightness = (v: number) => { if (adjustmentsLocked) return; setBrightness(v); triggerReprocess(gridW, gridH, { brightness: v, contrast, saturation, vibrancy }); };
  const handleContrast = (v: number) => { if (adjustmentsLocked) return; setContrast(v); triggerReprocess(gridW, gridH, { brightness, contrast: v, saturation, vibrancy }); };
  const handleSaturation = (v: number) => { if (adjustmentsLocked) return; setSaturation(v); triggerReprocess(gridW, gridH, { brightness, contrast, saturation: v, vibrancy }); };
  const handleVibrancy = (v: number) => { if (adjustmentsLocked) return; setVibrancy(v); triggerReprocess(gridW, gridH, { brightness, contrast, saturation, vibrancy: v }); };

  const handleGridW = (v: number) => { if (adjustmentsLocked) return; setGridW(v); triggerReprocess(v, gridH, { brightness, contrast, saturation, vibrancy }); };
  const handleGridH = (v: number) => { if (adjustmentsLocked) return; setGridH(v); triggerReprocess(gridW, v, { brightness, contrast, saturation, vibrancy }); };

  const handleRegisterPanToNext = useCallback((fn: () => void) => {
    panToNextRef.current = fn;
  }, []);

  const pixelColors = result?.pixelColors ?? [];
  const uniqueColors = result?.uniqueColors ?? [];
  const totalPixels = gridW * gridH;

  const handleDownloadPlain = () => downloadPNG({ pixelColors, scale: 1 }, 'pixelit-plain.png');
  const handleDownloadMarked = () => downloadPNG({ pixelColors, marked: marking.marked, showMarks: true, scale: 1 }, 'pixelit-marked.png');
  const handleDownloadScaled = () => downloadPNG({ pixelColors, marked: marking.marked, showMarks: true, scale: 8 }, 'pixelit-print.png');

  return (
    <div className="flex flex-col" style={{ height: '100vh', background: 'var(--color-bg)' }}>
      {/* Header */}
      <header className="flex items-center gap-3 px-5 py-3 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6c63ff, #a78bfa)' }}>
            <Layers size={16} className="text-white" />
          </div>
          <span className="text-base font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
            pics<span style={{ color: 'var(--color-accent)' }}>elit</span>
          </span>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full"
          style={{ background: 'rgba(108,99,255,0.12)', color: 'var(--color-accent2)', border: '1px solid rgba(108,99,255,0.22)' }}>
          Bead Planner
        </span>

        <div className="flex-1" />

        {isProcessing && (
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-muted)' }}>
            <Loader2 size={13} className="animate-spin" /> Processing…
          </div>
        )}
      </header>

      {/* Toolbar */}
      <Toolbar
        canUndo={marking.canUndo}
        canRedo={marking.canRedo}
        showGrid={showGrid}
        previewMode={previewMode}
        hasData={imageLoaded && !!result}
        markedCount={marking.markedCount}
        totalCount={marking.totalCount}
        onUndo={marking.undo}
        onRedo={marking.redo}
        onToggleGrid={() => setShowGrid(v => !v)}
        onTogglePreview={() => setPreviewMode(v => !v)}
        onNextBead={() => panToNextRef.current?.()}
        onDownloadPlain={handleDownloadPlain}
        onDownloadMarked={handleDownloadMarked}
        onDownloadScaled={handleDownloadScaled}
        onMarkAll={marking.markAll}
        onUnmarkAll={marking.unmarkAll}
        onResetImage={handleReset}
      />

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside
          className="flex flex-col flex-shrink-0 transition-all duration-200"
          style={{
            width: sidebarOpen ? 280 : 0,
            minWidth: sidebarOpen ? 280 : 0,
            overflow: 'hidden',
            borderRight: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
          }}
        >
          {sidebarOpen && (
            <div className="flex flex-col h-full p-3" style={{ width: 280 }}>
              {/* Tab bar */}
              <div className="flex rounded-lg p-0.5 mb-3 flex-shrink-0"
                style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
                {([['settings', 'Settings', Settings], ['palette', 'Colors', Palette]] as const).map(([key, label, Icon]) => (
                  <button key={key} onClick={() => setActiveTab(key as Tab)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all"
                    style={{
                      background: activeTab === key ? 'var(--color-surface2)' : 'transparent',
                      color: activeTab === key ? 'var(--color-text)' : 'var(--color-muted)',
                      border: activeTab === key ? '1px solid var(--color-border)' : '1px solid transparent',
                    }}>
                    <Icon size={12} /> {label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
                {activeTab === 'settings' && (
                  !imageLoaded
                    ? <UploadPanel onImageLoad={handleImageLoad} />
                    : <ControlPanel
                      gridW={gridW} gridH={gridH} aspectRatio={aspectRatio}
                      brightness={brightness} contrast={contrast}
                      saturation={saturation} vibrancy={vibrancy}
                      locked={adjustmentsLocked}
                      onGridWChange={handleGridW} onGridHChange={handleGridH}
                      onBrightnessChange={handleBrightness} onContrastChange={handleContrast}
                      onSaturationChange={handleSaturation} onVibrancyChange={handleVibrancy}
                      linkAspectRatio={linkAspect} onLinkAspectRatioChange={setLinkAspect}
                    />
                )}
                {activeTab === 'palette' && result && (
                  <ColorPalette
                    uniqueColors={uniqueColors}
                    totalPixels={totalPixels}
                    marked={marking.marked}
                    pixelColors={pixelColors}
                    highlightedColor={highlightedColor}
                    onHighlightColor={setHighlightedColor}
                    onMarkByColor={(hex, v) => marking.markByColor(hex, pixelColors, v)}
                  />
                )}
                {activeTab === 'palette' && !result && (
                  <p className="text-xs text-center mt-8" style={{ color: 'var(--color-muted)' }}>
                    Upload an image to see the color palette.
                  </p>
                )}
              </div>
            </div>
          )}
        </aside>

        {/* Sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(v => !v)}
          className="flex-shrink-0 flex items-center justify-center"
          style={{
            width: 18, background: 'var(--color-surface)', borderRight: '1px solid var(--color-border)',
            color: 'var(--color-muted)', cursor: 'pointer', border: 'none', padding: 0,
          }}
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
        </button>

        {/* Canvas area */}
        <main className="flex-1 flex flex-col min-w-0 min-h-0">
          {!imageLoaded ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
              <div className="text-center max-w-md">
                <h1 className="text-3xl font-bold mb-2"
                  style={{ background: 'linear-gradient(135deg, var(--color-accent), var(--color-accent2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Picselit — Bead Planner
                </h1>
                <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                  Upload a photo, pixelate it, and plan your perler bead project. Click ← Settings to get started.
                </p>
              </div>
              <div className="w-full max-w-sm">
                <UploadPanel onImageLoad={handleImageLoad} />
              </div>
              <div className="flex gap-6 text-xs" style={{ color: 'var(--color-muted)' }}>
                {['🎨 Adjust colors', '🔲 Interactive grid', '✅ Track progress', '📥 Export PNG'].map(f => (
                  <span key={f}>{f}</span>
                ))}
              </div>
            </div>
          ) : (
            <PixelCanvas
              pixelColors={pixelColors}
              marked={marking.marked}
              highlightedColor={highlightedColor}
              nextUnmarked={marking.nextUnmarked}
              showGrid={showGrid}
              previewMode={previewMode}
              onTogglePixel={marking.togglePixel}
              onMarkRect={marking.markRect}
              onRegisterPanToNext={handleRegisterPanToNext}
            />
          )}
        </main>
      </div>
    </div>
  );
}
