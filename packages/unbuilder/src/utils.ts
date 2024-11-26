import type { PackageJson } from 'type-fest'
import type { CompilerOptions } from 'typescript'
import fs from 'node:fs'
import path from 'node:path'
import { get } from 'lodash-es'
import { log } from './logger'

readPackageJson._packageJsonCache = null
export function readPackageJson(): PackageJson {
  if (readPackageJson._packageJsonCache)
    return readPackageJson._packageJsonCache
  if (fs.existsSync(path.resolve('package.json'))) {
    log('Using package.json: package.json')
    readPackageJson._packageJsonCache = JSON.parse(fs.readFileSync(path.resolve('package.json'), 'utf-8'))
    return readPackageJson._packageJsonCache
  }
  else return {}
}

readTsConfigCompilerOptions._tsConfigCompilerOptionsCache = null
export function readTsConfigCompilerOptions(): CompilerOptions {
  if (readTsConfigCompilerOptions._tsConfigCompilerOptionsCache)
    return readTsConfigCompilerOptions._tsConfigCompilerOptionsCache

  const tsconfigPath = path.resolve('tsconfig.json')
  if (fs.existsSync(tsconfigPath)) {
    log('Using tsconfig.json: tsconfig.json')
    readTsConfigCompilerOptions._tsConfigCompilerOptionsCache = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8')).compilerOptions || {}
    return readTsConfigCompilerOptions._tsConfigCompilerOptionsCache
  }
  else return {}
}

export function transformTsConfigPathsToCacheDir(
  paths: CompilerOptions['paths'],
): CompilerOptions['paths'] {
  const result: CompilerOptions['paths'] = {}
  const tsConfigPath = path.resolve('tsconfig.json')

  for (const [key, value] of Object.entries(paths)) {
    // 需要转换为绝对路径
    result[key] = value.map((v) => {
      return path.resolve(path.dirname(tsConfigPath), v)
    })
  }

  return result
}

interface EntryInfoResult {
  main?: PackageJson['main']
  module?: PackageJson['module']
  types?: PackageJson['types']
  exports?: PackageJson['exports']
}

export function readEntryInfo(packageJsonFile: PackageJson): EntryInfoResult {
  return {
    main: get(packageJsonFile, 'main'),
    module: get(packageJsonFile, 'module'),
    types: get(packageJsonFile, 'types'),
    exports: get(packageJsonFile, 'exports'),
  }
}
