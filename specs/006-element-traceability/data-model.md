# Data Model: Element Traceability

## Core element identity

| Field | Contract |
| --- | --- |
| `id` | Existing readonly authored string. Trace lookup compares the whole value case-sensitively. |
| `name` | Required readonly authored string. Distinct objects may share a name. |
| Model type | Existing CLI type recognition. JSON uses `null` when no specific type is available. |

A node holds incoming and outgoing adjacency. An edge refers to its source and target nodes, either of which may be absent. Add names without changing the endpoint or publication rules. Business metadata still comes from `getElementInfo()` for listing. The canonical name comes from the element. Custom attributes have no special meaning based on their keys.

## Published membership and root resolution

A selected partition supplies named element sets and diagram data sets. Look for the requested ID in those sets. If several exports publish the same object, show it once. If distinct objects share that ID, show a separate root for each match. An edge endpoint is eligible as a starting element when a selected export publishes it as a member. If no element matches, report an error with the requested ID.

Authors supply element IDs and names and are responsible for their uniqueness when their model needs it. Core and CLI code rely on that convention without checking the model for duplicate names or IDs. Preserve all matching objects when the command can return them as separate results.

## Trace result

| Entity | Fields and relationships |
| --- | --- |
| Trace result | `roots` is the ordered array of matching trace elements. A successful result has at least one root. |
| Trace element | `modelType`, `id`, `name`, and ordered `relationships`. An empty array represents a leaf. |
| Relationship branch | `modelType`, edge `id`, edge `name`, `direction` (`To` or `From`), and exactly one related `element`. |
| Listing identity | Required strings `id` and `name`. Present endpoint results use the same identity and retain the membership indicator. |

Live references stay in the source child. The result carries plain fields and child records across IPC.

## Processing transitions

Discover entries, apply path filters, load candidates, apply partition ID and name filters, and collect published matches. Expand each matching root independently in the loaded model, in order of first encounter in the selected exports. Each root is at hop zero. Each relationship and its related element add one hop. Skip an edge already used on the current path. When an unused edge returns to a path ancestor, emit that related element as a leaf. Track visits by object identity and keep sibling paths independent. For an edge root, expand its available endpoints and mark the root edge used before expanding their nodes.

Order branches by model type using the existing ordinal comparison, then `To` before `From`, then the original relationship order. Sort unavailable types as empty strings and render their type as `unknown` in the pretty tree.
