import {expect, test} from '@oclif/test'
import sinon from 'sinon'

import SnapshotCommand from '../../src/snapshot-command.js'

const sandbox = sinon.createSandbox()
let writeFileStub: sinon.SinonStub

describe('snapshot:generate', () => {
  beforeEach(() => {
    writeFileStub = sandbox.stub(SnapshotCommand.prototype, 'write')
  })

  afterEach(() => {
    sandbox.restore()
  })

  test
    .stdout()
    .command(['snapshot:generate'])
    .it('runs command to generate snapshot file', (ctx) => {
      expect(writeFileStub.calledOnce).to.be.true
      expect(writeFileStub.getCall(0).firstArg).to.equal('./command-snapshot.json')
      expect(ctx.stdout).to.contain('Generated snapshot file')
    })
})
