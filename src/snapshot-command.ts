import {Command} from '@oclif/core'
import * as _ from 'lodash'

export type SnapshotEntry = {
  command: string;
  plugin: string;
  flags: string[];
  alias: string[];
  chars:string[];
}

export abstract class SnapshotCommand extends Command {
  get commands(): Command.Loadable[] {
    const devPlugins = this.config.pjson.oclif.devPlugins ?? []
    const commands = this.config.commands
    // Ignore dev plugins
    .filter(command => !devPlugins.includes(command.pluginName ?? ''))
    // remove aliases that reference themselves
    .filter(command => !command.aliases.includes(command.id))
    return _.sortBy(commands, 'id')
  }

  get entries(): SnapshotEntry[] {
    return this.commands.map(command => {
      return {
        command: command.id,
        plugin: command.pluginName,
        flags: Object.keys(command.flags).sort(),
        alias: command.aliases,
        chars: Object.values(command.flags).map(flag => flag.char).filter(char => char).sort(),
      }
    }) as SnapshotEntry[]
  }
}
