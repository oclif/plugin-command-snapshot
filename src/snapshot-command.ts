import {Command, Interfaces} from '@oclif/core'
import * as _ from 'lodash'

export type SnapshotEntry = {
  command: string;
  plugin: string;
  flags: string[];
  alias: string[];
}

export abstract class SnapshotCommand extends Command {
  get commands(): Interfaces.Command.Loadable[] {
    const devPlugins = this.config.pjson.oclif.devPlugins ?? []
    const commands = this.config.commands
    // Ignore dev plugins
    .filter(command => !devPlugins.includes(command.pluginName ?? ''))
    return _.sortBy(commands, 'id')
  }

  get entries(): SnapshotEntry[] {
    return this.commands.map(command => {
      return {
        command: command.id,
        plugin: command.pluginName,
        flags: Object.keys(command.flags).sort(),
        alias: command.aliases,
      }
    }) as SnapshotEntry[]
  }
}
