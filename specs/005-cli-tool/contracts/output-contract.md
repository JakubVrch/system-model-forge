# Output Contract (schema version 1)

All commands use this JSON envelope:

```json
{"schemaVersion":1,"command":"partition-info","success":true,"data":{"partitions":[]},"error":null}
```

`command` is the recognized command or null for invalid dispatch; help/version may use `help`/`version`. A failure has `success:false`, `error:{"message":"concise explanation","context":{...}}`, and `data:null`, except an interrupted write operation can return its partial build summary. Context contains applicable `path`, `partitionId`, `exportGroup`, `exportKey`, `selector`, or `destination`, without a diagnostic/event array. Result paths are relative to root or destination as appropriate, not machine-specific absolute paths. Errors may identify an absolute path where necessary to explain an I/O failure.

## Partition inventory

`data.partitions[]`:

- `id`, `name`, `path` (entry relative to root).
- `parent`: null or `{path, id?, name?}`; unavailable identity fields are omitted.
- `exports.elements[]`: `{key, nodes, edges}`.
- `exports.diagrams[]`: `{key, nodes, edges, fileExtension}`.
- `exports.metamodel`: array of string keys.

Export arrays and metamodel keys are ordinally sorted. No records or diagram text appear. Empty arrays are explicit.

## Element selections

`data.selections[]`:

- `partition`: `{id,name,path}`.
- `export`: `{group:"elements"|"diagrams",key}`.
- `nodes` and `edges`: `{total,returned,omitted,items:[]}`.

Each item: `{kind,modelType,identity,attributes}` and, for edges, `endpoints:{from,to}`. `identity` contains required author-assigned `id` plus available `name` and `label` business-method values independent of property projection. `modelType` is string or null; the authored business attribute `type` remains inside attributes. Missing endpoint is null. A present endpoint is `{modelType,identity,inExport}`; `inExport` is based on full membership before limiting. It remains true if its node was merely omitted by the limit.

Distinct objects with matching authored IDs remain separate records. Authors own ID uniqueness. Endpoint identity is self-contained and inspection does not expand adjacency. Earlier CLI output included a generated `ref` on element and endpoint records. Consumers of that field must read `identity.id` and account for possible duplicate IDs. An authored `attributes.ref` remains business data.

Business-method result keys establish eligible attributes; fields absent on a particular member are missing. Unknown projected attributes fail before rendering. Explicit `undefined` is emitted as null in JSON, while an absent property remains omitted. Tables use the union of eligible attribute names, with `(missing)` cells where a record lacks that key.

## Attribute values

`getElementInfo()` returns a flat `Readonly<Record<string, string | number | null | undefined>>`. Numbers cover integers and decimals and must be finite; negative zero is rendered as zero. There are no nested objects, arrays, booleans, dates, bigint values, or graph references inside attributes. Authors can override the method to convert richer domain values into strings or numbers.

JSON preserves strings, finite numbers, and null directly. Explicit undefined values become null so their keys remain visible; omitted properties stay omitted. This intentionally does not preserve the difference between null and undefined in JSON. Pretty output may distinguish them as `null` and `(undefined)`; absent cells are `(missing)`. Empty strings and zero remain unchanged. Escape control characters in pretty output rather than interpreting terminal sequences.

The default method includes only supported own enumerable data values, excluding framework/identity fields. Unsupported stored values are excluded by the documented discovery rule, without recursive inspection or conversion. An override returning a value outside the declared flat type, a nonfinite number, or an accessor instead of a data field causes a concise inspection error identifying the element and attribute. A thrown method also fails inspection. No tagged-value encoding, reserved attribute key, cycle tracking, or JSON Pointer protocol is needed.

Endpoint summaries and absent endpoints remain separate CLI metadata defined above; these structures are not getElementInfo() attribute values.

## Build summary

`data` contains:

- `dryRun`: boolean.
- `partitions`: processed `{id,name,path,diagrams:[key,...]}` records in processing order.
- `exportedFiles`: distinct destination files successfully written.
- In dry-run only: `plannedFiles` and `artifacts:[{partitionPath,diagramKey,path}]`, where path is relative to output root. The partition list describes planned processing in this mode.

Normal builds do not return event logs, per-file status records, or diagram text. A partial-write error retains this shape and failed status; counts reflect completed writes only. Destination collisions keep each processed diagram key but count the destination once.

Pretty output is rendered from these same normalized results: compact partition inventories, separate node/edge tables per selection with total/shown/omitted counts, and one build summary. Endpoint cells show authored identity and model type, with explicit markers for unknown type, external membership, and absent endpoints. Business headings that collide with metadata headings or begin with `attribute:` receive the `attribute:` prefix. JSON adds no progress text or ANSI styling.
