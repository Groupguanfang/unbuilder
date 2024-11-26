import type { ModuleFormat, OutputOptions } from 'rollup'
import type { PackageJson } from 'type-fest'
import type { BuilderConfigType } from '../types'
import path from 'node:path'
import { logWithBuilder } from '../logger'
import { readEntryInfo, readPackageJson } from '../utils'

function buildOutputOptions(mixed: OutputOptions): OutputOptions {
  function getFormatExtension(format: ModuleFormat): 'cjs' | 'mjs' {
    switch (format) {
      case 'cjs':
        return 'cjs'
      case 'esm':
        return 'mjs'
      case 'commonjs':
        return 'cjs'
      case 'es':
        return 'mjs'
      case 'module':
        return 'mjs'
    }
  }

  return {
    entryFileNames: `[name].${getFormatExtension(mixed.format)}`,
    assetFileNames: `[name].[extname]`,
    chunkFileNames: `[name]-[hash].${getFormatExtension(mixed.format)}`,
    sourcemap: true,
    ...mixed,
  }
}

export function OutputAnalyzer(baseOptions: OutputOptions = {}, builder: BuilderConfigType): OutputOptions[] {
  const packageJson = readPackageJson()
  const entryInfo = readEntryInfo(packageJson)
  const result: OutputOptions[] = []

  // 分析`main`字段
  if (entryInfo.main) {
    const parsed = path.parse(entryInfo.main)
    if (!result.find(item => item.dir === parsed.dir && item.format === 'cjs'))
      result.push(buildOutputOptions({
        ...baseOptions,
        dir: parsed.dir,
        format: 'cjs',
      }))
  }

  // 分析`module`字段
  if (entryInfo.module) {
    const parsed = path.parse(entryInfo.module)
    if (!result.find(item => item.dir === parsed.dir && item.format === 'esm'))
      result.push(buildOutputOptions({
        ...baseOptions,
        dir: parsed.dir,
        format: 'esm',
      }))
  }

  // 分析`exports`字段
  if (entryInfo.exports) {
    function analyzeExportsConditions(conditions: PackageJson.ExportConditions): void {
      for (const [key, value] of Object.entries(conditions)) {
        if (typeof value === 'string') {
          if (key === 'import') {
            const parsed = path.parse(value)
            if (!result.find(item => item.dir === parsed.dir && item.format === 'esm'))
              result.push(buildOutputOptions({
                ...baseOptions,
                dir: parsed.dir,
                format: 'esm',
              }))
          }
          else if (key === 'require') {
            const parsed = path.parse(value)
            if (!result.find(item => item.dir === parsed.dir && item.format === 'cjs'))
              result.push(buildOutputOptions({
                ...baseOptions,
                dir: parsed.dir,
                format: 'cjs',
              }))
          }
        }
        else if (Array.isArray(value)) {
          for (const item of value) {
            if (typeof item !== 'string')
              analyzeExportsConditions(item)
          }
        }
        else if (typeof value === 'object') {
          analyzeExportsConditions(value)
        }
      }
    }

    if (Array.isArray(entryInfo.exports)) {
      for (const item of entryInfo.exports) {
        if (typeof item !== 'string')
          analyzeExportsConditions(item)
      }
    }
    else if (typeof entryInfo.exports === 'object') {
      analyzeExportsConditions(entryInfo.exports)
    }
  }

  logWithBuilder(builder, 'auto determined output:', JSON.stringify(result.map(item => ({
    dir: item.dir,
    format: item.format,
  }))))

  return result
}
