import { Settings, Palette } from 'lucide-react';

interface MobileNavProps {
    activeTab: 'settings' | 'palette';
    onTabChange: (tab: 'settings' | 'palette') => void;
    visible: boolean;
}

export function MobileNav({ activeTab, onTabChange, visible }: MobileNavProps) {
    if (!visible) return null;

    return (
        <nav
            className="md:hidden flex items-center justify-around py-2 px-6 flex-shrink-0"
            style={{
                background: 'var(--color-surface)',
                borderTop: '1px solid var(--color-border)',
                paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.5rem)'
            }}
        >
            <button
                onClick={() => onTabChange('settings')}
                className="flex flex-col items-center gap-1 transition-all"
                style={{ color: activeTab === 'settings' ? 'var(--color-accent)' : 'var(--color-muted)' }}
            >
                <Settings size={22} strokeWidth={activeTab === 'settings' ? 2.5 : 2} />
                <span className="text-[10px] font-medium">Studio</span>
            </button>

            <button
                onClick={() => onTabChange('palette')}
                className="flex flex-col items-center gap-1 transition-all"
                style={{ color: activeTab === 'palette' ? 'var(--color-accent)' : 'var(--color-muted)' }}
            >
                <Palette size={22} strokeWidth={activeTab === 'palette' ? 2.5 : 2} />
                <span className="text-[10px] font-medium">Colors</span>
            </button>
        </nav>
    );
}
