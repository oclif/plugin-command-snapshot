# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [3.1.3](https://github.com/oclif/plugin-command-snapshot/compare/v3.1.2...v3.1.3) (2022-02-14)


### Bug Fixes

* bump demps ([c2643c7](https://github.com/oclif/plugin-command-snapshot/commit/c2643c745aa121677be1bac60547180ba406b8e4))

### [3.1.2](https://github.com/oclif/plugin-command-snapshot/compare/v3.1.1...v3.1.2) (2021-11-10)


### Bug Fixes

* adds alias property to command-snapshot \n BREAKING CHANGE: this changes the output of the file of the command snapshot which will cause compare to fail ([dea464e](https://github.com/oclif/plugin-command-snapshot/commit/dea464e17c11efd6a777982f4689bfc41f6ce9bd))

### [3.1.1](https://github.com/oclif/plugin-command-snapshot/compare/v3.1.0...v3.1.1) (2021-10-11)


### Bug Fixes

* update hook regex ([#144](https://github.com/oclif/plugin-command-snapshot/issues/144)) ([dc1225c](https://github.com/oclif/plugin-command-snapshot/commit/dc1225cc22e071958436e320b8951063b038d4cc))

## [3.1.0](https://github.com/oclif/plugin-command-snapshot/compare/v3.0.0...v3.1.0) (2021-10-08)


### Features

* generate schema for hooks ([266b832](https://github.com/oclif/plugin-command-snapshot/commit/266b83242fab1961b036998119791b999a08ee19))


### Bug Fixes

* ignore hooks with no return type ([070ed41](https://github.com/oclif/plugin-command-snapshot/commit/070ed41902268d48034fdaa2b96f9a4a54eefd2c))
* schema:compare with hooks ([508549a](https://github.com/oclif/plugin-command-snapshot/commit/508549a372e56b3d79dec970e62477d9905dec13))

### [2.2.2](https://github.com/oclif/plugin-command-snapshot/compare/v2.2.1...v2.2.2) (2021-06-30)


### Bug Fixes

* dont fail if schemas folder isn't found ([b12dc79](https://github.com/oclif/plugin-command-snapshot/commit/b12dc796619fe2469b2b4ea8fc524f999b1c614e))

### [2.2.1](https://github.com/oclif/plugin-command-snapshot/compare/v2.2.0...v2.2.1) (2021-06-30)


### Bug Fixes

* allow for empty schemas dir ([bf3d74e](https://github.com/oclif/plugin-command-snapshot/commit/bf3d74e3c071ef524402e1bdb20e50cbff990b80))

## [2.2.0](https://github.com/oclif/plugin-command-snapshot/compare/v2.1.2...v2.2.0) (2021-06-30)


### Features

* add --ignorevoid flag to schema:generate ([9c4a48e](https://github.com/oclif/plugin-command-snapshot/commit/9c4a48e076e750c2320a47bc4b7c2f4bfc7029ae))

### [2.1.2](https://github.com/oclif/plugin-command-snapshot/compare/v2.1.1...v2.1.2) (2021-06-07)


### Bug Fixes

* disallow void return type ([4655cfd](https://github.com/oclif/plugin-command-snapshot/commit/4655cfd86eb1429c6b0a8b036bb22e43336b6e09))

### [2.1.1](https://github.com/oclif/plugin-command-snapshot/compare/v2.1.0...v2.1.1) (2021-06-04)


### Bug Fixes

* ensure lib files are published ([c54b061](https://github.com/oclif/plugin-command-snapshot/commit/c54b06183aa39eaed60869421d3dd02e90fa27c0))

## [2.1.0](https://github.com/oclif/plugin-command-snapshot/compare/v2.0.0...v2.1.0) (2021-06-03)


### Features

* add commands for generating and comparing JSON schemas ([#90](https://github.com/oclif/plugin-command-snapshot/issues/90)) ([0e31395](https://github.com/oclif/plugin-command-snapshot/commit/0e313950317179383786d939591d5e03116e5c27))


### Bug Fixes

* update return type for schema:generate ([36d99b3](https://github.com/oclif/plugin-command-snapshot/commit/36d99b3dc3d325c5ed81ea88f818f8ab59a67470))
