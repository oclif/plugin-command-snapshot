import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('schema:compare', () => {
  it('shows no changes', async () => {
    const {stdout} = await runCommand('schema:compare')
    expect(stdout).to.contain('No changes have been detected.')
  })

  it('shows changes', async () => {
    const {stdout} = await runCommand(['schema:compare', '--filepath=./test/schemas'])
    expect(stdout).to.contain('Found the following schema changes:')
    expect(stdout).to.contain('- definitions.Snapshots.items.additionalProperties was added to latest schema')
    expect(stdout).to.contain('- commands.snapshot:compare was not found in latest schema')
    expect(stdout).to.contain('If intended, please update the schema file(s) and run again:')
  })
})
