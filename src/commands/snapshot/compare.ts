
import {Command, flags} from '@oclif/command'
import * as _ from 'lodash'
import * as fsx from 'fs-extra'
import {EOL} from 'os'
import {SnapshotEntry} from './generate'
import * as chalk from 'chalk'

interface Change {
  name: string;
  removed?: boolean;
  added?: boolean;
}

type CommandChange = {
  flags: Change[];
} & Change;

export default class Compare extends Command {
    public static flags = {
      filepath: flags.string({
        description: 'path of the generated snapshot file',
        default: './command-snapshot.json',
      }),
    };

    /**
     * Compare a snapshot with the current commands
     * @param {CommandChange[]} initialCommands Command list from the snapshot
     * @param {CommandChange[]} updatedCommands Command list from runtime
     */
    public async compareSnapshot(initialCommands: SnapshotEntry[], updatedCommands: CommandChange[]) {
      const removedCommands: string[] = []
      const diffCommands: CommandChange[] = []

      initialCommands.forEach(initialCommand => {
        const updatedCommand = updatedCommands.find(updatedCommand => initialCommand.command === updatedCommand.name)

        if (updatedCommand) {
          const {changedFlags} = this.diffCommandFlags(initialCommand.flags, updatedCommand.flags)
          if (changedFlags.length > 0) {
            diffCommands.push(updatedCommand)
          }
        } else {
          removedCommands.push(initialCommand.command)
        }
      })

      const initialCommandNames = initialCommands.map(initialCommand => initialCommand.command)
      const updatedCommandNames = updatedCommands.map(updatedCommand => updatedCommand.name)
      const addedCommands = _.difference(updatedCommandNames, initialCommandNames)

      if (removedCommands.length === 0 && addedCommands.length === 0 && diffCommands.length === 0) {
        this.log('No changes have been detected.')
        return
      }

      // Fail the process since there are changes to the snapshot file
      process.exitCode = 1

      this.log(`The following commands and flags have modified: (${chalk.green('+')} added, ${chalk.red('-')} removed)${EOL}`)

      removedCommands.forEach(command => {
        this.log(chalk.red(`\t-${command}`))
      })
      addedCommands.forEach(command => {
        this.log(chalk.green(`\t+${command}`))
      })

      const removedFlags: string[] = []
      if (diffCommands.length > 0) {
        diffCommands.forEach(command => {
          this.log(`\t ${command.name}`)

          command.flags.forEach(flag => {
            if (flag.added || flag.removed) {
              const color = flag.added ? chalk.green : chalk.red
              this.log(color(`\t\t${flag.added ? '+' : '-'}${flag.name}`))
            }
            if (flag.removed) removedFlags.push()
          })
        })
      }

      this.log(`${EOL}Command or flag differences detected. If intended, please update the snapshot file and run again.`)

      // Check if existent commands have been deleted
      if (removedCommands.length > 0 || removedFlags.length > 0) {
        this.log(chalk.red(`${EOL}Since there are deletions, a major version bump is required.`))
      }

      return {addedCommands, removedCommands, removedFlags, diffCommands}
    }

    /**
     * Compares a flag snapshot with the current command's flags
     * @param {string[]} initialFlags Flag list from the snapshot
     * @param {string[]} updatedFlags Flag list from runtime
     * @param {string} initialCommand Command the flags belong to
     * @return {boolean} true if no changes, false otherwise
     */
    public diffCommandFlags(initialFlags: string[], updatedFlags: Change[]) {
      const updatedFlagNames = updatedFlags.map(updatedFlag => updatedFlag.name)
      const addedFlags = _.difference(updatedFlagNames, initialFlags)
      const removedFlags = _.difference(initialFlags, updatedFlagNames)
      const changedFlags: Change[] = []

      updatedFlags.forEach(updatedFlag => {
        if (addedFlags.includes(updatedFlag.name)) {
          updatedFlag.added = true
          changedFlags.push(updatedFlag)
        }
      })
      removedFlags.forEach(removedFlag => {
        changedFlags.push({name: removedFlag, removed: true})
        // The removed flags in not included in the updated flags, but we want it to
        // so it shows removed.
        updatedFlags.push({name: removedFlag, removed: true})
      })

      return {addedFlags, removedFlags, updatedFlags, changedFlags}
    }

    public async run() {
      const {flags} = this.parse(Compare)
      const oldCommandFlags = JSON.parse(fsx.readFileSync(flags.filepath).toString('utf8')) as SnapshotEntry[]
      const newCommandFlags = this.config.commands
      const resultnewCommandFlags: CommandChange[] = _.sortBy(newCommandFlags, 'id').map(command => {
        return {
          name: command.id,
          flags: Object.entries(command.flags).map(flagName => ({name: flagName[0]})),
        }
      })
      return this.compareSnapshot(oldCommandFlags, resultnewCommandFlags)
    }
}
