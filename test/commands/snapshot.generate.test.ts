import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import sinon from 'sinon'

import SnapshotCommand from '../../src/snapshot-command.js'

let writeFileStub: sinon.SinonStub

describe('snapshot:generate', () => {
  beforeEach(() => {
    writeFileStub = sinon.stub(SnapshotCommand.prototype, 'write')
  })

  afterEach(() => {
    sinon.restore()
  })

  it('runs command to generate snapshot file', async () => {
    const {stdout} = await runCommand('snapshot:generate')
    expect(writeFileStub.calledOnce).to.be.true
    expect(writeFileStub.getCall(0).firstArg).to.equal('./command-snapshot.json')
    expect(stdout).to.contain('Generated snapshot file')
  })
})
