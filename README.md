# 📦 unbuilder

Another `simple` and `easy to use` unified build tool for JavaScript/TypeScript projects.

## ✨ Features

- ⚔️ Multi-builder, current use `rollup` + `swc`, `esbuild` & `rolldown` is coming soon☝️ Currently builders status:
  - 🔪 `rollup` + `swc`/`tsc`: `stable`
  - 🔪 `rollup-dts`: `stable`
  - 🔪 `esbuild`: `developing`
  - 🔪 `rolldown`: `experimental`, not recommended for production.
- 🌎️ Default automatically lookup your `package.json` and `tsconfig.json` to generate:
  - 🔪 `input/entry` options from `package.json` `main`/`exports` fields
  - 🔪 `output` options from `package.json` `main`/`exports` fields
  - 🔪 `external` dependencies from `package.json` `dependencies`/`peerDependencies`/`devDependencies`/`optionalDependencies` fields
  - 🔪 `alias` paths options from `tsconfig.json`'s `compilerOptions.paths` field
- 🚀 Support `.vue` file out of box, built-in `postcss plugin` and support for `.vue` files, good👌
- 📻 Support `d.ts` file generation, use `rollup-plugin-dts` to generate `d.ts` files. We also can generate `.vue` file's `.d.ts` file, start writing component libraries has never been easier😉

## ⬇️ Install

```bash
pnpm install unbuilder
```

## ✍️ How to use

When you create a new project, you will create a `src` directory, write your project code, and of course you will declare the `main`/`module`/`types`/`exports` fields in the `package.json`.

`unbuilder` automatically recognizes the fields in your `package.json`. After specifying the `main`/`module`/`types`/`exports` fields, add the `unbuilder` field to the `package.json`, add a configuration array, and then execute `npm run build`. Cool! The files you want are transpiled.

```json
// package.json
{
  "name": "my-project",
  // Specify the main/module/types/exports fields
  "main": "dist/index.cjs",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  // Add scripts
  "scripts": {
    "build": "unbuilder"
  },
  "unbuilder": {
    // Add configuration array
    "config": [
      // `rollup` is mean to use rollup to build
      "rollup",
      // `rollup-dts` is mean to use rollup to generate `d.ts` files
      "rollup-dts"
    ]
  }
}
```

By default, `rollup` builder will use `swc` to transpile the code, and `rollup-dts` builder will use `dts-bundle-generator` to generate `d.ts` files.

If you don't want to write in package.json, you can also write the configuration in the `unbuilder.config.ts` file:

```ts
import { defineConfig } from 'unbuilder'

export default defineConfig([
  'rollup',
  'rollup-dts'
])
```

## Custom configuration

If the basic rollup preset does not meet your requirements, you can customize the configuration in the `unbuilder.config.ts`:

```ts
import { defineConfig } from 'unbuilder'

export default defineConfig([
  {
    builder: 'rollup',
    // rollup config
    rollupOptions: {}
  },
  {
    builder: 'rollup-dts',
    // rollup-dts config
    rollupOptions: {}
  }
])
```

For more information, please refer to the tsdoc comments in the source code.

## Author & License

[Naily Zero](https://github.com/groupguanfang) & MIT
