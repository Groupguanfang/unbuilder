import type { Node, SourceFile } from 'ts-morph'
import path from 'node:path'
import { cwd } from 'node:process'

export function relativeResolve(currentPath: string): string {
  if (path.isAbsolute(currentPath))
    return path.relative(cwd(), currentPath)
  else
    return currentPath
}

export function getSourceFileFromImport(absoluteImportPath: string, baseDir: string, moduleSpecifier: Node): SourceFile | null {
  const project = moduleSpecifier.getProject()

  // 解析绝对路径
  const absolutePath = path.resolve(baseDir, absoluteImportPath)

  // 添加文件到项目，考虑常见扩展名
  const extensions = ['.ts', '.tsx', '.js', '.jsx']
  for (const ext of extensions) {
    const fullPath = absolutePath + ext
    try {
      const sourceFile = project.addSourceFileAtPath(fullPath)
      return sourceFile
    }
    // eslint-disable-next-line unused-imports/no-unused-vars
    catch (e) {
      // 文件不存在或无法加载，继续尝试下一个扩展名
      continue
    }
  }
  return null
}
