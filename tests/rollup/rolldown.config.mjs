import path from 'node:path'
import { defineConfig } from 'rolldown'
import Dts from 'rollup-plugin-dts'
import PostCSS from 'rollup-plugin-postcss'
import Vue from 'unplugin-vue/rolldown'

export default defineConfig([
  {
    input: {
      index: 'src/index.ts',
    },

    external: ['vue'],

    plugins: [
      Vue(),
      PostCSS(),
    ],

    resolve: {
      alias: {
        '@': path.resolve('src'),
      },
    },

    output: {
      format: 'esm',
      dir: 'dist',
      entryFileNames: '[name].mjs',
      assetFileNames: '[name][extname]',
      chunkFileNames: '[name]-[hash].mjs',
    },
  },
  {
    input: {
      test: './src/pure.ts',
    },

    resolve: {
      alias: {
        '@': path.resolve('src'),
      },
    },

    plugins: [
      Dts(),
    ],

    output: {
      format: 'es',
      dir: 'dist2',
    },
  },
])
