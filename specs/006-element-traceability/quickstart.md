# Quickstart: Validate Element Traceability

Run from the repository root with Node.js 24 or later and installed dependencies. These commands target the completed implementation.

```bash
npm run typecheck
npm test
npm run build
npm run test:coverage
```

Use the existing unit and integration suites together and aim for 85% combined coverage. Keep integration focused on the main flows below. Exercise detailed parser, name validation, cycle, missing endpoint, and multiple-match cases in focused unit tests.

## Check help and version

```bash
node dist/cli/main.js help trace-element
node dist/cli/main.js version
```

Both commands run without loading the model.

## Trace Service A

```bash
fixture_root=tests/integration/fixtures/microservice-environment
node dist/cli/main.js trace-element serviceA --root "$fixture_root" --partition-id service-a
```

Expect `Service A` at the root with authored names and IDs on all lines. The parallel edges `service-a-publishes-shared` and `service-a-subscribes-shared` appear as separate `To` branches to `shared`. The database endpoint `databaseA` appears even though the selected service partition publishes only its connecting edge. The default output stops after the first hop.

## Follow the shared topic and trace an edge ID

```bash
node dist/cli/main.js trace-element shared --root "$fixture_root" --depth 2 --format json
node dist/cli/main.js trace-element service-a-publishes-shared --root "$fixture_root" --partition-id service-a
```

The JSON result contains one tree rooted at `shared`, with three incoming branch entries reaching both services. Second-hop elements are leaves. The relationship-root trace shows `shared` under `To` and `serviceA` under `From`.

## Verify canonical names in existing listing output

```bash
node dist/cli/main.js list-elements --root "$fixture_root" --partition-id service-a --elements localModel --property name --format json
```

Expect the authored names on node and edge identities and available endpoints, including the referenced database. Listing and present endpoint identity contain only the core ID and name. The service environment's existing diagram and build assertions should continue to pass after fixture migration.
