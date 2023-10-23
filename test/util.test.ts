import {expect} from '@oclif/test'

import {getKeyNameFromFilename, getSchemaFileName} from '../src/util.js'

describe('util test', () => {
  describe('getKeyNameFromFilename', () => {
    it('should return correct command id when only hyphens in file name a-b-c.json', () => {
      expect(getKeyNameFromFilename('a-b-c.json')).to.equal('a:b:c')
    })
    it('should return correct command id when escaped hyphens in file name a-b-c__d.json', () => {
      expect(getKeyNameFromFilename('a-b-c__d.json')).to.equal('a:b:c-d')
    })
    it('should return correct command id when escaped hyphens in file name a__b-c__d.json', () => {
      expect(getKeyNameFromFilename('a__b-c__d.json')).to.equal('a-b:c-d')
    })
    it('should return correct command id when escaped hyphens in file name a-b__c__d.json', () => {
      expect(getKeyNameFromFilename('a-b__c__d.json')).to.equal('a:b-c-d')
    })
    it('should return correct command id when underscore in file name a-b-c_d.json', () => {
      expect(getKeyNameFromFilename('a-b-c_d.json')).to.equal('a:b:c_d')
    })
  })
  describe('getSchemaFileName', () => {
    it('should return correct file name when only ":" in command id a:b:c', () => {
      expect(getSchemaFileName('a:b:c')).to.equal('a-b-c.json')
    })
    it('should return correct file name when hyphens in command id a:b:c-d', () => {
      expect(getSchemaFileName('a:b:c-d')).to.equal('a-b-c__d.json')
    })
    it('should return correct file name when hyphens in command id a-b:c-d', () => {
      expect(getSchemaFileName('a-b:c-d')).to.equal('a__b-c__d.json')
    })
    it('should return correct file name when hyphens in command id a:b-c-d', () => {
      expect(getSchemaFileName('a:b-c-d')).to.equal('a-b__c__d.json')
    })
    it('should return correct file name when underscore in command id a:b:c_d', () => {
      expect(getSchemaFileName('a:b:c_d')).to.equal('a-b-c_d.json')
    })
  })
})
