
import {Flags} from '@oclif/core'
import * as _ from 'lodash'
import * as fs from 'fs'
import {EOL} from 'os'
import {SnapshotCommand, SnapshotEntry} from '../../snapshot-command'
import * as chalk from 'chalk'

interface Change {
  name: string;
  removed?: boolean;
  added?: boolean;
}

type CommandChange = {
  plugin: string;
  flags: Change[];
  alias: Change[];
} & Change;

export type CompareResponse = {
  addedCommands?: string[];
  removedCommands?: string[];
  removedFlags?: string[];
  diffCommands?: CommandChange[];
}

export default class Compare extends SnapshotCommand {
    public static flags = {
      filepath: Flags.string({
        description: 'path of the generated snapshot file',
        default: './command-snapshot.json',
      }),
    };

    /**
     * Compare a snapshot with the current commands
     * @param {CommandChange[]} initialCommands Command list from the snapshot
     * @param {CommandChange[]} updatedCommands Command list from runtime
     * @returns all the command differences
     */
    public async compareSnapshot(initialCommands: SnapshotEntry[], updatedCommands: CommandChange[]): Promise<CompareResponse> {
      const removedCommands: string[] = []
      const diffCommands: CommandChange[] = []

      for (const initialCommand of initialCommands) {
        const updatedCommand = updatedCommands.find(updatedCommand => {
          // Protect against old snapshot files that don't have the plugin entry filled out.
          const samePlugin = initialCommand.plugin ? initialCommand.plugin === updatedCommand.plugin : true
          return initialCommand.command === updatedCommand.name && samePlugin
        })

        if (updatedCommand) {
          const changedFlags = this.diffCommandProperty(initialCommand.flags, updatedCommand.flags).changedProperty
          const changedAlias = this.diffCommandProperty(initialCommand.alias, updatedCommand.alias).changedProperty
          const flagsChanged = changedFlags.length > 0
          const aliasChanged = changedAlias.length > 0

          if (aliasChanged) {
            updatedCommand.alias = changedAlias
          }

          if (flagsChanged) {
            updatedCommand.flags = changedFlags
          }

          if (flagsChanged || aliasChanged) {
            diffCommands.push(updatedCommand)
          }
        } else {
          removedCommands.push(initialCommand.command)
        }
      }

      const initialCommandNames = initialCommands.map(initialCommand => initialCommand.command)
      const updatedCommandNames = updatedCommands.map(updatedCommand => updatedCommand.name)
      const addedCommands = _.difference(updatedCommandNames, initialCommandNames)

      if (removedCommands.length === 0 && addedCommands.length === 0 && diffCommands.length === 0) {
        this.log('No changes have been detected.')
        return {}
      }

      // Fail the process since there are changes to the snapshot file
      process.exitCode = 1

      this.log(`The following commands and flags have modified: (${chalk.green('+')} added, ${chalk.red('-')} removed)${EOL}`)

      for (const command of removedCommands) {
        this.log(chalk.red(`\t-${command}`))
      }

      for (const command of addedCommands) {
        this.log(chalk.green(`\t+${command}`))
      }

      const removedProperties: string[] = []

      const printCommandDiff = (properties: Change[], propertyName: string) => {
        if (properties.some(prop => prop.added || prop.removed)) this.log(`\t  ${propertyName}:`)
        for (const prop of properties) {
          if (prop.added || prop.removed) {
            const color = prop.added ? chalk.green : chalk.red
            this.log(color(`\t\t${prop.added ? '+' : '-'}${prop.name}`))
          }

          if (prop.removed) removedProperties.push()
        }
      }

      for (const command of diffCommands) {
        this.log(`\t${command.name}`)
        printCommandDiff(command.flags, 'Flags')
        printCommandDiff(command.alias, 'Aliases')
      }

      this.log(`${EOL}Command, flag, or alias differences detected. If intended, please update the snapshot file and run again.`)

      // Check if existent commands, or properties (flags, aliases) have been deleted
      if (removedCommands.length > 0 || removedProperties.length > 0) {
        this.log(chalk.red(`${EOL}Since there are deletions, a major version bump is required.`))
      }

      return {addedCommands, removedCommands, removedFlags: removedCommands, diffCommands}
    }

    /**
     * @deprecated in favor of diffCommandProperty
   * Compares a flag snapshot with the current command's flags
   * @param {string[]} initialFlags Flag list from the snapshot
   * @param {string[]} updatedFlags Flag list from runtime
   * @return {boolean} true if no changes, false otherwise
   */
    public diffCommandFlags(initialFlags: string[], updatedFlags: Change[]): { addedFlags: string[]; removedFlags: string[]; updatedFlags: Change[]; changedFlags: Change[] } {
      const diffedFlags = this.diffCommandProperty(initialFlags, updatedFlags)
      return {addedFlags: diffedFlags.addedProperty, removedFlags: diffedFlags.removedProperty, updatedFlags: diffedFlags.updated, changedFlags: diffedFlags.changedProperty}
    }

    /**
   * compares two command's properties to each other
   * @return a list of added, removed, updated, and changed properties
   * @param initial initial command property to compare against
   * @param updated generated command property to compare with
   */
    public diffCommandProperty(initial: string[], updated: Change[]): { addedProperty: string[]; removedProperty: string[]; updated: Change[]; changedProperty: Change[] } {
      const updatedPropertyNames = updated.map(update => update.name)
      const addedProperty = _.difference(updatedPropertyNames, initial)
      const removedProperty = _.difference(initial, updatedPropertyNames)
      const changedProperty: Change[] = []

      for (const update of updated) {
        if (addedProperty.includes(update.name)) {
          update.added = true
          changedProperty.push(update)
        }
      }

      for (const remove of removedProperty) {
        changedProperty.push({name: remove, removed: true})
        // The removed flags in not included in the updated flags, but we want it to
        // so it shows removed.
        updated.push({name: remove, removed: true})
      }

      return {addedProperty, removedProperty, updated, changedProperty}
    }

    get changed(): CommandChange[] {
      return this.commands.map(command => {
        return {
          name: command.id,
          plugin: command.pluginName || '',
          flags: Object.entries(command.flags).map(flagName => ({name: flagName[0]})),
          alias: command.aliases.map(alias => ({name: alias})),
        }
      })
    }

    public async run(): Promise<CompareResponse> {
      const {flags} = await this.parse(Compare)
      const oldCommands = JSON.parse(fs.readFileSync(flags.filepath).toString('utf8')) as SnapshotEntry[]
      const newCommands = this.changed
      return this.compareSnapshot(oldCommands, newCommands)
    }
}
