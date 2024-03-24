# `oclif-example schema`

generates and compares OCLIF plugins schema files

- [`oclif-example schema compare`](#oclif-example-schema-compare)
- [`oclif-example schema generate`](#oclif-example-schema-generate)

## `oclif-example schema compare`

```
USAGE
  $ oclif-example schema compare [--filepath <value>]

FLAGS
  --filepath=<value>  [default: ./schemas] path of the generated snapshot file
```

_See code: [src/commands/schema/compare.ts](https://github.com/oclif/plugin-command-snapshot/blob/5.1.3/src/commands/schema/compare.ts)_

## `oclif-example schema generate`

```
USAGE
  $ oclif-example schema generate [--filepath <value>] [--ignorevoid] [--singlefile]

FLAGS
  --filepath=<value>  [default: ./schemas] directory to save the generated schema files; can use "{version}" to insert
                      the current CLI/plugin version
  --ignorevoid        ignore commands that return void
  --singlefile        put generated schema into a single file
```

_See code: [src/commands/schema/generate.ts](https://github.com/oclif/plugin-command-snapshot/blob/5.1.3/src/commands/schema/generate.ts)_
