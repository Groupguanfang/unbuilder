import type { Project, SourceFile } from 'ts-morph'
import type { DtsBuildOptions } from './types'
import fs from 'node:fs'
import path from 'node:path'

export interface EntryService {
  getEntry: (cache?: boolean) => string[]
  getInclude: (cache?: boolean) => string[]
  /** Source files of entry files. */
  sourceFiles: SourceFile[]
  /** Source files of entry files. */
  entrySourceFiles: SourceFile[]
  isEntrySourceFile: (sourceFile: SourceFile) => boolean
}

/** Absolute path of entry files. */
let entry: string[]
/** Absolute path of include files. */
let include: string[]
/** Source files of entry files. */
const sourceFiles: SourceFile[] = []
/** Source files of entry files. */
let entrySourceFiles: SourceFile[] = []
const isInit = false

export function useEntry(options: DtsBuildOptions, project: Project, init: boolean = true): EntryService {
  const ctx: EntryService = {
    getEntry: (cache: boolean = true) => {
      if (cache !== false && entry)
        return entry

      entry = []
      entrySourceFiles = []
      if (!options.entry)
        throw new Error('No d.ts entry provided, please provide entry files.')
      if (!Array.isArray(options.entry))
        throw new Error('Entry must be an array.')

      for (const i in options.entry) {
        if (!fs.existsSync(options.entry[i]))
          throw new Error(`Entry ${i}: ${options.entry[i]} not found.`)
        if (fs.statSync(options.entry[i]).isDirectory())
          throw new Error(`Entry ${i}: ${options.entry[i]} cannot be a directory. If you want to include all files in a directory, please use 'include' option.`)
        entry.push(path.resolve(options.entry[i]))
      }

      // Add entry files to project.
      for (const i in entry) {
        if (!project.getSourceFile(entry[i])) {
          const currentSourceFile = project.addSourceFileAtPath(entry[i])
          sourceFiles.push(currentSourceFile)
          entrySourceFiles.push(currentSourceFile)
        }
      }

      return entry
    },

    getInclude: (cache: boolean = true) => {
      if (cache !== false && include)
        return include

      if (!options.include)
        return []

      if (!Array.isArray(options.include))
        throw new Error('Include must be an array.')

      include = []
      for (const i in options.include) {
        include.push(path.resolve(options.include[i]))
      }

      // Add include files to project.
      for (const i in include) {
        if (!project.getSourceFile(include[i]))
          sourceFiles.push(project.addSourceFileAtPath(include[i]))
      }

      return include
    },

    isEntrySourceFile(sourceFile): boolean {
      const filePath = sourceFile.getFilePath()
      return entrySourceFiles.some(sourceFile => sourceFile.getFilePath() === filePath)
    },

    sourceFiles,
    entrySourceFiles,
  }

  if (init === true && !isInit) {
    ctx.getEntry()
    ctx.getInclude()
  }

  return ctx
}
