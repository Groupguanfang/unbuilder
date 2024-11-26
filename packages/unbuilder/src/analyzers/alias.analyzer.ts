import type { Alias } from '@rollup/plugin-alias'
import type { BuilderConfigType } from '../types'
import path from 'node:path'
import { logWithBuilder } from '../logger'
import { readTsConfigCompilerOptions } from '../utils'

export function RollupAliasAnalyzer(builder: BuilderConfigType): Alias[] {
  const compilerOptions = readTsConfigCompilerOptions()
  const result: Alias[] = []

  for (const [key, value] of Object.entries(compilerOptions.paths)) {
    if (!value[0])
      continue

    const alias = key.replace(/\/\*$/, '')
    const replacement = (value[0] || '').replace(/\/\*$/, '')

    result.push({
      find: `${alias}`,
      replacement: `${path.resolve(replacement)}`,
    })
  }

  logWithBuilder(builder, 'auto determined aliases:', JSON.stringify(result))

  return result
}
