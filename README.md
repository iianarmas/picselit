# PicSelIt

Picselit is a modern, responsive web application designed for pixel art and perler/fuse bead planning. Easily convert photos into customizable pixel grids, adjust colors in real-time, and track your physical bead placements interactively.

![Picselit Theme Preview](https://picselit.vercel.app/preview.png) <!-- Placeholder, assuming a future image -->

## ✨ Features

- **Upload & Pixelate**: Instantly drop in photos to convert them into a color-reduced pixel grid.
- **Advanced Color Adjustments**: Fine-tune Brightness, Contrast, Saturation, and Vibrancy in real-time. Target a specific number of unique colors, and adjust color similarity merging.
- **Interactive Canvas**: Navigate huge canvases using intuitive controls:
  - **Left Click**: Mark individual beads
  - **Left Click + Drag**: Select multiple beads at once
  - **Space + Drag** (or Alt+Drag / Middle Click): Pan the canvas smoothly
  - **Scroll**: Fluid zoom all the way from huge close-ups down to a 5% thumbnail view
- **Cloud Progress Saving**: Powered by Supabase. Create an account, load your images, and pick up right where you left off. The database tracks everything from marked pixels to specific color slider values.
- **Theme Support**: Seamless Light and Dark mode variations stored securely in your browser's local storage.
- **Exporting**: Save your work as a standard PNG, an annotated PNG detailing your placed beads, or a high-res printable blueprint.

## 🚀 Getting Started

### Prerequisites
Make sure you have Node 18+ and `npm` installed. You will also need a Supabase project set up.

1. Clone the repository and install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root based on your Supabase configuration:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Start the development server:
```bash
npm run dev
```

## 🛠️ Tech Stack
- React 19 + TypeScript
- Vite
- Tailwind CSS (Utility styling + Custom CSS Vars)
- Supabase (PostgreSQL + Auth)
- HTML5 Canvas + `image-q` quantization

## 📄 Proprietary
BrainSales Team
