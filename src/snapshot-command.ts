import {Command} from '@oclif/core'
import sortBy from 'lodash.sortby'
import {writeFileSync} from 'node:fs'

export type SnapshotEntry = {
  alias: string[]
  command: string
  flagAliases: string[]
  flagChars: string[]
  flags: string[]

  plugin: string
}

export default abstract class SnapshotCommand extends Command {
  get commands(): Command.Loadable[] {
    const devPlugins = this.config.pjson.oclif.devPlugins ?? []
    const commands = this.config.commands
      // Ignore dev plugins
      .filter((command) => !devPlugins.includes(command.pluginName ?? ''))
      // remove aliases that reference themselves
      .filter((command) => !command.aliases.includes(command.id))
    return sortBy(commands, 'id')
  }

  get entries(): SnapshotEntry[] {
    return this.commands.map((command) => ({
      alias: command.aliases,
      command: command.id,
      flagAliases: Object.values(command.flags)
        .flatMap((flag) => flag.aliases)
        .filter(Boolean)
        .sort(),
      flagChars: Object.values(command.flags)
        .map((flag) => flag.char)
        .filter(Boolean)
        .sort(),
      flags: Object.keys(command.flags).sort(),
      plugin: command.pluginName,
    })) as SnapshotEntry[]
  }

  public write(path: string, data: string) {
    writeFileSync(path, data)
  }
}
