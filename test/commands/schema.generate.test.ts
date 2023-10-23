import {expect, test} from '@oclif/test'
import * as path from 'node:path'
import sinon from 'sinon'

import SnapshotCommand from '../../src/snapshot-command.js'

const sandbox = sinon.createSandbox()
let writeFileStub: sinon.SinonStub

describe('schema:generate', () => {
  beforeEach(() => {
    writeFileStub = sandbox.stub(SnapshotCommand.prototype, 'write')
  })

  afterEach(() => {
    sandbox.restore()
  })

  test
    .stdout()
    .command(['schema:generate'])
    .it('runs command to generate schema files', (ctx) => {
      // expect 4 calls because we have 4 command in this plugin
      expect(writeFileStub.callCount).to.equal(4)
      expect(ctx.stdout).to.contain(`Generated JSON schema file "${path.join('schemas/schema-compare.json')}"`)
      expect(ctx.stdout).to.contain(`Generated JSON schema file "${path.join('schemas/schema-generate.json')}"`)
      expect(ctx.stdout).to.contain(`Generated JSON schema file "${path.join('schemas/snapshot-compare.json')}"`)
      expect(ctx.stdout).to.contain(`Generated JSON schema file "${path.join('schemas/snapshot-generate.json')}"`)
    })
})
