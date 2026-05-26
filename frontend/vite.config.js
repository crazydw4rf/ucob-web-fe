import { defineConfig } from 'vite';
import { resolve, basename } from 'path';
import { glob } from 'glob';

// dynamically build input from src/pages/*.html
const htmlFiles = glob.sync('*.html', { cwd: resolve(__dirname, 'src') });
const input = Object.fromEntries(
  htmlFiles.map((file) => [
    basename(file, '.html'), // key: filename without extension
    resolve(__dirname, 'src', file),
  ])
);

export default defineConfig({
  root: './src',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input,
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
  plugins: [
    {
      name: 'flatten-html',
      writeBundle: {
        sequential: true,
        async handler(options, bundle) {
          const fs = await import('fs');
          const path = await import('path');

          const outDir = options.dir;

          for (const key in bundle) {
            if (key.endsWith('.html')) {
              const srcPath = path.join(outDir, key);
              const destPath = path.join(outDir, path.basename(key));
              fs.renameSync(srcPath, destPath);
            }
          }
        },
      },
    },
  ],
});
