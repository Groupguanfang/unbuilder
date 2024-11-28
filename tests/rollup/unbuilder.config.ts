import { defineConfig } from 'unbuilder'

export default defineConfig([
  'rollup',
  {
    builder: 'bundle-dts-generator',
    buildOptions: {
      include: ['./src/**/*'],
    },
  },
])
