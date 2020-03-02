@oclif/plugin-command-snapshot
========

Generates and compares OCLIF plugins snapshot files

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@oclif/plugin-command-snapshot.svg)](https://npmjs.org/package/@oclif/plugin-command-snapshot)
[![Downloads/week](https://img.shields.io/npm/dw/@oclif/plugin-command-snapshot.svg)](https://npmjs.org/package/@oclif/plugin-command-snapshot)
[![License](https://img.shields.io/npm/l/@oclif/plugin-command-snapshot.svg)](https://github.com/nramyasri-sf/@oclif/plugin-command-snapshot/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
<!-- tocstop -->

# Usage
This plugin is used to take snapshot of commands and flags in OCLIF plugins. These snapshots can be used to enforce a deprecation policy or to keep track of changes.

To include it in your plugin, add it to the `devPlugins` section in your package.json.

```json
"oclif": {
    ...
    "devPlugins": [
      "@oclif/plugin-command-snapshot"
      ...
    ]
```

Use the `snapshot:generate` command in your development process.

```sh-session
# generates a snapshot file that has a list or commands and flags in the current CLI or plugin
$ ./bin/run snapshot:generate
```

Use the `snapshot:compare` command in your continuos integration. This command will fail if changes are detected. The snapshot file should be updated and committed to the repository when legitimate changes are made.

```sh-session
# compare the current CLI or plugin commands and flags with a snapshot file to identify changes
$ ./bin/run snapshot:compare
```
