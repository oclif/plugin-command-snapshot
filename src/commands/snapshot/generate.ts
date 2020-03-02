import {Command, flags} from '@oclif/command'
import * as fs from 'fs'
import * as _ from 'lodash'

export type SnapshotEntry = {
  command: string;
  flags: string[];
}

export default class Generate extends Command {
    public static flags = {
      filepath: flags.string({
        description: 'path to save the generated snapshot file; can use "{version}" to replace the current CLI/plugin version',
        default: './command-snapshot.json',
      }),
    };

    public async run() {
      const numberOfSpaceChar = 4
      const {flags} = this.parse(Generate)
      const commands = this.config.commands
      const resultCommands = _.sortBy(commands, 'id').map(command => {
        return {
          command: command.id,
          flags: Object.keys(command.flags),
        }
      }) as SnapshotEntry[]
      const filePath = flags.filepath.replace('{version}', this.config.version)

      fs.writeFileSync(filePath, JSON.stringify(resultCommands, null, numberOfSpaceChar))
      this.log(`Generated snapshot file "${filePath}"`)
    }
}
