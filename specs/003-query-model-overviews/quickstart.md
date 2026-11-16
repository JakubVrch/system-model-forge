# Quickstart Validation: Service Event Overviews

This guide describes validation after implementation. The new helper tests and fixture modules are planned artifacts and do not exist at planning time. See [public contracts](contracts/query-selection-contract.md) and [data model](data-model.md) for exact semantics and fixture exports.

## Prerequisites and commands

From the repository root, use Node.js >=24 and the checked-in npm lockfile:

```bash
npm ci
npm run typecheck
npx vitest run tests/unit/connected-nodes.test.ts tests/unit/clean-selection.test.ts tests/unit/public-surface.test.ts tests/integration/quickstart.test.ts
npm test
npm run build
```

Expected outcome: all runtime and declaration tests pass and the build emits both helper declarations through `dist/index.d.ts`. The focused command targets the implementation's new files. These commands are acceptance checks, not evidence that this planning-only change implements the feature.

## Scenario 1: Filter edges before a single hop

Run the connected-nodes unit suite. Use multiple edge kinds and property values reaching nodes of the same type; only targets of predicate-accepted edges should appear. Verify outgoing-only and incoming-only filtering, both-direction incident ordering, first-discovery reference order, one-hop limits, self-loops, undefined opposite endpoints, equal-label distinct targets, and repeated starts/targets. Adding disconnected edges must leave predicate call counts unchanged. Assert fresh frozen results and unchanged source adjacency.

## Scenario 2: Clean a mixed selection

Run the cleanup unit suite. Include nodes after edges in input order, isolated nodes, missing source/target endpoints, omitted endpoints, parallel edges, self-loops, and repeated entries. Expected output is exactly the original nodes and edges with both endpoints included, preserving order. Verify no endpoints are added and no source collections are modified. Inspect the implementation for one node-set pass and one filter pass; use no elapsed-time threshold.

## Scenario 3: Import two independent service overviews

The integration test imports topics/databases and both service modules under `tests/integration/fixtures/microservice-environment`. Verify all four topics exist in infrastructure and both database references are original exports. Inspect each service's exported service, modules, relationships, localModel, and eventOverview.

For A, expect service A, its two modules, sharedTopic, and topicA; retain A's two module edges and all three event edges, including both parallel edges to sharedTopic. For B, expect service B, its two modules, sharedTopic, and topicB; retain B's two module edges and two event edges. The mixed overview order retains local entries first and then discovered topics; diagram output groups nodes before edges. Neither overview includes database nodes/edges, unrelatedTopic, the other service, or its modules/exclusive topic. Check exact lengths and reference identity at every position.

Also query both selected service nodes together: sharedTopic occurs once despite being reached from both starts; the two exclusive topics occur once each and unrelatedTopic is absent. Confirm each folder derives its exported overview through filter → edge-filtered hop → Set merge → explicit cleanup. Expected test lists may be explicit, but the derivation contains no maintained overview topic list.

## Scenario 4: Render, save, and repeat

Within `tests/integration/quickstart.test.ts`, define independent literal expected C4-style strings for A and B, including title, node order, edge order, and final newline. Do not calculate expectations using exportDiagram or the query helpers. Render exported arrays with the existing author-controlled framing and compare to those literals.

Create a temporary directory with `mkdtemp`, save both diagrams to separate `.mmd` files with `saveDiagram`, read them back as UTF-8, and compare each file to its literal expected string. Always remove the temporary directory in `finally`; the test leaves no persistent generated artifact in the repository.

After all fixture modules have initialized, snapshot every infrastructure/local export array and every involved node's outgoing, incoming, and incident adjacency. Re-derive both overviews from local models and export them 100 times. Every ordered reference selection and every output byte must match the independent expectations; source collections and adjacency must match their initial snapshots. Frozen fixture fields/collections and helper output arrays must reject attempted mutation where tested.

## Regression acceptance

The full test suite must still accept direct traversal, optional edge endpoints, and explicit incomplete selections passed straight to exportDiagram. Declaration tests cover readonly inputs/results and edge-predicate typing. The exact public runtime surface adds only connectedNodes and cleanSelection. No infrastructure/domain class becomes a framework export.
