import type { CompilerOptions, SourceFile } from 'ts-morph'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import vueCompiler from '@vue/compiler-sfc'
import glob from 'fast-glob'
import { Project } from 'ts-morph'

export interface Options {
  input: string | string[]
  outDir?: string
}

export async function build({ input, outDir }: Options): Promise<SourceFile[]> {
  const tsConfigFilePath = fs.existsSync('tsconfig.json')
    ? 'tsconfig.json'
    : undefined
  const compilerOptions: CompilerOptions = {
    allowJs: true,
    declaration: true,
    emitDeclarationOnly: true,
    noEmitOnError: true,
  }
  if (outDir) {
    compilerOptions.outDir = outDir
  }
  const project = new Project({
    compilerOptions,
    tsConfigFilePath,
    skipAddingFilesFromTsConfig: true,
  })
  const files = await glob(input)

  const sourceFiles: SourceFile[] = []

  await Promise.all(
    files.map(async (file) => {
      const content = await fs.promises.readFile(file, 'utf8')
      if (file.endsWith('.ts')) {
        const sourceFile = project.createSourceFile(
          path.relative(process.cwd(), file),
          content,
          {
            overwrite: true,
          },
        )
        sourceFiles.push(sourceFile)
        return
      }
      const sfc = vueCompiler.parse(content)
      const { script, scriptSetup } = sfc.descriptor
      if (script || scriptSetup) {
        let content = ''
        let isTS = false
        if (script && script.content) {
          content += script.content
          if (script.lang === 'ts' || script.lang === 'tsx')
            isTS = true
        }
        if (scriptSetup) {
          const compiled = vueCompiler.compileScript(sfc.descriptor, {
            id: 'xxx',
          })
          content += compiled.content
          if (scriptSetup.lang === 'ts' || scriptSetup.lang === 'tsx')
            isTS = true
        }
        const sourceFile = project.createSourceFile(
          path.relative(process.cwd(), file) + (isTS ? '.ts' : '.js'),
          content,
        )
        sourceFiles.push(sourceFile)
      }
    }),
  )

  const diagnostics = project.getPreEmitDiagnostics()
  // eslint-disable-next-line no-console
  console.log(project.formatDiagnosticsWithColorAndContext(diagnostics))

  project.emitToMemory()

  // for (const sourceFile of sourceFiles) {
  //   const emitOutput = sourceFile.getEmitOutput()
  //   for (const outputFile of emitOutput.getOutputFiles()) {
  //     const filepath = outputFile.getFilePath()
  //   }
  // }

  return sourceFiles
}
