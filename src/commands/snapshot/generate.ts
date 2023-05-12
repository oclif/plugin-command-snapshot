import {Flags} from '@oclif/core'
import * as fs from 'fs'
import {SnapshotCommand, SnapshotEntry} from '../../snapshot-command'

export type Snapshots = SnapshotEntry[]

export default class Generate extends SnapshotCommand {
    public static flags = {
      filepath: Flags.string({
        description: 'path to save the generated snapshot file; can use "{version}" to replace the current CLI/plugin version',
        default: './command-snapshot.json',
      }),
    };

    public async run(): Promise<Snapshots> {
      const numberOfSpaceChar = 4
      const {flags} = await this.parse(Generate)

      const resultCommands = this.entries

      const duplicatedChar = resultCommands.find(command => command.flags.length > 1 && new Set(command.flagChars).size !== command.flagChars.length)
      if (duplicatedChar) {
        throw new Error(`Command "${duplicatedChar.command}" has duplicate short-flag characters "${duplicatedChar.flagChars.filter((item, index) => duplicatedChar.flagChars.indexOf(item) !== index)}"`)
      }

      const charCommandConflict = resultCommands.find(command => command.flags.length > 1 && new Set([...command.flags, ...command.flagAliases]).size !== [...command.flags, ...command.flagAliases].length)

      if (charCommandConflict) {
        // will be defined because we just found this above
        const problemChar = charCommandConflict.flagAliases.find(char => charCommandConflict.flags.indexOf(char)) as string
        const fullFlags  = this.commands.find(command => command.id === charCommandConflict.command)
        throw new Error(`Command "${charCommandConflict.command}" has conflict between flag  "${problemChar}" and an alias with ${Object.values(fullFlags?.flags ?? []).find(allFlags => allFlags.aliases?.includes(problemChar))?.name} `)
      }

      const filePath = flags.filepath.replace('{version}', this.config.version)

      fs.writeFileSync(filePath, JSON.stringify(resultCommands, null, numberOfSpaceChar))
      this.log(`Generated snapshot file "${filePath}"`)
      return resultCommands
    }
}
