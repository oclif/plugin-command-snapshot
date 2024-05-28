import {Flags, ux} from '@oclif/core'
import chalk from 'chalk'
import {globbySync} from 'globby'
import fs from 'node:fs'
import path from 'node:path'
import {Schema, createGenerator} from 'ts-json-schema-generator'

import SnapshotCommand from '../../snapshot-command.js'
import {GLOB_PATTERNS, getAllFiles, getSchemaFileName} from '../../util.js'

export type SchemasMap = {
  [key: string]: Schema
}

export type Schemas = {commands: SchemasMap; hooks: SchemasMap}

export type GenerateResponse = string[]

type SchemaGenerateOptions = {
  base: SnapshotCommand
  commandGlobs?: string[]
  commandsDir?: string
  ignoreVoid?: boolean
}

export class SchemaGenerator {
  private base: SnapshotCommand
  private classToId: Record<string, string> = {}
  private commandGlobs: string[]
  private commandsDir: string | undefined
  private ignoreVoid: boolean

  constructor(options: SchemaGenerateOptions) {
    this.base = options.base
    this.ignoreVoid = options.ignoreVoid ?? true
    this.commandsDir = options.commandsDir
    this.commandGlobs = options.commandGlobs ?? GLOB_PATTERNS
  }

  public async generate(): Promise<Schemas> {
    for (const cmd of this.base.commands) {
      // eslint-disable-next-line no-await-in-loop
      const loadedCmd = await cmd.load() // commands are loaded async in oclif/core
      this.classToId[loadedCmd.name] = loadedCmd.id
    }

    const cmdSchemas: SchemasMap = {}

    for (const file of this.getAllCmdFiles()) {
      const {commandId, returnType} = this.parseCmdFile(file)
      if (this.ignoreVoid && returnType === 'void') continue
      cmdSchemas[commandId] = this.generateSchema(returnType, file)
    }

    const hookSchemas: SchemasMap = {}
    for (const file of this.getAllHookFiles()) {
      const {hookId, returnType} = this.parseHookFile(file)
      if (returnType && hookId) {
        hookSchemas[hookId] = this.generateSchema(returnType, file)
      }
    }

    return {commands: cmdSchemas, hooks: hookSchemas}
  }

  private determineCommandId(contents: string): string | undefined {
    for (const [className, cmdId] of Object.entries(this.classToId)) {
      const regex = new RegExp(` class ${className} `, 'g')
      if (regex.test(contents)) {
        return cmdId
      }
    }
  }

  private generateSchema(returnType: string, file: string): Schema {
    try {
      const config = {
        path: file,
        skipTypeCheck: true,
        type: returnType,
      }
      return createGenerator(config).createSchema(config.type)
    } catch (error: unknown) {
      if (error instanceof Error) {
        const error_ = error.message.toLowerCase().includes('no root type')
          ? new Error(
              `Schema generator could not find the ${chalk.red(returnType)} type. Please make sure that ${chalk.red(
                returnType,
              )} is exported.`,
            )
          : error
        throw error_
      }

      throw error
    }
  }

  private getAllCmdFiles(): string[] {
    const {outDir, rootDir} = this.getDirs()
    if (this.commandsDir) {
      const commandsSrcDir = path.resolve(this.base.config.root, this.commandsDir).replace(outDir, rootDir)
      return globbySync(this.commandGlobs, {absolute: true, cwd: commandsSrcDir})
    }

    return getAllFiles(path.join(rootDir, 'commands'), '.ts')
  }

  private getAllHookFiles(): string[] {
    const hookFiles = Object.values(this.base.config.pjson.oclif?.hooks ?? {})
      .flatMap((hook) => {
        if (Array.isArray(hook)) {
          return hook.map((h) => {
            if (typeof h === 'string') return h
            ux.warn(`Identifier/target based hooks are not supported: ${h}`)
            return null
          })
        }

        if (typeof hook === 'string') {
          return hook
        }

        ux.warn(`Identifier/target based hooks are not supported: ${hook}`)
        return null
      })
      .filter((h): h is string => typeof h === 'string')

    const {outDir, rootDir} = this.getDirs()
    return hookFiles.map((h) => `${path.resolve(h)}.ts`.replace(outDir, rootDir))
  }

  private getDirs(): {outDir: string; rootDir: string} {
    const dirs = {
      outDir: path.join(this.base.config.root, 'lib'),
      rootDir: path.join(this.base.config.root, 'src'),
    }
    try {
      const tsConfig = JSON.parse(fs.readFileSync(path.join(this.base.config.root, 'tsconfig.json'), 'utf8'))
      if (tsConfig.compilerOptions.rootDir) {
        dirs.rootDir = path.join(this.base.config.root, tsConfig.compilerOptions.rootDir)
      }

      if (tsConfig.compilerOptions.outDir) {
        dirs.outDir = path.join(this.base.config.root, tsConfig.compilerOptions.outDir)
      }

      return dirs
    } catch {}

    return dirs
  }

  /**
   * Use regex to find the typescript type being returned by the command's
   * `run` method.
   * @param file the file to parse
   * @returns Returns the name of the return type and the command id.
   */
  private parseCmdFile(file: string): {commandId: string; returnType: string} {
    const returnTypeRegex = /(?<=async\srun\(\):\sPromise<)(.*?)(>*)(?=>)/g
    const contents = fs.readFileSync(file, 'utf8')
    const [returnType] = (returnTypeRegex.exec(contents) as string[]) || []
    if (!returnType) {
      throw new Error(`No return type found for file ${file}`)
    }

    const commandId = this.determineCommandId(contents)
    if (!commandId) {
      throw new Error(`No commandId found for file ${file}`)
    }

    this.validateReturnType(returnType, commandId)
    return {commandId, returnType}
  }

  /**
   * Use regex to find the typescript type being returned by the hook
   * @param file the file to parse
   * @returns Returns the name of the return type and the hook id.
   */
  private parseHookFile(file: string): {hookId: null | string; returnType: null | string} {
    const returnTypeRegex = /(?<=const\shook:\s(.*?)<)[^'](.*?)[^'](>*)(?=>)/g
    const contents = fs.readFileSync(file, 'utf8')
    const [returnType] = (returnTypeRegex.exec(contents) as string[]) || []
    if (!returnType || returnType === 'void') {
      return {hookId: null, returnType: null}
    }

    const hooks = this.base.config.pjson.oclif?.hooks ?? {}
    const hookId = Object.keys(hooks).find((key) => {
      const hookFiles = (Array.isArray(hooks[key]) ? hooks[key] : [hooks[key]]) as string[]
      const hookFileNames = hookFiles.map((f) => path.basename(f).split('.')[0])
      const currentFileName = path.basename(file).split('.')[0]
      return hookFileNames.includes(currentFileName)
    })
    if (!hookId) {
      return {hookId: null, returnType: null}
    }

    this.validateReturnType(returnType, hookId)
    return {hookId, returnType}
  }

  private validateReturnType(returnType: string, commandId: string) {
    const notAllowed = this.ignoreVoid ? ['any', 'unknown'] : ['any', 'unknown', 'void']
    const vagueTypes = ['JsonMap', 'JsonCollection', 'AnyJson']
    if (notAllowed.includes(returnType)) {
      throw new Error(`${returnType} (from ${commandId}) is not allowed. Please use a more specific type.`)
    } else if (vagueTypes.includes(returnType)) {
      throw new Error(`${returnType} (from ${commandId}) is too vague. Please use a more specific type.`)
    }
  }
}

export default class SchemaGenerate extends SnapshotCommand {
  public static flags = {
    filepath: Flags.string({
      default: './schemas',
      description:
        'directory to save the generated schema files; can use "{version}" to insert the current CLI/plugin version',
    }),
    ignorevoid: Flags.boolean({
      default: true,
      description: 'ignore commands that return void',
    }),
    singlefile: Flags.boolean({
      default: false,
      description: 'put generated schema into a single file',
    }),
  }

  public async run(): Promise<GenerateResponse> {
    const strategy =
      typeof this.config.pjson.oclif?.commands === 'string' ? 'pattern' : this.config.pjson.oclif?.commands?.strategy
    const commandsDir =
      typeof this.config.pjson.oclif?.commands === 'string'
        ? this.config.pjson.oclif?.commands
        : this.config.pjson.oclif?.commands?.target
    const commandGlobs =
      typeof this.config.pjson.oclif?.commands === 'string'
        ? GLOB_PATTERNS
        : this.config.pjson.oclif?.commands?.globPatterns

    if (strategy === 'single') {
      this.error('This command is not supported for single command CLIs')
    }

    if (strategy === 'explicit') {
      this.error('This command is not supported for explicit command discovery')
    }

    const {flags} = await this.parse(SchemaGenerate)
    const generator = new SchemaGenerator({base: this, commandGlobs, commandsDir, ignoreVoid: flags.ignorevoid})

    const schemas = await generator.generate()

    const directory = flags.filepath.replace('{version}', this.config.version)
    fs.mkdirSync(directory, {recursive: true})

    const files: string[] = []
    if (flags.singlefile) {
      const filePath = path.join(directory, 'schema.json')
      this.write(filePath, JSON.stringify(schemas, null, 2))
      this.log(`Generated JSON schema file "${filePath}"`)
      files.push(filePath)
    } else {
      for (const [cmdId, schema] of Object.entries(schemas.commands)) {
        const fileName = getSchemaFileName(cmdId)
        const filePath = path.join(directory, fileName)
        this.write(filePath, JSON.stringify(schema, null, 2))
        this.log(`Generated JSON schema file "${filePath}"`)
        files.push(filePath)
      }

      if (Object.values(schemas.hooks).length > 0) {
        const hooksDir = path.join(directory, 'hooks')
        fs.mkdirSync(hooksDir, {recursive: true})
        for (const [hookId, schema] of Object.entries(schemas.hooks)) {
          const fileName = getSchemaFileName(hookId)
          const filePath = path.join(hooksDir, fileName)
          this.write(filePath, JSON.stringify(schema, null, 2))
          this.log(`Generated JSON schema file "${filePath}"`)
          files.push(filePath)
        }
      }
    }

    return files
  }
}
