import { useState, useEffect } from 'react';

export type ColorMappings = Record<string, string>;

export function useColorMappings() {
    const [mappings, setMappings] = useState<ColorMappings>(() => {
        const saved = localStorage.getItem('picselit_color_mappings');
        return saved ? JSON.parse(saved) : {};
    });

    useEffect(() => {
        localStorage.setItem('picselit_color_mappings', JSON.stringify(mappings));
    }, [mappings]);

    const setMapping = (hex: string, code: string) => {
        setMappings(prev => ({
            ...prev,
            [hex.toLowerCase()]: code
        }));
    };

    const getMapping = (hex: string) => {
        return mappings[hex.toLowerCase()] || '';
    };

    return { mappings, setMapping, getMapping };
}
