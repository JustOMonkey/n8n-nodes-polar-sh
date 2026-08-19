# Polar Node — Lot 2c: Members, Customer Seats, Customer Sessions, Organization Access Tokens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four new resources to the `Polar` n8n node — Customer Seat (6 ops, incl. 2 unauthenticated), Customer Session (1 op), Member (6 ops), Organization Access Token (4 ops) — bringing the node from 18 to 22 resources.

**Architecture:** Same declarative-routing architecture as every prior lot: one file per operation under `nodes/Polar/resources/<resource>/`, an `index.ts` per resource wiring the Operation dropdown, `routing.send`/`routing.request` only (no custom `execute()`), reuse of `shared/descriptions.ts` helpers. This lot adds one new shared constant (`availableScopeOptions`, a 62-value `INodePropertyOptions[]` matching the existing `currencyOptions`/`countryOptions` pattern) and reuses three existing idioms verbatim: the omit-if-empty top-level field pattern (`value: '={{ $value || undefined }}'`, established by Subscription Cancel and Discount Create's `products` field), the raw-JSON-string-field pattern for genuinely arbitrary data (established by Meter's "Filter (JSON)" override), and the self-omitting "Update Fields"/"Additional Fields" collection pattern.

**Tech Stack:** TypeScript, n8n community node SDK (`n8n-node` CLI for lint/build), no new runtime npm dependency.

**Spec:** `docs/superpowers/specs/2026-08-19-polar-node-lot2c-members-seats-sessions-tokens-design.md`

## Global Constraints

- Auth: reuse the existing `Polar API` credential — no new credential. Customer Seat's Get Claim Info / Claim Seat operations correspond to genuinely unauthenticated API endpoints (`security: []` in the real spec) — the node still requires a configured credential (n8n's credential requirement is node-wide, not per-operation), but Polar's server does not check its validity for these two operations. Document this in each field's description; no special routing/code is needed — the credential is attached mechanically like every other operation, Polar's server just ignores it for these two.
- One file per operation under `nodes/Polar/resources/<resource>/`, camelCase directory names matching existing resources (`customerSeat`, `customerSession`, `member`, `organizationAccessToken`).
- `organization_id` is never exposed as a field/filter anywhere in this lot (the credential's token is already org-scoped) — this applies even though Organization Access Token's List operation has a real `organization_id` filter in the schema; omit it, matching every other list filter of this shape across the whole package.
- No `sorting` filter exposed on any Get Many operation (Member's `getAll` and Organization Access Token's `getAll` both have a real `sorting` parameter in their schemas; both are omitted, matching the established convention — confirmed zero resources in the codebase currently expose one).
- Cross-resource and own-resource ID fields are plain `type: 'string'`, never `resourceLocator`/`loadOptions`.
- 5+-item `options`/`collection`/`fixedCollection` `options` arrays must be alphabetized by `displayName`. This lot's largest instance is `availableScopeOptions` (62 entries) — the exact list, already alphabetized, is given verbatim in Task 4; do not re-derive or re-order it.
- Boolean field descriptions must contain the word "whether".
- Every new resource inserts into the existing 18-resource alphabetical Resource dropdown and `properties` spread in `Polar.node.ts`. Final 22-resource order: Benefit, Benefit Grant, Checkout, Checkout Link, Custom Field, Customer, Customer Meter, **Customer Seat**, **Customer Session**, Discount, Dispute, Event, Event Type, File, License Key, **Member**, Meter, Order, **Organization Access Token**, Product, Refund, Subscription.
- Run `npm run lint` and `npm run build` after every task; both must be clean before moving to the next task. There is no unit test suite in this package — lint + build is this project's established verification gate.
- Reuse `paginationProperties(show)` for every Get Many operation's `Return All`/`Limit` fields, **except** Customer Seat's List Seats, whose response (`SeatsList`) is not a standard paginated-list shape — that operation has no pagination fields at all (matches Meter's Get Quantities precedent from Lot 2a, which also skipped pagination for a non-list-shaped response).
- Every "Filters" collection field on a Get Many operation follows the exact pattern in `nodes/Polar/resources/subscription/getAll.ts`: a `type: 'collection'` field named `filters`, `placeholder: 'Add Filter'`, each option routing directly to `qs.<key>`.
- Every self-omitting "Update Fields"/"Additional Fields" collection follows the exact pattern in `nodes/Polar/resources/discount/update.ts`: a `type: 'collection'` field, `placeholder: 'Add Field'`, each option routing directly to `body.<key>` via `routing: { request: { body: { <key>: '={{$value}}' } } }` — omission is automatic since untouched options never appear in `$value`. **Exception**: a `multiOptions` field inside such a collection (Organization Access Token Update's `scopes`) additionally needs `value: '={{ $value.length ? $value : undefined }}'` inside that same `request.body` wrapper, because an *added-but-left-empty* `multiOptions` selection (`[]`) is otherwise indistinguishable from "no change" — this exact guard is already established for a standalone (non-collection) `multiOptions` field in `nodes/Polar/resources/discount/create.ts`'s `products` field; Task 4 applies the same guard inside a collection for the first time in this codebase, which is a direct, unsurprising extension of the existing idiom, not a new pattern.
- A genuinely optional top-level field (not inside any collection) that must be omitted from the request when left blank uses `routing: { send: { type: 'body', property: '<key>', value: '={{ $value || undefined }}' } }` — the exact pattern already used by `nodes/Polar/resources/subscription/cancel.ts`'s `customerCancellationReason`/`customerCancellationComment` fields. Use this (not a collection) for fields that are primary inputs to an operation rather than secondary/rarely-used extras — Customer Seat's Assign Seat and Customer Session's Create are both built this way, since none of their fields are more "additional" than any other.
- A genuinely arbitrary-JSON field (not a flat string/integer/number/boolean key-value bag — i.e. not what `typedMetadataField` is for) uses a raw `type: 'string'` field with `typeOptions: { rows: 4 }` and `routing: { send: { type: 'body', property: '<key>', value: '={{ $value ? JSON.parse($value) : undefined }}' } }` — the exact pattern already used by `nodes/Polar/resources/meter/create.ts`'s "Filter (JSON)" field. Customer Seat's `metadata` (Assign Seat) is this lot's one instance.
- Every `.toString()`-embedded function used in a `routing` expression must be fully self-contained — no closures. This lot introduces none (no new array-of-objects composite fields), so this constraint has nothing new to verify beyond the usual holistic check.

## Resources

### Customer Seat (Task 1) — 6 operations, 2 unauthenticated, one raw-JSON field
### Customer Session (Task 2) — 1 operation
### Member (Task 3) — 6 operations, one Create/Update role-enum asymmetry to get right
### Organization Access Token (Task 4) — 4 operations, introduces `availableScopeOptions` (62-value shared constant)
### README + final verification (Task 5)

---

### Task 1: Customer Seat resource

**Files:**
- Create: `nodes/Polar/resources/customerSeat/getAll.ts`
- Create: `nodes/Polar/resources/customerSeat/assign.ts`
- Create: `nodes/Polar/resources/customerSeat/revoke.ts`
- Create: `nodes/Polar/resources/customerSeat/resendInvitation.ts`
- Create: `nodes/Polar/resources/customerSeat/getClaimInfo.ts`
- Create: `nodes/Polar/resources/customerSeat/claim.ts`
- Create: `nodes/Polar/resources/customerSeat/index.ts`
- Modify: `nodes/Polar/Polar.node.ts` — add import + Resource dropdown entry + `properties` spread entry

**Interfaces:**
- Produces: `customerSeatDescription: INodeProperties[]` (exported from `resources/customerSeat/index.ts`), consumed only by `Polar.node.ts`. No other task depends on anything from this task.

- [ ] **Step 1: Create `nodes/Polar/resources/customerSeat/getAll.ts`**

```ts
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['customerSeat'], operation: ['getAll'] };

export const customerSeatGetAllDescription: INodeProperties[] = [
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show },
		description:
			'This response is not paginated — it returns every seat for the given subscription or order at once, along with the total and available seat counts',
		options: [
			{
				displayName: 'Order ID',
				name: 'order_id',
				type: 'string',
				default: '',
				description: 'Filter by the order the seats belong to (for one-time purchase seats)',
				routing: { request: { qs: { order_id: '={{$value}}' } } },
			},
			{
				displayName: 'Subscription ID',
				name: 'subscription_id',
				type: 'string',
				default: '',
				description: 'Filter by the subscription the seats belong to (for recurring seats)',
				routing: { request: { qs: { subscription_id: '={{$value}}' } } },
			},
		],
	},
];
```

- [ ] **Step 2: Create `nodes/Polar/resources/customerSeat/assign.ts`**

```ts
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['customerSeat'], operation: ['assign'] };

export const customerSeatAssignDescription: INodeProperties[] = [
	{
		displayName: 'Subscription ID',
		name: 'subscriptionId',
		type: 'string',
		default: '',
		displayOptions: { show },
		description:
			'The subscription to assign a seat from (for recurring seats). Provide this, or Order ID, or Checkout ID.',
		routing: { send: { type: 'body', property: 'subscription_id', value: '={{ $value || undefined }}' } },
	},
	{
		displayName: 'Order ID',
		name: 'orderId',
		type: 'string',
		default: '',
		displayOptions: { show },
		description:
			'The order to assign a seat from (for one-time purchase seats). Provide this, or Subscription ID, or Checkout ID.',
		routing: { send: { type: 'body', property: 'order_id', value: '={{ $value || undefined }}' } },
	},
	{
		displayName: 'Checkout ID',
		name: 'checkoutId',
		type: 'string',
		default: '',
		displayOptions: { show },
		description:
			'Resolves to the subscription or order produced by this checkout. Provide this, or Subscription ID, or Order ID.',
		routing: { send: { type: 'body', property: 'checkout_id', value: '={{ $value || undefined }}' } },
	},
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		default: '',
		displayOptions: { show },
		description:
			'Email of the customer to assign the seat to. Provide this and/or one of the ID fields below to identify the recipient.',
		routing: { send: { type: 'body', property: 'email', value: '={{ $value || undefined }}' } },
	},
	{
		displayName: 'Customer ID',
		name: 'customerId',
		type: 'string',
		default: '',
		displayOptions: { show },
		description: 'Customer ID for the seat assignment',
		routing: { send: { type: 'body', property: 'customer_id', value: '={{ $value || undefined }}' } },
	},
	{
		displayName: 'External Customer ID',
		name: 'externalCustomerId',
		type: 'string',
		default: '',
		displayOptions: { show },
		description: 'External customer ID for the seat assignment',
		routing: { send: { type: 'body', property: 'external_customer_id', value: '={{ $value || undefined }}' } },
	},
	{
		displayName: 'Member ID',
		name: 'memberId',
		type: 'string',
		default: '',
		displayOptions: { show },
		description: 'Member ID for the seat assignment',
		routing: { send: { type: 'body', property: 'member_id', value: '={{ $value || undefined }}' } },
	},
	{
		displayName: 'External Member ID',
		name: 'externalMemberId',
		type: 'string',
		default: '',
		displayOptions: { show },
		description:
			'Can be used alone (look up an existing member) or together with Email (create/validate a new member)',
		routing: { send: { type: 'body', property: 'external_member_id', value: '={{ $value || undefined }}' } },
	},
	{
		displayName: 'Immediate Claim',
		name: 'immediateClaim',
		type: 'boolean',
		default: false,
		displayOptions: { show },
		description: 'Whether to immediately claim the seat without sending an invitation email (API-only feature)',
		routing: { send: { type: 'body', property: 'immediate_claim' } },
	},
	{
		displayName: 'Metadata (JSON)',
		name: 'metadataJson',
		type: 'string',
		typeOptions: { rows: 4 },
		default: '',
		displayOptions: { show },
		description: 'Additional metadata for the seat, as a JSON object (max 10 keys, 1KB total)',
		routing: { send: { type: 'body', property: 'metadata', value: '={{ $value ? JSON.parse($value) : undefined }}' } },
	},
];
```

- [ ] **Step 3: Create `nodes/Polar/resources/customerSeat/revoke.ts`**

```ts
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['customerSeat'], operation: ['revoke'] };

export const customerSeatRevokeDescription: INodeProperties[] = [
	{
		displayName: 'Seat ID',
		name: 'seatId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
];
```

- [ ] **Step 4: Create `nodes/Polar/resources/customerSeat/resendInvitation.ts`**

```ts
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['customerSeat'], operation: ['resendInvitation'] };

export const customerSeatResendInvitationDescription: INodeProperties[] = [
	{
		displayName: 'Seat ID',
		name: 'seatId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
];
```

- [ ] **Step 5: Create `nodes/Polar/resources/customerSeat/getClaimInfo.ts`**

```ts
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['customerSeat'], operation: ['getClaimInfo'] };

export const customerSeatGetClaimInfoDescription: INodeProperties[] = [
	{
		displayName: 'Invitation Token',
		name: 'invitationToken',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description:
			'This endpoint requires no authentication on Polar’s side — it is meant for the invited person’s own client, and works regardless of whether the configured credential is valid',
	},
];
```

- [ ] **Step 6: Create `nodes/Polar/resources/customerSeat/claim.ts`**

```ts
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['customerSeat'], operation: ['claim'] };

export const customerSeatClaimDescription: INodeProperties[] = [
	{
		displayName: 'Invitation Token',
		name: 'invitationToken',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description:
			'This endpoint requires no authentication on Polar’s side — it is meant for the invited person’s own client, and works regardless of whether the configured credential is valid',
		routing: { send: { type: 'body', property: 'invitation_token' } },
	},
];
```

- [ ] **Step 7: Create `nodes/Polar/resources/customerSeat/index.ts`**

```ts
import type { INodeProperties } from 'n8n-workflow';
import { customerSeatGetAllDescription } from './getAll';
import { customerSeatAssignDescription } from './assign';
import { customerSeatRevokeDescription } from './revoke';
import { customerSeatResendInvitationDescription } from './resendInvitation';
import { customerSeatGetClaimInfoDescription } from './getClaimInfo';
import { customerSeatClaimDescription } from './claim';

const showOnlyForCustomerSeat = { resource: ['customerSeat'] };

export const customerSeatDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForCustomerSeat },
		options: [
			{
				name: 'Assign Seat',
				value: 'assign',
				action: 'Assign a seat',
				description: 'Assign a seat to a customer or member',
				routing: { request: { method: 'POST', url: '=/customer-seats' } },
			},
			{
				name: 'Claim Seat',
				value: 'claim',
				action: 'Claim a seat',
				description: 'Claim a seat using an invitation token (no authentication required)',
				routing: { request: { method: 'POST', url: '=/customer-seats/claim' } },
			},
			{
				name: 'Get Claim Info',
				value: 'getClaimInfo',
				action: 'Get seat claim info',
				description: 'Get read-only information about a seat claim invitation (no authentication required)',
				routing: { request: { method: 'GET', url: '=/customer-seats/claim/{{$parameter["invitationToken"]}}' } },
			},
			{
				name: 'List Seats',
				value: 'getAll',
				action: 'List seats',
				description: 'List seats for a subscription or order',
				routing: { request: { method: 'GET', url: '=/customer-seats' } },
			},
			{
				name: 'Resend Invitation',
				value: 'resendInvitation',
				action: 'Resend a seat invitation',
				description: 'Resend the invitation email for a pending seat',
				routing: { request: { method: 'POST', url: '=/customer-seats/{{$parameter["seatId"]}}/resend' } },
			},
			{
				name: 'Revoke Seat',
				value: 'revoke',
				action: 'Revoke a seat',
				description: 'Revoke an assigned or pending seat',
				routing: { request: { method: 'DELETE', url: '=/customer-seats/{{$parameter["seatId"]}}' } },
			},
		],
		default: 'getAll',
	},
	...customerSeatGetAllDescription,
	...customerSeatAssignDescription,
	...customerSeatRevokeDescription,
	...customerSeatResendInvitationDescription,
	...customerSeatGetClaimInfoDescription,
	...customerSeatClaimDescription,
];
```

- [ ] **Step 8: Wire into `nodes/Polar/Polar.node.ts`**

Add the import alphabetically (after `customerMeterDescription`, before `discountDescription`):

```ts
import { customerSeatDescription } from './resources/customerSeat';
```

Add the Resource dropdown entry alphabetically (after `{ name: 'Customer Meter', value: 'customerMeter' }`, before `{ name: 'Discount', value: 'discount' }`):

```ts
					{ name: 'Customer Seat', value: 'customerSeat' },
```

Add the `properties` spread entry in the same relative position (after `...customerMeterDescription,`, before `...discountDescription,`):

```ts
			...customerSeatDescription,
```

- [ ] **Step 9: Verify and commit**

Run `npm run lint` and `npm run build`; both must be clean. Commit:

```bash
git add nodes/Polar/resources/customerSeat nodes/Polar/Polar.node.ts
git commit -m "feat: add Customer Seat resource"
```

---

### Task 2: Customer Session resource

**Files:**
- Create: `nodes/Polar/resources/customerSession/create.ts`
- Create: `nodes/Polar/resources/customerSession/index.ts`
- Modify: `nodes/Polar/Polar.node.ts` — add import + Resource dropdown entry + `properties` spread entry

**Interfaces:**
- Produces: `customerSessionDescription: INodeProperties[]`, consumed only by `Polar.node.ts`. No dependency on Task 1.

- [ ] **Step 1: Create `nodes/Polar/resources/customerSession/create.ts`**

```ts
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['customerSession'], operation: ['create'] };

export const customerSessionCreateDescription: INodeProperties[] = [
	{
		displayName: 'Customer ID',
		name: 'customerId',
		type: 'string',
		default: '',
		displayOptions: { show },
		description: 'Provide exactly one of Customer ID / External Customer ID to identify who this session is for',
		routing: { send: { type: 'body', property: 'customer_id', value: '={{ $value || undefined }}' } },
	},
	{
		displayName: 'External Customer ID',
		name: 'externalCustomerId',
		type: 'string',
		default: '',
		displayOptions: { show },
		description: 'Provide exactly one of Customer ID / External Customer ID to identify who this session is for',
		routing: { send: { type: 'body', property: 'external_customer_id', value: '={{ $value || undefined }}' } },
	},
	{
		displayName: 'Member ID',
		name: 'memberId',
		type: 'string',
		default: '',
		displayOptions: { show },
		description:
			'ID of the member to create a session for. When not provided and the organization has member management enabled, the owner member of the customer is used for individual customers.',
		routing: { send: { type: 'body', property: 'member_id', value: '={{ $value || undefined }}' } },
	},
	{
		displayName: 'External Member ID',
		name: 'externalMemberId',
		type: 'string',
		default: '',
		displayOptions: { show },
		description: 'Alternative to Member ID',
		routing: { send: { type: 'body', property: 'external_member_id', value: '={{ $value || undefined }}' } },
	},
	{
		displayName: 'Return URL',
		name: 'returnUrl',
		type: 'string',
		default: '',
		displayOptions: { show },
		description: 'When set, a back button is shown in the customer portal to return to this URL',
		routing: { send: { type: 'body', property: 'return_url', value: '={{ $value || undefined }}' } },
	},
];
```

- [ ] **Step 2: Create `nodes/Polar/resources/customerSession/index.ts`**

```ts
import type { INodeProperties } from 'n8n-workflow';
import { customerSessionCreateDescription } from './create';

const showOnlyForCustomerSession = { resource: ['customerSession'] };

export const customerSessionDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForCustomerSession },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a customer session',
				description: 'Generate a one-time customer portal access token',
				routing: { request: { method: 'POST', url: '=/customer-sessions/' } },
			},
		],
		default: 'create',
	},
	...customerSessionCreateDescription,
];
```

- [ ] **Step 3: Wire into `nodes/Polar/Polar.node.ts`**

Add the import alphabetically (after `customerSeatDescription` — which Task 1 already inserted before `discountDescription` — before `discountDescription`):

```ts
import { customerSessionDescription } from './resources/customerSession';
```

Add the Resource dropdown entry alphabetically (after `{ name: 'Customer Seat', value: 'customerSeat' }`, before `{ name: 'Discount', value: 'discount' }`):

```ts
					{ name: 'Customer Session', value: 'customerSession' },
```

Add the `properties` spread entry in the same relative position:

```ts
			...customerSessionDescription,
```

- [ ] **Step 4: Verify and commit**

Run `npm run lint` and `npm run build`; both must be clean. Commit:

```bash
git add nodes/Polar/resources/customerSession nodes/Polar/Polar.node.ts
git commit -m "feat: add Customer Session resource"
```

---

### Task 3: Member resource

**Files:**
- Create: `nodes/Polar/resources/member/getAll.ts`
- Create: `nodes/Polar/resources/member/get.ts`
- Create: `nodes/Polar/resources/member/getByExternalId.ts`
- Create: `nodes/Polar/resources/member/create.ts`
- Create: `nodes/Polar/resources/member/update.ts`
- Create: `nodes/Polar/resources/member/delete.ts`
- Create: `nodes/Polar/resources/member/index.ts`
- Modify: `nodes/Polar/Polar.node.ts` — add import + Resource dropdown entry + `properties` spread entry

**Interfaces:**
- Produces: `memberDescription: INodeProperties[]`, consumed only by `Polar.node.ts`. No dependency on Tasks 1-2.

**Load-bearing detail — do not "fix" this into consistency:** `MemberCreate.role` accepts only 2 values (`member`, `billing_manager` — no `owner`), while `MemberUpdate.role` accepts the full 3-value `MemberRole` (`owner`, `billing_manager`, `member`). This is real, grounded in the live OpenAPI spec, not a typo. Create's Role dropdown must have exactly 2 options; Update's must have exactly 3.

- [ ] **Step 1: Create `nodes/Polar/resources/member/getAll.ts`**

```ts
import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../shared/descriptions';

const show = { resource: ['member'], operation: ['getAll'] };

export const memberGetAllDescription: INodeProperties[] = [
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
				displayName: 'Role',
				name: 'role',
				type: 'options',
				options: [
					{ name: 'Billing Manager', value: 'billing_manager' },
					{ name: 'Member', value: 'member' },
					{ name: 'Owner', value: 'owner' },
				],
				default: 'member',
				routing: { request: { qs: { role: '={{$value}}' } } },
			},
		],
	},
];
```

- [ ] **Step 2: Create `nodes/Polar/resources/member/get.ts`**

```ts
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['member'], operation: ['get'] };

export const memberGetDescription: INodeProperties[] = [
	{
		displayName: 'Member ID',
		name: 'memberId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
];
```

- [ ] **Step 3: Create `nodes/Polar/resources/member/getByExternalId.ts`**

```ts
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['member'], operation: ['getByExternalId'] };

export const memberGetByExternalIdDescription: INodeProperties[] = [
	{
		displayName: 'External ID',
		name: 'externalId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: "The member's external ID",
	},
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show },
		description: 'One of Customer ID / External Customer ID is required by the API to disambiguate',
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
		],
	},
];
```

- [ ] **Step 4: Create `nodes/Polar/resources/member/create.ts`**

```ts
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['member'], operation: ['create'] };

export const memberCreateDescription: INodeProperties[] = [
	{
		displayName: 'Customer ID',
		name: 'customerId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'The customer this member belongs to',
		routing: { send: { type: 'body', property: 'customer_id' } },
	},
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'email' } },
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
				displayName: 'External ID',
				name: 'external_id',
				type: 'string',
				default: '',
				description: "The member's ID in your own system. Must be unique within the customer.",
				routing: { request: { body: { external_id: '={{$value}}' } } },
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				routing: { request: { body: { name: '={{$value}}' } } },
			},
			{
				displayName: 'Role',
				name: 'role',
				type: 'options',
				options: [
					{ name: 'Billing Manager', value: 'billing_manager' },
					{ name: 'Member', value: 'member' },
				],
				default: 'member',
				description:
					"To assign or transfer ownership, use the Update operation instead — 'Owner' is not a valid role on Create",
				routing: { request: { body: { role: '={{$value}}' } } },
			},
		],
	},
];
```

- [ ] **Step 5: Create `nodes/Polar/resources/member/update.ts`**

```ts
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['member'], operation: ['update'] };

export const memberUpdateDescription: INodeProperties[] = [
	{
		displayName: 'Member ID',
		name: 'memberId',
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
				displayName: 'Role',
				name: 'role',
				type: 'options',
				options: [
					{ name: 'Billing Manager', value: 'billing_manager' },
					{ name: 'Member', value: 'member' },
					{ name: 'Owner', value: 'owner' },
				],
				default: 'member',
				description: "Assigning 'Owner' transfers ownership of the customer to this member",
				routing: { request: { body: { role: '={{$value}}' } } },
			},
		],
	},
];
```

- [ ] **Step 6: Create `nodes/Polar/resources/member/delete.ts`**

```ts
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['member'], operation: ['delete'] };

export const memberDeleteDescription: INodeProperties[] = [
	{
		displayName: 'Member ID',
		name: 'memberId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
];
```

- [ ] **Step 7: Create `nodes/Polar/resources/member/index.ts`**

```ts
import type { INodeProperties } from 'n8n-workflow';
import { memberGetAllDescription } from './getAll';
import { memberGetDescription } from './get';
import { memberGetByExternalIdDescription } from './getByExternalId';
import { memberCreateDescription } from './create';
import { memberUpdateDescription } from './update';
import { memberDeleteDescription } from './delete';

const showOnlyForMember = { resource: ['member'] };

export const memberDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForMember },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a member',
				description: 'Create a new member for a B2B customer',
				routing: { request: { method: 'POST', url: '=/members/' } },
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a member',
				description: 'Delete a member',
				routing: { request: { method: 'DELETE', url: '=/members/{{$parameter["memberId"]}}' } },
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a member',
				description: 'Get a single member by ID',
				routing: { request: { method: 'GET', url: '=/members/{{$parameter["memberId"]}}' } },
			},
			{
				name: 'Get By External ID',
				value: 'getByExternalId',
				action: 'Get a member by external ID',
				description: 'Get a single member by its external ID',
				routing: { request: { method: 'GET', url: '=/members/external/{{$parameter["externalId"]}}' } },
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many members',
				description: 'Get many members',
				routing: { request: { method: 'GET', url: '=/members/' } },
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a member',
				description: 'Update an existing member (name and role only)',
				routing: { request: { method: 'PATCH', url: '=/members/{{$parameter["memberId"]}}' } },
			},
		],
		default: 'getAll',
	},
	...memberGetAllDescription,
	...memberGetDescription,
	...memberGetByExternalIdDescription,
	...memberCreateDescription,
	...memberUpdateDescription,
	...memberDeleteDescription,
];
```

- [ ] **Step 8: Wire into `nodes/Polar/Polar.node.ts`**

Add the import alphabetically (after `licenseKeyDescription`, before `meterDescription`):

```ts
import { memberDescription } from './resources/member';
```

Add the Resource dropdown entry alphabetically (after `{ name: 'License Key', value: 'licenseKey' }`, before `{ name: 'Meter', value: 'meter' }`):

```ts
					{ name: 'Member', value: 'member' },
```

Add the `properties` spread entry in the same relative position:

```ts
			...memberDescription,
```

- [ ] **Step 9: Verify and commit**

Run `npm run lint` and `npm run build`; both must be clean. Commit:

```bash
git add nodes/Polar/resources/member nodes/Polar/Polar.node.ts
git commit -m "feat: add Member resource"
```

---

### Task 4: Organization Access Token resource

**Files:**
- Modify: `nodes/Polar/shared/descriptions.ts` — add `availableScopeOptions` export (insert directly after the existing `currencyOptions` export)
- Create: `nodes/Polar/resources/organizationAccessToken/getAll.ts`
- Create: `nodes/Polar/resources/organizationAccessToken/create.ts`
- Create: `nodes/Polar/resources/organizationAccessToken/update.ts`
- Create: `nodes/Polar/resources/organizationAccessToken/delete.ts`
- Create: `nodes/Polar/resources/organizationAccessToken/index.ts`
- Modify: `nodes/Polar/Polar.node.ts` — add import + Resource dropdown entry + `properties` spread entry

**Interfaces:**
- Produces: `availableScopeOptions` in `shared/descriptions.ts`, consumed only within this task's own `create.ts`/`update.ts`. No other task in this plan needs it.
- Produces: `organizationAccessTokenDescription: INodeProperties[]`, consumed only by `Polar.node.ts`.

- [ ] **Step 1: Add `availableScopeOptions` to `nodes/Polar/shared/descriptions.ts`**

Insert this constant immediately after the existing `currencyOptions` export (which ends at the line `];` closing its array, currently around line 52), and before `billingAddressField`. **This is the complete, alphabetized 62-value list — use it verbatim, do not re-derive or re-order it:**

```ts
export const availableScopeOptions: INodePropertyOptions[] = [
	{ name: 'Benefits: Read', value: 'benefits:read' },
	{ name: 'Benefits: Write', value: 'benefits:write' },
	{ name: 'Checkout Links: Read', value: 'checkout_links:read' },
	{ name: 'Checkout Links: Write', value: 'checkout_links:write' },
	{ name: 'Checkouts: Read', value: 'checkouts:read' },
	{ name: 'Checkouts: Write', value: 'checkouts:write' },
	{ name: 'Custom Fields: Read', value: 'custom_fields:read' },
	{ name: 'Custom Fields: Write', value: 'custom_fields:write' },
	{ name: 'Customer Meters: Read', value: 'customer_meters:read' },
	{ name: 'Customer Portal: Read', value: 'customer_portal:read' },
	{ name: 'Customer Portal: Write', value: 'customer_portal:write' },
	{ name: 'Customer Seats: Read', value: 'customer_seats:read' },
	{ name: 'Customer Seats: Write', value: 'customer_seats:write' },
	{ name: 'Customer Sessions: Write', value: 'customer_sessions:write' },
	{ name: 'Customers: Read', value: 'customers:read' },
	{ name: 'Customers: Write', value: 'customers:write' },
	{ name: 'Discounts: Read', value: 'discounts:read' },
	{ name: 'Discounts: Write', value: 'discounts:write' },
	{ name: 'Disputes: Read', value: 'disputes:read' },
	{ name: 'Email', value: 'email' },
	{ name: 'Events: Read', value: 'events:read' },
	{ name: 'Events: Write', value: 'events:write' },
	{ name: 'Files: Read', value: 'files:read' },
	{ name: 'Files: Write', value: 'files:write' },
	{ name: 'License Keys: Read', value: 'license_keys:read' },
	{ name: 'License Keys: Write', value: 'license_keys:write' },
	{ name: 'Member Sessions: Write', value: 'member_sessions:write' },
	{ name: 'Members: Read', value: 'members:read' },
	{ name: 'Members: Write', value: 'members:write' },
	{ name: 'Meters: Read', value: 'meters:read' },
	{ name: 'Meters: Write', value: 'meters:write' },
	{ name: 'Metrics: Read', value: 'metrics:read' },
	{ name: 'Metrics: Write', value: 'metrics:write' },
	{ name: 'Notification Recipients: Read', value: 'notification_recipients:read' },
	{ name: 'Notification Recipients: Write', value: 'notification_recipients:write' },
	{ name: 'Notifications: Read', value: 'notifications:read' },
	{ name: 'Notifications: Write', value: 'notifications:write' },
	{ name: 'OpenID', value: 'openid' },
	{ name: 'Orders: Read', value: 'orders:read' },
	{ name: 'Orders: Write', value: 'orders:write' },
	{ name: 'Organization Access Tokens: Read', value: 'organization_access_tokens:read' },
	{ name: 'Organization Access Tokens: Write', value: 'organization_access_tokens:write' },
	{ name: 'Organizations: Read', value: 'organizations:read' },
	{ name: 'Organizations: Write', value: 'organizations:write' },
	{ name: 'Payments: Read', value: 'payments:read' },
	{ name: 'Payouts: Read', value: 'payouts:read' },
	{ name: 'Payouts: Write', value: 'payouts:write' },
	{ name: 'Products: Read', value: 'products:read' },
	{ name: 'Products: Write', value: 'products:write' },
	{ name: 'Profile', value: 'profile' },
	{ name: 'Refunds: Read', value: 'refunds:read' },
	{ name: 'Refunds: Write', value: 'refunds:write' },
	{ name: 'Subscriptions: Read', value: 'subscriptions:read' },
	{ name: 'Subscriptions: Write', value: 'subscriptions:write' },
	{ name: 'Transactions: Read', value: 'transactions:read' },
	{ name: 'Transactions: Write', value: 'transactions:write' },
	{ name: 'User: Read', value: 'user:read' },
	{ name: 'User: Write', value: 'user:write' },
	{ name: 'Wallets: Read', value: 'wallets:read' },
	{ name: 'Wallets: Write', value: 'wallets:write' },
	{ name: 'Webhooks: Read', value: 'webhooks:read' },
	{ name: 'Webhooks: Write', value: 'webhooks:write' },
];
```

`INodePropertyOptions` is already imported at the top of `shared/descriptions.ts` (used by `countryOptions`/`currencyOptions`) — no new import needed.

- [ ] **Step 2: Create `nodes/Polar/resources/organizationAccessToken/getAll.ts`**

```ts
import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../shared/descriptions';

const show = { resource: ['organizationAccessToken'], operation: ['getAll'] };

export const organizationAccessTokenGetAllDescription: INodeProperties[] = [...paginationProperties(show)];
```

- [ ] **Step 3: Create `nodes/Polar/resources/organizationAccessToken/create.ts`**

```ts
import type { INodeProperties } from 'n8n-workflow';
import { availableScopeOptions } from '../../shared/descriptions';

const show = { resource: ['organizationAccessToken'], operation: ['create'] };

export const organizationAccessTokenCreateDescription: INodeProperties[] = [
	{
		displayName: 'Comment',
		name: 'comment',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'A note to help you identify this token later',
		routing: { send: { type: 'body', property: 'comment' } },
	},
	{
		displayName: 'Scopes',
		name: 'scopes',
		type: 'multiOptions',
		options: availableScopeOptions,
		default: [],
		required: true,
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'scopes' } },
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
				displayName: 'Expires In',
				name: 'expires_in',
				type: 'string',
				default: '',
				description: "ISO 8601 duration string, e.g. 'P30D' for 30 days. Leave empty for a token that never expires.",
				routing: { request: { body: { expires_in: '={{$value}}' } } },
			},
		],
	},
];
```

- [ ] **Step 4: Create `nodes/Polar/resources/organizationAccessToken/update.ts`**

```ts
import type { INodeProperties } from 'n8n-workflow';
import { availableScopeOptions } from '../../shared/descriptions';

const show = { resource: ['organizationAccessToken'], operation: ['update'] };

export const organizationAccessTokenUpdateDescription: INodeProperties[] = [
	{
		displayName: 'Organization Access Token ID',
		name: 'organizationAccessTokenId',
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
				displayName: 'Comment',
				name: 'comment',
				type: 'string',
				default: '',
				routing: { request: { body: { comment: '={{$value}}' } } },
			},
			{
				displayName: 'Scopes',
				name: 'scopes',
				type: 'multiOptions',
				options: availableScopeOptions,
				default: [],
				description: 'Leave empty to keep the existing scopes unchanged',
				routing: { request: { body: { scopes: '={{ $value.length ? $value : undefined }}' } } },
			},
		],
	},
];
```

- [ ] **Step 5: Create `nodes/Polar/resources/organizationAccessToken/delete.ts`**

```ts
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['organizationAccessToken'], operation: ['delete'] };

export const organizationAccessTokenDeleteDescription: INodeProperties[] = [
	{
		displayName: 'Organization Access Token ID',
		name: 'organizationAccessTokenId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
];
```

- [ ] **Step 6: Create `nodes/Polar/resources/organizationAccessToken/index.ts`**

```ts
import type { INodeProperties } from 'n8n-workflow';
import { organizationAccessTokenGetAllDescription } from './getAll';
import { organizationAccessTokenCreateDescription } from './create';
import { organizationAccessTokenUpdateDescription } from './update';
import { organizationAccessTokenDeleteDescription } from './delete';

const showOnlyForOrganizationAccessToken = { resource: ['organizationAccessToken'] };

export const organizationAccessTokenDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForOrganizationAccessToken },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create an organization access token',
				description:
					'Create a new organization access token. The raw token value is only ever returned once, in this response — capture it immediately.',
				routing: { request: { method: 'POST', url: '=/organization-access-tokens/' } },
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete an organization access token',
				description: 'Delete an organization access token',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/organization-access-tokens/{{$parameter["organizationAccessTokenId"]}}',
					},
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many organization access tokens',
				description: 'Get many organization access tokens',
				routing: { request: { method: 'GET', url: '=/organization-access-tokens/' } },
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update an organization access token',
				description: 'Update an existing organization access token',
				routing: {
					request: {
						method: 'PATCH',
						url: '=/organization-access-tokens/{{$parameter["organizationAccessTokenId"]}}',
					},
				},
			},
		],
		default: 'getAll',
	},
	...organizationAccessTokenGetAllDescription,
	...organizationAccessTokenCreateDescription,
	...organizationAccessTokenUpdateDescription,
	...organizationAccessTokenDeleteDescription,
];
```

- [ ] **Step 7: Wire into `nodes/Polar/Polar.node.ts`**

Add the import alphabetically (after `orderDescription`, before `productDescription`):

```ts
import { organizationAccessTokenDescription } from './resources/organizationAccessToken';
```

Add the Resource dropdown entry alphabetically (after `{ name: 'Order', value: 'order' }`, before `{ name: 'Product', value: 'product' }`):

```ts
					{ name: 'Organization Access Token', value: 'organizationAccessToken' },
```

Add the `properties` spread entry in the same relative position:

```ts
			...organizationAccessTokenDescription,
```

At this point `Polar.node.ts` has all 22 resources in the exact alphabetical order specified in Global Constraints — verify this explicitly before committing.

- [ ] **Step 8: Verify and commit**

Run `npm run lint` and `npm run build`; both must be clean. Commit:

```bash
git add nodes/Polar/shared/descriptions.ts nodes/Polar/resources/organizationAccessToken nodes/Polar/Polar.node.ts
git commit -m "feat: add Organization Access Token resource"
```

---

### Task 5: README update and full-package verification

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: the final state of `nodes/Polar/Polar.node.ts` after Tasks 1–4 (all 22 resources landed). No other task depends on this one — it is the last task in the plan.

- [ ] **Step 1: Update `README.md`**

Find the bullet list documenting the node's resources and operations. If it is already fully alphabetized (it should be, after Lot 2b's Task 5 either found it already alphabetical or fixed it), insert four new bullets — **Customer Seat**, **Customer Session**, **Member**, **Organization Access Token** — in their correct alphabetical positions without reordering the rest. If any drift from alphabetical order is found, re-alphabetize the whole list (matching the precedent both Lot 2a's and Lot 2b's Task 5 already established for this exact situation) — verify, don't assume.

Content for each new bullet:

- **Customer Seat**: Assign Seat, Claim Seat, Get Claim Info, List Seats, Resend Invitation, Revoke Seat — assign, revoke, and manage seat-based subscription/order member seats; Get Claim Info and Claim Seat require no Polar authentication (they're for the invited person's own client).
- **Customer Session**: Create — generate a one-time customer portal access token.
- **Member**: Create, Delete, Get, Get By External ID, Get Many, Update — manage individual people within a B2B customer (requires the organization's member-management feature).
- **Organization Access Token**: Create, Delete, Get Many, Update — manage the org-scoped API tokens themselves (the same kind of token this package's own credential uses). The raw token value is only returned once, at creation.

- [ ] **Step 2: Full-package verification**

Run `npm run lint` and `npm run build` one final time on the complete branch (all 5 tasks' changes together). Both must be clean.

Independently re-verify (do not just trust each task's own commit message):
- `nodes/Polar/Polar.node.ts` contains exactly 22 resources, alphabetically ordered, matching Global Constraints, with no duplicate `value`s and no orphaned imports.
- Every new resource's `index.ts` operation list is itself alphabetized by `name`.
- The `availableScopeOptions` array in `shared/descriptions.ts` has exactly 62 entries, is alphabetized by `name`, and every `value` is a real `AvailableScope` enum value (spot-check at least 10 against the live OpenAPI spec at `https://polar.sh/docs/openapi.yaml`).
- Every 5+-item nested `options` array introduced by Tasks 1-4 besides `availableScopeOptions` (Member's Role options in `getAll.ts`/`update.ts` — 3 items, below the 5-item threshold but confirm alphabetical anyway) is alphabetized by `displayName`.
- Customer Seat's List Seats operation genuinely has no pagination fields (confirm this wasn't accidentally added).

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: document Customer Seat, Customer Session, Member, and Organization Access Token resources"
```

## Testing note

Carry the spec's testing note into manual Sandbox verification once the branch is otherwise clean: Customer Seat's full lifecycle depends on a seat-based subscription or order existing in Sandbox (seat-based pricing must be enabled for the organization) — Assign Seat → List Seats → (optionally) Resend Invitation → Get Claim Info (with the invitation token from the assigned seat) → Claim Seat is the realistic end-to-end sequence to verify manually. Organization Access Token Create should be verified to actually return a usable `token` string once, and that a subsequent Get Many/Update never exposes it again.
