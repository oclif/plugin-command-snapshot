import {Flags} from '@oclif/core'

import SnapshotCommand, {SnapshotEntry} from '../../snapshot-command.js'

export type Snapshots = SnapshotEntry[]

export default class Generate extends SnapshotCommand {
  public static flags = {
    filepath: Flags.string({
      default: './command-snapshot.json',
      description:
        'path to save the generated snapshot file; can use "{version}" to replace the current CLI/plugin version',
    }),
  }

  public async run(): Promise<Snapshots> {
    const numberOfSpaceChar = 4
    const {flags} = await this.parse(Generate)

    const resultCommands = this.entries

    const duplicatedChar = resultCommands.find(
      (command) => command.flags.length > 1 && new Set(command.flagChars).size !== command.flagChars.length,
    )
    if (duplicatedChar) {
      throw new Error(
        `Command "${duplicatedChar.command}" has duplicate short-flag characters "${duplicatedChar.flagChars.filter(
          (item, index) => duplicatedChar.flagChars.indexOf(item) !== index,
        )}"`,
      )
    }

    const charConflictCommand = resultCommands.find(
      (command) =>
        command.flags.length > 1 &&
        new Set([...command.flagAliases, ...command.flagChars, ...command.flags]).size !==
          [...command.flags, ...command.flagChars, ...command.flagAliases].length,
    )

    if (charConflictCommand) {
      const conflictFlags = [
        ...charConflictCommand.flags,
        ...charConflictCommand.flagChars,
        ...charConflictCommand.flagAliases,
      ].filter((item, index, array) => array.indexOf(item) !== index)
      throw new Error(`Command "${charConflictCommand.command}" has conflicting flags "${conflictFlags}"`)
    }

    const filePath = flags.filepath.replace('{version}', this.config.version)

    this.write(filePath, JSON.stringify(resultCommands, null, numberOfSpaceChar))
    this.log(`Generated snapshot file "${filePath}"`)
    return resultCommands
  }
}
