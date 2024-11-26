import type { PackageJson } from 'type-fest'
import type { BuilderConfigType } from '../types'
import fs from 'node:fs'
import path from 'node:path'
import { logWithBuilder } from '../logger'
import { readEntryInfo, readPackageJson } from '../utils'

interface TestExtensionOptions<Ext extends string = string> {
  filePath: string
  exts?: Ext[]
  srcPath?: string
}

/**
 * 判断某个扩展名的文件是否存在
 *
 * @template T
 * @param {TestExtensionOptions<T>} options - 选项
 * @return {Record<T, boolean>}
 */
function testExtension<T extends string = '.ts' | '.js' | '.jsx' | '.tsx'>(options: TestExtensionOptions<T>): Record<T, boolean>
function testExtension({ filePath, exts = ['.ts', '.js', '.jsx', '.tsx'], srcPath = './src' }: TestExtensionOptions): Record<string, boolean> {
  function testExt(currentExtension: string): boolean {
    const pathParsed = path.parse(filePath)
    pathParsed.ext = currentExtension
    pathParsed.base = undefined
    if (srcPath)
      pathParsed.dir = srcPath
    return fs.existsSync(path.resolve(path.format(pathParsed)))
  }

  const result: Record<string, boolean> = {}
  for (const ext of exts) {
    result[ext] = testExt(ext)
  }
  return result
}

export function PackageJsonEntry(srcPath: string = './src', builder: BuilderConfigType): Record<string, string> {
  const packageJson = readPackageJson()
  const entryInfo = readEntryInfo(packageJson)
  const result: Record<string, string> = {}

  // 分析`main`字段
  if (entryInfo.main) {
    const testResult = testExtension({
      filePath: entryInfo.main,
      srcPath,
    })
    for (const ext in testResult) {
      if (!testResult[ext])
        continue
      const parsed = path.parse(entryInfo.main)

      parsed.ext = ext
      parsed.base = undefined
      if (srcPath)
        parsed.dir = srcPath
      result[parsed.name] = path.format(parsed)
    }
  }

  // 分析`exports`字段
  if (entryInfo.exports) {
    function analyzeExportsConditions(conditions: PackageJson.ExportConditions): void {
      for (const [_key, value] of Object.entries(conditions)) {
        if (typeof value === 'string') {
          const testResult = testExtension({
            filePath: value,
            srcPath,
          })
          for (const ext in testResult) {
            if (!testResult[ext])
              continue
            const parsed = path.parse(value)

            parsed.ext = ext
            parsed.base = undefined
            if (srcPath)
              parsed.dir = srcPath
            result[parsed.name] = path.format(parsed)
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

  logWithBuilder(builder, 'auto determined entry:', JSON.stringify(result))

  return result
}
