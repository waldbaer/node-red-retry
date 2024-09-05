// --------------------------------------------------------------------------------------------------------------------
// Tests for shared resource/utility 'logger'
// --------------------------------------------------------------------------------------------------------------------
// Setup Infrastructure:
//   npm install --save-dev
//   npm install ~/.node-red --no-save
// Run tests
//   npm run test
// More docu:
//   - https://www.npmjs.com/package/node-red-node-test-helper
//   - https://sinonjs.org/releases/latest/assertions/
//   - https://www.npmjs.com/package/supertest
// --------------------------------------------------------------------------------------------------------------------
require('node-red-node-test-helper');
const sinon = require('sinon');
const logger = require('../resources/logger.js');

describe('logger utility', function() {
  beforeEach(function() {
    sinon.spy(console, 'warn');
    sinon.spy(console, 'error');

    sinon.spy(nodeMock, 'warn');
    sinon.spy(nodeMock, 'error');
  });

  afterEach(function() {
    console.error.restore();
    console.warn.restore();

    nodeMock.warn.restore();
    nodeMock.error.restore();
  });

  // ==== Constants =====
  const LoggerNodeName = `Retry`;

  // ==== Mocks =====
  class NodeMock {
    constructor() {}
    warn(warnMessage, msg = undefined) {}
    error(errorMessage, msg = undefined) {}
  }

  // Mock for a Node-RED node supporting logging
  const nodeMock = new NodeMock();

  // ==== Tests =======================================================================================================

  // ==== Console logger (Browser) ==============
  it(`console logger should log warning`, function(done) {
    const testedWarningString = 'test warning log';
    logger.logWarning(testedWarningString);
    console.warn.should.be.calledWithMatch(`[${LoggerNodeName}] ${testedWarningString}`);
    done();
  });

  it(`console logger should log error`, function(done) {
    const testedErrorString = 'test error log';
    logger.logError(testedErrorString);
    console.error.should.be.calledWithMatch(`[${LoggerNodeName}] ${testedErrorString}`);
    done();
  });

  // ==== Node logger (Node-RED) ================
  it(`node logger should log warning`, function(done) {
    const testedWarningString = 'test warning log';

    logger.logWarning(testedWarningString, nodeMock);
    nodeMock.warn.should.be.calledWithMatch(`[${LoggerNodeName}] ${testedWarningString}`);
    done();
  });

  it(`node logger should log error`, function(done) {
    const testedErrorString = 'test error log';

    logger.logError(testedErrorString, nodeMock);
    nodeMock.error.should.be.calledWithMatch(`[${LoggerNodeName}] ${testedErrorString}`);
    done();
  });
});
