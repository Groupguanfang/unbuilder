import type { ExportDeclaration, SourceFile } from 'ts-morph'
import type { DtsBuildOptions } from './types'
import fs from 'node:fs'
import path from 'node:path'
import { relativeResolve } from './utils'
import { useVue } from './vue'

export interface EachExportDeclarationsService {
  eachExportDeclarations: (currentSourceFile: SourceFile) => void
  addSourceFileByExportDeclaration: (exportDeclaration: ExportDeclaration) => void
}

export function useEachExportDeclarations(sourceFiles: SourceFile[], options: DtsBuildOptions): EachExportDeclarationsService {
  const vueService = useVue(options)
  const vueCompiler = vueService.getVueCompiler()

  const ctx: EachExportDeclarationsService = {
    addSourceFileByExportDeclaration(exportDeclaration) {
      const currentSourceFile = exportDeclaration.getSourceFile()
      const project = exportDeclaration.getProject()
      const exportedSourceFile = exportDeclaration.getModuleSpecifierSourceFile()
      if (exportedSourceFile && !exportedSourceFile.isInNodeModules()) {
        sourceFiles.push(exportedSourceFile)
        return ctx.eachExportDeclarations(exportedSourceFile)
      }

      // 如果关闭了vue功能，直接结束。
      if (!vueCompiler)
        return

      /// 如果该导入有sourceFile实例，而且位于node_modules中，直接结束。
      if (exportedSourceFile && exportedSourceFile.isInNodeModules())
        return

      /// 处理.vue文件。
      const moduleSpecifier = exportDeclaration.getModuleSpecifierValue()
      if (!moduleSpecifier)
        return
      const filePath = path.resolve(path.dirname(currentSourceFile.getFilePath()), moduleSpecifier)
      if (!filePath.endsWith('.vue'))
        return console.warn(`[bundle-dts-generator] Export module specifier "${moduleSpecifier}" in ${relativeResolve(currentSourceFile.getFilePath())} is not a .vue file, ignored.`)
      if (!fs.existsSync(filePath))
        return console.warn(`[bundle-dts-generator] Export module specifier "${moduleSpecifier}" in ${relativeResolve(currentSourceFile.getFilePath())} does not exist, ignored.`)
      if (!fs.statSync(filePath).isFile())
        return console.warn(`[bundle-dts-generator] Export module specifier "${moduleSpecifier}" in ${relativeResolve(currentSourceFile.getFilePath())} is not a file, ignored.`)

      const rawVueFileContent = fs.readFileSync(filePath, 'utf-8')
      const sfc = vueCompiler.parse(rawVueFileContent)
      // 拿到`script`和`scriptSetup`，然后合并内容，生成新的`.vue.ts`文件。
      const { script, scriptSetup } = sfc.descriptor

      /** 最终合并好的`.vue.ts`文件内容。 */
      let finalScriptContent = ''
      /** 是否是TS文件。 */
      let isTS = false
      if (script) {
        finalScriptContent += script.content
        if (script.lang === 'ts' || script.lang === 'tsx')
          isTS = true
      }
      if (scriptSetup) {
        // scriptSetup需要通过vueCompiler.compileScript编译。
        finalScriptContent += vueCompiler.compileScript(sfc.descriptor, {
          id: 'xxx',
        }).content
        if (scriptSetup.lang === 'ts' || scriptSetup.lang === 'tsx')
          isTS = true
      }

      const vueSourceFile = project.createSourceFile(
        filePath.replace(/\.vue$/, isTS ? '.vue.ts' : '.vue.js'),
        finalScriptContent,
        { overwrite: true },
      )

      sourceFiles.push(vueSourceFile)
    },

    eachExportDeclarations(currentSourceFile) {
      const exportDeclarations = currentSourceFile.getExportDeclarations()
      for (const exportDeclaration of exportDeclarations)
        ctx.addSourceFileByExportDeclaration(exportDeclaration)
    },
  }

  return ctx
}
