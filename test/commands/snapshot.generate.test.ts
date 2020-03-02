import {expect, test} from '@oclif/test'
import * as fs from 'fs'
import * as sinon from 'sinon'

const sandbox = sinon.createSandbox()
let writeFileStub: any

describe('snapshot:generate', () => {
  beforeEach(() => {
    writeFileStub = sandbox.stub(fs, 'writeFileSync')
  })

  afterEach(() => {
    sandbox.restore()
  })

  test
  .stdout()
  .command(['snapshot:generate'])
  .it('runs command to generate snapshot file', ctx => {
    expect(writeFileStub.calledOnce).to.be.true
    expect(writeFileStub.getCall(0).firstArg).to.equal('./command-snapshot.json')
    expect(ctx.stdout).to.contain('Generated snapshot file')
  })
})
