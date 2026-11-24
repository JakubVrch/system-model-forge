# Core Contract: Required Element Names

Every `ModelElement` exposes a readonly authored string `name` alongside its existing readonly string `id`. Constructors require the name at the end of the existing parameter list.

| Constructor | Required arguments |
| --- | --- |
| `Node` | `id: string, name: string` |
| `Edge<From, To>` | `from: Endpoint<From>, to: Endpoint<To>, id: string, name: string` |

Keep the existing generic endpoint types and their optionality. Apply the string-name check before edge registration so a failed construction cannot leave adjacency entries. Authors supply IDs and names and are responsible for their uniqueness where their models require it. Core does not enforce uniqueness. Trace lookup uses IDs and preserves distinct matching objects.

Subclasses with an existing authored name forward it to the base constructor and preserve its value. Subclasses and factories that previously accepted only an ID supply an explicit name. `defineElement()` continues to infer its argument list. Its freezing and publication behavior follow the existing core contract.

The default `getElementInfo()` snapshot excludes `name` as identity metadata. Name lookup through the core contract is independent of attribute overrides. The core assigns no special meaning to authored attributes beyond the fields defined on core elements. Keep existing `toNotation()` output where only construction metadata changes, including the service fixture diagram expectations.

This contract supersedes the element constructor signatures and optional business-derived names in the earlier core and CLI feature documentation. The change is incompatible with existing constructor callers that omit a name.
