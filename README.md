# PicSelIt

Picselit is a modern, responsive application designed for pixel art and perler/fuse bead planning. Easily convert photos into customizable pixel grids, adjust colors in real-time, and track your physical bead placements interactively across Web and Mobile.

## ✨ Features

- **Cross-Platform Support**: Optimized for both Desktop browsers and Android mobile devices using Capacitor.
- **Mobile-First UI**: Features a sleek Bottom Sheet design on mobile for intuitive setting adjustments without blocking the canvas.
- **Upload & Pixelate**: Instantly drop in photos to convert them into a color-reduced pixel grid.
- **Real-Time Adjustments**: Fine-tune Brightness, Contrast, Saturation, and Vibrancy. Target a specific number of unique colors and adjust similarity merging using high-performance quantization.
- **Interactive Canvas**: 
  - **Marking**: Tap or click to mark beads, or use a box-selection (drag) to mark large areas.
  - **Navigation**: Intuitive touch pinch-to-zoom and pan.
  - **Performance**: High-performance rendering engine with offscreen canvas caching for flicker-free transitions and smooth 60fps interaction.
- **Cloud Sync**: Persistent work saving powered by Supabase. Your projects, marked pixels, and settings stay in sync.
- **Theme Support**: Premium Light and Dark modes with dynamic Android Status Bar integration.
- **Professional Export**: High-res printable blueprints, plain PNGs, and annotated placement guides.

## 🚀 Getting Started

### Web Development
1. Clone and install: `npm install`
2. Configure `.env`: Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Run: `npm run dev`

### Mobile (Android)
1. Build the web app: `npm run build`
2. Sync to Android: `npx cap sync`
3. Open in Android Studio: `npx cap open android`

## 🛠️ Tech Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Mobile**: Capacitor JS
- **Backend**: Supabase (Auth + DB)
- **Engine**: HTML5 Canvas, `image-q` quantization
- **Design**: Lucide Icons, Modern CSS Variables

## 📄 License
Proprietary - BrainSales Team
