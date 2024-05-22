import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import path from 'node:path'
import sinon from 'sinon'

import SnapshotCommand from '../../src/snapshot-command.js'

let writeFileStub: sinon.SinonStub

describe('schema:generate', () => {
  beforeEach(() => {
    writeFileStub = sinon.stub(SnapshotCommand.prototype, 'write')
  })

  afterEach(() => {
    sinon.restore()
  })

  it('runs command to generate schema files', async () => {
    const {stdout} = await runCommand('schema:generate')
    expect(writeFileStub.callCount).to.equal(4)
    expect(stdout).to.contain(`Generated JSON schema file "${path.join('schemas/schema-compare.json')}"`)
    expect(stdout).to.contain(`Generated JSON schema file "${path.join('schemas/schema-generate.json')}"`)
    expect(stdout).to.contain(`Generated JSON schema file "${path.join('schemas/snapshot-compare.json')}"`)
    expect(stdout).to.contain(`Generated JSON schema file "${path.join('schemas/snapshot-generate.json')}"`)
  })
})
