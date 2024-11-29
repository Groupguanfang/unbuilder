import { build } from 'bundle-dts-generator'

build({
  entry: [
    './src/index.ts',
  ],

  outDir: './dist',

  removeCacheDirOnExit: false,
})
