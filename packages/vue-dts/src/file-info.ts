import type { Color } from 'kleur'
import type { Plugin } from 'rollup'
import fs from 'node:fs/promises'
import path from 'node:path'
import k from 'kleur'

export async function fileInfoLog(filename: string, filePath: string, color: Color = k.bold().cyan): Promise<void> {
  const fileSize = await fs.stat(filePath).then(stats => `${`${(stats.size / 1024).toFixed(2)}KB`}`)
  // eslint-disable-next-line no-console
  console.log(`${color(`[bundle-dts-generator]`)} ${k.bold(filename)}: ${k.green(fileSize)}`)
}

export default function FileInfo(): Plugin {
  return {
    name: 'unbuilder:file-info',
    async writeBundle(options, bundle) {
      for (const [fileName] of Object.entries(bundle)) {
        const filePath = path.join(options.dir || path.dirname(options.file), fileName)
        const stats = await fs.stat(filePath)

        // eslint-disable-next-line no-console
        console.log(`${k.bold().cyan(`[bundle-dts-generator]`)} ${k.bold(fileName)}: ${k.green(`${`${(stats.size / 1024).toFixed(2)}KB`}`)}`)
      }
    },
  }
}
