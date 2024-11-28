import type { CallExpression, ImportDeclaration, SourceFile } from 'ts-morph'
import type { DtsBuildOptions } from './types'
import fs from 'node:fs'
import path from 'node:path'
import { SyntaxKind } from 'ts-morph'
import { getSourceFileFromImport, relativeResolve } from './utils'
import { useVue } from './vue'

export interface EachImportDeclarationsService {
  addSourceFileByImportDeclaration: (importDeclaration: ImportDeclaration) => void
  addSourceFileByDynamicImport: (callExpression: CallExpression) => void
  eachDynamicImportDeclarations: (currentSourceFile: SourceFile) => void
  eachImportDeclarations: (currentSourceFile: SourceFile) => void
}

export function useEachImportDeclarations(sourceFiles: SourceFile[], options: DtsBuildOptions): EachImportDeclarationsService {
  const vueService = useVue(options)
  const vueCompiler = vueService.getVueCompiler()

  const ctx: EachImportDeclarationsService = {
    eachImportDeclarations(currentSourceFile): void {
      const importDeclarations = currentSourceFile.getImportDeclarations()
      for (const importDeclaration of importDeclarations)
        ctx.addSourceFileByImportDeclaration(importDeclaration)
    },

    eachDynamicImportDeclarations(currentSourceFile): void {
      const callExpressions = currentSourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)
      for (const callExpression of callExpressions) {
        const expression = callExpression.getExpression()
        if (!expression || expression.getText() !== 'import')
          continue

        ctx.addSourceFileByDynamicImport(callExpression)
      }
    },

    addSourceFileByDynamicImport(callExpression: CallExpression): void {
      const currentSourceFile = callExpression.getSourceFile()
      const moduleSpecifier = callExpression.getArguments()[0]
      if (!moduleSpecifier)
        return
      const moduleSpecifierValue = moduleSpecifier.getText().replace(/['"`]/g, '')
      const absoluteImportPath = path.resolve(path.dirname(currentSourceFile.getFilePath()), moduleSpecifierValue)
      const importedSourceFile = getSourceFileFromImport(
        absoluteImportPath,
        path.dirname(currentSourceFile.getFilePath()),
        moduleSpecifier,
      )
      if (!importedSourceFile)
        return console.warn(`[bundle-dts-generator] Dynamic import "${moduleSpecifierValue}" in ${relativeResolve(currentSourceFile.getFilePath())} does not exist, ignored. \nIf the generator throw an error, please make sure this dynamic import file are included in the 'DtsBuildOptions.include' field.`)

      sourceFiles.push(importedSourceFile)
    },

    addSourceFileByImportDeclaration(importDeclaration): void {
      const currentSourceFile = importDeclaration.getSourceFile()
      const project = importDeclaration.getProject()
      const importedSourceFile = importDeclaration.getModuleSpecifierSourceFile()
      // 如果能拿得到sourceFile文件，说明是正常文件，加入到sourceFiles，然后继续递归查找导入的文件。
      if (importedSourceFile && !importedSourceFile.isInNodeModules() && !importedSourceFile.isFromExternalLibrary()) {
        sourceFiles.push(importedSourceFile)
        return ctx.eachImportDeclarations(importedSourceFile)
      }

      if (!vueCompiler)
        return

      /// 处理.vue文件。
      const moduleSpecifier = importDeclaration.getModuleSpecifierValue()
      const filePath = path.resolve(path.dirname(currentSourceFile.getFilePath()), moduleSpecifier)
      if (!filePath.endsWith('.vue'))
        return console.warn(`[bundle-dts-generator] Module specifier "${moduleSpecifier}" in ${relativeResolve(currentSourceFile.getFilePath())} is not a .vue file, ignored.`)
      if (!fs.existsSync(filePath))
        return console.warn(`[bundle-dts-generator] Module specifier "${moduleSpecifier}" in ${relativeResolve(currentSourceFile.getFilePath())} does not exist, ignored.`)
      if (!fs.statSync(filePath).isFile())
        return console.warn(`[bundle-dts-generator] Module specifier "${moduleSpecifier}" in ${relativeResolve(currentSourceFile.getFilePath())} is not a file, ignored.`)

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
  }

  return ctx
}
