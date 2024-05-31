import {Flags, toConfiguredId} from '@oclif/core'
import {bold, cyan, underline} from 'ansis'
import {Operation, diff} from 'just-diff'
import get from 'lodash.get'
import fs from 'node:fs'
import path from 'node:path'
import * as semver from 'semver'
import {Schema} from 'ts-json-schema-generator'

import SnapshotCommand from '../../snapshot-command.js'
import {GLOB_PATTERNS, getAllFiles, getKeyNameFromFilename} from '../../util.js'
import {SchemaGenerator, Schemas} from './generate.js'

export type SchemaComparison = Array<{op: Operation; path: (number | string)[]; value: unknown}>

function isNumber(n: number | string | undefined): boolean {
  return Number.isInteger(Number(n))
}

function isMeaningless(n: number | string | undefined): boolean {
  if (!n) return true
  const meaninglessKeys: Array<number | string> = ['$comment', '__computed']
  return meaninglessKeys.includes(n)
}

export default class SchemaCompare extends SnapshotCommand {
  public static flags = {
    filepath: Flags.string({
      default: './schemas',
      description: 'path of the generated snapshot file',
    }),
  }

  public async run(): Promise<SchemaComparison> {
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

    const {flags} = await this.parse(SchemaCompare)

    try {
      fs.accessSync(flags.filepath)
    } catch {
      this.log(`${flags.filepath} not found.`)
      return []
    }

    const existingSchema = this.readExistingSchema(flags.filepath)
    const generator = new SchemaGenerator({base: this, commandGlobs, commandsDir})
    const latestSchema = await generator.generate()
    this.debug('existingSchema', existingSchema)
    this.debug('latestSchema', latestSchema)
    const changes = diff(latestSchema, existingSchema)

    const humanReadableChanges: Record<string, string[]> = {}
    for (const change of changes) {
      const lastPathElement = change.path.at(-1)
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
        case 'replace': {
          humanReadableChanges[commandId].push(
            `${underline(readablePath)} was changed from ${cyan(existing)} to ${cyan(latest)}`,
          )
          break
        }

        case 'add': {
          humanReadableChanges[commandId].push(
            lastElementIsNum
              ? `Array item at ${underline(basePath)} was ${cyan('added')} to latest schema`
              : `${underline(readablePath)} was ${cyan('added')} to latest schema`,
          )
          break
        }

        case 'remove': {
          humanReadableChanges[commandId].push(
            lastElementIsNum
              ? `Array item at ${underline(basePath)} was ${cyan('not found')} in latest schema`
              : `${underline(readablePath)} was ${cyan('not found')} in latest schema`,
          )
          break
        }

        default: {
          break
        }
      }
    }

    if (Object.keys(humanReadableChanges).length === 0) {
      this.log('No changes have been detected.')
      return []
    }

    this.log()
    this.log(bold.red('Found the following schema changes:'))
    for (const [commandId, changes] of Object.entries(humanReadableChanges)) {
      this.log()
      this.log(bold(commandId))
      for (const change of changes) {
        this.log(`  - ${change}`)
      }
    }

    this.log()
    const bin = process.platform === 'win32' ? 'bin\\dev.cmd' : 'bin/dev.js'
    this.log(
      'If intended, please update the schema file(s) and run again:',
      bold(`${bin} ${toConfiguredId('schema:generate', this.config)}`),
    )
    process.exitCode = 1
    return changes
  }

  private readExistingSchema(filePath: string): Schemas {
    const contents = fs.readdirSync(filePath)
    const folderIsVersioned = contents.every((c) => semver.valid(c))
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
}
