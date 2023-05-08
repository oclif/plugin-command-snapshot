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
      const duplicated = resultCommands.find(command => command.flags.length > 1 && new Set(command.chars).size !== command.chars.length)
      if (duplicated) {
        throw new Error(`Command "${duplicated.command}" has duplicate chars "${duplicated.chars.filter((item, index) => duplicated.chars.indexOf(item) !== index)}"`)
      }

      const filePath = flags.filepath.replace('{version}', this.config.version)

      fs.writeFileSync(filePath, JSON.stringify(resultCommands, null, numberOfSpaceChar))
      this.log(`Generated snapshot file "${filePath}"`)
      return resultCommands
    }
}
