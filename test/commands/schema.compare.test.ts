import {expect, test} from '@oclif/test'
import * as sinon from 'sinon'

const sandbox = sinon.createSandbox()

describe('schema:compare', () => {
  afterEach(() => {
    sandbox.restore()
  })

  test
  .stdout()
  .command(['schema:compare'])
  .it('shows no changes', ctx => {
    expect(ctx.stdout).to.contain('No changes have been detected.')
  })

  test
  .stdout()
  .command(['schema:compare', '--filepath=./test/schemas'])
  .it('shows changes', ctx => {
    expect(ctx.stdout).to.contain('Found the following schema changes:')
    expect(ctx.stdout).to.contain('- definitions.Snapshots.items.properties.flags.type was removed from latest schema')
    expect(ctx.stdout).to.contain('- snapshot:compare was removed from latest schema')
    expect(ctx.stdout).to.contain('If intended, please update the schema file(s) and run again.')
  })
})
