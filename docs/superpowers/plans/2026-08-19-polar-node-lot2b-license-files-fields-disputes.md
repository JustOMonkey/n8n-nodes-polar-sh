# Polar Node — Lot 2b: License Keys, Files, Custom Fields, Disputes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four new resources to the `Polar` n8n node — Dispute (read-only), Custom Field (5-way discriminated Create/Update), License Key (admin CRUD + customer-facing Validate/Activate/Deactivate), File (declarative S3-upload primitives) — bringing the node from 14 to 18 resources.

**Architecture:** Same declarative-routing architecture as every prior lot: one file per operation under `nodes/Polar/resources/<resource>/`, an `index.ts` per resource wiring the Operation dropdown, `routing.send`/`routing.request` only (no custom `execute()`), reuse of `shared/descriptions.ts` helpers. This lot adds one new shared helper (`typedMetadataField`) and reuses three existing composite-body idioms verbatim: `billingAddressField`'s single-collection-routing-to-nested-object pattern, the "Update Fields" self-omitting-collection-with-per-option-routing pattern, and the `.toString()`-embedded-pure-function pattern for array/composite assembly (Meter's Aggregation, Event's `buildEventsArray`).

**Tech Stack:** TypeScript, n8n community node SDK (`n8n-node` CLI for lint/build), no new runtime npm dependency.

**Spec:** `docs/superpowers/specs/2026-08-19-polar-node-lot2b-license-files-fields-disputes-design.md`

## Global Constraints

- Auth: reuse the existing `Polar API` credential — no new credential, no new files under `credentials/`.
- One file per operation under `nodes/Polar/resources/<resource>/`, PascalCase-free camelCase directory names matching existing resources (`customField`, `dispute`, `file`, `licenseKey`).
- `organization_id` is never exposed as a field anywhere in this lot — every list/create/action endpoint's `organization_id` is optional-with-null in the real schema and the existing Polar API credential's token is already org-scoped (Lot 1's established convention, reconfirmed for every resource in Lot 2a). **Exception:** License Key's Validate/Activate/Deactivate operations, where `organization_id` is a required top-level field on the request body per the real schema (`LicenseKeyValidate`/`LicenseKeyActivate`/`LicenseKeyDeactivate` all list it as required) — these three operations DO expose an `Organization ID` field, unlike every other operation in the entire package. This is intentional and grounded in the spec, not an inconsistency to fix.
- No `sorting` filter exposed on any Get Many operation in this lot, matching the established Lot 1/2a convention (no resource in the codebase currently exposes a `sorting` filter, confirmed via `grep -r sorting nodes/Polar/resources` returning zero matches before this lot).
- Cross-resource and own-resource ID fields are plain `type: 'string'`, never `resourceLocator`/`loadOptions`.
- 5+-item `options`/`collection`/`fixedCollection` `options` arrays must be alphabetized by `displayName`. This applies to each individual nested options array, not the top-level `INodeProperties[]` list a file exports (top-level field order follows logical grouping, e.g. ID field → required fields → optional groups, matching every existing resource file).
- Boolean field descriptions must contain the word "whether".
- Every new resource inserts into the existing 14-resource alphabetical Resource dropdown and `properties` spread in `Polar.node.ts`. Final 18-resource order: Benefit, Benefit Grant, Checkout, Checkout Link, **Custom Field**, Customer, Customer Meter, Discount, **Dispute**, Event, Event Type, **File**, **License Key**, Meter, Order, Product, Refund, Subscription.
- Run `npm run lint` and `npm run build` after every task; both must be clean before moving to the next task. There is no unit test suite in this package (confirmed: no `tests/` directory, no test script in `package.json`) — lint + build is this project's established verification gate, matching every prior lot.
- Reuse `paginationProperties(show)` for every Get Many operation's `Return All`/`Limit` fields.
- Every "Filters" collection field on a Get Many operation follows the exact pattern in `nodes/Polar/resources/subscription/getAll.ts`: a `type: 'collection'` field named `filters`, `placeholder: 'Add Filter'`, each option routing directly to `qs.<key>`.
- Every self-omitting "Update Fields" collection follows the exact pattern in `nodes/Polar/resources/discount/update.ts`: a `type: 'collection'` field named `updateFields`, `placeholder: 'Add Field'`, each option routing directly to `body.<key>` (no collection-level `value` override — omission is automatic since untouched options never appear in `$value`).
- A "nested optional object" field (an entire sub-object that itself may be entirely absent from the request) follows the exact pattern in `nodes/Polar/shared/descriptions.ts`'s `billingAddressField`: a `type: 'collection'` field whose OWN routing sends `Object.keys($value).length ? $value : undefined` as the parent body key, with each of its own sub-fields carrying no routing of their own (they're pure UI staging, only read via the collection's own `$value`).
- Every `.toString()`-embedded function used in a `routing` expression must be fully self-contained (only its own parameters, no closures) — verify this in the **compiled** `dist/**/*.js` output after `npm run build`, not just the TypeScript source, matching the verification discipline the Lot 2a final review applied.

## Resources

### Dispute (Task 1) — 2 operations, read-only
### Custom Field (Task 2) — 5 operations, discriminated Create/Update, introduces `typedMetadataField`
### License Key (Task 3) — 7 operations, consumes `typedMetadataField` from Task 2
### File (Task 4) — 5 operations, declarative S3-upload primitives
### README + final verification (Task 5)

---

### Task 1: Dispute resource

**Files:**
- Create: `nodes/Polar/resources/dispute/getAll.ts`
- Create: `nodes/Polar/resources/dispute/get.ts`
- Create: `nodes/Polar/resources/dispute/index.ts`
- Modify: `nodes/Polar/Polar.node.ts` — add import + Resource dropdown entry + `properties` spread entry

**Interfaces:**
- Produces: `disputeDescription: INodeProperties[]` (exported from `resources/dispute/index.ts`), consumed only by `Polar.node.ts`. No other task depends on anything from this task.

- [ ] **Step 1: Create `nodes/Polar/resources/dispute/getAll.ts`**

```ts
import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../shared/descriptions';

const show = { resource: ['dispute'], operation: ['getAll'] };

export const disputeGetAllDescription: INodeProperties[] = [
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
				displayName: 'Order ID',
				name: 'order_id',
				type: 'string',
				default: '',
				description: 'Filter disputes by the ID of the associated order',
				routing: { request: { qs: { order_id: '={{$value}}' } } },
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'multiOptions',
				options: [
					{ name: 'Early Warning', value: 'early_warning' },
					{ name: 'Lost', value: 'lost' },
					{ name: 'Needs Response', value: 'needs_response' },
					{ name: 'Prevented', value: 'prevented' },
					{ name: 'Under Review', value: 'under_review' },
					{ name: 'Won', value: 'won' },
				],
				default: [],
				description: 'Filter disputes by status',
				routing: { request: { qs: { status: '={{$value}}' } } },
			},
		],
	},
];
```

- [ ] **Step 2: Create `nodes/Polar/resources/dispute/get.ts`**

```ts
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['dispute'], operation: ['get'] };

export const disputeGetDescription: INodeProperties[] = [
	{
		displayName: 'Dispute ID',
		name: 'disputeId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
];
```

- [ ] **Step 3: Create `nodes/Polar/resources/dispute/index.ts`**

```ts
import type { INodeProperties } from 'n8n-workflow';
import { disputeGetAllDescription } from './getAll';
import { disputeGetDescription } from './get';

const showOnlyForDispute = { resource: ['dispute'] };

export const disputeDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForDispute },
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get a dispute',
				description: 'Get a single dispute by ID',
				routing: { request: { method: 'GET', url: '=/disputes/{{$parameter["disputeId"]}}' } },
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many disputes',
				description: 'Get many disputes',
				routing: { request: { method: 'GET', url: '=/disputes/' } },
			},
		],
		default: 'getAll',
	},
	...disputeGetAllDescription,
	...disputeGetDescription,
];
```

- [ ] **Step 4: Wire into `nodes/Polar/Polar.node.ts`**

Add the import alphabetically among the existing resource imports (after `discountDescription`, before `eventDescription`):

```ts
import { disputeDescription } from './resources/dispute';
```

Add the Resource dropdown entry alphabetically (after `{ name: 'Discount', value: 'discount' }`, before `{ name: 'Event', value: 'event' }`):

```ts
					{ name: 'Dispute', value: 'dispute' },
```

Add the `properties` spread entry in the same relative position as the import (after `...discountDescription,`, before `...eventDescription,`):

```ts
			...disputeDescription,
```

- [ ] **Step 5: Verify and commit**

Run `npm run lint` and `npm run build`; both must be clean. Commit:

```bash
git add nodes/Polar/resources/dispute nodes/Polar/Polar.node.ts
git commit -m "feat: add Dispute resource"
```

---

### Task 2: Custom Field resource + `typedMetadataField` shared helper

**Files:**
- Modify: `nodes/Polar/shared/descriptions.ts` — add `typedMetadataField` export (insert directly after the existing `metadataField` function, same file, same conventions)
- Create: `nodes/Polar/resources/customField/getAll.ts`
- Create: `nodes/Polar/resources/customField/get.ts`
- Create: `nodes/Polar/resources/customField/create.ts`
- Create: `nodes/Polar/resources/customField/update.ts`
- Create: `nodes/Polar/resources/customField/delete.ts`
- Create: `nodes/Polar/resources/customField/index.ts`
- Modify: `nodes/Polar/Polar.node.ts` — add import + Resource dropdown entry + `properties` spread entry

**Interfaces:**
- Produces: `typedMetadataField(fieldName, bodyProperty, displayName, show)` in `shared/descriptions.ts`, same signature shape as the existing `metadataField`. Task 3 (License Key) imports this function from `'../../shared/descriptions'` — the exact same relative import path every other resource file already uses for `metadataField`/`paginationProperties`. Task 3 must NOT re-declare or copy this function.
- Produces: `customFieldDescription: INodeProperties[]`, consumed only by `Polar.node.ts`.

- [ ] **Step 1: Add `typedMetadataField` to `nodes/Polar/shared/descriptions.ts`**

Insert this function immediately after the existing `metadataField` function (which ends at the line `}` closing its `routing` block, currently around line 126):

```ts
export function typedMetadataField(
	fieldName: string,
	bodyProperty: string,
	displayName: string,
	show: ShowCondition,
): INodeProperties {
	return {
		displayName,
		name: fieldName,
		type: 'fixedCollection',
		typeOptions: { multipleValues: true, multipleValueButtonText: 'Add Field' },
		default: {},
		displayOptions: { show },
		description:
			'Key-value pairs to store additional information (max 50 pairs, key max 40 characters, string value max 500 characters). Values are stored as text by default; use a number- or boolean-looking value to store it as a real number or boolean.',
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
		routing: {
			send: {
				type: 'body',
				property: bodyProperty,
				value:
					'={{ $value.field && $value.field.length ? Object.fromEntries($value.field.map((f) => [f.key, (f.value === "true" ? true : (f.value === "false" ? false : (f.value !== "" && !isNaN(Number(f.value)) ? Number(f.value) : f.value)))])) : undefined }}',
			},
		},
	};
}
```

Do not modify the existing `metadataField` function — it stays exactly as-is, still used by every Lot 1/2a resource with a plain-string `metadata` field.

- [ ] **Step 2: Create `nodes/Polar/resources/customField/getAll.ts`**

```ts
import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../shared/descriptions';

const show = { resource: ['customField'], operation: ['getAll'] };

export const customFieldGetAllDescription: INodeProperties[] = [
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
				displayName: 'Query',
				name: 'query',
				type: 'string',
				default: '',
				description: 'Filter custom fields by name or slug',
				routing: { request: { qs: { query: '={{$value}}' } } },
			},
			{
				displayName: 'Type',
				name: 'type',
				type: 'multiOptions',
				options: [
					{ name: 'Checkbox', value: 'checkbox' },
					{ name: 'Date', value: 'date' },
					{ name: 'Number', value: 'number' },
					{ name: 'Select', value: 'select' },
					{ name: 'Text', value: 'text' },
				],
				default: [],
				description: 'Filter custom fields by type',
				routing: { request: { qs: { type: '={{$value}}' } } },
			},
		],
	},
];
```

- [ ] **Step 3: Create `nodes/Polar/resources/customField/get.ts`**

```ts
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['customField'], operation: ['get'] };

export const customFieldGetDescription: INodeProperties[] = [
	{
		displayName: 'Custom Field ID',
		name: 'customFieldId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
];
```

- [ ] **Step 4: Create `nodes/Polar/resources/customField/create.ts`**

```ts
import type { INodeProperties } from 'n8n-workflow';
import { typedMetadataField } from '../../shared/descriptions';

const show = { resource: ['customField'], operation: ['create'] };
const showCheckbox = { ...show, type: ['checkbox'] };
const showNumberDate = { ...show, type: ['number', 'date'] };
const showText = { ...show, type: ['text'] };
const showSelect = { ...show, type: ['select'] };

export const customFieldCreateDescription: INodeProperties[] = [
	{
		displayName: 'Slug',
		name: 'slug',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description:
			"Identifier of the custom field, used as the key when storing values. Must be unique across the organization. Only ASCII letters, numbers, hyphens, and underscores allowed (e.g. 'preferred-locale').",
		routing: { send: { type: 'body', property: 'slug' } },
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'Name of the custom field',
		routing: { send: { type: 'body', property: 'name' } },
	},
	{
		displayName: 'Type',
		name: 'type',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show },
		options: [
			{ name: 'Checkbox', value: 'checkbox' },
			{ name: 'Date', value: 'date' },
			{ name: 'Number', value: 'number' },
			{ name: 'Select', value: 'select' },
			{ name: 'Text', value: 'text' },
		],
		default: 'text',
		routing: { send: { type: 'body', property: 'type' } },
	},
	{
		displayName: 'Checkbox Properties',
		name: 'propertiesCheckbox',
		type: 'collection',
		placeholder: 'Add Property',
		default: {},
		displayOptions: { show: showCheckbox },
		options: [
			{ displayName: 'Form Help Text', name: 'form_help_text', type: 'string', default: '' },
			{ displayName: 'Form Label', name: 'form_label', type: 'string', default: '' },
			{ displayName: 'Form Placeholder', name: 'form_placeholder', type: 'string', default: '' },
		],
		routing: { send: { type: 'body', property: 'properties' } },
	},
	{
		displayName: 'Number/Date Properties',
		name: 'propertiesNumberDate',
		type: 'collection',
		placeholder: 'Add Property',
		default: {},
		displayOptions: { show: showNumberDate },
		options: [
			{ displayName: 'Form Help Text', name: 'form_help_text', type: 'string', default: '' },
			{ displayName: 'Form Label', name: 'form_label', type: 'string', default: '' },
			{ displayName: 'Form Placeholder', name: 'form_placeholder', type: 'string', default: '' },
			{
				displayName: 'Maximum Value (Le)',
				name: 'le',
				type: 'number',
				default: 0,
				description: 'Inclusive maximum value allowed',
			},
			{
				displayName: 'Minimum Value (Ge)',
				name: 'ge',
				type: 'number',
				default: 0,
				description: 'Inclusive minimum value allowed',
			},
		],
		routing: { send: { type: 'body', property: 'properties' } },
	},
	{
		displayName: 'Text Properties',
		name: 'propertiesText',
		type: 'collection',
		placeholder: 'Add Property',
		default: {},
		displayOptions: { show: showText },
		options: [
			{ displayName: 'Form Help Text', name: 'form_help_text', type: 'string', default: '' },
			{ displayName: 'Form Label', name: 'form_label', type: 'string', default: '' },
			{ displayName: 'Form Placeholder', name: 'form_placeholder', type: 'string', default: '' },
			{ displayName: 'Max Length', name: 'max_length', type: 'number', default: 0, typeOptions: { minValue: 0 } },
			{ displayName: 'Min Length', name: 'min_length', type: 'number', default: 0, typeOptions: { minValue: 0 } },
			{
				displayName: 'Textarea',
				name: 'textarea',
				type: 'boolean',
				default: false,
				description: 'Whether to render the field as a multi-line textarea instead of a single-line input',
			},
		],
		routing: { send: { type: 'body', property: 'properties' } },
	},
	{
		displayName: 'Select Properties',
		name: 'propertiesSelectDetails',
		type: 'collection',
		placeholder: 'Add Property',
		default: {},
		displayOptions: { show: showSelect },
		options: [
			{ displayName: 'Form Help Text', name: 'form_help_text', type: 'string', default: '' },
			{ displayName: 'Form Label', name: 'form_label', type: 'string', default: '' },
			{ displayName: 'Form Placeholder', name: 'form_placeholder', type: 'string', default: '' },
		],
	},
	{
		displayName: 'Options',
		name: 'customFieldSelectOptions',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true, multipleValueButtonText: 'Add Option' },
		default: {},
		displayOptions: { show: showSelect },
		description: 'The selectable options for this field. At least one is required.',
		options: [
			{
				displayName: 'Option',
				name: 'option',
				values: [
					{ displayName: 'Label', name: 'label', type: 'string', default: '', required: true },
					{ displayName: 'Value', name: 'value', type: 'string', default: '', required: true },
				],
			},
		],
	},
	{
		displayName: 'Select Properties (Composed)',
		name: 'propertiesSelect',
		type: 'hidden',
		default: {},
		displayOptions: { show: showSelect },
		routing: {
			send: {
				type: 'body',
				property: 'properties',
				value:
					'={{ (function(details, options){ var result = Object.assign({}, details); if (options && options.length) { result.options = options; } return result; })($parameter["propertiesSelectDetails"], ($parameter["customFieldSelectOptions"].option || []).map((o) => ({ value: o.value, label: o.label }))) }}',
			},
		},
	},
	typedMetadataField('metadata', 'metadata', 'Metadata', show),
];
```

- [ ] **Step 5: Create `nodes/Polar/resources/customField/update.ts`**

Same discriminator shape as Create, but every "Properties" collection's routing wraps in `Object.keys($value).length ? $value : undefined` (matching `billingAddressField`'s omission idiom, since `properties` is nullable on Update) and the composed Select field's inline function takes an extra `omitIfEmpty` argument. `name`/`slug`/`metadata` move into a self-omitting `updateFields` collection (all three are independently nullable-optional on every `CustomFieldUpdate*` variant). `type` stays a required top-level selector — it can't change the field's actual type (every `CustomFieldUpdate*` variant's `type` is a schema `const`), it only tells the node which existing shape to send; document this in the field's description.

```ts
import type { INodeProperties } from 'n8n-workflow';
import { typedMetadataField } from '../../shared/descriptions';

const show = { resource: ['customField'], operation: ['update'] };
const showCheckbox = { ...show, type: ['checkbox'] };
const showNumberDate = { ...show, type: ['number', 'date'] };
const showText = { ...show, type: ['text'] };
const showSelect = { ...show, type: ['select'] };

export const customFieldUpdateDescription: INodeProperties[] = [
	{
		displayName: 'Custom Field ID',
		name: 'customFieldId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
	{
		displayName: 'Type',
		name: 'type',
		type: 'options',
		noDataExpression: true,
		required: true,
		displayOptions: { show },
		description:
			"The custom field's existing type. A custom field's type cannot be changed after creation — this selects which shape of Properties fields to show and send, it does not change the field's type. Must match the field's actual current type.",
		options: [
			{ name: 'Checkbox', value: 'checkbox' },
			{ name: 'Date', value: 'date' },
			{ name: 'Number', value: 'number' },
			{ name: 'Select', value: 'select' },
			{ name: 'Text', value: 'text' },
		],
		default: 'text',
		routing: { send: { type: 'body', property: 'type' } },
	},
	{
		displayName: 'Checkbox Properties',
		name: 'propertiesCheckbox',
		type: 'collection',
		placeholder: 'Add Property',
		default: {},
		displayOptions: { show: showCheckbox },
		options: [
			{ displayName: 'Form Help Text', name: 'form_help_text', type: 'string', default: '' },
			{ displayName: 'Form Label', name: 'form_label', type: 'string', default: '' },
			{ displayName: 'Form Placeholder', name: 'form_placeholder', type: 'string', default: '' },
		],
		routing: {
			send: { type: 'body', property: 'properties', value: '={{ Object.keys($value).length ? $value : undefined }}' },
		},
	},
	{
		displayName: 'Number/Date Properties',
		name: 'propertiesNumberDate',
		type: 'collection',
		placeholder: 'Add Property',
		default: {},
		displayOptions: { show: showNumberDate },
		options: [
			{ displayName: 'Form Help Text', name: 'form_help_text', type: 'string', default: '' },
			{ displayName: 'Form Label', name: 'form_label', type: 'string', default: '' },
			{ displayName: 'Form Placeholder', name: 'form_placeholder', type: 'string', default: '' },
			{
				displayName: 'Maximum Value (Le)',
				name: 'le',
				type: 'number',
				default: 0,
				description: 'Inclusive maximum value allowed',
			},
			{
				displayName: 'Minimum Value (Ge)',
				name: 'ge',
				type: 'number',
				default: 0,
				description: 'Inclusive minimum value allowed',
			},
		],
		routing: {
			send: { type: 'body', property: 'properties', value: '={{ Object.keys($value).length ? $value : undefined }}' },
		},
	},
	{
		displayName: 'Text Properties',
		name: 'propertiesText',
		type: 'collection',
		placeholder: 'Add Property',
		default: {},
		displayOptions: { show: showText },
		options: [
			{ displayName: 'Form Help Text', name: 'form_help_text', type: 'string', default: '' },
			{ displayName: 'Form Label', name: 'form_label', type: 'string', default: '' },
			{ displayName: 'Form Placeholder', name: 'form_placeholder', type: 'string', default: '' },
			{ displayName: 'Max Length', name: 'max_length', type: 'number', default: 0, typeOptions: { minValue: 0 } },
			{ displayName: 'Min Length', name: 'min_length', type: 'number', default: 0, typeOptions: { minValue: 0 } },
			{
				displayName: 'Textarea',
				name: 'textarea',
				type: 'boolean',
				default: false,
				description: 'Whether to render the field as a multi-line textarea instead of a single-line input',
			},
		],
		routing: {
			send: { type: 'body', property: 'properties', value: '={{ Object.keys($value).length ? $value : undefined }}' },
		},
	},
	{
		displayName: 'Select Properties',
		name: 'propertiesSelectDetails',
		type: 'collection',
		placeholder: 'Add Property',
		default: {},
		displayOptions: { show: showSelect },
		options: [
			{ displayName: 'Form Help Text', name: 'form_help_text', type: 'string', default: '' },
			{ displayName: 'Form Label', name: 'form_label', type: 'string', default: '' },
			{ displayName: 'Form Placeholder', name: 'form_placeholder', type: 'string', default: '' },
		],
	},
	{
		displayName: 'Options',
		name: 'customFieldSelectOptions',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true, multipleValueButtonText: 'Add Option' },
		default: {},
		displayOptions: { show: showSelect },
		description: 'Leave empty to keep the existing options unchanged. Adding any option replaces the entire list.',
		options: [
			{
				displayName: 'Option',
				name: 'option',
				values: [
					{ displayName: 'Label', name: 'label', type: 'string', default: '', required: true },
					{ displayName: 'Value', name: 'value', type: 'string', default: '', required: true },
				],
			},
		],
	},
	{
		displayName: 'Select Properties (Composed)',
		name: 'propertiesSelect',
		type: 'hidden',
		default: {},
		displayOptions: { show: showSelect },
		routing: {
			send: {
				type: 'body',
				property: 'properties',
				value:
					'={{ (function(details, options){ var result = Object.assign({}, details); if (options && options.length) { result.options = options; } return Object.keys(result).length ? result : undefined; })($parameter["propertiesSelectDetails"], ($parameter["customFieldSelectOptions"].option || []).map((o) => ({ value: o.value, label: o.label }))) }}',
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
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				routing: { request: { body: { name: '={{$value}}' } } },
			},
			{
				displayName: 'Slug',
				name: 'slug',
				type: 'string',
				default: '',
				description:
					"Identifier of the custom field, used as the key when storing values. Must be unique across the organization. Only ASCII letters, numbers, hyphens, and underscores allowed.",
				routing: { request: { body: { slug: '={{$value}}' } } },
			},
		],
	},
	typedMetadataField('metadata', 'metadata', 'Metadata', show),
];
```

- [ ] **Step 6: Create `nodes/Polar/resources/customField/delete.ts`**

```ts
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['customField'], operation: ['delete'] };

export const customFieldDeleteDescription: INodeProperties[] = [
	{
		displayName: 'Custom Field ID',
		name: 'customFieldId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
];
```

- [ ] **Step 7: Create `nodes/Polar/resources/customField/index.ts`**

```ts
import type { INodeProperties } from 'n8n-workflow';
import { customFieldGetAllDescription } from './getAll';
import { customFieldGetDescription } from './get';
import { customFieldCreateDescription } from './create';
import { customFieldUpdateDescription } from './update';
import { customFieldDeleteDescription } from './delete';

const showOnlyForCustomField = { resource: ['customField'] };

export const customFieldDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForCustomField },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a custom field',
				description: 'Create a new custom field',
				routing: { request: { method: 'POST', url: '=/custom-fields/' } },
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a custom field',
				description: 'Delete a custom field',
				routing: { request: { method: 'DELETE', url: '=/custom-fields/{{$parameter["customFieldId"]}}' } },
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a custom field',
				description: 'Get a single custom field by ID',
				routing: { request: { method: 'GET', url: '=/custom-fields/{{$parameter["customFieldId"]}}' } },
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many custom fields',
				description: 'Get many custom fields',
				routing: { request: { method: 'GET', url: '=/custom-fields/' } },
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a custom field',
				description: 'Update an existing custom field',
				routing: { request: { method: 'PATCH', url: '=/custom-fields/{{$parameter["customFieldId"]}}' } },
			},
		],
		default: 'getAll',
	},
	...customFieldGetAllDescription,
	...customFieldGetDescription,
	...customFieldCreateDescription,
	...customFieldUpdateDescription,
	...customFieldDeleteDescription,
];
```

- [ ] **Step 8: Wire into `nodes/Polar/Polar.node.ts`**

Add the import alphabetically (after `checkoutLinkDescription`, before `customerDescription`):

```ts
import { customFieldDescription } from './resources/customField';
```

Add the Resource dropdown entry alphabetically (after `{ name: 'Checkout Link', value: 'checkoutLink' }`, before `{ name: 'Customer', value: 'customer' }`):

```ts
					{ name: 'Custom Field', value: 'customField' },
```

Add the `properties` spread entry in the same relative position (after `...checkoutLinkDescription,`, before `...customerDescription,`):

```ts
			...customFieldDescription,
```

- [ ] **Step 9: Verify and commit**

Run `npm run lint` and `npm run build`; both must be clean. Additionally, open `dist/nodes/Polar/resources/customField/create.js` and `dist/nodes/Polar/resources/customField/update.js` and confirm the embedded `propertiesSelect`/`propertiesSelect` composed functions reference only their own `details`/`options` parameters — no outer-scope variables. Commit:

```bash
git add nodes/Polar/shared/descriptions.ts nodes/Polar/resources/customField nodes/Polar/Polar.node.ts
git commit -m "feat: add Custom Field resource and typedMetadataField helper"
```

---

### Task 3: License Key resource

**Files:**
- Create: `nodes/Polar/resources/licenseKey/getAll.ts`
- Create: `nodes/Polar/resources/licenseKey/get.ts`
- Create: `nodes/Polar/resources/licenseKey/update.ts`
- Create: `nodes/Polar/resources/licenseKey/getActivation.ts`
- Create: `nodes/Polar/resources/licenseKey/validate.ts`
- Create: `nodes/Polar/resources/licenseKey/activate.ts`
- Create: `nodes/Polar/resources/licenseKey/deactivate.ts`
- Create: `nodes/Polar/resources/licenseKey/index.ts`
- Modify: `nodes/Polar/Polar.node.ts` — add import + Resource dropdown entry + `properties` spread entry

**Interfaces:**
- Consumes: `typedMetadataField` from `nodes/Polar/shared/descriptions.ts`, added in Task 2. This task must run after Task 2 lands — the import `import { typedMetadataField } from '../../shared/descriptions';` will fail to resolve a real export otherwise.
- Produces: `licenseKeyDescription: INodeProperties[]`, consumed only by `Polar.node.ts`.

- [ ] **Step 1: Create `nodes/Polar/resources/licenseKey/getAll.ts`**

```ts
import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../shared/descriptions';

const show = { resource: ['licenseKey'], operation: ['getAll'] };

export const licenseKeyGetAllDescription: INodeProperties[] = [
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
				displayName: 'Benefit ID',
				name: 'benefit_id',
				type: 'string',
				default: '',
				routing: { request: { qs: { benefit_id: '={{$value}}' } } },
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'multiOptions',
				options: [
					{ name: 'Disabled', value: 'disabled' },
					{ name: 'Granted', value: 'granted' },
					{ name: 'Revoked', value: 'revoked' },
				],
				default: [],
				routing: { request: { qs: { status: '={{$value}}' } } },
			},
		],
	},
];
```

- [ ] **Step 2: Create `nodes/Polar/resources/licenseKey/get.ts`**

```ts
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['licenseKey'], operation: ['get'] };

export const licenseKeyGetDescription: INodeProperties[] = [
	{
		displayName: 'License Key ID',
		name: 'licenseKeyId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'Returns the license key along with its activations',
	},
];
```

- [ ] **Step 3: Create `nodes/Polar/resources/licenseKey/update.ts`**

```ts
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['licenseKey'], operation: ['update'] };

export const licenseKeyUpdateDescription: INodeProperties[] = [
	{
		displayName: 'License Key ID',
		name: 'licenseKeyId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
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
				displayName: 'Expires At',
				name: 'expires_at',
				type: 'dateTime',
				default: '',
				routing: { request: { body: { expires_at: '={{$value}}' } } },
			},
			{
				displayName: 'Limit Activations',
				name: 'limit_activations',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 1000 },
				description: 'Maximum number of activations allowed for this license key',
				routing: { request: { body: { limit_activations: '={{$value}}' } } },
			},
			{
				displayName: 'Limit Usage',
				name: 'limit_usage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1 },
				description: 'Maximum cumulative usage allowed for this license key',
				routing: { request: { body: { limit_usage: '={{$value}}' } } },
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'Disabled', value: 'disabled' },
					{ name: 'Granted', value: 'granted' },
					{ name: 'Revoked', value: 'revoked' },
				],
				default: 'granted',
				routing: { request: { body: { status: '={{$value}}' } } },
			},
			{
				displayName: 'Usage',
				name: 'usage',
				type: 'number',
				default: 0,
				description: "The license key's current cumulative usage count",
				routing: { request: { body: { usage: '={{$value}}' } } },
			},
		],
	},
];
```

- [ ] **Step 4: Create `nodes/Polar/resources/licenseKey/getActivation.ts`**

```ts
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['licenseKey'], operation: ['getActivation'] };

export const licenseKeyGetActivationDescription: INodeProperties[] = [
	{
		displayName: 'License Key ID',
		name: 'licenseKeyId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
	{
		displayName: 'Activation ID',
		name: 'activationId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
];
```

- [ ] **Step 5: Create `nodes/Polar/resources/licenseKey/validate.ts`**

```ts
import type { INodeProperties } from 'n8n-workflow';
import { typedMetadataField } from '../../shared/descriptions';

const show = { resource: ['licenseKey'], operation: ['validate'] };

export const licenseKeyValidateDescription: INodeProperties[] = [
	{
		displayName: 'Key',
		name: 'key',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'The license key string to validate',
		routing: { send: { type: 'body', property: 'key' } },
	},
	{
		displayName: 'Organization ID',
		name: 'organizationId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'organization_id' } },
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show },
		options: [
			{
				displayName: 'Activation ID',
				name: 'activation_id',
				type: 'string',
				default: '',
				description: 'Required if the license key benefit has activations enabled',
				routing: { request: { body: { activation_id: '={{$value}}' } } },
			},
			{
				displayName: 'Benefit ID',
				name: 'benefit_id',
				type: 'string',
				default: '',
				routing: { request: { body: { benefit_id: '={{$value}}' } } },
			},
			{
				displayName: 'Customer ID',
				name: 'customer_id',
				type: 'string',
				default: '',
				routing: { request: { body: { customer_id: '={{$value}}' } } },
			},
			{
				displayName: 'Increment Usage',
				name: 'increment_usage',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0 },
				description: 'Amount to increment the license key usage counter by during this validation',
				routing: { request: { body: { increment_usage: '={{$value}}' } } },
			},
		],
	},
	typedMetadataField('conditions', 'conditions', 'Conditions', show),
];
```

- [ ] **Step 6: Create `nodes/Polar/resources/licenseKey/activate.ts`**

```ts
import type { INodeProperties } from 'n8n-workflow';
import { typedMetadataField } from '../../shared/descriptions';

const show = { resource: ['licenseKey'], operation: ['activate'] };

export const licenseKeyActivateDescription: INodeProperties[] = [
	{
		displayName: 'Key',
		name: 'key',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'The license key string to activate',
		routing: { send: { type: 'body', property: 'key' } },
	},
	{
		displayName: 'Organization ID',
		name: 'organizationId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'organization_id' } },
	},
	{
		displayName: 'Label',
		name: 'label',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'A label identifying this activation instance (e.g. a device or machine name)',
		routing: { send: { type: 'body', property: 'label' } },
	},
	typedMetadataField('conditions', 'conditions', 'Conditions', show),
	typedMetadataField('meta', 'meta', 'Meta', show),
];
```

- [ ] **Step 7: Create `nodes/Polar/resources/licenseKey/deactivate.ts`**

```ts
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['licenseKey'], operation: ['deactivate'] };

export const licenseKeyDeactivateDescription: INodeProperties[] = [
	{
		displayName: 'Key',
		name: 'key',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'The license key string to deactivate an instance of',
		routing: { send: { type: 'body', property: 'key' } },
	},
	{
		displayName: 'Organization ID',
		name: 'organizationId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'organization_id' } },
	},
	{
		displayName: 'Activation ID',
		name: 'activationId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'activation_id' } },
	},
];
```

- [ ] **Step 8: Create `nodes/Polar/resources/licenseKey/index.ts`**

```ts
import type { INodeProperties } from 'n8n-workflow';
import { licenseKeyGetAllDescription } from './getAll';
import { licenseKeyGetDescription } from './get';
import { licenseKeyUpdateDescription } from './update';
import { licenseKeyGetActivationDescription } from './getActivation';
import { licenseKeyValidateDescription } from './validate';
import { licenseKeyActivateDescription } from './activate';
import { licenseKeyDeactivateDescription } from './deactivate';

const showOnlyForLicenseKey = { resource: ['licenseKey'] };

export const licenseKeyDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForLicenseKey },
		options: [
			{
				name: 'Activate',
				value: 'activate',
				action: 'Activate a license key',
				description: 'Activate a license key instance',
				routing: { request: { method: 'POST', url: '=/license-keys/activate' } },
			},
			{
				name: 'Deactivate',
				value: 'deactivate',
				action: 'Deactivate a license key',
				description: 'Deactivate a license key instance',
				routing: { request: { method: 'POST', url: '=/license-keys/deactivate' } },
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a license key',
				description: 'Get a single license key by ID',
				routing: { request: { method: 'GET', url: '=/license-keys/{{$parameter["licenseKeyId"]}}' } },
			},
			{
				name: 'Get Activation',
				value: 'getActivation',
				action: 'Get a license key activation',
				description: 'Get a single license key activation by ID',
				routing: {
					request: {
						method: 'GET',
						url: '=/license-keys/{{$parameter["licenseKeyId"]}}/activations/{{$parameter["activationId"]}}',
					},
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many license keys',
				description: 'Get many license keys',
				routing: { request: { method: 'GET', url: '=/license-keys/' } },
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a license key',
				description: 'Update an existing license key',
				routing: { request: { method: 'PATCH', url: '=/license-keys/{{$parameter["licenseKeyId"]}}' } },
			},
			{
				name: 'Validate',
				value: 'validate',
				action: 'Validate a license key',
				description: 'Validate a license key',
				routing: { request: { method: 'POST', url: '=/license-keys/validate' } },
			},
		],
		default: 'getAll',
	},
	...licenseKeyGetAllDescription,
	...licenseKeyGetDescription,
	...licenseKeyUpdateDescription,
	...licenseKeyGetActivationDescription,
	...licenseKeyValidateDescription,
	...licenseKeyActivateDescription,
	...licenseKeyDeactivateDescription,
];
```

- [ ] **Step 9: Wire into `nodes/Polar/Polar.node.ts`**

Add the import alphabetically (after `eventTypeDescription`, before `fileDescription` — Task 4 will add `fileDescription` after this task lands; for now, insert directly before `meterDescription`):

```ts
import { licenseKeyDescription } from './resources/licenseKey';
```

Add the Resource dropdown entry alphabetically (after `{ name: 'Event Type', value: 'eventType' }`, before `{ name: 'Meter', value: 'meter' }` — Task 4 will insert `File` between these two afterward):

```ts
					{ name: 'License Key', value: 'licenseKey' },
```

Add the `properties` spread entry in the same relative position:

```ts
			...licenseKeyDescription,
```

- [ ] **Step 10: Verify and commit**

Run `npm run lint` and `npm run build`; both must be clean. Commit:

```bash
git add nodes/Polar/resources/licenseKey nodes/Polar/Polar.node.ts
git commit -m "feat: add License Key resource"
```

---

### Task 4: File resource

**Files:**
- Create: `nodes/Polar/resources/file/getAll.ts`
- Create: `nodes/Polar/resources/file/create.ts`
- Create: `nodes/Polar/resources/file/completeUpload.ts`
- Create: `nodes/Polar/resources/file/update.ts`
- Create: `nodes/Polar/resources/file/delete.ts`
- Create: `nodes/Polar/resources/file/index.ts`
- Modify: `nodes/Polar/Polar.node.ts` — add import + Resource dropdown entry + `properties` spread entry

**Interfaces:**
- Produces: `fileDescription: INodeProperties[]`, consumed only by `Polar.node.ts`. No dependency on Task 2 or Task 3 — File has no typed key-value field anywhere in its schema.

- [ ] **Step 1: Create `nodes/Polar/resources/file/getAll.ts`**

```ts
import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../shared/descriptions';

const show = { resource: ['file'], operation: ['getAll'] };

export const fileGetAllDescription: INodeProperties[] = [
	...paginationProperties(show),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show },
		description: 'There is no single "Get" operation for files — use this Get Many operation with the File IDs filter to fetch specific files.',
		options: [
			{
				displayName: 'File IDs',
				name: 'ids',
				type: 'string',
				default: '',
				description: 'One or more file IDs, comma-separated',
				routing: {
					request: {
						qs: {
							ids: '={{ $value ? $value.split(",").map((s) => s.trim()).filter((s) => s) : undefined }}',
						},
					},
				},
			},
		],
	},
];
```

- [ ] **Step 2: Create `nodes/Polar/resources/file/create.ts`**

```ts
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['file'], operation: ['create'] };

type UploadPartEntry = {
	number: number;
	chunkStart: number;
	chunkEnd: number;
	checksumSha256Base64?: string;
};

function buildUploadParts(parts: UploadPartEntry[]) {
	return {
		parts: parts.map((p) => {
			const part: Record<string, unknown> = { number: p.number, chunk_start: p.chunkStart, chunk_end: p.chunkEnd };
			if (p.checksumSha256Base64) part.checksum_sha256_base64 = p.checksumSha256Base64;
			return part;
		}),
	};
}

export const fileCreateDescription: INodeProperties[] = [
	{
		displayName: 'Service',
		name: 'service',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show },
		options: [
			{ name: 'Downloadable', value: 'downloadable' },
			{ name: 'Organization Avatar', value: 'organization_avatar' },
			{ name: 'Product Media', value: 'product_media' },
		],
		default: 'downloadable',
		description:
			'What this file is for. Organization Avatar and Product Media accept only image MIME types (jpeg/png/gif/webp/svg+xml) and are capped at 1 MB and 10 MB respectively; Downloadable accepts any MIME type with no fixed cap.',
		routing: { send: { type: 'body', property: 'service' } },
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'name' } },
	},
	{
		displayName: 'MIME Type',
		name: 'mimeType',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'mime_type' } },
	},
	{
		displayName: 'Size (Bytes)',
		name: 'size',
		type: 'number',
		default: 0,
		required: true,
		typeOptions: { minValue: 0, numberPrecision: 0 },
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'size' } },
	},
	{
		displayName: 'Upload Parts',
		name: 'uploadParts',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true, multipleValueButtonText: 'Add Part' },
		default: {},
		required: true,
		displayOptions: { show },
		description: 'Declare each S3 multipart upload part. Polar returns a presigned upload URL per part.',
		options: [
			{
				displayName: 'Part',
				name: 'part',
				values: [
					{
						displayName: 'Checksum SHA256 (Base64)',
						name: 'checksumSha256Base64',
						type: 'string',
						default: '',
					},
					{ displayName: 'Chunk End', name: 'chunkEnd', type: 'number', default: 0, typeOptions: { minValue: 0 } },
					{ displayName: 'Chunk Start', name: 'chunkStart', type: 'number', default: 0, typeOptions: { minValue: 0 } },
					{ displayName: 'Number', name: 'number', type: 'number', default: 1, typeOptions: { minValue: 1 } },
				],
			},
		],
		routing: {
			send: {
				type: 'body',
				property: 'upload',
				value: `={{ (${buildUploadParts.toString()})(($parameter["uploadParts"].part || []).map((p) => ({ number: p.number, chunkStart: p.chunkStart, chunkEnd: p.chunkEnd, checksumSha256Base64: p.checksumSha256Base64 }))) }}`,
			},
		},
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show },
		options: [
			{
				displayName: 'Checksum SHA256 (Base64)',
				name: 'checksum_sha256_base64',
				type: 'string',
				default: '',
				routing: { request: { body: { checksum_sha256_base64: '={{$value}}' } } },
			},
			{
				displayName: 'Version',
				name: 'version',
				type: 'string',
				default: '',
				routing: { request: { body: { version: '={{$value}}' } } },
			},
		],
	},
];
```

- [ ] **Step 3: Create `nodes/Polar/resources/file/completeUpload.ts`**

```ts
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['file'], operation: ['completeUpload'] };

type CompletedPartEntry = {
	number: number;
	checksumEtag: string;
	checksumSha256Base64?: string;
};

function buildCompletedParts(parts: CompletedPartEntry[]) {
	return parts.map((p) => {
		const part: Record<string, unknown> = { number: p.number, checksum_etag: p.checksumEtag };
		if (p.checksumSha256Base64) part.checksum_sha256_base64 = p.checksumSha256Base64;
		return part;
	});
}

export const fileCompleteUploadDescription: INodeProperties[] = [
	{
		displayName: 'File ID',
		name: 'fileId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
	{
		displayName: 'Path',
		name: 'path',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'The storage path Polar returned when the file was created',
		routing: { send: { type: 'body', property: 'path' } },
	},
	{
		displayName: 'Completed Parts',
		name: 'completedParts',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true, multipleValueButtonText: 'Add Part' },
		default: {},
		required: true,
		displayOptions: { show },
		description: "Each part's number, and the ETag/checksum returned by S3 when you PUT its bytes",
		options: [
			{
				displayName: 'Part',
				name: 'part',
				values: [
					{
						displayName: 'Checksum ETag',
						name: 'checksumEtag',
						type: 'string',
						default: '',
						required: true,
					},
					{
						displayName: 'Checksum SHA256 (Base64)',
						name: 'checksumSha256Base64',
						type: 'string',
						default: '',
					},
					{ displayName: 'Number', name: 'number', type: 'number', default: 1, typeOptions: { minValue: 1 } },
				],
			},
		],
		routing: {
			send: {
				type: 'body',
				property: 'parts',
				value: `={{ (${buildCompletedParts.toString()})(($parameter["completedParts"].part || []).map((p) => ({ number: p.number, checksumEtag: p.checksumEtag, checksumSha256Base64: p.checksumSha256Base64 }))) }}`,
			},
		},
	},
];
```

- [ ] **Step 4: Create `nodes/Polar/resources/file/update.ts`**

```ts
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['file'], operation: ['update'] };

export const fileUpdateDescription: INodeProperties[] = [
	{
		displayName: 'File ID',
		name: 'fileId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
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
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				routing: { request: { body: { name: '={{$value}}' } } },
			},
			{
				displayName: 'Version',
				name: 'version',
				type: 'string',
				default: '',
				routing: { request: { body: { version: '={{$value}}' } } },
			},
		],
	},
];
```

- [ ] **Step 5: Create `nodes/Polar/resources/file/delete.ts`**

```ts
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['file'], operation: ['delete'] };

export const fileDeleteDescription: INodeProperties[] = [
	{
		displayName: 'File ID',
		name: 'fileId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
];
```

- [ ] **Step 6: Create `nodes/Polar/resources/file/index.ts`**

```ts
import type { INodeProperties } from 'n8n-workflow';
import { fileGetAllDescription } from './getAll';
import { fileCreateDescription } from './create';
import { fileCompleteUploadDescription } from './completeUpload';
import { fileUpdateDescription } from './update';
import { fileDeleteDescription } from './delete';

const showOnlyForFile = { resource: ['file'] };

export const fileDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForFile },
		options: [
			{
				name: 'Complete Upload',
				value: 'completeUpload',
				action: 'Complete a file upload',
				description: 'Report the completed S3 multipart upload parts back to Polar',
				routing: { request: { method: 'POST', url: '=/files/{{$parameter["fileId"]}}/uploaded' } },
			},
			{
				name: 'Create',
				value: 'create',
				action: 'Create a file',
				description: 'Declare a new file and its upload parts, returning presigned S3 upload URLs',
				routing: { request: { method: 'POST', url: '=/files/' } },
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a file',
				description: 'Delete a file',
				routing: { request: { method: 'DELETE', url: '=/files/{{$parameter["fileId"]}}' } },
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many files',
				description: 'Get many files',
				routing: { request: { method: 'GET', url: '=/files/' } },
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a file',
				description: 'Update an existing file',
				routing: { request: { method: 'PATCH', url: '=/files/{{$parameter["fileId"]}}' } },
			},
		],
		default: 'getAll',
	},
	...fileGetAllDescription,
	...fileCreateDescription,
	...fileCompleteUploadDescription,
	...fileUpdateDescription,
	...fileDeleteDescription,
];
```

- [ ] **Step 7: Wire into `nodes/Polar/Polar.node.ts`**

Add the import alphabetically (after `eventTypeDescription`, before `licenseKeyDescription` — which Task 3 already inserted before `meterDescription`):

```ts
import { fileDescription } from './resources/file';
```

Add the Resource dropdown entry alphabetically (after `{ name: 'Event Type', value: 'eventType' }`, before `{ name: 'License Key', value: 'licenseKey' }`):

```ts
					{ name: 'File', value: 'file' },
```

Add the `properties` spread entry in the same relative position (after `...eventTypeDescription,`, before `...licenseKeyDescription,`):

```ts
			...fileDescription,
```

At this point `Polar.node.ts` has all 18 resources in the exact alphabetical order specified in Global Constraints — verify this explicitly before committing.

- [ ] **Step 8: Verify and commit**

Run `npm run lint` and `npm run build`; both must be clean. Additionally, open `dist/nodes/Polar/resources/file/create.js` and `dist/nodes/Polar/resources/file/completeUpload.js` and confirm `buildUploadParts`/`buildCompletedParts` reference only their own `parts`/`p` parameters — no outer-scope variables. Commit:

```bash
git add nodes/Polar/resources/file nodes/Polar/Polar.node.ts
git commit -m "feat: add File resource"
```

---

### Task 5: README update and full-package verification

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: the final state of `nodes/Polar/Polar.node.ts` after Tasks 1–4 (all 18 resources landed). No other task depends on this one — it is the last task in the plan.

- [ ] **Step 1: Update `README.md`**

Find the bullet list documenting the node's resources and operations (the same list Lot 2a's Task 4 extended). Insert four new bullets — **Custom Field**, **Dispute**, **File**, **License Key** — in alphabetical position among the existing entries, each listing its operations, following the exact phrasing style of the existing bullets (e.g. the Meter/Event Type bullets added in Lot 2a). Content for each:

- **Custom Field**: Create, Delete, Get, Get Many, Update — org-defined extra data fields (text/number/date/checkbox/select) collected on checkout.
- **Dispute**: Get, Get Many — read-only view of payment disputes/chargebacks.
- **File**: Complete Upload, Create, Delete, Get Many, Update — declarative primitives for Polar's S3 multipart file upload flow (Create returns presigned upload URLs; actually PUTing file bytes to S3 is done in your own workflow, e.g. with an HTTP Request node, before calling Complete Upload).
- **License Key**: Activate, Deactivate, Get, Get Activation, Get Many, Update, Validate — license-gated software activation and validation.

If the existing list was already fully alphabetized by Lot 2a's Task 4, insert these four in the correct alphabetical positions without reordering the rest. If any drift from alphabetical order is found (unlikely, but verify — don't assume), re-alphabetize the whole list, matching the resolution Lot 2a's Task 4 already established as this project's precedent for that exact situation.

- [ ] **Step 2: Full-package verification**

Run `npm run lint` and `npm run build` one final time on the complete branch (all 5 tasks' changes together). Both must be clean.

Independently re-verify (do not just trust each task's own commit message):
- `nodes/Polar/Polar.node.ts` contains exactly 18 resources, alphabetically ordered, matching Global Constraints, with no duplicate `value`s and no orphaned imports.
- Every new resource's `index.ts` operation list is itself alphabetized by `name`.
- Every 5+-item nested `options` array introduced by this plan (Custom Field's per-type Properties collections, License Key's Update Fields, File's Upload/Completed Parts sub-fields, etc.) is alphabetized by `displayName`.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: document Custom Field, Dispute, File, and License Key resources"
```

## Testing note

Carry the spec's testing note into manual Sandbox verification once the branch is otherwise clean: create a Custom Field of each of the 5 types and confirm each type's specific `properties` round-trip correctly; activate a License Key with `conditions`/`meta` containing a mix of string/number/boolean values and confirm Polar's stored values keep their real JSON types (not stringified — this is the exact bug class the Lot 2a final review caught, now guarded against by `typedMetadataField`, but worth confirming end-to-end against the real API); run a full File Create → (manual S3 PUT via a separate HTTP Request node) → Complete Upload sequence at least once to confirm the two Polar-side calls compose correctly.
