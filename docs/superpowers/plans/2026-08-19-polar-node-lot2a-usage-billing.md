# Polar Node — Lot 2a: Usage & Billing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four new resources to the `Polar` node — Meter, Event, Event Type, Customer Meter — covering Polar's usage-based billing pipeline, following the exact conventions established by Lot 1a/1b.

**Architecture:** Same declarative-routing pattern as every existing resource: one file per operation under `nodes/Polar/resources/<resource>/`, an `index.ts` wiring the Resource+Operation dropdown, reuse of `nodes/Polar/shared/descriptions.ts` helpers, and the `.toString()`-embedded-function trick (already used for `nextPageInfo`/`buildPricesArray`/`configuredOutputs`) for the two composite structures this lot introduces: Meter's `filter`/`aggregation` body keys and Event Ingest's heterogeneous array body.

**Tech Stack:** TypeScript, n8n-workflow declarative routing, no new runtime dependency.

**Spec:** `docs/superpowers/specs/2026-08-19-polar-node-lot2a-usage-billing-design.md`

## Global Constraints

- No new runtime npm dependency.
- Every endpoint, field name, and enum value below is grounded in Polar's real OpenAPI spec (`https://polar.sh/docs/openapi.yaml`) — do not invent or guess field names.
- Resource dropdown in `nodes/Polar/Polar.node.ts` stays alphabetical. Final order after this lot: Benefit, Benefit Grant, Checkout, Checkout Link, Customer, **Customer Meter**, Discount, **Event**, **Event Type**, **Meter**, Order, Product, Refund, Subscription.
- Own-resource ID fields (`meterId`, `eventId`, `eventTypeId`, `customerMeterId`) are plain `string` fields, never `resourceLocator` — matches the reviewed, approved convention from Lot 1 (`benefitId`, `productId`, `discountId`), confirmed again by the Lot 1b final review's M2 finding.
- Cross-resource *filter* fields (`customer_id`, `external_customer_id`, `meter_id` appearing inside a "Filters" `collection` on a Get Many/List operation) are plain `string` fields too — matches the established, reviewed convention already used by `order/getAll.ts`, `subscription/getAll.ts`, `refund/getAll.ts`, `checkout/getAll.ts`, `benefitGrant/getAll.ts` (all use bare `customer_id`/`external_customer_id` string filters, not `resourceLocator`/`customerLocator`). Do NOT introduce a `meterLocator` helper or a `getMeters`/`getMeterOptions` registration — nothing in this lot needs a friendly picker for Meter (it's only ever filtered by ID, never picked while composing another resource's body), and Lot 1b's final review flagged an analogous unused `listSearch` registration (`getBenefits`) as dead-code Minor finding — do not repeat that mistake.
- `type: 'collection'` (not `fixedCollection`) is the established pattern for a flat, all-optional "Filters" or "Update Fields" group: entries are only sent in the request when the user explicitly adds them via "Add Field"/"Add Filter" — this is what makes Update operations safe against Lot 1b's C2/C3/C4 bug class (silently wiping data the user never intended to touch). Every simple scalar Update field in this lot goes in an "Update Fields" `collection`, exactly like `discount/update.ts`. Only the two genuinely composite fields (Meter's `filter` and `aggregation`) sit outside that collection, as standalone top-level properties with their own composite-assembly routing — a bare `collection` sub-item cannot run the array-mapping/JSON-parsing logic those two need.
- `options`/`collection`/`multiOptions` arrays with 5 or more items must be alphabetized by `displayName` (lint rule `node-param-options-type-unsorted-items` / `node-param-collection-type-unsorted-items`) — every such array below is already written in alphabetical order; preserve it exactly, do not "improve" the ordering.
- Boolean field descriptions must contain the word "whether" (lint rule `node-param-description-boolean-without-whether`).
- Run `npm run lint` and `npm run build` before any task is considered done — both must pass clean.

## Task 1: Meter resource

**Files:**
- Create: `nodes/Polar/resources/meter/getAll.ts`
- Create: `nodes/Polar/resources/meter/get.ts`
- Create: `nodes/Polar/resources/meter/create.ts`
- Create: `nodes/Polar/resources/meter/update.ts`
- Create: `nodes/Polar/resources/meter/getQuantities.ts`
- Create: `nodes/Polar/resources/meter/index.ts`
- Modify: `nodes/Polar/Polar.node.ts`

**Interfaces:**
- Consumes: `paginationProperties(show)`, `metadataField(fieldName, bodyProperty, displayName, show)` from `../../shared/descriptions`.
- Produces: `meterDescription` (exported from `index.ts`), imported and spread into `Polar.node.ts`'s `properties` array. Resource dropdown gains `{ name: 'Meter', value: 'meter' }`, inserted alphabetically between `Event Type` and `Order` (this task only adds the Meter entry; Task 3 adds Event/Event Type/Customer Meter — see Task 1's exact `Polar.node.ts` diff below, which anticipates the final alphabetical position but only wires Meter itself; if Task 1 runs before Task 3, insert Meter directly after the current last resource before `Order`, i.e. between `Customer` and `Discount` is WRONG — the correct alphabetical slot for `Meter` alone, before the other three exist, is between `Discount` and `Order`).

- [ ] **Step 1: Create `nodes/Polar/resources/meter/getAll.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../shared/descriptions';

const show = { resource: ['meter'], operation: ['getAll'] };

export const meterGetAllDescription: INodeProperties[] = [
	...paginationProperties(show),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show },
		options: [
			{
				displayName: 'Is Archived',
				name: 'is_archived',
				type: 'boolean',
				default: false,
				description: 'Whether to only return archived (or only non-archived) meters',
				routing: { request: { qs: { is_archived: '={{$value}}' } } },
			},
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				default: '',
				description: 'Filter meters by name',
				routing: { request: { qs: { query: '={{$value}}' } } },
			},
		],
	},
];
```

- [ ] **Step 2: Create `nodes/Polar/resources/meter/get.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['meter'], operation: ['get'] };

export const meterGetDescription: INodeProperties[] = [
	{
		displayName: 'Meter ID',
		name: 'meterId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
];
```

- [ ] **Step 3: Create `nodes/Polar/resources/meter/create.ts`**

Polar's `MeterCreate` body: `name` (required), `unit` (enum, default `scalar`), `custom_label`/`custom_multiplier` (only meaningful when `unit: custom`), `metadata`, `filter` (required — a `Filter` object: `{conjunction: 'and'|'or', clauses: [...]}`, real schema is recursive but the UI builder below only supports one flat level, with a JSON escape hatch for deeper nesting — approved in the design spec, matches how Polar's own `GET /v1/events/` `filter` query param already expects raw filter JSON from power users), `aggregation` (required — discriminated on `func`: `count` takes no `property`, the other five (`avg`/`max`/`min`/`sum`/`unique`) require one).

The `Aggregation Property` field is only shown for non-`count` functions, so when `func: count`, its `routing.send` never fires — a hidden `Aggregation (Count)` field covers exactly that case so the `aggregation` body key is always sent under mutually-exclusive `displayOptions`, never via last-field-wins.

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { metadataField } from '../../shared/descriptions';

const show = { resource: ['meter'], operation: ['create'] };
const showCustomUnit = { ...show, unit: ['custom'] };
const showAggregationProperty = { ...show, aggregationFunc: ['avg', 'max', 'min', 'sum', 'unique'] };
const showAggregationCount = { ...show, aggregationFunc: ['count'] };

export const meterCreateDescription: INodeProperties[] = [
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: "The meter's name. Shown on customer invoices and usage.",
		routing: { send: { type: 'body', property: 'name' } },
	},
	{
		displayName: 'Unit',
		name: 'unit',
		type: 'options',
		options: [
			{ name: 'Custom', value: 'custom' },
			{ name: 'Scalar', value: 'scalar' },
			{ name: 'Token', value: 'token' },
		],
		default: 'scalar',
		displayOptions: { show },
		description: 'The unit of the meter',
		routing: { send: { type: 'body', property: 'unit' } },
	},
	{
		displayName: 'Custom Label',
		name: 'customLabel',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: showCustomUnit },
		description: "The label for the custom unit, e.g. 'request'",
		routing: { send: { type: 'body', property: 'custom_label' } },
	},
	{
		displayName: 'Custom Multiplier',
		name: 'customMultiplier',
		type: 'number',
		default: 1,
		typeOptions: { minValue: 1 },
		displayOptions: { show: showCustomUnit },
		description: 'The multiplier to convert from the base unit to display scale, e.g. 1000 to display per 1000 units',
		routing: { send: { type: 'body', property: 'custom_multiplier' } },
	},
	metadataField('metadata', 'metadata', 'Metadata', show),
	{
		displayName: 'Filter Conjunction',
		name: 'filterConjunction',
		type: 'options',
		options: [
			{ name: 'AND (All Clauses Must Match)', value: 'and' },
			{ name: 'OR (Any Clause May Match)', value: 'or' },
		],
		default: 'and',
		displayOptions: { show },
		description: 'How the filter clauses below are combined',
	},
	{
		displayName: 'Filter Clauses',
		name: 'filterClauses',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true, multipleValueButtonText: 'Add Clause' },
		default: {},
		displayOptions: { show },
		description: 'Events must match this filter to be included in the meter. Ignored if "Filter (JSON)" below is set.',
		options: [
			{
				displayName: 'Clause',
				name: 'clause',
				values: [
					{
						displayName: 'Property',
						name: 'property',
						type: 'string',
						default: '',
						description: "Event property to filter on, e.g. 'name' or a metadata key",
					},
					{
						displayName: 'Operator',
						name: 'operator',
						type: 'options',
						options: [
							{ name: 'Equals', value: 'eq' },
							{ name: 'Greater Than', value: 'gt' },
							{ name: 'Greater Than or Equal', value: 'gte' },
							{ name: 'Less Than', value: 'lt' },
							{ name: 'Less Than or Equal', value: 'lte' },
							{ name: 'Like', value: 'like' },
							{ name: 'Not Equals', value: 'ne' },
							{ name: 'Not Like', value: 'not_like' },
						],
						default: 'eq',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						description: 'Compared as text by default; use a number- or boolean-looking value to compare numerically or as a boolean',
					},
				],
			},
		],
	},
	{
		displayName: 'Filter (JSON)',
		name: 'filterJson',
		type: 'string',
		typeOptions: { rows: 4 },
		default: '',
		displayOptions: { show },
		description:
			'Advanced: paste a raw Polar filter object as JSON to support nested filter groups (the visual builder above only supports one flat level). Overrides "Filter Conjunction"/"Filter Clauses" when set.',
		routing: {
			send: {
				type: 'body',
				property: 'filter',
				value:
					'={{ $value ? JSON.parse($value) : { conjunction: $parameter["filterConjunction"], clauses: ($parameter["filterClauses"].clause || []).map((c) => ({ property: c.property, operator: c.operator, value: c.value })) } }}',
			},
		},
	},
	{
		displayName: 'Aggregation Function',
		name: 'aggregationFunc',
		type: 'options',
		options: [
			{ name: 'Average', value: 'avg' },
			{ name: 'Count', value: 'count' },
			{ name: 'Maximum', value: 'max' },
			{ name: 'Minimum', value: 'min' },
			{ name: 'Sum', value: 'sum' },
			{ name: 'Unique', value: 'unique' },
		],
		default: 'count',
		displayOptions: { show },
		description: 'How matched events are aggregated to calculate the meter',
	},
	{
		displayName: 'Aggregation (Count)',
		name: 'aggregationCount',
		type: 'hidden',
		default: {},
		displayOptions: { show: showAggregationCount },
		routing: {
			send: {
				type: 'body',
				property: 'aggregation',
				value: '={{ { func: "count" } }}',
			},
		},
	},
	{
		displayName: 'Aggregation Property',
		name: 'aggregationProperty',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: showAggregationProperty },
		description: "Event property to aggregate, e.g. a metadata key holding a numeric value. Not used for 'Count'.",
		routing: {
			send: {
				type: 'body',
				property: 'aggregation',
				value: '={{ { func: $parameter["aggregationFunc"], property: $value } }}',
			},
		},
	},
];
```

- [ ] **Step 4: Create `nodes/Polar/resources/meter/update.ts`**

`MeterUpdate` fields are all optional. Simple scalars (`name`, `unit`, `custom_label`, `custom_multiplier`, `is_archived`) go in an "Update Fields" `collection` (omitted from the request unless the user adds them — no `undefined`-guard needed, that's the `collection` type's own behavior). `filter`/`aggregation` stay top-level (need composite assembly) but must be entirely omittable — `filter` is omitted when neither `filterClauses` nor `filterJson` are set; `aggregation` is omitted when `aggregationFunc` is left at its `Do Not Change` default.

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { metadataField } from '../../shared/descriptions';

const show = { resource: ['meter'], operation: ['update'] };
const showAggregationProperty = { ...show, aggregationFunc: ['avg', 'max', 'min', 'sum', 'unique'] };
const showAggregationCount = { ...show, aggregationFunc: ['count'] };

export const meterUpdateDescription: INodeProperties[] = [
	{
		displayName: 'Meter ID',
		name: 'meterId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
	metadataField('metadata', 'metadata', 'Metadata', show),
	{
		displayName: 'Filter Conjunction',
		name: 'filterConjunction',
		type: 'options',
		options: [
			{ name: 'AND (All Clauses Must Match)', value: 'and' },
			{ name: 'OR (Any Clause May Match)', value: 'or' },
		],
		default: 'and',
		displayOptions: { show },
		description:
			'How the filter clauses below are combined. Ignored (and the meter\'s existing filter left unchanged) if neither Filter Clauses nor Filter (JSON) below are set.',
	},
	{
		displayName: 'Filter Clauses',
		name: 'filterClauses',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true, multipleValueButtonText: 'Add Clause' },
		default: {},
		displayOptions: { show },
		description: 'Leave empty (and "Filter (JSON)" below empty too) to keep the meter\'s existing filter unchanged',
		options: [
			{
				displayName: 'Clause',
				name: 'clause',
				values: [
					{ displayName: 'Property', name: 'property', type: 'string', default: '' },
					{
						displayName: 'Operator',
						name: 'operator',
						type: 'options',
						options: [
							{ name: 'Equals', value: 'eq' },
							{ name: 'Greater Than', value: 'gt' },
							{ name: 'Greater Than or Equal', value: 'gte' },
							{ name: 'Less Than', value: 'lt' },
							{ name: 'Less Than or Equal', value: 'lte' },
							{ name: 'Like', value: 'like' },
							{ name: 'Not Equals', value: 'ne' },
							{ name: 'Not Like', value: 'not_like' },
						],
						default: 'eq',
					},
					{ displayName: 'Value', name: 'value', type: 'string', default: '' },
				],
			},
		],
	},
	{
		displayName: 'Filter (JSON)',
		name: 'filterJson',
		type: 'string',
		typeOptions: { rows: 4 },
		default: '',
		displayOptions: { show },
		description:
			'Advanced: paste a raw Polar filter object as JSON to support nested filter groups. Overrides "Filter Conjunction"/"Filter Clauses" when set.',
		routing: {
			send: {
				type: 'body',
				property: 'filter',
				value:
					'={{ $value ? JSON.parse($value) : (($parameter["filterClauses"].clause || []).length ? { conjunction: $parameter["filterConjunction"], clauses: $parameter["filterClauses"].clause.map((c) => ({ property: c.property, operator: c.operator, value: c.value })) } : undefined) }}',
			},
		},
	},
	{
		displayName: 'Aggregation Function',
		name: 'aggregationFunc',
		type: 'options',
		options: [
			{ name: 'Do Not Change', value: '' },
			{ name: 'Average', value: 'avg' },
			{ name: 'Count', value: 'count' },
			{ name: 'Maximum', value: 'max' },
			{ name: 'Minimum', value: 'min' },
			{ name: 'Sum', value: 'sum' },
			{ name: 'Unique', value: 'unique' },
		],
		default: '',
		displayOptions: { show },
		description: "Leave as 'Do Not Change' to keep the meter's existing aggregation unchanged",
	},
	{
		displayName: 'Aggregation (Count)',
		name: 'aggregationCount',
		type: 'hidden',
		default: {},
		displayOptions: { show: showAggregationCount },
		routing: {
			send: {
				type: 'body',
				property: 'aggregation',
				value: '={{ { func: "count" } }}',
			},
		},
	},
	{
		displayName: 'Aggregation Property',
		name: 'aggregationProperty',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: showAggregationProperty },
		description: 'Event property to aggregate, e.g. a metadata key holding a numeric value',
		routing: {
			send: {
				type: 'body',
				property: 'aggregation',
				value: '={{ { func: $parameter["aggregationFunc"], property: $value } }}',
			},
		},
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show },
		options: [
			{
				displayName: 'Custom Label',
				name: 'custom_label',
				type: 'string',
				default: '',
				description: "Only used when Unit below is set to 'custom'",
				routing: { request: { body: { custom_label: '={{$value}}' } } },
			},
			{
				displayName: 'Custom Multiplier',
				name: 'custom_multiplier',
				type: 'number',
				default: 1,
				description: "Only used when Unit below is set to 'custom'",
				routing: { request: { body: { custom_multiplier: '={{$value}}' } } },
			},
			{
				displayName: 'Is Archived',
				name: 'is_archived',
				type: 'boolean',
				default: false,
				description: 'Whether to archive (or unarchive) the meter',
				routing: { request: { body: { is_archived: '={{$value}}' } } },
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: "The meter's name. Shown on customer invoices and usage.",
				routing: { request: { body: { name: '={{$value}}' } } },
			},
			{
				displayName: 'Unit',
				name: 'unit',
				type: 'options',
				options: [
					{ name: 'Custom', value: 'custom' },
					{ name: 'Scalar', value: 'scalar' },
					{ name: 'Token', value: 'token' },
				],
				default: 'scalar',
				routing: { request: { body: { unit: '={{$value}}' } } },
			},
		],
	},
];
```

- [ ] **Step 5: Create `nodes/Polar/resources/meter/getQuantities.ts`**

`GET /v1/meters/{id}/quantities` — `start_timestamp`/`end_timestamp`/`interval` required; `timezone`, `customer_id`, `external_customer_id`, `customer_aggregation_function` optional.

```typescript
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['meter'], operation: ['getQuantities'] };

export const meterGetQuantitiesDescription: INodeProperties[] = [
	{
		displayName: 'Meter ID',
		name: 'meterId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
	{
		displayName: 'Start Timestamp',
		name: 'startTimestamp',
		type: 'dateTime',
		default: '',
		required: true,
		displayOptions: { show },
		routing: { request: { qs: { start_timestamp: '={{$value}}' } } },
	},
	{
		displayName: 'End Timestamp',
		name: 'endTimestamp',
		type: 'dateTime',
		default: '',
		required: true,
		displayOptions: { show },
		routing: { request: { qs: { end_timestamp: '={{$value}}' } } },
	},
	{
		displayName: 'Interval',
		name: 'interval',
		type: 'options',
		options: [
			{ name: 'Day', value: 'day' },
			{ name: 'Hour', value: 'hour' },
			{ name: 'Month', value: 'month' },
			{ name: 'Week', value: 'week' },
			{ name: 'Year', value: 'year' },
		],
		default: 'day',
		required: true,
		displayOptions: { show },
		routing: { request: { qs: { interval: '={{$value}}' } } },
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show },
		options: [
			{
				displayName: 'Customer Aggregation Function',
				name: 'customer_aggregation_function',
				type: 'options',
				options: [
					{ name: 'Average', value: 'avg' },
					{ name: 'Count', value: 'count' },
					{ name: 'Maximum', value: 'max' },
					{ name: 'Minimum', value: 'min' },
					{ name: 'Sum', value: 'sum' },
					{ name: 'Unique', value: 'unique' },
				],
				default: 'sum',
				description:
					'If set, quantities are first computed per customer before being aggregated with this function. Leave unset to aggregate across all customers directly.',
				routing: { request: { qs: { customer_aggregation_function: '={{$value}}' } } },
			},
			{
				displayName: 'Customer ID',
				name: 'customer_id',
				type: 'string',
				default: '',
				routing: { request: { qs: { customer_id: '={{$value}}' } } },
			},
			{
				displayName: 'External Customer ID',
				name: 'external_customer_id',
				type: 'string',
				default: '',
				routing: { request: { qs: { external_customer_id: '={{$value}}' } } },
			},
			{
				displayName: 'Timezone',
				name: 'timezone',
				type: 'string',
				default: 'UTC',
				description: 'Timezone to use for the timestamps',
				routing: { request: { qs: { timezone: '={{$value}}' } } },
			},
		],
	},
];
```

- [ ] **Step 6: Create `nodes/Polar/resources/meter/index.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { meterGetAllDescription } from './getAll';
import { meterGetDescription } from './get';
import { meterCreateDescription } from './create';
import { meterUpdateDescription } from './update';
import { meterGetQuantitiesDescription } from './getQuantities';

const showOnlyForMeter = { resource: ['meter'] };

export const meterDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForMeter },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a meter',
				description: 'Create a new meter',
				routing: { request: { method: 'POST', url: '=/meters/' } },
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a meter',
				description: 'Get a single meter by ID',
				routing: { request: { method: 'GET', url: '=/meters/{{$parameter["meterId"]}}' } },
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many meters',
				description: 'Get many meters',
				routing: { request: { method: 'GET', url: '=/meters/' } },
			},
			{
				name: 'Get Quantities',
				value: 'getQuantities',
				action: 'Get meter quantities',
				description: "Get a meter's usage quantities over a time period",
				routing: { request: { method: 'GET', url: '=/meters/{{$parameter["meterId"]}}/quantities' } },
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a meter',
				description: 'Update an existing meter',
				routing: { request: { method: 'PATCH', url: '=/meters/{{$parameter["meterId"]}}' } },
			},
		],
		default: 'getAll',
	},
	...meterGetAllDescription,
	...meterGetDescription,
	...meterCreateDescription,
	...meterUpdateDescription,
	...meterGetQuantitiesDescription,
];
```

- [ ] **Step 7: Edit `nodes/Polar/Polar.node.ts`**

Add the import (alphabetically among the resource imports — after the `subscriptionDescription`/`refundDescription` pair, following this file's existing non-strict-but-grouped import order, place it directly after `import { productDescription } from './resources/product';` and before `import { subscriptionDescription } from './resources/subscription';`... actually simplest: add `import { meterDescription } from './resources/meter';` right after the `orderDescription` import line, keeping the resource-import block in the same relative order the file already uses):

```typescript
import { meterDescription } from './resources/meter';
```

Add `{ name: 'Meter', value: 'meter' }` to the `Resource` options array, positioned between `Discount` and `Order` (Task 3 will later insert `Customer Meter`/`Event`/`Event Type` around it — inserting Meter now between Discount/Order is correct for this task in isolation and stays correct after Task 3 adds the other three, since `Event`/`Event Type` sort before `Meter` and `Customer Meter` sorts before `Discount`).

Add `...meterDescription,` to the `properties` array spread list, in the same relative position as the Resource option (after `...discountDescription,` and before `...orderDescription,`).

- [ ] **Step 8: Verify**

Run `npm run lint` and `npm run build`. Both must pass clean.

- [ ] **Step 9: Commit**

```bash
git add nodes/Polar/resources/meter nodes/Polar/Polar.node.ts
git commit -m "feat: add Meter resource"
```

## Task 2: Event resource

**Files:**
- Create: `nodes/Polar/resources/event/getAll.ts`
- Create: `nodes/Polar/resources/event/get.ts`
- Create: `nodes/Polar/resources/event/listNames.ts`
- Create: `nodes/Polar/resources/event/ingest.ts`
- Create: `nodes/Polar/resources/event/index.ts`
- Modify: `nodes/Polar/Polar.node.ts`

**Interfaces:**
- Consumes: `paginationProperties(show)` from `../../shared/descriptions`.
- Produces: `eventDescription`. Resource dropdown gains `{ name: 'Event', value: 'event' }`, inserted alphabetically between `Discount` and `Event Type` (which does not exist yet if Task 3 hasn't run — insert directly after `Discount` and before `Meter`; Task 3 will insert `Event Type` between this and `Meter` later).

- [ ] **Step 1: Create `nodes/Polar/resources/event/getAll.ts`**

`GET /v1/events/` filters used here: `customer_id`, `external_customer_id`, `meter_id`, `name`, `source`, `query`, `parent_id`, `depth`, `start_timestamp`, `end_timestamp` (the API's `organization_id`, `metadata`, and `sorting` params are skipped, matching Lot 1's convention of never exposing organization-scoping or metadata-query filters on any resource).

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../shared/descriptions';

const show = { resource: ['event'], operation: ['getAll'] };

export const eventGetAllDescription: INodeProperties[] = [
	...paginationProperties(show),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show },
		options: [
			{
				displayName: 'Customer ID',
				name: 'customer_id',
				type: 'string',
				default: '',
				routing: { request: { qs: { customer_id: '={{$value}}' } } },
			},
			{
				displayName: 'Depth',
				name: 'depth',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0, maxValue: 5 },
				description:
					'Fetch descendants up to this depth (0 = root events only, 1 = roots + children, etc.). Leave this field out entirely to return all events regardless of depth.',
				routing: { request: { qs: { depth: '={{$value}}' } } },
			},
			{
				displayName: 'End Timestamp',
				name: 'end_timestamp',
				type: 'dateTime',
				default: '',
				routing: { request: { qs: { end_timestamp: '={{$value}}' } } },
			},
			{
				displayName: 'External Customer ID',
				name: 'external_customer_id',
				type: 'string',
				default: '',
				routing: { request: { qs: { external_customer_id: '={{$value}}' } } },
			},
			{
				displayName: 'Meter ID',
				name: 'meter_id',
				type: 'string',
				default: '',
				description: "Filter to events matching a meter's filter clause",
				routing: { request: { qs: { meter_id: '={{$value}}' } } },
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'Filter by event name',
				routing: { request: { qs: { name: '={{$value}}' } } },
			},
			{
				displayName: 'Parent ID',
				name: 'parent_id',
				type: 'string',
				default: '',
				description: 'When combined with Depth, use this event as the anchor instead of root events',
				routing: { request: { qs: { parent_id: '={{$value}}' } } },
			},
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				default: '',
				routing: { request: { qs: { query: '={{$value}}' } } },
			},
			{
				displayName: 'Source',
				name: 'source',
				type: 'options',
				options: [
					{ name: 'System', value: 'system' },
					{ name: 'User', value: 'user' },
				],
				default: 'user',
				routing: { request: { qs: { source: '={{$value}}' } } },
			},
			{
				displayName: 'Start Timestamp',
				name: 'start_timestamp',
				type: 'dateTime',
				default: '',
				routing: { request: { qs: { start_timestamp: '={{$value}}' } } },
			},
		],
	},
];
```

- [ ] **Step 2: Create `nodes/Polar/resources/event/get.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['event'], operation: ['get'] };

export const eventGetDescription: INodeProperties[] = [
	{
		displayName: 'Event ID',
		name: 'eventId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
];
```

- [ ] **Step 3: Create `nodes/Polar/resources/event/listNames.ts`**

`GET /v1/events/names` — paginated, with `customer_id`/`external_customer_id`/`query`/`source` filters.

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../shared/descriptions';

const show = { resource: ['event'], operation: ['listNames'] };

export const eventListNamesDescription: INodeProperties[] = [
	...paginationProperties(show),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show },
		options: [
			{
				displayName: 'Customer ID',
				name: 'customer_id',
				type: 'string',
				default: '',
				routing: { request: { qs: { customer_id: '={{$value}}' } } },
			},
			{
				displayName: 'External Customer ID',
				name: 'external_customer_id',
				type: 'string',
				default: '',
				routing: { request: { qs: { external_customer_id: '={{$value}}' } } },
			},
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				default: '',
				description: 'Filter event names by this search query',
				routing: { request: { qs: { query: '={{$value}}' } } },
			},
			{
				displayName: 'Source',
				name: 'source',
				type: 'options',
				options: [
					{ name: 'System', value: 'system' },
					{ name: 'User', value: 'user' },
				],
				default: 'user',
				routing: { request: { qs: { source: '={{$value}}' } } },
			},
		],
	},
];
```

- [ ] **Step 4: Create `nodes/Polar/resources/event/ingest.ts`**

`POST /v1/events/ingest` body: `{ events: [...] }`, each item either an `EventCreateCustomer` (has `customer_id`) or `EventCreateExternalCustomer` (has `external_customer_id`) — otherwise identical shape (`name` required; `timestamp`, `external_id`, `parent_id`, `metadata`, `member_id` all optional). Per the design spec's ruling, this is built as a repeatable `fixedCollection` where each entry simply offers BOTH ID fields side by side (matching this codebase's existing convention for internal-vs-external customer identification, e.g. `order/getAll.ts`'s `customer_id`/`external_customer_id` filter pair — no toggle needed) — the assembly function picks whichever one is filled in per entry, preferring `customerId` if both are somehow set.

`buildEventsArray` is embedded into the routing expression via `.toString()` (same technique as `nextPageInfo`/`buildPricesArray`) — it must stay fully self-contained (only its own parameter, no closures).

```typescript
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['event'], operation: ['ingest'] };

type IngestEventEntry = {
	name: string;
	customerId?: string;
	externalCustomerId?: string;
	timestamp?: string;
	externalId?: string;
	parentId?: string;
	memberId?: string;
	metadata?: { field?: Array<{ key: string; value: string }> };
};

function buildEventsArray(entries: IngestEventEntry[]) {
	return entries.map((e) => {
		const event: Record<string, unknown> = { name: e.name };
		if (e.customerId) {
			event.customer_id = e.customerId;
		} else if (e.externalCustomerId) {
			event.external_customer_id = e.externalCustomerId;
		}
		if (e.timestamp) event.timestamp = e.timestamp;
		if (e.externalId) event.external_id = e.externalId;
		if (e.parentId) event.parent_id = e.parentId;
		if (e.memberId) event.member_id = e.memberId;
		if (e.metadata && e.metadata.field && e.metadata.field.length) {
			event.metadata = Object.fromEntries(e.metadata.field.map((f) => [f.key, f.value]));
		}
		return event;
	});
}

export const eventIngestDescription: INodeProperties[] = [
	{
		displayName: 'Events',
		name: 'events',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true, multipleValueButtonText: 'Add Event' },
		default: {},
		required: true,
		displayOptions: { show },
		description: 'The batch of events to ingest. Provide exactly one of Customer ID / External Customer ID per event.',
		options: [
			{
				displayName: 'Event',
				name: 'event',
				values: [
					{ displayName: 'Event Name', name: 'name', type: 'string', default: '', required: true },
					{ displayName: 'Customer ID', name: 'customerId', type: 'string', default: '' },
					{ displayName: 'External Customer ID', name: 'externalCustomerId', type: 'string', default: '' },
					{
						displayName: 'Timestamp',
						name: 'timestamp',
						type: 'dateTime',
						default: '',
						description: 'Defaults to the current time if left empty',
					},
					{
						displayName: 'External ID',
						name: 'externalId',
						type: 'string',
						default: '',
						description: 'Your own unique identifier for this event, useful for deduplication',
					},
					{
						displayName: 'Parent ID',
						name: 'parentId',
						type: 'string',
						default: '',
						description: 'A Polar event ID or your own External ID of the parent event, for correlated usage',
					},
					{
						displayName: 'Member ID',
						name: 'memberId',
						type: 'string',
						default: '',
						description:
							"ID of the member within the customer's organization who performed the action (B2B attribution). Only applies alongside Customer ID.",
					},
					{
						displayName: 'Metadata',
						name: 'metadata',
						type: 'fixedCollection',
						typeOptions: { multipleValues: true, multipleValueButtonText: 'Add Metadata Field' },
						default: {},
						options: [
							{
								displayName: 'Field',
								name: 'field',
								values: [
									{ displayName: 'Key', name: 'key', type: 'string', default: '' },
									{ displayName: 'Value', name: 'value', type: 'string', default: '' },
								],
							},
						],
					},
				],
			},
		],
		routing: {
			send: {
				type: 'body',
				property: 'events',
				value: `={{ (${buildEventsArray.toString()})($value.event || []) }}`,
			},
		},
	},
];
```

- [ ] **Step 5: Create `nodes/Polar/resources/event/index.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { eventGetAllDescription } from './getAll';
import { eventGetDescription } from './get';
import { eventListNamesDescription } from './listNames';
import { eventIngestDescription } from './ingest';

const showOnlyForEvent = { resource: ['event'] };

export const eventDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForEvent },
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get an event',
				description: 'Get a single event by ID',
				routing: { request: { method: 'GET', url: '=/events/{{$parameter["eventId"]}}' } },
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many events',
				description: 'Get many events',
				routing: { request: { method: 'GET', url: '=/events/' } },
			},
			{
				name: 'Ingest',
				value: 'ingest',
				action: 'Ingest events',
				description: 'Ingest a batch of usage events',
				routing: { request: { method: 'POST', url: '=/events/ingest' } },
			},
			{
				name: 'List Names',
				value: 'listNames',
				action: 'List event names',
				description: 'List the distinct event names seen for this organization',
				routing: { request: { method: 'GET', url: '=/events/names' } },
			},
		],
		default: 'getAll',
	},
	...eventGetAllDescription,
	...eventGetDescription,
	...eventListNamesDescription,
	...eventIngestDescription,
];
```

- [ ] **Step 6: Edit `nodes/Polar/Polar.node.ts`**

Add `import { eventDescription } from './resources/event';` grouped with the other resource imports.

Add `{ name: 'Event', value: 'event' }` to the `Resource` options array, positioned directly after `Discount` and before `Meter` (Task 1's entry).

Add `...eventDescription,` to the `properties` array spread list, after `...discountDescription,` and before `...meterDescription,`.

- [ ] **Step 7: Verify**

Run `npm run lint` and `npm run build`. Both must pass clean.

- [ ] **Step 8: Commit**

```bash
git add nodes/Polar/resources/event nodes/Polar/Polar.node.ts
git commit -m "feat: add Event resource"
```

## Task 3: Event Type + Customer Meter resources

Both resources are small (2 operations each) and unrelated to each other beyond both being usage-billing reporting surfaces — bundled into one task the same way Lot 1b bundled Benefit + Benefit Grant.

**Files:**
- Create: `nodes/Polar/resources/eventType/getAll.ts`
- Create: `nodes/Polar/resources/eventType/update.ts`
- Create: `nodes/Polar/resources/eventType/index.ts`
- Create: `nodes/Polar/resources/customerMeter/getAll.ts`
- Create: `nodes/Polar/resources/customerMeter/get.ts`
- Create: `nodes/Polar/resources/customerMeter/index.ts`
- Modify: `nodes/Polar/Polar.node.ts`

**Interfaces:**
- Consumes: `paginationProperties(show)` from `../../shared/descriptions`.
- Produces: `eventTypeDescription`, `customerMeterDescription`. Resource dropdown gains `{ name: 'Event Type', value: 'eventType' }` (between `Event` and `Meter`) and `{ name: 'Customer Meter', value: 'customerMeter' }` (between `Customer` and `Discount`).

- [ ] **Step 1: Create `nodes/Polar/resources/eventType/getAll.ts`**

`GET /v1/event-types/` filters: `customer_id`, `external_customer_id`, `parent_id`, `query` (searches name/label), `root_events` (boolean), `source`.

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../shared/descriptions';

const show = { resource: ['eventType'], operation: ['getAll'] };

export const eventTypeGetAllDescription: INodeProperties[] = [
	...paginationProperties(show),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show },
		options: [
			{
				displayName: 'Customer ID',
				name: 'customer_id',
				type: 'string',
				default: '',
				routing: { request: { qs: { customer_id: '={{$value}}' } } },
			},
			{
				displayName: 'External Customer ID',
				name: 'external_customer_id',
				type: 'string',
				default: '',
				routing: { request: { qs: { external_customer_id: '={{$value}}' } } },
			},
			{
				displayName: 'Parent ID',
				name: 'parent_id',
				type: 'string',
				default: '',
				description: 'Filter by a specific parent event ID',
				routing: { request: { qs: { parent_id: '={{$value}}' } } },
			},
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				default: '',
				description: 'Filter event types by name or label',
				routing: { request: { qs: { query: '={{$value}}' } } },
			},
			{
				displayName: 'Root Events Only',
				name: 'root_events',
				type: 'boolean',
				default: false,
				description: 'Whether to only return event types that have root events (no parent)',
				routing: { request: { qs: { root_events: '={{$value}}' } } },
			},
			{
				displayName: 'Source',
				name: 'source',
				type: 'options',
				options: [
					{ name: 'System', value: 'system' },
					{ name: 'User', value: 'user' },
				],
				default: 'user',
				routing: { request: { qs: { source: '={{$value}}' } } },
			},
		],
	},
];
```

- [ ] **Step 2: Create `nodes/Polar/resources/eventType/update.ts`**

`PATCH /v1/event-types/{id}` body: `EventTypeUpdate` — `label` (required, max 128 chars), `label_property_selector` (optional, nullable).

```typescript
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['eventType'], operation: ['update'] };

export const eventTypeUpdateDescription: INodeProperties[] = [
	{
		displayName: 'Event Type ID',
		name: 'eventTypeId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
	{
		displayName: 'Label',
		name: 'label',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'The label for the event type',
		routing: { send: { type: 'body', property: 'label' } },
	},
	{
		displayName: 'Label Property Selector',
		name: 'labelPropertySelector',
		type: 'string',
		default: '',
		displayOptions: { show },
		description: "Property path to extract a dynamic label from event metadata (e.g. 'subject' or 'metadata.subject')",
		routing: { send: { type: 'body', property: 'label_property_selector', value: '={{$value || undefined}}' } },
	},
];
```

- [ ] **Step 3: Create `nodes/Polar/resources/eventType/index.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { eventTypeGetAllDescription } from './getAll';
import { eventTypeUpdateDescription } from './update';

const showOnlyForEventType = { resource: ['eventType'] };

export const eventTypeDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForEventType },
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many event types',
				description: 'Get many event types',
				routing: { request: { method: 'GET', url: '=/event-types/' } },
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update an event type',
				description: "Update an event type's label",
				routing: { request: { method: 'PATCH', url: '=/event-types/{{$parameter["eventTypeId"]}}' } },
			},
		],
		default: 'getAll',
	},
	...eventTypeGetAllDescription,
	...eventTypeUpdateDescription,
];
```

- [ ] **Step 4: Create `nodes/Polar/resources/customerMeter/getAll.ts`**

`GET /v1/customer-meters/` filters: `customer_id`, `external_customer_id`, `meter_id`.

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../shared/descriptions';

const show = { resource: ['customerMeter'], operation: ['getAll'] };

export const customerMeterGetAllDescription: INodeProperties[] = [
	...paginationProperties(show),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show },
		options: [
			{
				displayName: 'Customer ID',
				name: 'customer_id',
				type: 'string',
				default: '',
				routing: { request: { qs: { customer_id: '={{$value}}' } } },
			},
			{
				displayName: 'External Customer ID',
				name: 'external_customer_id',
				type: 'string',
				default: '',
				routing: { request: { qs: { external_customer_id: '={{$value}}' } } },
			},
			{
				displayName: 'Meter ID',
				name: 'meter_id',
				type: 'string',
				default: '',
				routing: { request: { qs: { meter_id: '={{$value}}' } } },
			},
		],
	},
];
```

- [ ] **Step 5: Create `nodes/Polar/resources/customerMeter/get.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['customerMeter'], operation: ['get'] };

export const customerMeterGetDescription: INodeProperties[] = [
	{
		displayName: 'Customer Meter ID',
		name: 'customerMeterId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
];
```

- [ ] **Step 6: Create `nodes/Polar/resources/customerMeter/index.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { customerMeterGetAllDescription } from './getAll';
import { customerMeterGetDescription } from './get';

const showOnlyForCustomerMeter = { resource: ['customerMeter'] };

export const customerMeterDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForCustomerMeter },
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get a customer meter',
				description: 'Get a single customer meter by ID',
				routing: { request: { method: 'GET', url: '=/customer-meters/{{$parameter["customerMeterId"]}}' } },
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many customer meters',
				description: 'Get many customer meters',
				routing: { request: { method: 'GET', url: '=/customer-meters/' } },
			},
		],
		default: 'getAll',
	},
	...customerMeterGetAllDescription,
	...customerMeterGetDescription,
];
```

- [ ] **Step 7: Edit `nodes/Polar/Polar.node.ts`**

Add imports:

```typescript
import { eventTypeDescription } from './resources/eventType';
import { customerMeterDescription } from './resources/customerMeter';
```

Add to the `Resource` options array: `{ name: 'Event Type', value: 'eventType' }` between `Event` and `Meter`; `{ name: 'Customer Meter', value: 'customerMeter' }` between `Customer` and `Discount`.

Add to the `properties` spread list: `...eventTypeDescription,` between `...eventDescription,` and `...meterDescription,`; `...customerMeterDescription,` between `...customerDescription,` and `...discountDescription,`.

After this task, the full `Resource` options array (in order) must read: Benefit, Benefit Grant, Checkout, Checkout Link, Customer, Customer Meter, Discount, Event, Event Type, Meter, Order, Product, Refund, Subscription — and the `properties` spread list must be in the same relative order.

- [ ] **Step 8: Verify**

Run `npm run lint` and `npm run build`. Both must pass clean.

- [ ] **Step 9: Commit**

```bash
git add nodes/Polar/resources/eventType nodes/Polar/resources/customerMeter nodes/Polar/Polar.node.ts
git commit -m "feat: add Event Type and Customer Meter resources"
```

## Task 4: README update and full-package verification

**Files:**
- Modify: `README.md`

**Interfaces:**
- Produces: documentation reflecting the complete `Polar` node (14 resources: Lot 1a + Lot 1b + Lot 2a) as it now ships.

- [ ] **Step 1: Update the "Nodes" section of `README.md`**

Add to the `### Polar` bullet list, in alphabetical order matching the final Resource dropdown:

```markdown
- **Customer Meter** — Get Many, Get
- **Event** — Get Many, Get, Ingest, List Names
- **Event Type** — Get Many, Update
- **Meter** — Create, Get, Get Many, Get Quantities, Update
```

Insert `Customer Meter` after `Customer`'s existing bullet and before `Discount`'s; insert `Event`/`Event Type` after `Discount`'s bullet and before `Order`'s; insert `Meter` after `Event Type`'s new bullet and before `Order`'s.

- [ ] **Step 2: Full-package verification**

Run, in order:

```bash
npm run lint
npm run build
```

Then statically cross-check `nodes/Polar/Polar.node.ts`'s `Resource` options array against every resource's actual `index.ts` Operation list, confirming: 14 resources total (Benefit, Benefit Grant, Checkout, Checkout Link, Customer, Customer Meter, Discount, Event, Event Type, Meter, Order, Product, Refund, Subscription), alphabetically ordered, and that the `properties` array spread order matches.

If a Sandbox environment is available, run the sequence the design spec's "Testing note" calls for: create a Meter (Count aggregation over a filter matching a test event name is simplest to verify) → Ingest a matching Event for a real Sandbox customer → List/Get that Customer Meter and confirm its balance reflects the ingested event. This exercises Meter, Event, and Customer Meter end-to-end in one pass.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: document Meter, Event, Event Type, and Customer Meter resources"
```

---

## Definition of Done

- [ ] `npm run lint` and `npm run build` succeed with no errors.
- [ ] The `Polar` node exposes 14 resources total (all of Lot 1a/1b plus Meter, Event, Event Type, Customer Meter), manually verified against a Polar Sandbox organization where an environment was available.
- [ ] `README.md` accurately lists every new resource and its operations.
- [ ] No new runtime npm dependency was added.
- [ ] Meter's `filter`/`aggregation` composite bodies and Event Ingest's per-entry event assembly each send exactly the fields for the selected variant/mode, with no cross-variant leakage — the same correctness risk this plan shares with Lot 1a's Subscription task and Lot 1b's Benefit/Product/Discount tasks, and it should get the same file-by-file scrutiny in review.
- [ ] Every Update operation (Meter) omits untouched optional fields from the request rather than sending a value that would silently overwrite existing data — the exact bug class (C2/C3/C4) the Lot 1b final review caught, and the review for this plan should specifically re-verify it was avoided here too.
