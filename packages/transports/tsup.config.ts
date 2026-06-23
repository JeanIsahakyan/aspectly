import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    cefsharp: 'src/cefsharp.ts',
    webkit: 'src/webkit.ts',
    android: 'src/android.ts',
    'react-native': 'src/react-native.ts',
    iframe: 'src/iframe.ts',
    window: 'src/window.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
});
