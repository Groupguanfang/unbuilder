import type { NormalizedOutputOptions as RolldownNormalizedOutputOptions, OutputBundle as RolldownOutputBundle, RolldownPlugin } from 'rolldown'
import type { NormalizedOutputOptions, OutputBundle, Plugin } from 'rollup'
import type { BuilderConfigType } from './types'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import k from 'kleur'

export default function FileInfo(builder: 'rollup'): Plugin
export default function FileInfo(builder: 'rolldown'): RolldownPlugin
export default function FileInfo(builder: BuilderConfigType): RolldownPlugin | Plugin {
  return {
    name: 'unbuilder:file-info',
    async writeBundle(options: NormalizedOutputOptions | RolldownNormalizedOutputOptions, bundle: OutputBundle | RolldownOutputBundle) {
      for (const [fileName] of Object.entries(bundle)) {
        const filePath = path.join(options.dir || path.dirname(options.file), fileName)
        const stats = await fs.stat(filePath)

        // eslint-disable-next-line no-console
        console.log(`${k.bold().cyan(`[${builder}]`)} ${k.bold(fileName)}: ${k.green(`${`${(stats.size / 1024).toFixed(2)}KB`}`)}`)
      }
    },
  }
}
