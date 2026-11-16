# Data Model: Query Selections and Example Modules

This feature adds derived collections, not a new stored graph representation.

## Framework entities

| Entity | Fields / relationships | Validation and identity |
| --- | --- | --- |
| `Node` (existing) | `outgoing`, `incoming`, `edges`: readonly snapshots of original edges | Object identity; labels/notation are not keys |
| `Edge` (existing) | `from: Node \| undefined`, `to: Node \| undefined` | Endpoints remain optional; queries do not repair them |
| Edge predicate | `(edge: Edge) => boolean` | Called before opposite-endpoint inspection for each direction-selected edge of each unique selected start; must not mutate the graph |
| Selection | `readonly GraphElement[]`, where `GraphElement = Node \| Edge` | Ordered references; input may contain duplicates and incomplete edges |
| Reached nodes | Fresh frozen `readonly Node[]` | Defined accepted targets, unique by identity, in first-discovery order |
| Derived selection | Fresh frozen `readonly GraphElement[]` after native merge and cleanup | Unique references due to merge; every edge has two selected endpoints |

The generic cleanup operation preserves repeated input entries; uniqueness belongs to the merge stage. All returned objects are the originals. No IDs, graph registry, persistence schema, migrations, or new lifecycle state are introduced.

Traversal requires an explicit `outgoing`, `incoming`, or `both` direction. Outgoing uses `Node.outgoing` and `Edge.to`; incoming uses `Node.incoming` and `Edge.from`; both uses `Node.edges` and the opposite endpoint relative to each start. Preserve the chosen snapshot order, evaluate self-loops once per start, and skip undefined opposite endpoints. An edge joining two supplied starts may be evaluated once from each start.

## Test-only metamodel and exports

Define `ServiceNode`, `ModuleNode`, `TopicNode`, and `DatabaseNode` specializations with readonly `id` and `name` fields and deterministic notation. Define `ModuleRelationship`, `EventRelationship`, and `DatabaseRelationship` subclasses with readonly label fields; event relationships can distinguish publish/subscribe through a readonly `kind` property. Domain types and notation remain in the fixture `metamodel/` folder, with one class per file: `service-node.ts`, `module-node.ts`, `topic-node.ts`, `database-node.ts`, `module-relationship.ts`, `event-relationship.ts`, and `database-relationship.ts`. Infrastructure and service modules import the needed classes directly from those files using `.js` ESM paths.

Use stable IDs and author-defined C4-style notation: service/module/topic nodes emit `System(id, "name")`, databases emit `SystemDb(id, "name")`, and relationships emit `Rel(fromId, toId, "label")`. This is illustrative notation, not framework behavior.

| Module | Named exports / responsibility |
| --- | --- |
| `infrastructure/topics` | `sharedTopic`, `topicA`, `topicB`, `unrelatedTopic`, frozen `topics` array |
| `infrastructure/databases` | `databaseA`, `databaseB`, frozen `databases` array |
| `service-a` | `service`, frozen `modules`, `relationships`, `localModel`, and `eventOverview`; references sharedTopic, topicA, databaseA |
| `service-b` | Same export names in its own module; references sharedTopic, topicB, databaseB |

Each service has two modules. Its local model orders service, modules, then module relationships, event relationships, and database relationships. Include two distinct parallel event edges from service A to the shared topic (e.g. publish and subscribe), plus an edge to topicA. Service B connects to the shared topic and topicB. Module edges point from service to module; database edges from service to database. The selected-start union across both services demonstrates a target reached by multiple starts; the service-specific topics demonstrate exclusive targets.

Infrastructure arrays contain original node instances and import only metamodel. Service local arrays omit infrastructure nodes but include relationships to them. Test expectations may explicitly list expected nodes; production fixture overview derivation must not maintain a target list. Freeze arrays and authored instances after initialization; queries preserve references and do not extend or mutate them.

## Derivation stages

1. **Local model → start nodes**: filter localModel for ServiceNode instances.
2. **Start nodes → reached topics**: call connectedNodes with an EventRelationship predicate and explicit `'outgoing'` direction. Evaluate all outgoing edge kinds; follow only accepted edges. The result includes shared and service-specific topic references once.
3. **Local model + reached topics → merged selection**: insertion-ordered identity Set, with local entries first. No element appears twice.
4. **Merged selection → event overview**: cleanSelection removes database relationships because database endpoints are absent. Service/modules and their relationships remain; event edges and reached topics remain. No missing node is added.
5. **Overview → text → file**: existing exporter groups nodes before edges, preserving within-group order; saveDiagram persists that exact text.

These are pure derivation stages, not mutations or state transitions on source nodes. Module initialization constructs the graph once; repeat-validation re-runs the derivation against the assembled graph. Direct exports of incomplete local selections retain existing behavior.
