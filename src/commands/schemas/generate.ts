import * as path from 'path'
import * as fs from 'fs'
import {flags} from '@oclif/command'
import {createGenerator, Schema} from 'ts-json-schema-generator'
import {SnapshotCommand} from '../../snapshot-command'

export default class SchemaGenerate extends SnapshotCommand {
    public static flags = {
      directory: flags.string({
        description: 'directory to save the generated schema files; can use "{version}" to insert the current CLI/plugin version',
        default: './schemas/{version}',
      }),
      singlefile: flags.boolean({
        description: 'put generated schema into a single file',
        default: false,
      }),
    };

    private classToId: Record<string, string> = {}

    public async run() {
      const {flags} = this.parse(SchemaGenerate)

      for (const cmd of this.commands) {
        // eslint-disable-next-line no-await-in-loop
        const loadedCmd = await cmd.load() // commands are loaded async in oclif/core
        this.classToId[loadedCmd.name] = loadedCmd.id
      }

      const schemas: Record<string, Schema> = {}

      for (const file of this.getAllCmdFiles()) {
        const {returnType, commandId} = this.parseFile(file)
        const config = {
          path: file,
          type: returnType,
          skipTypeCheck: true,
        }
        const schema = createGenerator(config).createSchema(config.type)
        schemas[commandId] = schema
      }

      const directory = flags.directory.replace('{version}', this.config.version)
      fs.mkdirSync(directory, {recursive: true})

      if (flags.singlefile) {
        const filePath = path.join(directory, 'schema.json')
        fs.writeFileSync(filePath, JSON.stringify(schemas, null, 2))
        this.log(`Generated JSON schema file "${filePath}"`)
      } else {
        for (const [cmdId, schema] of Object.entries(schemas)) {
          const fileName = cmdId.replace(/:/g, '-')
          const filePath = path.join(directory, `${fileName}.json`)
          fs.writeFileSync(filePath, JSON.stringify(schema, null, 2))
          this.log(`Generated JSON schema file "${filePath}"`)
        }
      }
    }

    private getAllCmdFiles(dirPath: string = path.join(this.config.root, 'src', 'commands'), allFiles: string[] = []) {
      const files = fs.readdirSync(dirPath)

      files.forEach(file => {
        const fPath = path.join(dirPath, file)
        if (fs.statSync(fPath).isDirectory()) {
          allFiles = this.getAllCmdFiles(fPath, allFiles)
        } else if (file.endsWith('ts')) {
          allFiles.push(fPath)
        }
      })

      return allFiles
    }

    private parseFile(file: string): { returnType: string; commandId: string } {
      const returnTypeRegex = /(?<=async\srun\(\):\sPromise<)(.*?)(?=>)/g
      const contents = fs.readFileSync(file, 'utf8')
      const [returnType] = returnTypeRegex.exec(contents) as string[]
      const commandId = this.determineCommandId(contents)
      if (!commandId) {
        throw new Error(`No commandId found for file ${file}`)
      }

      return {returnType, commandId}
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
