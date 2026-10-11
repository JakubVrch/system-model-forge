# Data Model: Extensible Graph Core

## Value Conventions

- Model elements have no `id`; an element is identified by its object reference.
- Node and edge relationships use object references. A missing endpoint node is
  simply `undefined`, which is a valid value.
- Element creation is lenient: it never throws for missing endpoints, so bulk-imported data always yields a model. Reporting such
  problems belongs to a later validation feature.
- Collections returned by traversal are readonly. Reading or exporting
  a model does not change it.
- Diagram output is deterministic for the same element instances and notation.

## Entities

| Entity                   | Fields and behavior                                                        | Rules                                                                                                                                                                                                                                                                                            |
| ------------------------ | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ModelElement`           | overridable `toNotation()`                                           | Shared base class for nodes and edges. Elements carry no identifier.                                                                                                                                                                                                                            |
| `Node`                   | Default notation; `edges`, `outgoing`, `incoming` arrays    | May be instantiated directly or specialized by inheritance. `edges` is a frozen array of references to all connected edges; `outgoing` those where the node is `from`; `incoming` those where it is `to`. A self-loop is in `edges` once and in both direction arrays. With none, each is empty. |
| `Edge`                   | Readonly `from` and `to` (`Node \| undefined`); default notation | Each endpoint is a `Node` reference or `undefined` when the node is missing; both are valid. Construction registers the edge as outgoing on a defined `from` and incoming on a defined `to`; `undefined` endpoints register nowhere. |
| Specialized node or edge | Inherited base state plus subclass behavior and optional notation override | Custom notation is used by diagram export. Subclasses do not modify the core classes.                                                                                                                                                                                                            |
| Graph instance           | A collection of related `Node` and `Edge` objects                          | Edges retain their endpoint object references. Parallel edges are distinct instances; cycles do not merge nodes or edges.                                                                                                                                                                        |
| Diagram                  | Deterministically ordered textual fragments for supplied graph elements    | Represents exactly the supplied array. An endpoint node not in that array is named by its notation in the edge line but is not rendered as a selected node. An empty selection yields a valid framed diagram.                                                                                               |

## Relationships and Lifecycle

1. A node is created with no arguments.
2. An edge is created with two endpoints, each a node object
   or `undefined`. The edge registers itself with each defined endpoint's
   private edge state.
3. `Node.edges` returns a frozen array of references, never the private
   mutable storage. Creating another edge makes it appear in later reads;
   reads and exports do not change adjacency.
4. Callers may select elements with normal JavaScript array operations such as
   `filter()`. The library does not supply a separate element-filtering API.
5. Diagram export renders only selected nodes and edges. Each selected edge's
   notation carries its endpoint notations (`undefined` for a missing node),
   even if either endpoint node is omitted from the selection.

## Validation Rules

- Missing endpoints are allowed: either or both of an edge's `from`/`to` may be
  `undefined`, and creation, traversal, and export all succeed.
- Endpoints are not patched in place; edges stay immutable.
- Distinct edges remain distinct even when they connect the same pair of nodes.
- A self-loop contributes one `edges` entry, not two duplicates, and appears in
  both `outgoing` and `incoming`.
- Direction is explicit through `outgoing`/`incoming`.
- Export must retain every selected element; it must not infer, add, or merge
  endpoint nodes or edges.
- Export ordering and default notation must be independent of locale and
  collection insertion order.
- Custom notation is expected to return deterministic text for an unchanged
  element.

## Out of Scope

Partition ownership, model assembly, type metamodels, cross-partition
dependencies, multi-hop query APIs, built-in filtering, and CLI behavior belong
to other features or are excluded. So is validation: a later feature will
detect and report missing endpoints and similar problems to
support debugging; this feature only keeps them representable.
