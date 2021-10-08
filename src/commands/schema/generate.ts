import * as path from 'path'
import * as fs from 'fs'
import {Flags} from '@oclif/core'
import {createGenerator, Schema} from 'ts-json-schema-generator'
import {SnapshotCommand} from '../../snapshot-command'
import {red} from 'chalk'

export type SchemasMap = {
  [key: string]: Schema;
}

export type Schemas = { commands: SchemasMap; hooks: SchemasMap}

export type GenerateResponse = string[];

export function getAllFiles(dirPath: string, ext: string, allFiles: string[] = []): string[] {
  let files: string[] = []
  try {
    files = fs.readdirSync(dirPath)
  } catch {}
  files.forEach(file => {
    const fPath = path.join(dirPath, file)
    if (fs.statSync(fPath).isDirectory()) {
      allFiles = getAllFiles(fPath, ext, allFiles)
    } else if (file.endsWith(ext)) {
      allFiles.push(fPath)
    }
  })

  return allFiles
}

export class SchemaGenerator {
  private classToId: Record<string, string> = {}

  constructor(private base: SnapshotCommand, private ignorevoid = true) {}

  public async generate(): Promise<Schemas> {
    for (const cmd of this.base.commands) {
      // eslint-disable-next-line no-await-in-loop
      const loadedCmd = await cmd.load() // commands are loaded async in oclif/core
      this.classToId[loadedCmd.name] = loadedCmd.id
    }

    const cmdSchemas: SchemasMap = {}

    for (const file of this.getAllCmdFiles()) {
      const {returnType, commandId} = this.parseCmdFile(file)
      if (this.ignorevoid && returnType === 'void') continue
      try {
        const config = {
          path: file,
          type: returnType,
          skipTypeCheck: true,
        }
        const schema = createGenerator(config).createSchema(config.type)
        cmdSchemas[commandId] = schema
      } catch (error: any) {
        if (error.message.toLowerCase().includes('no root type')) {
          throw new Error(`Schema generator could not find the ${red(returnType)} type. Please make sure that ${red(returnType)} is exported.`)
        } else {
          throw error
        }
      }
    }

    const hookSchemas: SchemasMap = {}
    for (const file of this.getAllHookFiles()) {
      const {returnType, hookId} = this.parseHookFile(file)
      if (returnType && hookId) {
        try {
          const config = {
            path: file,
            type: returnType,
            skipTypeCheck: true,
          }
          const schema = createGenerator(config).createSchema(config.type)
          hookSchemas[hookId] = schema
        } catch (error: any) {
          if (error.message.toLowerCase().includes('no root type')) {
            throw new Error(`Schema generator could not find the ${red(returnType)} type. Please make sure that ${red(returnType)} is exported.`)
          } else {
            throw error
          }
        }
      }
    }

    return {commands: cmdSchemas, hooks: hookSchemas}
  }

  private getAllCmdFiles(): string[] {
    return getAllFiles(path.join(this.base.config.root, 'src', 'commands'), '.ts')
  }

  private getAllHookFiles(): string[] {
    return getAllFiles(path.join(this.base.config.root, 'src', 'hooks'), '.ts')
  }

  private parseCmdFile(file: string): { returnType: string; commandId: string } {
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
    return {returnType, commandId}
  }

  private parseHookFile(file: string): { returnType: string | null; hookId: string | null } {
    const returnTypeRegex = /(?<=const\shook:\s(.*?)<)(.*?)(>*)(?=>)/g
    const contents = fs.readFileSync(file, 'utf8')
    const [returnType] = (returnTypeRegex.exec(contents) as string[]) || []
    if (!returnType) {
      return {returnType: null, hookId: null}
    }
    const hooks = this.base.config.pjson.oclif?.hooks ?? {}
    const hookId = Object.keys(hooks).find(key => {
      const hookFiles = (Array.isArray(hooks[key]) ? hooks[key] : [hooks[key]])as string[]
      const hookFileNames = hookFiles.map(f => path.basename(f).split('.')[0])
      const currentFileName = path.basename(file).split('.')[0]
      return hookFileNames.includes(currentFileName)
    })
    if (!hookId) {
      return {returnType: null, hookId: null}
    }

    this.validateReturnType(returnType, hookId)
    return {returnType, hookId}
  }

  private validateReturnType(returnType: string, commandId: string) {
    const notAllowed = this.ignorevoid ? ['any', 'unknown'] : ['any', 'unknown', 'void']
    const vaugeTypes = ['JsonMap', 'JsonCollection', 'AnyJson']
    if (notAllowed.includes(returnType)) {
      throw new Error(`${returnType} (from ${commandId}) is not allowed. Please use a more specific type.`)
    } else if (vaugeTypes.includes(returnType)) {
      throw new Error(`${returnType} (from ${commandId}) is too vauge. Please use a more specific type.`)
    }
  }

  private determineCommandId(contents: string): string | undefined {
    for (const [className, cmdId] of Object.entries(this.classToId)) {
      const regex = new RegExp(` class ${className} `, 'g')
      if (regex.test(contents)) {
        return cmdId
      }
    }
  }
}

export default class SchemaGenerate extends SnapshotCommand {
    public static flags = {
      filepath: Flags.string({
        description: 'directory to save the generated schema files; can use "{version}" to insert the current CLI/plugin version',
        default: './schemas',
      }),
      singlefile: Flags.boolean({
        description: 'put generated schema into a single file',
        default: false,
      }),
      ignorevoid: Flags.boolean({
        description: 'ignore commands that return void',
        default: true,
      }),
    };

    public async run(): Promise<GenerateResponse> {
      const {flags} = await this.parse(SchemaGenerate)
      const generator = new SchemaGenerator(this, flags.ignorevoid)

      const schemas = await generator.generate()

      const directory = flags.filepath.replace('{version}', this.config.version)
      fs.mkdirSync(directory, {recursive: true})

      const files: string[] = []
      if (flags.singlefile) {
        const filePath = path.join(directory, 'schema.json')
        fs.writeFileSync(filePath, JSON.stringify(schemas, null, 2))
        this.log(`Generated JSON schema file "${filePath}"`)
        files.push(filePath)
      } else {
        for (const [cmdId, schema] of Object.entries(schemas.commands)) {
          const fileName = `${cmdId.replace(/:/g, '-')}.json`
          const filePath = path.join(directory, fileName)
          fs.writeFileSync(filePath, JSON.stringify(schema, null, 2))
          this.log(`Generated JSON schema file "${filePath}"`)
          files.push(filePath)
        }

        if (Object.values(schemas.hooks).length > 0) {
          const hooksDir = path.join(directory, 'hooks')
          fs.mkdirSync(hooksDir, {recursive: true})
          for (const [hookId, schema] of Object.entries(schemas.hooks)) {
            const fileName = `${hookId.replace(/:/g, '-')}.json`
            const filePath = path.join(hooksDir, fileName)
            fs.writeFileSync(filePath, JSON.stringify(schema, null, 2))
            this.log(`Generated JSON schema file "${filePath}"`)
            files.push(filePath)
          }
        }
      }
      return files
    }
}
