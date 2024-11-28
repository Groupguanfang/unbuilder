import type ts from 'typescript'
import type { DtsBuildOptions } from './types'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { Project } from 'ts-morph'
import { useDefaultCompilerOptions } from './compiler-options'
import { useEmitPreBundleDts } from './emit-cache'
import { useEntry } from './entry'
import { useEachImportDeclarations } from './import-declaration'
import { useRollup } from './rollup'

async function removeCacheDir(project: Project): Promise<void> {
  const cacheOutDir = project.getCompilerOptions().outDir
  if (cacheOutDir && fs.existsSync(cacheOutDir))
    fs.rmdirSync(cacheOutDir, { recursive: true })
}

export async function build(options: DtsBuildOptions = {}): Promise<void> {
  // 运行插件的`config`方法, 让插件可以修改`options`参数
  for (const plugin of options.plugins || [])
    if (plugin.config)
      await plugin.config(options)

  const { defaultCompilerOptions } = useDefaultCompilerOptions(options)

  const project = new Project({
    compilerOptions: {
      ...defaultCompilerOptions,
      ...(options.compilerOptions || {}),
      outDir: options.cacheDir
        ? options.cacheDir
        : options.outDir
          ? path.resolve(options.outDir, './.cache')
          : path.resolve('./dist/.cache'),
    },
  })

  // 清理缓存文件夹
  await removeCacheDir(project)

  // 分析入口文件和`include`文件
  const entryService = useEntry(options, project, true)

  // 收集所有导入声明依赖的文件，遇到`.vue`文件会自动添加`.vue.ts`结尾的文件
  const eachImportDeclarationService = useEachImportDeclarations(
    entryService.sourceFiles,
    options,
  )
  // 遍历所有导入声明
  entryService.sourceFiles.forEach(eachImportDeclarationService.eachImportDeclarations)

  // 分析动态导入的文件，和上面的静态导入声明一样，遇到`.vue`文件会自动添加`.vue.ts`结尾的文件
  entryService.sourceFiles.forEach(eachImportDeclarationService.eachDynamicImportDeclarations)

  // 生成`.d.ts`文件
  const emitCacheService = useEmitPreBundleDts(project, entryService)
  const emittedEntryFilePath = await emitCacheService.emit(options)

  // 使用`rollup`打包`.d.ts`文件
  useRollup(emittedEntryFilePath, project.getCompilerOptions() as ts.CompilerOptions).run(options)

  // 工作结束，清理缓存文件夹
  process.on('exit', async () => {
    if (options.removeCacheDirOnExit !== false)
      await removeCacheDir(project)
  })
}
