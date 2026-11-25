# CLI Contract: Element Traceability

## Command

```text
model-forge trace-element <element-id> [--depth <positive-integer>] [shared options]
```

Shared options are `--root`, `--partition-id`, `--partition-name`, `--path`, `--format`, and `--tsconfig`. Use the feature 005 defaults and selection semantics. A trace requires exactly one nonempty positional ID and accepts depth once, defaulting to one. Parse depth as a positive safe integer. Use `--` before an ID that begins with a hyphen.

Reject `--property` as unsupported on `trace-element` through the same path as an unknown option. Preserve the standard error path for other invalid arguments, an ID with no matches, and source failures. A recognized JSON format applies to failures. JSON writes one document to stdout, with null data on trace failures. Source diagnostics stay on stderr. Successful trace exits zero.

Selectors determine which exports can supply starting elements. Print one tree for each distinct matching object and separate consecutive trees with a blank line. Traversal follows existing graph connections in the loaded model, including endpoints outside the selected exports. Separate branches represent parallel edges. See the [data model](../data-model.md) for hop and cycle rules.

## Help and version commands

```text
model-forge help
model-forge version
```

The help and version commands run without an element ID or source loading.

## Pretty output

Render each element as `ModelType: Name (id)`. Append `-> To` or `-> From` on edge lines. Use `├──`, `└──`, and `│` for branches and escape control characters according to the CLI's plain output conventions.

```text
OrderService: Order Service (orders)
├── ServiceCall: Primary Payment (payment-primary) -> To
│   └── PaymentService: Payment Service (payments)
└── ServiceCall: Fallback Payment (payment-fallback) -> To
    └── PaymentService: Payment Service (payments)
```

## JSON output

Extend the feature 005 envelope with the `trace-element` command and do not advance `schemaVersion`. A successful result has `success: true`, `error: null`, and `data: { roots }`. The recursive fields are defined in the [data model](../data-model.md). JSON retains exact strings and uses `null` for an unavailable model type.

For `list-elements`, item and present endpoint `identity.name` are required strings sourced from the core element. In pretty output, use the authored name in the table's Name column and endpoint details. The `--property` option selects business attributes, and every projection retains core identity. The CLI rejects `id` and `name` as property selectors, including when an attribute override supplies those keys. Listing and endpoint identity contain only `id` and `name`. Any custom `label` is an ordinary business attribute and follows the same rules as any other authored key.
