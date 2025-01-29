import {Flags} from '@oclif/core'
import {green, red} from 'ansis'
import difference from 'lodash.difference'
import fs from 'node:fs'
import {EOL} from 'node:os'

import SnapshotCommand, {SnapshotEntry} from '../../snapshot-command.js'

interface Change {
  added?: boolean
  name: string
  removed?: boolean
}

type CommandChange = Change & {
  alias: Change[]
  chars: Change[]
  flags: Change[]
  plugin: string
}

export type CompareResponse = {
  addedCommands?: string[]
  diffCommands?: CommandChange[]
  removedCommands?: string[]
  removedFlags?: string[]
}

export default class Compare extends SnapshotCommand {
  public static flags = {
    filepath: Flags.string({
      default: './command-snapshot.json',
      description: 'path of the generated snapshot file',
    }),
  }

  get changed(): CommandChange[] {
    return this.commands.map((command) => ({
      alias: command.aliases.map((alias) => ({name: alias})),
      // we can assert as string because of the filter
      chars: Object.values(command.flags)
        .map((flag) => flag.char)
        .filter((char) => typeof char === 'string')
        .map((char) => ({name: char as string})),
      flags: Object.entries(command.flags).map((flagName) => ({name: flagName[0]})),
      name: command.id,
      plugin: command.pluginName || '',
    }))
  }

  /**
   * Compare a snapshot with the current commands
   * @param {CommandChange[]} initialCommands Command list from the snapshot
   * @param {CommandChange[]} updatedCommands Command list from runtime
   * @returns all the command differences
   */
  public async compareSnapshot(
    initialCommands: SnapshotEntry[],
    updatedCommands: CommandChange[],
  ): Promise<CompareResponse> {
    const removedCommands: string[] = []
    const diffCommands: CommandChange[] = []

    for (const initialCommand of initialCommands) {
      const updatedCommand = updatedCommands.find((updatedCommand) => {
        // Protect against old snapshot files that don't have the plugin entry filled out.
        const samePlugin = initialCommand.plugin ? initialCommand.plugin === updatedCommand.plugin : true
        return initialCommand.command === updatedCommand.name && samePlugin
      })

      if (updatedCommand) {
        const changedFlags = this.diffCommandProperty(initialCommand.flags, updatedCommand.flags).changedProperty
        const changedAlias = this.diffCommandProperty(initialCommand.alias, updatedCommand.alias).changedProperty
        const changedChars = this.diffCommandProperty(initialCommand.flagChars, updatedCommand.chars).changedProperty
        const flagsChanged = changedFlags.length > 0
        const aliasChanged = changedAlias.length > 0
        const charsChanged = changedChars.length > 0

        if (aliasChanged) {
          updatedCommand.alias = changedAlias
        }

        if (charsChanged) {
          updatedCommand.chars = changedChars
        }

        if (flagsChanged) {
          updatedCommand.flags = changedFlags
        }

        if (flagsChanged || aliasChanged || charsChanged) {
          diffCommands.push(updatedCommand)
        }
      } else {
        removedCommands.push(initialCommand.command)
      }
    }

    const initialCommandNames = initialCommands.map((initialCommand) => initialCommand.command)
    const updatedCommandNames = updatedCommands.map((updatedCommand) => updatedCommand.name)
    const addedCommands = difference(updatedCommandNames, initialCommandNames)

    if (removedCommands.length === 0 && addedCommands.length === 0 && diffCommands.length === 0) {
      this.log('No changes have been detected.')
      return {}
    }

    // Fail the process since there are changes to the snapshot file
    process.exitCode = 1

    this.log(`The following commands and flags have modified: (${green('+')} added, ${red('-')} removed)${EOL}`)

    for (const command of removedCommands) {
      this.log(red(`\t-${command}`))
    }

    for (const command of addedCommands) {
      this.log(green(`\t+${command}`))
    }

    const removedProperties: string[] = []

    const printCommandDiff = (properties: Change[], propertyName: string) => {
      if (properties.some((prop) => prop.added || prop.removed)) this.log(`\t  ${propertyName}:`)
      for (const prop of properties) {
        if (prop.added || prop.removed) {
          const color = prop.added ? green : red
          this.log(color(`\t\t${prop.added ? '+' : '-'}${prop.name}`))
        }

        if (prop.removed) removedProperties.push()
      }
    }

    for (const command of diffCommands) {
      this.log(`\t${command.name}`)
      printCommandDiff(command.flags, 'Flags')
      printCommandDiff(command.chars, 'Short Flags')
      printCommandDiff(command.alias, 'Aliases')
    }

    this.log(
      `${EOL}Command, flag, flag characters, or alias differences detected. If intended, please update the snapshot file and run again.`,
    )

    // Check if existent commands, or properties (flags, aliases) have been deleted
    if (removedCommands.length > 0 || removedProperties.length > 0) {
      this.log(red(`${EOL}Since there are deletions, a major version bump is required.`))
    }

    return {addedCommands, diffCommands, removedCommands, removedFlags: removedCommands}
  }

  /**
   * compares two command's properties to each other
   * @returns a list of added, removed, updated, and changed properties
   * @param initial initial command property to compare against
   * @param updated generated command property to compare with
   */
  public diffCommandProperty(
    initial: string[],
    updated: Change[],
  ): {addedProperty: string[]; changedProperty: Change[]; removedProperty: string[]; updated: Change[]} {
    const updatedPropertyNames = updated.map((update) => update.name)
    const addedProperty = difference(updatedPropertyNames, initial)
    const removedProperty = difference(initial, updatedPropertyNames)
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

    return {addedProperty, changedProperty, removedProperty, updated}
  }

  public async run(): Promise<CompareResponse> {
    const {flags} = await this.parse(Compare)
    const oldCommands = JSON.parse(fs.readFileSync(flags.filepath, 'utf8')) as SnapshotEntry[]
    const newCommands = this.changed
    return this.compareSnapshot(oldCommands, newCommands)
  }
}
