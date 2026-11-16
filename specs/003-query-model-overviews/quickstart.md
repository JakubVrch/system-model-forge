# Quickstart Validation: Service Event Overviews

The helpers and fixture modules are implemented. This guide describes their executable validation. See [public contracts](contracts/query-selection-contract.md) and [data model](data-model.md) for exact semantics and fixture exports.

## Prerequisites and commands

From the repository root, use Node.js >=24 and the checked-in npm lockfile:

```bash
npm ci
npm run typecheck
npx vitest run tests/unit/connected-nodes.test.ts tests/unit/clean-selection.test.ts tests/unit/public-surface.test.ts tests/integration/quickstart.test.ts tests/integration/microservice-environment.test.ts tests/integration/metamodel.test.ts
npm test
npm run build
```

Expected outcome: all runtime and declaration tests pass and the build emits both helper declarations through `dist/index.d.ts`. The focused command targets the implementation's new files. The implementation has been validated with these checks.

## Scenario 1: Filter edges before a single hop

Run the connected-nodes unit suite. Use multiple edge kinds and property values reaching nodes of the same type; only targets of predicate-accepted edges should appear. Verify outgoing-only and incoming-only filtering, both-direction incident ordering, first-discovery reference order, one-hop limits, self-loops, undefined opposite endpoints, equal-label distinct targets, and repeated starts/targets. Adding disconnected edges must leave predicate call counts unchanged. Assert fresh frozen results and unchanged source adjacency.

## Scenario 2: Clean a mixed selection

Run the cleanup unit suite. Include nodes after edges in input order, isolated nodes, missing source/target endpoints, omitted endpoints, parallel edges, self-loops, and repeated references during set construction. Expected output is exactly the original nodes and edges with both endpoints included, preserving order. Verify no endpoints are added and no source collections are modified. Inspect the implementation for one filter pass with existing set membership; use no elapsed-time threshold.

## Scenario 3: Import two independent service overviews

The integration test imports topics/databases and both service modules under `tests/integration/fixtures/microservice-environment`. Verify all four topics exist in infrastructure and both database references are original exports. Inspect each service's exported service, modules, relationships, localModel, and eventOverview.

For A, expect service A, its two modules, sharedTopic, and topicA; retain A's two module edges and all three event edges, including both parallel edges to sharedTopic. For B, expect service B, its two modules, sharedTopic, and topicB; retain B's two module edges and two event edges. The mixed overview order retains local entries first and then discovered topics; diagram output groups nodes before edges. Neither overview includes database nodes/edges, unrelatedTopic, the other service, or its modules/exclusive topic. Check exact lengths and reference identity at every position.

Also query both selected service nodes together: sharedTopic occurs once despite being reached from both starts; the two exclusive topics occur once each and unrelatedTopic is absent. Confirm each folder derives its exported overview through filter → edge-filtered hop → Set merge → explicit cleanup. Expected test lists may be explicit, but the derivation contains no maintained overview topic list.

## Scenario 4: Render, save, and repeat

Within `tests/integration/microservice-environment.test.ts`, define independent literal expected C4-style strings for A and B, including title, node order, edge order, and final newline. Do not calculate expectations using exportDiagram or the query helpers. Render exported sets with the existing author-controlled framing and compare to those literals.

Create a temporary directory with `mkdtemp`, save both diagrams to separate `.mmd` files with `saveDiagram`, read them back as UTF-8, and compare each file to its literal expected string. Always remove the temporary directory in `finally`; the test leaves no persistent generated artifact in the repository.

After all fixture modules have initialized, snapshot every infrastructure/local export set and every involved node's outgoing, incoming, and incident adjacency. Re-derive both overviews from local models and export them 100 times. Every ordered reference selection and every output byte must match the independent expectations; source collections and adjacency must match their initial snapshots. Frozen fixture fields/collections and helper output sets must reject attempted mutation where tested.

## Regression acceptance

The full test suite must still accept direct traversal, optional edge endpoints, and explicit incomplete selections passed straight to exportDiagram. Declaration tests cover ReadonlySet inputs/results and edge-predicate typing. The exact public runtime surface adds only connectedNodes and cleanSelection. No infrastructure/domain class becomes a framework export.

## Validation evidence

Baseline typecheck, tests, and build passed. The new traversal, cleanup, integration, and readonlySet tests were observed failing before their corresponding implementations. All graph collection results and fixture exports now use protected readonly sets; Node getters return snapshots that do not change after later edge construction.

The readonlySet tests verify identity uniqueness, insertion order, source snapshot isolation, membership, iterators, and forEach receiver semantics. They verify that add/delete/clear, borrowed native Set mutation methods, and callback access cannot mutate the collection. The exporter is tested with sets and single-use generators, with independent nodes-first expected output. Integration validates both saved diagrams and 100 repeated full derivations.

Final set API validation: `npm run typecheck`, `npm test`, and `npm run build` passed. Vitest reports 35 passing tests across 11 files, including 4 declaration tests, with no type errors. The runtime export list includes readonlySet. No partition interface or governance layer was introduced.

## Element definition validation

All seven metamodel modules now export callable definitions plus type-only implementation classes. Consumer creation uses definitions directly; core defineElement owns post-construction shallow freezing. service.is and event.is replace domain-specific instanceof checks. Constructor parameters remain inferred, including event publish/subscribe kind, optional database relationship labels, defaults, and rest parameters.

The defineElement and public-export runtime tests failed before implementation. Focused tests then passed, followed by final `npm run typecheck`, `npm test`, and `npm run build`. Vitest reports 43 passing tests across 13 files, including 6 declaration tests, with no type errors. Both service diagrams retain their expected content, saved-file assertions, and 100-run identity/export stability. `git diff --check` passed.

## Consumer layout and import aliases

The quickstart is a short consumer smoke test that imports fixture exports and verifies the services and selected topics. Detailed selection identity, immutability, repeated derivation, diagram-text, and persistence checks live in `tests/integration/microservice-environment.test.ts`; metamodel export and parameter checks live in `tests/integration/metamodel.test.ts`.

TypeScript and Vitest resolve @core to the public core entry (and @core/* to internal modules for focused tests), @metamodel to the example metamodel index, and @fixtures/* to fixture directory indexes. Fixture consumers use these aliases. Core source retains relative imports so compiled Node.js modules run without a custom alias loader. The metamodel index exports databaseUsage, eventFlow, and moduleComposition with their corresponding type-only classes.

Final organization validation: typecheck, all 44 tests across 15 files, and build passed. Both actual fixture overviews were exported to `artifacts/diagrams/service-a-events.mmd` and `artifacts/diagrams/service-b-events.mmd`; each file matches its independent expected diagram literal. The quickstart contains only fixture-import smoke checks.

C4 Component notation uses Container for services and Component for modules, SystemQueue for topics, SystemDb for databases, and directed Rel statements for composition, event flows, and database usage. The dedicated metamodel test asserts all seven notation outputs together. Markdown previews wrap each exported service diagram in a mermaid fence.

Shared collection validation: filterSet and unionSet runtime/public-surface tests were observed failing before implementation. Both service fixtures now use unionSet for local-model composition, filterSet for service selection, and unionSet for the reached-topic merge. Cleanup reuses filterSet. Typecheck, all 53 tests across 19 files, and build passed; generated declarations preserve guard narrowing and heterogeneous union inference. Existing .mmd artifacts and Markdown previews still match the independent expected diagrams.

Source import validation: relative imports/re-exports now use .ts; @core subpath aliases are extensionless. TypeScript rewriteRelativeImportExtensions emits .js runtime specifiers. Typecheck, all 53 tests, and build passed, and the built ESM package ran directly in Node.js. A separate consumer check validated the generated declarations without opting into TypeScript-extension imports.
