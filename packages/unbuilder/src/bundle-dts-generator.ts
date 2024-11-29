import type { BundleDtsGeneratorBuilderConfig } from './types'
import { build } from 'bundle-dts-generator'
import { PackageJsonEntry } from './analyzers'

export async function buildDtsWithBundleDtsGenerator(config: BundleDtsGeneratorBuilderConfig): Promise<void> {
  const options = config.buildOptions || {}

  // 装载入口分析器
  const analyzedEntry = PackageJsonEntry(
    typeof config.entryExtractor === 'string' ? config.entryExtractor : './src',
    config.builder,
  )
  if (!options.entry)
    options.entry = Object.values(analyzedEntry)

  return await build(options)
}
