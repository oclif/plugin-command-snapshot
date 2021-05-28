import {expect, test} from '@oclif/test'
import * as fs from 'fs'
import * as sinon from 'sinon'

const sandbox = sinon.createSandbox()
let writeFileStub: any

describe('schema:generate', () => {
  beforeEach(() => {
    writeFileStub = sandbox.stub(fs, 'writeFileSync')
  })

  afterEach(() => {
    sandbox.restore()
  })

  test
  .stdout()
  .command(['schema:generate'])
  .it('runs command to generate schema files', ctx => {
    // expect 4 calls because we have 4 command in this plugin
    expect(writeFileStub.callCount).to.equal(4)
    expect(ctx.stdout).to.contain('Generated JSON schema file "schemas/schema:compare.json"')
    expect(ctx.stdout).to.contain('Generated JSON schema file "schemas/schema:generate.json"')
    expect(ctx.stdout).to.contain('Generated JSON schema file "schemas/snapshot:compare.json"')
    expect(ctx.stdout).to.contain('Generated JSON schema file "schemas/snapshot:generate.json"')
  })
})
