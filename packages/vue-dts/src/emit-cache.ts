import type { Project } from 'ts-morph'
import type { EntryService } from './entry'
import type { DtsBuildOptions } from './types'
import fs from 'node:fs'
import path from 'node:path'
import k from 'kleur'
import { fileInfoLog } from './file-info'

export interface EmitPreBundleDtsService {
  emit: (options: DtsBuildOptions) => Promise<string[]>
}

export function useEmitPreBundleDts(project: Project, entryService: EntryService): EmitPreBundleDtsService {
  return {
    async emit(_options: DtsBuildOptions) {
      project.emitToMemory()
      const projectSourceFiles = project.getSourceFiles()
      const entryOutputFilePaths: string[] = []

      // 用双层 Promise.all 并发处理所有文件而非for循环，提高性能
      await Promise.all(projectSourceFiles.map(async (projectSourceFile) => {
        const outputFiles = projectSourceFile.getEmitOutput().getOutputFiles()

        await Promise.all(outputFiles.map(async (outputFile) => {
          const originalFilepath = outputFile.getFilePath()
          const replacedFilePath = originalFilepath.replace(/\.d\.ts$/, '.ts') as ReturnType<typeof outputFile.getFilePath>
          if (originalFilepath.endsWith('.d.ts') && entryService.isEntrySourceFile(projectSourceFile))
            entryOutputFilePaths.push(replacedFilePath)
          await fs.promises.mkdir(path.dirname(replacedFilePath), { recursive: true })
          await fs.promises.writeFile(replacedFilePath, outputFile.getText(), 'utf-8')
          await fileInfoLog(`cache file: ${path.basename(replacedFilePath)}`, replacedFilePath, k.bold().blue)
        }))
      }))

      return entryOutputFilePaths
    },
  }
}
