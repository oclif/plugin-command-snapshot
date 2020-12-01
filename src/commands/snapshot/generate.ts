import {flags} from '@oclif/command'
import * as fs from 'fs'
import {SnapshotCommand} from '../../snapshot-command'

export default class Generate extends SnapshotCommand {
    public static flags = {
      filepath: flags.string({
        description: 'path to save the generated snapshot file; can use "{version}" to replace the current CLI/plugin version',
        default: './command-snapshot.json',
      }),
    };

    public async run() {
      const numberOfSpaceChar = 4
      const {flags} = this.parse(Generate)

      const resultCommands = this.entries
      const filePath = flags.filepath.replace('{version}', this.config.version)

      fs.writeFileSync(filePath, JSON.stringify(resultCommands, null, numberOfSpaceChar))
      this.log(`Generated snapshot file "${filePath}"`)
    }
}
