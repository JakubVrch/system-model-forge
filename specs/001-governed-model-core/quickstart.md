# Quickstart Validation Guide

## Prerequisites

- Node.js 24 LTS and Yarn.
- Install dependencies from the repository root after the core package manifest
  and lockfile are created:

```bash
yarn install
yarn typecheck
yarn test
```

Expected: strict TypeScript checking and the Vitest suite pass.

## Validate Extension and Creation

1. Define one subclass of `Node` with custom notation and instantiate it.
2. Define one subclass of `Edge` with custom notation and instantiate it with
   two node instances.
3. Verify the specialized class methods/properties remain available on the
   instances and that the edge retains the exact supplied endpoint references.
4. Instantiate core `Node` and `Edge` directly and verify their default
   notation is usable.

Expected: no core class changes are needed to define specialized elements.
See the [TypeScript declaration contract](contracts/typescript-declaration-contract.md)
and [data model](data-model.md).

## Validate Traversal

Construct a small graph with an isolated node, a cycle, and two distinct edges
between the same endpoints. Check that:

- `node.edges` contains exactly the node's connected edges;
- `node.outgoing` contains only edges whose `from` is the node and
  `node.incoming` only edges whose `to` is the node;
- an isolated node has empty `edges`, `outgoing`, and `incoming` arrays;
- each edge's `from` and `to` are the exact supplied nodes or `undefined`;
- a self-loop appears once in `edges` and in both direction arrays; and
- reading does not change subsequent results.

Expected: parallel edges remain distinct and cycles do not merge graph
elements. See the [element traversal contract](contracts/element-traversal-contract.md).

## Validate Incomplete Bulk Imports

Build a model from a bulk list in which some edges name nodes that never
appear, and some nodes have no edges. Check that:

- no construction call throws;
- an edge with a missing endpoint holds `undefined` there and appears only in
  its defined endpoint's `edges` and direction array;
- traversal and `exportDiagram()` succeed, print `undefined` for the missing
  endpoint, and do not render it as a node.

Expected: an incomplete model is always buildable and inspectable. Reporting
these conditions is deferred to a later validation feature.

## Validate Selection and Diagram Export

Build a mixed array of nodes and edges, select a subset using ordinary
JavaScript `filter()`, and pass only that result to `exportDiagram()`. Include
an edge whose endpoint node is omitted from the selection. Also export an empty
array.

Expected:

- every selected instance is represented, with its custom notation when
  provided and its default notation otherwise;
- omitted endpoint nodes are named by the selected edge but are not introduced
  as selected node entries;
- parallel edges remain separately represented;
- empty selection produces a valid empty diagram; and
- repeated exports of the same selection produce byte-identical output across
  100 runs.

Use the feature's focused integration tests and the exact formatting contract
in [the TypeScript declaration contract](contracts/typescript-declaration-contract.md).
