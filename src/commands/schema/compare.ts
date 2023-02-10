import * as path from 'path'
import * as fs from 'fs'
import * as semver from 'semver'
import {get} from 'lodash'
import {diff, Operation} from 'just-diff'
import {Flags, toConfiguredId} from '@oclif/core'
import {Schema} from 'ts-json-schema-generator'
import {SnapshotCommand} from '../../snapshot-command'
import {getAllFiles, SchemaGenerator, Schemas} from './generate'
import {bold, cyan, red, underline} from 'chalk'
import {getKeyNameFromFilename} from '../../util'

export type SchemaComparison = Array<{ op: Operation; path: (string | number)[]; value: any }>

function isNumber(n: string | number): boolean {
  return Number.isInteger(Number(n))
}

function isMeaningless(n: string | number): boolean {
  const meaninglessKeys: Array<string | number> = ['$comment', '__computed']
  return meaninglessKeys.includes(n)
}

export default class SchemaCompare extends SnapshotCommand {
  public static flags = {
    filepath: Flags.string({
      description: 'path of the generated snapshot file',
      default: './schemas',
    }),
  };

  public async run(): Promise<SchemaComparison> {
    const {flags} = await this.parse(SchemaCompare)

    try {
      fs.accessSync(flags.filepath)
    } catch {
      this.log(`${flags.filepath} not found.`)
      return []
    }

    const existingSchema = this.readExistingSchema(flags.filepath)
    const latestSchema = (await this.generateLatestSchema())
    this.debug('existingSchema', existingSchema)
    this.debug('latestSchema', latestSchema)
    const changes = diff(latestSchema, existingSchema)

    const humanReadableChanges: Record<string, string[]> = {}
    for (const change of changes) {
      const lastPathElement = change.path[change.path.length - 1]
      if (isMeaningless(lastPathElement)) continue

      const objPath = change.path.join('.')
      const existing = get(existingSchema, objPath)
      const latest = get(latestSchema, objPath)
      const [commandId] = objPath.split('.definitions')
      const readablePath = objPath.replace(`${commandId}.`, '')

      if (!humanReadableChanges[commandId]) {
        humanReadableChanges[commandId] = []
      }

      const lastElementIsNum = isNumber(lastPathElement)
      const basePath = lastElementIsNum ? readablePath.replace(`.${lastPathElement}`, '') : readablePath

      switch (change.op) {
      case 'replace':
        humanReadableChanges[commandId].push(`${underline(readablePath)} was changed from ${cyan(existing)} to ${cyan(latest)}`)
        break
      case 'add':
        humanReadableChanges[commandId].push(
          lastElementIsNum ?
            `Array item at ${underline(basePath)} was ${cyan('added')} to latest schema` :
            `${underline(readablePath)} was ${cyan('added')} to latest schema`,
        )
        break
      case 'remove':
        humanReadableChanges[commandId].push(
          lastElementIsNum ?
            `Array item at ${underline(basePath)} was ${cyan('not found')} in latest schema` :
            `${underline(readablePath)} was ${cyan('not found')} in latest schema`,
        )
        break
      default:
        break
      }
    }

    if (Object.keys(humanReadableChanges).length === 0) {
      this.log('No changes have been detected.')
      return []
    }

    this.log()
    this.log(bold(red('Found the following schema changes:')))
    for (const [commandId, changes] of Object.entries(humanReadableChanges)) {
      this.log()
      this.log(bold(commandId))
      for (const change of changes) {
        this.log(`  - ${change}`)
      }
    }

    this.log()
    const bin = process.platform === 'win32' ? 'bin\\dev.cmd' : 'bin/dev'
    this.log('If intended, please update the schema file(s) and run again:', bold(`${bin} ${toConfiguredId('schema:generate', this.config)}`))
    process.exitCode = 1
    return changes
  }

  private readExistingSchema(filePath: string): Schemas {
    const contents = fs.readdirSync(filePath)
    const folderIsVersioned = contents.every(c => semver.valid(c))
    const schemasDir = folderIsVersioned ? path.join(filePath, semver.rsort(contents)[0] || '') : filePath
    const schemaFiles = getAllFiles(schemasDir, '.json')

    let schemas: Schemas = {
      commands: {},
      hooks: {},
    }
    if (schemaFiles.length === 1 && schemaFiles[0].endsWith('schema.json')) {
      schemas = JSON.parse(fs.readFileSync(schemaFiles[0]).toString('utf8')) as Schemas
    } else {
      for (const file of schemaFiles) {
        const schema = JSON.parse(fs.readFileSync(file).toString('utf8')) as Schema
        const key = path.basename(getKeyNameFromFilename(file))
        if (file.split(path.sep).includes('hooks')) {
          schemas.hooks[key] = schema
        } else {
          schemas.commands[key] = schema
        }
      }
    }

    return schemas
  }

  private async generateLatestSchema(): Promise<Schemas> {
    const generator = new SchemaGenerator(this)
    return generator.generate()
  }
}
