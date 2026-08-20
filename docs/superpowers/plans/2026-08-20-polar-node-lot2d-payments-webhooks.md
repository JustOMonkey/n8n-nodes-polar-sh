# Polar Node — Lot 2d: Payment, Webhook Endpoint, Webhook Delivery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three new resources to the `Polar` n8n node — Payment (2 ops, read-only), Webhook Endpoint (6 ops), Webhook Delivery (2 ops) — bringing the node from 22 to 25 resources. This is the final sub-lot of Lot 2.

**Architecture:** Same declarative-routing architecture as every prior lot: one file per operation under `nodes/Polar/resources/<resource>/`, an `index.ts` per resource wiring the Operation dropdown, `routing.send`/`routing.request` only (no custom `execute()`), reuse of `shared/descriptions.ts` helpers. This lot adds one new shared constant (`webhookEventTypeOptions`, a 35-value `INodePropertyOptions[]` matching the existing `availableScopeOptions`/`currencyOptions` pattern) and reuses existing idioms verbatim: the standard "Filters" collection (routing straight to `qs.<key>`), the self-omitting "Update Fields" collection (routing straight to `body.<key>`, with the `multiOptions`-inside-a-collection omit-if-empty guard already established by Organization Access Token Update's `scopes` field), and the no-body plain-ID-field action pattern already established by Customer Seat's Resend Invitation / Revoke Seat.

**Tech Stack:** TypeScript, n8n community node SDK (`n8n-node` CLI for lint/build), no new runtime npm dependency.

**Spec:** `docs/superpowers/specs/2026-08-20-polar-node-lot2d-payments-webhooks-design.md`

## Global Constraints

- Auth: reuse the existing `Polar API` credential — no new credential.
- One file per operation under `nodes/Polar/resources/<resource>/`, camelCase directory names matching existing resources (`payment`, `webhookEndpoint`, `webhookDelivery`).
- `organization_id` is never exposed as a field/filter anywhere in this lot (the credential's token is already org-scoped) — this applies even though Webhook Endpoint Create and Webhook Endpoint Get Many both have a real `organization_id` field/filter in their schemas; omit it, matching every other field/filter of this shape across the whole package.
- No `sorting` filter exposed on any Get Many operation (Payment's `getAll` has a real `sorting` parameter in its schema; omitted, matching the established convention).
- Array-capable ID/free-text filters (schemas typed `anyOf: [T, array<T>, null]`) are exposed as a single plain field of type `T`, never as a multi-value input — Payment's `checkout_id`/`order_id`/`customer_id`/`method`/`customer_email` and Webhook Delivery's `endpoint_id` are all this shape; only genuine fixed enums (`status`, `event_type`) get `multiOptions`.
- Cross-resource and own-resource ID fields are plain `type: 'string'`, never `resourceLocator`/`loadOptions`.
- 5+-item `options`/`multiOptions` arrays must be alphabetized by `displayName`, using the real `localeCompare`-based lint comparator (not hand-reasoning) — this lot's instance is `webhookEventTypeOptions` (35 entries), given verbatim in Task 2; do not re-derive or re-order it. Every other option list introduced in this lot (below the 5-item threshold) is alphabetized anyway, matching the codebase-wide convention of alphabetizing every "Filters"/"Update Fields"/`options` list regardless of size — the exact orderings are given verbatim in each task's code and were verified with `node -e` scripts against the real `localeCompare` comparator; use them as written.
- Boolean field descriptions must contain the word "whether".
- Every new resource inserts into the existing 22-resource alphabetical Resource dropdown and `properties` spread in `Polar.node.ts`. Final 25-resource order: Benefit, Benefit Grant, Checkout, Checkout Link, Custom Field, Customer, Customer Meter, Customer Seat, Customer Session, Discount, Dispute, Event, Event Type, File, License Key, Member, Meter, Order, Organization Access Token, **Payment**, Product, Refund, Subscription, **Webhook Delivery**, **Webhook Endpoint**.
- Run `npm run lint` and `npm run build` after every task; both must be clean before moving to the next task. There is no unit test suite in this package — lint + build is this project's established verification gate.
- Reuse `paginationProperties(show)` for every Get Many operation's `Return All`/`Limit` fields — both Payment's Get Many and Webhook Endpoint's Get Many and Webhook Delivery's Get Many all have standard `ListResource_*` paginated response shapes (confirmed against the live OpenAPI spec's `x-speakeasy-pagination` blocks), unlike Lot 2c's Customer Seat List Seats exception.
- Every "Filters" collection field on a Get Many operation follows the exact pattern in `nodes/Polar/resources/dispute/getAll.ts` / `nodes/Polar/resources/order/getAll.ts`: a `type: 'collection'` field named `filters`, `placeholder: 'Add Filter'`, each option routing directly to `qs.<key>`.
- Every self-omitting "Update Fields"/"Additional Fields" collection follows the exact pattern in `nodes/Polar/resources/organizationAccessToken/update.ts`: a `type: 'collection'` field, `placeholder: 'Add Field'`, each option routing directly to `body.<key>` via `routing: { request: { body: { <key>: '={{$value}}' } } }`. The one `multiOptions` field inside such a collection in this lot (Webhook Endpoint Update's `events`) additionally needs `value: '={{ $value.length ? $value : undefined }}'` inside that same `request.body` wrapper — the exact guard already established by Organization Access Token Update's `scopes` field in Lot 2c.
- A no-body action on a single resource identified by a plain ID field (Webhook Endpoint's Reset Secret, Webhook Delivery's Redeliver) follows the exact pattern in `nodes/Polar/resources/customerSeat/resendInvitation.ts`: a single required `type: 'string'` ID field with no `routing` of its own — the operation-level `routing.request.url` (built from `$parameter[...]`) is all that's needed, since there is no request body to send.
- No `.toString()`-embedded composite-body functions are introduced in this lot (no array-of-objects fields) — nothing new to verify beyond the usual holistic check.

## Resources

### Payment (Task 1) — 2 operations, read-only
### Webhook Endpoint (Task 2) — 6 operations, introduces `webhookEventTypeOptions` (35-value shared constant)
### Webhook Delivery (Task 3) — 2 operations, consumes `webhookEventTypeOptions`
### README + final verification (Task 4)

---

### Task 1: Payment resource

**Files:**
- Create: `nodes/Polar/resources/payment/getAll.ts`
- Create: `nodes/Polar/resources/payment/get.ts`
- Create: `nodes/Polar/resources/payment/index.ts`
- Modify: `nodes/Polar/Polar.node.ts` — add import + Resource dropdown entry + `properties` spread entry

**Interfaces:**
- Produces: `paymentDescription: INodeProperties[]`, consumed only by `Polar.node.ts`.
- Consumes: nothing from other tasks in this plan.

- [ ] **Step 1: Create `nodes/Polar/resources/payment/getAll.ts`**

```ts
import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../shared/descriptions';

const show = { resource: ['payment'], operation: ['getAll'] };

export const paymentGetAllDescription: INodeProperties[] = [
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
				displayName: 'Checkout ID',
				name: 'checkout_id',
				type: 'string',
				default: '',
				description: 'Filter payments by the ID of the associated checkout',
				routing: { request: { qs: { checkout_id: '={{$value}}' } } },
			},
			{
				displayName: 'Customer Email',
				name: 'customer_email',
				type: 'string',
				default: '',
				description: 'Filter payments by the customer email',
				routing: { request: { qs: { customer_email: '={{$value}}' } } },
			},
			{
				displayName: 'Customer ID',
				name: 'customer_id',
				type: 'string',
				default: '',
				description: 'Filter payments by the ID of the associated customer',
				routing: { request: { qs: { customer_id: '={{$value}}' } } },
			},
			{
				displayName: 'Method',
				name: 'method',
				type: 'string',
				default: '',
				description: 'Filter payments by payment method',
				routing: { request: { qs: { method: '={{$value}}' } } },
			},
			{
				displayName: 'Order ID',
				name: 'order_id',
				type: 'string',
				default: '',
				description: 'Filter payments by the ID of the associated order',
				routing: { request: { qs: { order_id: '={{$value}}' } } },
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'multiOptions',
				options: [
					{ name: 'Failed', value: 'failed' },
					{ name: 'Pending', value: 'pending' },
					{ name: 'Succeeded', value: 'succeeded' },
				],
				default: [],
				description: 'Filter payments by status',
				routing: { request: { qs: { status: '={{$value}}' } } },
			},
		],
	},
];
```

- [ ] **Step 2: Create `nodes/Polar/resources/payment/get.ts`**

```ts
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['payment'], operation: ['get'] };

export const paymentGetDescription: INodeProperties[] = [
	{
		displayName: 'Payment ID',
		name: 'paymentId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
];
```

- [ ] **Step 3: Create `nodes/Polar/resources/payment/index.ts`**

```ts
import type { INodeProperties } from 'n8n-workflow';
import { paymentGetAllDescription } from './getAll';
import { paymentGetDescription } from './get';

const showOnlyForPayment = { resource: ['payment'] };

export const paymentDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForPayment },
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get a payment',
				description: 'Get a single payment by ID',
				routing: { request: { method: 'GET', url: '=/payments/{{$parameter["paymentId"]}}' } },
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many payments',
				description: 'Get many payments',
				routing: { request: { method: 'GET', url: '=/payments/' } },
			},
		],
		default: 'getAll',
	},
	...paymentGetAllDescription,
	...paymentGetDescription,
];
```

- [ ] **Step 4: Wire into `nodes/Polar/Polar.node.ts`**

Add the import alphabetically (after `organizationAccessTokenDescription`, before `productDescription`):

```ts
import { paymentDescription } from './resources/payment';
```

Add the Resource dropdown entry alphabetically (after `{ name: 'Organization Access Token', value: 'organizationAccessToken' }`, before `{ name: 'Product', value: 'product' }`):

```ts
					{ name: 'Payment', value: 'payment' },
```

Add the `properties` spread entry in the same relative position:

```ts
			...paymentDescription,
```

- [ ] **Step 5: Verify and commit**

Run `npm run lint` and `npm run build`; both must be clean. Commit:

```bash
git add nodes/Polar/resources/payment nodes/Polar/Polar.node.ts
git commit -m "feat: add Payment resource"
```

---

### Task 2: Webhook Endpoint resource

**Files:**
- Modify: `nodes/Polar/shared/descriptions.ts` — add `webhookEventTypeOptions` export (insert directly after the existing `availableScopeOptions` export)
- Create: `nodes/Polar/resources/webhookEndpoint/getAll.ts`
- Create: `nodes/Polar/resources/webhookEndpoint/get.ts`
- Create: `nodes/Polar/resources/webhookEndpoint/create.ts`
- Create: `nodes/Polar/resources/webhookEndpoint/update.ts`
- Create: `nodes/Polar/resources/webhookEndpoint/delete.ts`
- Create: `nodes/Polar/resources/webhookEndpoint/resetSecret.ts`
- Create: `nodes/Polar/resources/webhookEndpoint/index.ts`
- Modify: `nodes/Polar/Polar.node.ts` — add import + Resource dropdown entry + `properties` spread entry

**Interfaces:**
- Produces: `webhookEventTypeOptions` in `shared/descriptions.ts`, consumed by this task's own `create.ts`/`update.ts` AND by Task 3's `getAll.ts` (Webhook Delivery's `event_type` filter). Task 3 must not re-derive or duplicate this constant.
- Produces: `webhookEndpointDescription: INodeProperties[]`, consumed only by `Polar.node.ts`.

- [ ] **Step 1: Add `webhookEventTypeOptions` to `nodes/Polar/shared/descriptions.ts`**

Insert this constant immediately after the existing `availableScopeOptions` export (which ends at the line `];` closing its array), and before `billingAddressField`. **This is the complete, alphabetized 35-value list — use it verbatim, do not re-derive or re-order it:**

```ts
export const webhookEventTypeOptions: INodePropertyOptions[] = [
	{ name: 'Benefit Grant: Created', value: 'benefit_grant.created' },
	{ name: 'Benefit Grant: Cycled', value: 'benefit_grant.cycled' },
	{ name: 'Benefit Grant: Revoked', value: 'benefit_grant.revoked' },
	{ name: 'Benefit Grant: Updated', value: 'benefit_grant.updated' },
	{ name: 'Benefit: Created', value: 'benefit.created' },
	{ name: 'Benefit: Updated', value: 'benefit.updated' },
	{ name: 'Checkout: Created', value: 'checkout.created' },
	{ name: 'Checkout: Expired', value: 'checkout.expired' },
	{ name: 'Checkout: Updated', value: 'checkout.updated' },
	{ name: 'Customer Seat: Assigned', value: 'customer_seat.assigned' },
	{ name: 'Customer Seat: Claimed', value: 'customer_seat.claimed' },
	{ name: 'Customer Seat: Revoked', value: 'customer_seat.revoked' },
	{ name: 'Customer: Created', value: 'customer.created' },
	{ name: 'Customer: Deleted', value: 'customer.deleted' },
	{ name: 'Customer: State Changed', value: 'customer.state_changed' },
	{ name: 'Customer: Updated', value: 'customer.updated' },
	{ name: 'Member: Created', value: 'member.created' },
	{ name: 'Member: Deleted', value: 'member.deleted' },
	{ name: 'Member: Updated', value: 'member.updated' },
	{ name: 'Order: Created', value: 'order.created' },
	{ name: 'Order: Paid', value: 'order.paid' },
	{ name: 'Order: Refunded', value: 'order.refunded' },
	{ name: 'Order: Updated', value: 'order.updated' },
	{ name: 'Organization: Updated', value: 'organization.updated' },
	{ name: 'Product: Created', value: 'product.created' },
	{ name: 'Product: Updated', value: 'product.updated' },
	{ name: 'Refund: Created', value: 'refund.created' },
	{ name: 'Refund: Updated', value: 'refund.updated' },
	{ name: 'Subscription: Active', value: 'subscription.active' },
	{ name: 'Subscription: Canceled', value: 'subscription.canceled' },
	{ name: 'Subscription: Created', value: 'subscription.created' },
	{ name: 'Subscription: Past Due', value: 'subscription.past_due' },
	{ name: 'Subscription: Revoked', value: 'subscription.revoked' },
	{ name: 'Subscription: Uncanceled', value: 'subscription.uncanceled' },
	{ name: 'Subscription: Updated', value: 'subscription.updated' },
];
```

`INodePropertyOptions` is already imported at the top of `shared/descriptions.ts`.

- [ ] **Step 2: Create `nodes/Polar/resources/webhookEndpoint/getAll.ts`**

```ts
import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../shared/descriptions';

const show = { resource: ['webhookEndpoint'], operation: ['getAll'] };

export const webhookEndpointGetAllDescription: INodeProperties[] = [...paginationProperties(show)];
```

- [ ] **Step 3: Create `nodes/Polar/resources/webhookEndpoint/get.ts`**

```ts
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['webhookEndpoint'], operation: ['get'] };

export const webhookEndpointGetDescription: INodeProperties[] = [
	{
		displayName: 'Webhook Endpoint ID',
		name: 'webhookEndpointId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
];
```

- [ ] **Step 4: Create `nodes/Polar/resources/webhookEndpoint/create.ts`**

```ts
import type { INodeProperties } from 'n8n-workflow';
import { webhookEventTypeOptions } from '../../shared/descriptions';

const show = { resource: ['webhookEndpoint'], operation: ['create'] };

export const webhookEndpointCreateDescription: INodeProperties[] = [
	{
		displayName: 'URL',
		name: 'url',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'The URL where the webhook events will be sent',
		routing: { send: { type: 'body', property: 'url' } },
	},
	{
		displayName: 'Format',
		name: 'format',
		type: 'options',
		options: [
			{ name: 'Discord', value: 'discord' },
			{ name: 'Raw', value: 'raw' },
			{ name: 'Slack', value: 'slack' },
		],
		default: 'raw',
		required: true,
		displayOptions: { show },
		description: 'The format of the webhook payload',
		routing: { send: { type: 'body', property: 'format' } },
	},
	{
		displayName: 'Events',
		name: 'events',
		type: 'multiOptions',
		options: webhookEventTypeOptions,
		default: [],
		required: true,
		displayOptions: { show },
		description: 'The events that will trigger the webhook',
		routing: { send: { type: 'body', property: 'events' } },
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
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'An optional name for the webhook endpoint to help organize and identify it',
				routing: { request: { body: { name: '={{$value}}' } } },
			},
		],
	},
];
```

- [ ] **Step 5: Create `nodes/Polar/resources/webhookEndpoint/update.ts`**

```ts
import type { INodeProperties } from 'n8n-workflow';
import { webhookEventTypeOptions } from '../../shared/descriptions';

const show = { resource: ['webhookEndpoint'], operation: ['update'] };

export const webhookEndpointUpdateDescription: INodeProperties[] = [
	{
		displayName: 'Webhook Endpoint ID',
		name: 'webhookEndpointId',
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
				displayName: 'Enabled',
				name: 'enabled',
				type: 'boolean',
				default: true,
				description: 'Whether the webhook endpoint is enabled and will receive events',
				routing: { request: { body: { enabled: '={{$value}}' } } },
			},
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				options: webhookEventTypeOptions,
				default: [],
				description: 'Leave empty to keep the existing events unchanged',
				routing: { request: { body: { events: '={{ $value.length ? $value : undefined }}' } } },
			},
			{
				displayName: 'Format',
				name: 'format',
				type: 'options',
				options: [
					{ name: 'Discord', value: 'discord' },
					{ name: 'Raw', value: 'raw' },
					{ name: 'Slack', value: 'slack' },
				],
				default: 'raw',
				description: 'The format of the webhook payload',
				routing: { request: { body: { format: '={{$value}}' } } },
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'An optional name for the webhook endpoint to help organize and identify it',
				routing: { request: { body: { name: '={{$value}}' } } },
			},
			{
				displayName: 'URL',
				name: 'url',
				type: 'string',
				default: '',
				description: 'The URL where the webhook events will be sent',
				routing: { request: { body: { url: '={{$value}}' } } },
			},
		],
	},
];
```

- [ ] **Step 6: Create `nodes/Polar/resources/webhookEndpoint/delete.ts`**

```ts
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['webhookEndpoint'], operation: ['delete'] };

export const webhookEndpointDeleteDescription: INodeProperties[] = [
	{
		displayName: 'Webhook Endpoint ID',
		name: 'webhookEndpointId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
];
```

- [ ] **Step 7: Create `nodes/Polar/resources/webhookEndpoint/resetSecret.ts`**

```ts
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['webhookEndpoint'], operation: ['resetSecret'] };

export const webhookEndpointResetSecretDescription: INodeProperties[] = [
	{
		displayName: 'Webhook Endpoint ID',
		name: 'webhookEndpointId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'Resetting the secret immediately invalidates the previous one',
	},
];
```

- [ ] **Step 8: Create `nodes/Polar/resources/webhookEndpoint/index.ts`**

```ts
import type { INodeProperties } from 'n8n-workflow';
import { webhookEndpointGetAllDescription } from './getAll';
import { webhookEndpointGetDescription } from './get';
import { webhookEndpointCreateDescription } from './create';
import { webhookEndpointUpdateDescription } from './update';
import { webhookEndpointDeleteDescription } from './delete';
import { webhookEndpointResetSecretDescription } from './resetSecret';

const showOnlyForWebhookEndpoint = { resource: ['webhookEndpoint'] };

export const webhookEndpointDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForWebhookEndpoint },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a webhook endpoint',
				description: 'Create a new webhook endpoint',
				routing: { request: { method: 'POST', url: '=/webhooks/endpoints' } },
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a webhook endpoint',
				description: 'Delete a webhook endpoint',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/webhooks/endpoints/{{$parameter["webhookEndpointId"]}}',
					},
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a webhook endpoint',
				description: 'Get a single webhook endpoint by ID',
				routing: {
					request: {
						method: 'GET',
						url: '=/webhooks/endpoints/{{$parameter["webhookEndpointId"]}}',
					},
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many webhook endpoints',
				description: 'Get many webhook endpoints',
				routing: { request: { method: 'GET', url: '=/webhooks/endpoints' } },
			},
			{
				name: 'Reset Secret',
				value: 'resetSecret',
				action: 'Reset a webhook endpoint secret',
				description: 'Regenerate a webhook endpoint secret. The previous secret is immediately invalidated.',
				routing: {
					request: {
						method: 'PATCH',
						url: '=/webhooks/endpoints/{{$parameter["webhookEndpointId"]}}/secret',
					},
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a webhook endpoint',
				description: 'Update an existing webhook endpoint',
				routing: {
					request: {
						method: 'PATCH',
						url: '=/webhooks/endpoints/{{$parameter["webhookEndpointId"]}}',
					},
				},
			},
		],
		default: 'getAll',
	},
	...webhookEndpointGetAllDescription,
	...webhookEndpointGetDescription,
	...webhookEndpointCreateDescription,
	...webhookEndpointUpdateDescription,
	...webhookEndpointDeleteDescription,
	...webhookEndpointResetSecretDescription,
];
```

- [ ] **Step 9: Wire into `nodes/Polar/Polar.node.ts`**

Add the import at the end of the import list, after `subscriptionDescription` (alphabetically, "webhook..." sorts after every other resource name in the list) — note Task 3 will later insert `webhookDeliveryDescription`'s import immediately before this one, since "Delivery" < "Endpoint":

```ts
import { webhookEndpointDescription } from './resources/webhookEndpoint';
```

Add the Resource dropdown entry at the end of the list, after `{ name: 'Subscription', value: 'subscription' }`:

```ts
					{ name: 'Webhook Endpoint', value: 'webhookEndpoint' },
```

Add the `properties` spread entry in the same relative position (end of the list, after `...subscriptionDescription,`):

```ts
			...webhookEndpointDescription,
```

- [ ] **Step 10: Verify and commit**

Run `npm run lint` and `npm run build`; both must be clean. Commit:

```bash
git add nodes/Polar/shared/descriptions.ts nodes/Polar/resources/webhookEndpoint nodes/Polar/Polar.node.ts
git commit -m "feat: add Webhook Endpoint resource"
```

---

### Task 3: Webhook Delivery resource

**Files:**
- Create: `nodes/Polar/resources/webhookDelivery/getAll.ts`
- Create: `nodes/Polar/resources/webhookDelivery/redeliver.ts`
- Create: `nodes/Polar/resources/webhookDelivery/index.ts`
- Modify: `nodes/Polar/Polar.node.ts` — add import + Resource dropdown entry + `properties` spread entry

**Interfaces:**
- Consumes: `webhookEventTypeOptions` from `nodes/Polar/shared/descriptions.ts`, produced by Task 2. Do not re-derive or duplicate it.
- Produces: `webhookDeliveryDescription: INodeProperties[]`, consumed only by `Polar.node.ts`.

- [ ] **Step 1: Create `nodes/Polar/resources/webhookDelivery/getAll.ts`**

```ts
import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties, webhookEventTypeOptions } from '../../shared/descriptions';

const show = { resource: ['webhookDelivery'], operation: ['getAll'] };

export const webhookDeliveryGetAllDescription: INodeProperties[] = [
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
				displayName: 'End Timestamp',
				name: 'end_timestamp',
				type: 'dateTime',
				default: '',
				description: 'Filter deliveries before this timestamp',
				routing: { request: { qs: { end_timestamp: '={{$value}}' } } },
			},
			{
				displayName: 'Endpoint ID',
				name: 'endpoint_id',
				type: 'string',
				default: '',
				description: 'Filter deliveries by the ID of the associated webhook endpoint',
				routing: { request: { qs: { endpoint_id: '={{$value}}' } } },
			},
			{
				displayName: 'Event Type',
				name: 'event_type',
				type: 'multiOptions',
				options: webhookEventTypeOptions,
				default: [],
				description: 'Filter deliveries by webhook event type',
				routing: { request: { qs: { event_type: '={{$value}}' } } },
			},
			{
				displayName: 'HTTP Code Class',
				name: 'http_code_class',
				type: 'options',
				options: [
					{ name: '2xx', value: '2xx' },
					{ name: '3xx', value: '3xx' },
					{ name: '4xx', value: '4xx' },
					{ name: '5xx', value: '5xx' },
				],
				default: '2xx',
				description: 'Filter deliveries by HTTP response code class',
				routing: { request: { qs: { http_code_class: '={{$value}}' } } },
			},
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				default: '',
				description: 'Free-text query to filter webhook deliveries',
				routing: { request: { qs: { query: '={{$value}}' } } },
			},
			{
				displayName: 'Start Timestamp',
				name: 'start_timestamp',
				type: 'dateTime',
				default: '',
				description: 'Filter deliveries after this timestamp',
				routing: { request: { qs: { start_timestamp: '={{$value}}' } } },
			},
			{
				displayName: 'Succeeded',
				name: 'succeeded',
				type: 'boolean',
				default: true,
				description: 'Whether to filter deliveries by success status',
				routing: { request: { qs: { succeeded: '={{$value}}' } } },
			},
		],
	},
];
```

- [ ] **Step 2: Create `nodes/Polar/resources/webhookDelivery/redeliver.ts`**

The path parameter here is a **webhook event ID**, not an endpoint or delivery ID — name the field accordingly and say so in its description to avoid confusion with Webhook Endpoint's ID field.

```ts
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['webhookDelivery'], operation: ['redeliver'] };

export const webhookDeliveryRedeliverDescription: INodeProperties[] = [
	{
		displayName: 'Webhook Event ID',
		name: 'webhookEventId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'The ID of the webhook event to redeliver (not the delivery ID or the endpoint ID)',
	},
];
```

- [ ] **Step 3: Create `nodes/Polar/resources/webhookDelivery/index.ts`**

```ts
import type { INodeProperties } from 'n8n-workflow';
import { webhookDeliveryGetAllDescription } from './getAll';
import { webhookDeliveryRedeliverDescription } from './redeliver';

const showOnlyForWebhookDelivery = { resource: ['webhookDelivery'] };

export const webhookDeliveryDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForWebhookDelivery },
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many webhook deliveries',
				description: 'Get many webhook deliveries',
				routing: { request: { method: 'GET', url: '=/webhooks/deliveries' } },
			},
			{
				name: 'Redeliver',
				value: 'redeliver',
				action: 'Redeliver a webhook event',
				description: 'Schedule the re-delivery of a webhook event',
				routing: {
					request: {
						method: 'POST',
						url: '=/webhooks/events/{{$parameter["webhookEventId"]}}/redeliver',
					},
				},
			},
		],
		default: 'getAll',
	},
	...webhookDeliveryGetAllDescription,
	...webhookDeliveryRedeliverDescription,
];
```

- [ ] **Step 4: Wire into `nodes/Polar/Polar.node.ts`**

Add the import alphabetically (after `subscriptionDescription`, before `webhookEndpointDescription` — `webhookDeliveryDescription` sorts before `webhookEndpointDescription` because "Delivery" < "Endpoint"):

```ts
import { webhookDeliveryDescription } from './resources/webhookDelivery';
```

Add the Resource dropdown entry alphabetically (after `{ name: 'Subscription', value: 'subscription' }`, before `{ name: 'Webhook Endpoint', value: 'webhookEndpoint' }`):

```ts
					{ name: 'Webhook Delivery', value: 'webhookDelivery' },
```

Add the `properties` spread entry in the same relative position (after `...subscriptionDescription,`, before `...webhookEndpointDescription,`):

```ts
			...webhookDeliveryDescription,
```

At this point `Polar.node.ts` has all 25 resources in the exact alphabetical order specified in Global Constraints — verify this explicitly before committing.

- [ ] **Step 5: Verify and commit**

Run `npm run lint` and `npm run build`; both must be clean. Commit:

```bash
git add nodes/Polar/resources/webhookDelivery nodes/Polar/Polar.node.ts
git commit -m "feat: add Webhook Delivery resource"
```

---

### Task 4: README update and full-package verification

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: the final state of `nodes/Polar/Polar.node.ts` after Tasks 1–3 (all 25 resources landed). No other task depends on this one — it is the last task in the plan.

- [ ] **Step 1: Update `README.md`**

Find the bullet list documenting the node's resources and operations (currently ending with `Subscription`). Insert three new bullets — **Payment**, **Webhook Delivery**, **Webhook Endpoint** — in their correct alphabetical positions without reordering the rest. If any drift from alphabetical order is found elsewhere in the list, re-alphabetize the whole list (matching the precedent already established by every prior lot's final task) — verify, don't assume.

Content for each new bullet:

- **Payment**: Get Many, Get — read-only view of payments (`payments:read` only; no create/update/delete exists in the API).
- **Webhook Delivery**: Get Many, Redeliver — delivery history for webhook events, and scheduling redelivery of a specific event.
- **Webhook Endpoint**: Create, Delete, Get, Get Many, Reset Secret, Update — manage webhook subscriptions (URL, payload format, subscribed event types). Reset Secret immediately invalidates the previous signing secret.

Also update the top-of-file summary line (line 5, "checkouts, checkout links, customers, orders, subscriptions, and refunds") if it's the kind of illustrative (non-exhaustive) list that prior lots have left alone — confirm by checking whether prior lots (2a/2b/2c) touched it; if none did, leave it as-is here too, consistent with that precedent.

- [ ] **Step 2: Full-package verification**

Run `npm run lint` and `npm run build` one final time on the complete branch (all 4 tasks' changes together). Both must be clean.

Independently re-verify (do not just trust each task's own commit message):
- `nodes/Polar/Polar.node.ts` contains exactly 25 resources, alphabetically ordered, matching Global Constraints, with no duplicate `value`s and no orphaned imports.
- Every new resource's `index.ts` operation list is itself alphabetized by `name`.
- The `webhookEventTypeOptions` array in `shared/descriptions.ts` has exactly 35 entries, is alphabetized by `name`, and every `value` is a real `WebhookEventType` enum value (spot-check at least 10 against the live OpenAPI spec at `https://polar.sh/docs/openapi.yaml`).
- Every 5+-item nested `options`/`multiOptions` array introduced by Tasks 1-3 besides `webhookEventTypeOptions` is alphabetized by `displayName` (Payment's `status` — 3 items, below threshold but confirm alphabetical anyway; Webhook Endpoint's `format` — 3 items, same; Webhook Delivery's `http_code_class` — 4 items, same).
- `organization_id` does not appear as an exposed field/filter anywhere in the three new resources.
- Webhook Delivery's Redeliver field is genuinely named/described as a webhook *event* ID, not confusable with an endpoint or delivery ID.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: document Payment, Webhook Endpoint, and Webhook Delivery resources"
```

## Testing note

Payment's Get Many/Get can be verified directly against Sandbox once any payment exists there (e.g. from a completed Checkout in an earlier lot's testing). Webhook Endpoint's full lifecycle (Create → Get → Update → Reset Secret → Delete) is straightforward to verify against Sandbox. Webhook Delivery requires an actual delivered event to exist first — the realistic sequence is: Create a Webhook Endpoint pointed at a URL that will actually receive it (e.g. webhook.site), trigger any event covered by its `events` list (e.g. create a Checkout), then Get Many Deliveries filtered by that `endpoint_id`, and finally Redeliver using the `webhook_event.id` from one of the returned deliveries.
