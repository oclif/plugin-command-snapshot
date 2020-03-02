import {expect, test} from '@oclif/test'
import * as sinon from 'sinon'

const sandbox = sinon.createSandbox()

describe('snapshot:compare', () => {
  afterEach(() => {
    sandbox.restore()
  })

  test
  .stdout()
  .command(['snapshot:compare'])
  .it('shows no changes', ctx => {
    expect(ctx.stdout).to.contain('No changes have been detected.')
  })

  test
  .stdout()
  .command(['snapshot:compare', '--filepath=./test/command-snapshot.json'])
  .it('shows changes', ctx => {
    expect(ctx.stdout).to.contain('The following commands and flags have modified')
    expect(ctx.stdout).to.contain('\t-removed:command')
    expect(ctx.stdout).to.contain('\t+snapshot:generate')
    expect(ctx.stdout).to.contain('\t\t+filepath')
    expect(ctx.stdout).to.contain('\t\t-all')
    expect(ctx.stdout).to.contain('Since there are deletions, a major version bump is required.')
  })
})
