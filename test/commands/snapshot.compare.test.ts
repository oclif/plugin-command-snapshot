import {runCommand} from '@oclif/test'
import {expect} from 'chai'

describe('snapshot:compare', () => {
  it('shows no changes', async () => {
    const {stdout} = await runCommand('snapshot:compare')
    expect(stdout).to.contain('No changes have been detected.')
  })

  it('shows changes', async () => {
    const {stdout} = await runCommand(['snapshot:compare', '--filepath=./test/command-snapshot.json'])
    expect(stdout).to.contain('The following commands and flags have modified')
    expect(stdout).to.contain('\t-removed:command')
    expect(stdout).to.contain('\t+snapshot:generate')
    expect(stdout).to.contain('\t\t+filepath')
    expect(stdout).to.contain('\t\t-all')
    expect(stdout).to.contain('Since there are deletions, a major version bump is required.')
  })
})
