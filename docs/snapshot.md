# `oclif-example snapshot`

generates and compares OCLIF plugins snapshot files

- [`oclif-example snapshot compare`](#oclif-example-snapshot-compare)
- [`oclif-example snapshot generate`](#oclif-example-snapshot-generate)

## `oclif-example snapshot compare`

```
USAGE
  $ oclif-example snapshot compare [--filepath <value>]

FLAGS
  --filepath=<value>  [default: ./command-snapshot.json] path of the generated snapshot file
```

_See code: [src/commands/snapshot/compare.ts](https://github.com/oclif/plugin-command-snapshot/blob/5.1.3/src/commands/snapshot/compare.ts)_

## `oclif-example snapshot generate`

```
USAGE
  $ oclif-example snapshot generate [--filepath <value>]

FLAGS
  --filepath=<value>  [default: ./command-snapshot.json] path to save the generated snapshot file; can use "{version}"
                      to replace the current CLI/plugin version
```

_See code: [src/commands/snapshot/generate.ts](https://github.com/oclif/plugin-command-snapshot/blob/5.1.3/src/commands/snapshot/generate.ts)_
