// Color utility functions

export interface RGBColor {
    r: number;
    g: number;
    b: number;
}

export function hexToRgb(hex: string): RGBColor {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
        : { r: 0, g: 0, b: 0 };
}

export function rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return [h * 360, s * 100, l * 100];
}

export function hslToRgb(h: number, s: number, l: number): RGBColor {
    h /= 360; s /= 100; l /= 100;
    let r: number, g: number, b: number;
    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

// Adjust a single pixel's RGBA data in place
export function adjustPixel(
    data: Uint8ClampedArray,
    i: number,
    brightness: number,  // 0–200, 100 = neutral
    contrast: number,    // 0–200, 100 = neutral
    saturation: number,  // 0–200, 100 = neutral
    vibrancy: number,    // 0–200, 100 = neutral
): void {
    let r = data[i], g = data[i + 1], b = data[i + 2];

    // Brightness (multiply)
    const bright = brightness / 100;
    r *= bright; g *= bright; b *= bright;

    // Contrast
    const contrFactor = (259 * (contrast * 2.55 - 127.5 + 127.5)) / (255 * (259 - (contrast * 2.55 - 127.5 + 127.5)));
    const cf = (259 * (contrast - 50)) / (255 * (259 - (contrast - 50)));
    r = cf * (r - 128) + 128;
    g = cf * (g - 128) + 128;
    b = cf * (b - 128) + 128;
    void contrFactor;

    // Saturation & Vibrancy in HSL
    let [h, s, l] = rgbToHsl(
        Math.max(0, Math.min(255, r)),
        Math.max(0, Math.min(255, g)),
        Math.max(0, Math.min(255, b))
    );
    s = Math.max(0, Math.min(100, s * (saturation / 100)));

    // Vibrancy: boost saturation more for less-saturated pixels
    const vibBoost = (vibrancy - 100) / 100;
    const vibFactor = 1 - s / 100;  // higher boost for desaturated pixels
    s = Math.max(0, Math.min(100, s + vibBoost * vibFactor * 50));

    const adjusted = hslToRgb(h, s, l);
    data[i] = adjusted.r;
    data[i + 1] = adjusted.g;
    data[i + 2] = adjusted.b;
}
