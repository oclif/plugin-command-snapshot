import * as path from 'path'
import * as fs from 'fs'
import * as semver from 'semver'
import * as _ from 'lodash'
import {diff, Operation} from 'just-diff'
import {Flags} from '@oclif/core'
import {Schema} from 'ts-json-schema-generator'
import {SnapshotCommand} from '../../snapshot-command'
import {SchemaGenerator} from './generate'
import {bold, cyan, red, underline} from 'chalk'

export type SchemaComparison = Array<{ op: Operation; path: (string | number)[]; value: any }>

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
    const latestSchema = await this.generateLatestSchema()

    const changes = diff(latestSchema, existingSchema)
    if (changes.length === 0) {
      this.log('No changes have been detected.')
      return []
    }

    const humandReadableChanges: Record<string, string[]> = {}
    for (const change of changes) {
      const objPath = change.path.join('.')
      const existing = _.get(existingSchema, objPath)
      const latest = _.get(latestSchema, objPath)
      const [commandId] = objPath.split('.definitions')
      const readablePath = objPath.replace(`${commandId}.`, '')
      if (!humandReadableChanges[commandId]) {
        humandReadableChanges[commandId] = []
      }
      switch (change.op) {
      case 'replace':
        humandReadableChanges[commandId].push(`${underline(readablePath)} was changed from ${cyan(existing)} to ${cyan(latest)}`)
        break
      case 'add':
        humandReadableChanges[commandId].push(`${underline(readablePath)} was ${cyan('added')} to latest schema`)
        break
      case 'remove':
        humandReadableChanges[commandId].push(`${underline(readablePath)} was ${cyan('removed')} from latest schema`)
        break
      default:
        break
      }
    }

    this.log()
    this.log(bold(red('Found the following schema changes:')))
    for (const [commandId, changes] of Object.entries(humandReadableChanges)) {
      this.log()
      this.log(bold(commandId))
      for (const change of changes) {
        this.log(`  - ${change}`)
      }
    }
    this.log()
    this.log('If intended, please update the schema file(s) and run again.')
    process.exitCode = 1
    return changes
  }

  private readExistingSchema(filePath: string): Record<string, Schema> {
    const contents = fs.readdirSync(filePath)
    const folderIsVersioned = contents.every(c => semver.valid(c))
    const schemasDir = folderIsVersioned ? path.join(filePath, semver.rsort(contents)[0] || '') : filePath
    const schemaFiles = fs.readdirSync(schemasDir).map(f => path.join(schemasDir, f)).filter(f => !fs.statSync(f).isDirectory())

    let schemas: Record<string, Schema> = {}
    if (schemaFiles.length === 1 && schemaFiles[0].endsWith('schema.json')) {
      schemas = JSON.parse(fs.readFileSync(schemaFiles[0]).toString('utf8')) as Record<string, Schema>
    } else {
      for (const file of schemaFiles) {
        const schema = JSON.parse(fs.readFileSync(file).toString('utf8')) as Schema
        schemas[path.basename(file.replace(/-/g, ':')).replace('.json', '')] = schema
      }
    }
    return schemas
  }

  private async generateLatestSchema(): Promise<Record<string, Schema>> {
    const generator = new SchemaGenerator(this)
    return generator.generate()
  }
}
