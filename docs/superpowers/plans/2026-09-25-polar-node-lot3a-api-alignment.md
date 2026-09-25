# Polar Node Lot 3a — Core API Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the `Polar` node's Core API surface match Polar's 2026-10 OpenAPI spec exactly. Remove what no longer exists, migrate Member to its new customer-scoped endpoints, and add the missing operations and resources.

**Architecture:** Declarative n8n node (routing-only, no `execute()`), one file per operation under `nodes/Polar/resources/<resource>/`. Two dev-only safety nets are added first:
- `scripts/audit-openapi.mjs` diffs the **built** node description against the live spec: endpoints, scope notices and webhook events.
- `test/*.test.mjs` (Node's built-in `node:test`, zero deps) pins the few pieces of runtime logic and the backward-compatibility contracts.

**Tech Stack:** TypeScript, n8n-workflow declarative routing, `@n8n/node-cli` (build/lint), Node 24 (`node:test`, global `fetch`).

**Spec:** `docs/superpowers/specs/2026-09-25-polar-node-lot3a-api-alignment-design.md`

## Global Constraints

- Reuse the existing `Polar API` credential. No new credential, no new runtime npm dependency (dev scripts use Node built-ins only).
- Every operation's routing sets `ignoreHttpStatusErrors: true` and `output.postReceive` starting with `handlePolarApiError`. Every resource `index.ts` spreads `...scopeNoticesForResource('<resource>')` right after its Operation property.
- ID fields are plain `type: 'string'`, `required: true`, `default: ''`.
- Update operations use a self-omitting `type: 'collection'` named `updateFields`, placeholder `'Add Field'`.
- 5+-item `options` / `multiOptions` arrays are alphabetized by `name` (lint's `localeCompare` comparator — `npm run lint` is the judge). Boolean field descriptions contain the word "whether".
- `organization_id` and `sorting` are never exposed. Array-capable ID filters are a single plain string field. Only fixed enums get `multiOptions`.
- Huge enums (`timezone`, `country`, `default_presentment_currency`) are plain string fields.
- Scopes come from the 2026-10 spec's `security[].oat` array. Multiple scopes are AND'd.
- Excluded from this lot: `/customer-portal/*`, `/oauth2/*`, `/checkouts/client/*`, `POST /organizations`.
- Version bump and CHANGELOG are **not** edited by hand: `npm run release` (release-it + auto-changelog) produces them. The user picks **minor → 1.1.0** at release time.
- Dev loop for every task: `npm run build && npm run lint && npm test && node scripts/audit-openapi.mjs`.

## Review Focus

1. **Export endpoint returns a 4xx** (e.g. invalid date filter). The body arrives as a raw `Buffer` because exports use `encoding: 'arraybuffer'`. The user must still see Polar's `detail` message, not `[object Object]` or a missing message. Pinned in Task 2 (`handlePolarApiError` Buffer test).
2. **Multi-value filters** (Order Export status = Paid + Refunded, Metric Billing Type, columns). They must reach Polar as repeated keys (`status=paid&status=refunded`), otherwise FastAPI rejects them or keeps only one. Pinned in Task 1: the audit asserts `arrayFormat: 'repeat'` on every export/metrics request.
3. **Saved workflows using the old Member operations** must still open with the same operation selected. Pinned in Task 4: a test asserts the six legacy operation values still exist.
4. **Export with zero matching rows**: Polar returns a header-only or empty CSV. The node must still emit one item with a binary `data` file, not zero items or a crash. Pinned in Task 2 (`csvToBinary` empty-buffer test).
5. **Metric dates set via an expression** (a Luxon DateTime or a full ISO timestamp with a time zone). They must be sent as `YYYY-MM-DD`, because the spec types them `format: date` and a full timestamp returns 422. Pinned in Task 7: a test asserts the send-value expression truncates to 10 characters.

---

### Task 1: OpenAPI audit harness + test runner

**Files:**
- Create: `scripts/audit-openapi.mjs`
- Create: `test/.gitkeep` (removed in Task 2 once a real test exists — skip if Task 2 runs immediately)
- Modify: `package.json` (`scripts.test`)
- Modify (only if lint complains): `eslint.config.mjs`

**Interfaces:**
- Produces: `node scripts/audit-openapi.mjs [spec-path-or-url]`. It exits 0 when the built node matches the spec and 1 otherwise, printing one line per problem prefixed `NOT IN API`, `MISSING`, `SCOPES`, `ARRAYFORMAT` or `EVENTS`. It requires `npm run build` first because it reads `dist/`.
- Produces: `npm test` → `node --test "test/**/*.test.mjs"`.

- [ ] **Step 1: Write the audit script**

Create `scripts/audit-openapi.mjs`:

```js
#!/usr/bin/env node
// Dev-only check: diffs the BUILT Polar node (dist/) against Polar's versioned OpenAPI spec.
// Usage: npm run build && node scripts/audit-openapi.mjs [spec-path-or-url]
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';

const require = createRequire(import.meta.url);
const SPEC = process.argv[2] ?? 'https://polar.sh/docs/openapi/2026-10.openapi.json';
const spec = SPEC.startsWith('http')
	? await (await fetch(SPEC)).json()
	: JSON.parse(await readFile(SPEC, 'utf8'));

// Endpoints the Polar node deliberately doesn't cover (see the Lot 3a spec, "Out of scope").
const EXCLUDED_PREFIXES = ['/customer-portal/', '/oauth2/', '/checkouts/client/'];
const EXCLUDED_OPS = new Set(['POST /organizations']);

const norm = (url) =>
	url
		.replace(/^=/, '')
		.replace(/^\/v1/, '')
		.replace(/\{\{[^}]*\}\}|\{[^}]+\}/g, '{}')
		.replace(/\/$/, '');

const specOps = new Map();
for (const [path, methods] of Object.entries(spec.paths)) {
	for (const [method, op] of Object.entries(methods)) {
		if (!['get', 'post', 'put', 'patch', 'delete'].includes(method)) continue;
		const oat = (op.security ?? []).find((s) => s.oat)?.oat ?? null;
		specOps.set(`${method.toUpperCase()} ${norm(path)}`, oat && oat.length ? [...oat].sort() : null);
	}
}

const { Polar } = require('../dist/nodes/Polar/Polar.node.js');
const properties = new Polar().description.properties;

const nodeOps = new Map(); // key -> { resource, operation, request }
for (const prop of properties) {
	if (prop.name !== 'operation' || prop.type !== 'options') continue;
	const resource = prop.displayOptions.show.resource[0];
	for (const option of prop.options) {
		const request = option.routing?.request;
		if (!request) continue;
		nodeOps.set(`${request.method} ${norm(request.url)}`, { resource, operation: option.value, request });
	}
}

const notices = new Map(); // "resource.operation" -> sorted scopes
for (const prop of properties) {
	if (prop.type !== 'notice' || !prop.name.endsWith('ScopeNotice')) continue;
	const { resource, operation } = prop.displayOptions.show;
	const scopes = [...prop.displayName.matchAll(/`([^`]+)`/g)].map((m) => m[1]).sort();
	notices.set(`${resource[0]}.${operation[0]}`, scopes);
}

const problems = [];
for (const [key, { resource, operation, request }] of nodeOps) {
	if (!specOps.has(key)) {
		problems.push(`NOT IN API  ${key}  (${resource}.${operation})`);
		continue;
	}
	const expected = specOps.get(key);
	const actual = notices.get(`${resource}.${operation}`) ?? null;
	if (JSON.stringify(expected) !== JSON.stringify(actual)) {
		problems.push(
			`SCOPES      ${resource}.${operation}: spec ${JSON.stringify(expected)} vs node ${JSON.stringify(actual)}`,
		);
	}
	if (/\/export$|^GET \/metrics$/.test(key) && request.arrayFormat !== 'repeat') {
		problems.push(`ARRAYFORMAT ${resource}.${operation} must set arrayFormat: 'repeat'`);
	}
}
for (const key of specOps.keys()) {
	const path = key.slice(key.indexOf(' ') + 1);
	if (EXCLUDED_OPS.has(key) || EXCLUDED_PREFIXES.some((p) => path.startsWith(p))) continue;
	if (!nodeOps.has(key)) problems.push(`MISSING     ${key}`);
}

const { webhookEventTypeOptions } = require('../dist/nodes/Polar/shared/descriptions.js');
const nodeEvents = new Set(webhookEventTypeOptions.map((o) => o.value));
const specEvents = spec.components.schemas.WebhookEventType.enum;
for (const e of specEvents) if (!nodeEvents.has(e)) problems.push(`EVENTS      missing ${e}`);
for (const e of nodeEvents) if (!specEvents.includes(e)) problems.push(`EVENTS      not in API ${e}`);

for (const p of problems) console.log(p);
console.log(`\n${nodeOps.size} node operations, ${specOps.size} spec operations, ${problems.length} problem(s)`);
process.exit(problems.length ? 1 : 0);
```

- [ ] **Step 2: Add the test script**

In `package.json` `scripts`, add after `"lint:fix"`:

```json
		"test": "node --test \"test/**/*.test.mjs\"",
```

- [ ] **Step 3: Run the audit to confirm it catches today's gaps**

Run: `npm run build && node scripts/audit-openapi.mjs`
Expected: exit code 1. Output includes `NOT IN API` lines for every `/members...` and `/organization-access-tokens...` operation, `MISSING` lines such as `DELETE /products/{}`, `GET /orders/export` and `GET /metrics`, and 7 `EVENTS missing` lines (`subscription.cycled`, `subscription.paused`, `subscription.resumed`, `subscription.migrated`, `discount.created`, `discount.updated`, `discount.deleted`). **No `SCOPES` lines should appear for resources outside Member/OAT.** If one does, the existing scope table drifted: fix that entry in `nodes/Polar/shared/errorHandling.ts` to match the spec now and note it in the commit message.

- [ ] **Step 4: Lint**

Run: `npm run lint`
Expected: PASS. If it reports errors inside `scripts/`, replace `eslint.config.mjs` with:

```js
import { config } from '@n8n/node-cli/eslint';

export default [...config, { ignores: ['scripts/**', 'test/**'] }];
```

and re-run until it passes.

- [ ] **Step 5: Commit**

```bash
git add scripts/audit-openapi.mjs package.json eslint.config.mjs
git commit -m "chore: add OpenAPI audit script and node:test runner for the Polar node"
```

---

### Task 2: Shared helpers — webhook events, error body parsing, CSV → binary

**Files:**
- Modify: `nodes/Polar/shared/descriptions.ts` (`webhookEventTypeOptions`)
- Modify: `nodes/Polar/shared/errorHandling.ts` (`handlePolarApiError`, 403 message)
- Create: `nodes/Polar/shared/binary.ts`
- Create: `test/shared.test.mjs`
- Modify: `README.md` (Polar Trigger paragraph: "~30 event types" → "42 event types")

**Interfaces:**
- Produces: `csvToBinary(fileName: string): (this: IExecuteSingleFunctions, items: INodeExecutionData[], response: IN8nHttpFullResponse) => Promise<INodeExecutionData[]>`, exported from `nodes/Polar/shared/binary.ts`. Output: `[{ json: { fileName, size }, binary: { data } }]`.
- Produces: `handlePolarApiError` now also accepts a `Buffer` or string body and parses JSON out of it.

- [ ] **Step 1: Write the failing tests**

Create `test/shared.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { handlePolarApiError } = require('../dist/nodes/Polar/shared/errorHandling.js');
const { csvToBinary } = require('../dist/nodes/Polar/shared/binary.js');

const fakeThis = {
	getNodeParameter: (name) => ({ resource: 'order', operation: 'export' })[name],
	getNode: () => ({ id: '1', name: 'Polar', type: 'polar', typeVersion: 1, position: [0, 0], parameters: {} }),
	helpers: {
		prepareBinaryData: async (buffer, fileName, mimeType) => ({
			data: buffer.toString('base64'),
			fileName,
			mimeType,
		}),
	},
};

test('handlePolarApiError surfaces Polar detail from a Buffer body (export endpoints)', async () => {
	const body = Buffer.from(JSON.stringify({ detail: 'created_after must include a UTC offset' }));
	await assert.rejects(
		() => handlePolarApiError.call(fakeThis, [], { statusCode: 422, headers: {}, body }),
		(error) => {
			assert.match(error.description, /created_after must include a UTC offset/);
			return true;
		},
	);
});

test('handlePolarApiError passes successful responses through untouched', async () => {
	const items = [{ json: { ok: true } }];
	assert.equal(await handlePolarApiError.call(fakeThis, items, { statusCode: 200, headers: {}, body: {} }), items);
});

test('csvToBinary turns CSV bytes into one binary item', async () => {
	const csv = 'email,status\na@b.co,paid\n';
	const [item] = await csvToBinary('orders-export.csv').call(fakeThis, [], {
		statusCode: 200,
		headers: {},
		body: Buffer.from(csv),
	});
	assert.equal(item.binary.data.fileName, 'orders-export.csv');
	assert.equal(item.binary.data.mimeType, 'text/csv');
	assert.equal(Buffer.from(item.binary.data.data, 'base64').toString(), csv);
	assert.equal(item.json.size, Buffer.byteLength(csv));
});

test('csvToBinary still emits one item for an empty export', async () => {
	const items = await csvToBinary('customers-export.csv').call(fakeThis, [], {
		statusCode: 200,
		headers: {},
		body: Buffer.alloc(0),
	});
	assert.equal(items.length, 1);
	assert.equal(items[0].json.size, 0);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run build && npm test`
Expected: FAIL. `binary.js` cannot be found, and the Buffer-body test fails because `detail` is not read from a Buffer.

- [ ] **Step 3: Implement `binary.ts`**

Create `nodes/Polar/shared/binary.ts`:

```ts
import type {
	IExecuteSingleFunctions,
	IN8nHttpFullResponse,
	INodeExecutionData,
} from 'n8n-workflow';

/**
 * `postReceive` factory for Polar's CSV export endpoints. Place it after `handlePolarApiError`,
 * and send the request with `encoding: 'arraybuffer'` and `json: false` so the CSV reaches this
 * function as raw bytes instead of being parsed as JSON.
 */
export function csvToBinary(fileName: string) {
	return async function (
		this: IExecuteSingleFunctions,
		_items: INodeExecutionData[],
		response: IN8nHttpFullResponse,
	): Promise<INodeExecutionData[]> {
		const body = response.body as unknown;
		const buffer = Buffer.isBuffer(body)
			? body
			: Buffer.from(typeof body === 'string' ? body : '', 'utf8');
		const data = await this.helpers.prepareBinaryData(buffer, fileName, 'text/csv');
		return [{ json: { fileName, size: buffer.length }, binary: { data } }];
	};
}
```

- [ ] **Step 4: Make `handlePolarApiError` parse Buffer/string bodies and drop the OAT mention**

In `nodes/Polar/shared/errorHandling.ts`, add above `handlePolarApiError`:

```ts
// Export endpoints are requested with `encoding: 'arraybuffer'`, so their error bodies arrive
// as raw bytes rather than parsed JSON.
function parseErrorBody(raw: unknown): IDataObject {
	const text = Buffer.isBuffer(raw) ? raw.toString('utf8') : raw;
	if (typeof text === 'string') {
		try {
			return JSON.parse(text) as IDataObject;
		} catch {
			return { message: text };
		}
	}
	return (text ?? {}) as IDataObject;
}
```

Replace the line `const body = (response.body ?? {}) as IDataObject;` with:

```ts
	const body = parseErrorBody(response.body);
```

In the 403 branch, replace

```
Edit your Organization Access Token in the Polar dashboard (or use the Organization Access Token resource in this node) to add
```

with

```
Edit your Organization Access Token in the Polar dashboard to add
```

- [ ] **Step 5: Add the 7 missing webhook events**

In `nodes/Polar/shared/descriptions.ts` `webhookEventTypeOptions`, insert right after `{ name: 'Customer: Updated', value: 'customer.updated' },`:

```ts
	{ name: 'Discount: Created', value: 'discount.created' },
	{ name: 'Discount: Deleted', value: 'discount.deleted' },
	{ name: 'Discount: Updated', value: 'discount.updated' },
```

and replace the subscription block (from `Subscription: Active` to `Subscription: Updated`) with:

```ts
	{ name: 'Subscription: Active', value: 'subscription.active' },
	{ name: 'Subscription: Canceled', value: 'subscription.canceled' },
	{ name: 'Subscription: Created', value: 'subscription.created' },
	{ name: 'Subscription: Cycled', value: 'subscription.cycled' },
	{ name: 'Subscription: Migrated', value: 'subscription.migrated' },
	{ name: 'Subscription: Past Due', value: 'subscription.past_due' },
	{ name: 'Subscription: Paused', value: 'subscription.paused' },
	{ name: 'Subscription: Resumed', value: 'subscription.resumed' },
	{ name: 'Subscription: Revoked', value: 'subscription.revoked' },
	{ name: 'Subscription: Uncanceled', value: 'subscription.uncanceled' },
	{ name: 'Subscription: Updated', value: 'subscription.updated' },
```

In `README.md`, in the Polar Trigger section, replace `for Polar's ~30 event types` with `for all 42 of Polar's webhook event types`.

- [ ] **Step 6: Verify**

Run: `npm run build && npm run lint && npm test && node scripts/audit-openapi.mjs`
Expected: build, lint and tests PASS. The audit still fails, but **no `EVENTS` lines** remain. If lint flags the `Buffer` global, add `import { Buffer } from 'node:buffer';` at the top of both `binary.ts` and `errorHandling.ts`.

- [ ] **Step 7: Commit**

```bash
git rm -q --ignore-unmatch test/.gitkeep
git add nodes/Polar/shared test/shared.test.mjs README.md
git commit -m "feat: add 7 missing webhook events, CSV-to-binary helper, Buffer-safe error parsing"
```

---

### Task 3: Remove the Organization Access Token resource

**Files:**
- Delete: `nodes/Polar/resources/organizationAccessToken/` (whole directory)
- Modify: `nodes/Polar/Polar.node.ts` (import, Resource option, spread)
- Modify: `nodes/Polar/shared/descriptions.ts` (delete `availableScopeOptions`)
- Modify: `nodes/Polar/shared/errorHandling.ts` (delete `organizationAccessToken` entry and the header comment sentences about it)
- Modify: `README.md` (delete the `- **Organization Access Token** — ...` bullet)

**Interfaces:**
- Consumes: nothing new. Produces: nothing new (removal only).

- [ ] **Step 1: Confirm the audit currently flags it**

Run: `node scripts/audit-openapi.mjs | grep organization-access-tokens`
Expected: 4 `NOT IN API` lines.

- [ ] **Step 2: Remove it**

```bash
git rm -r -q nodes/Polar/resources/organizationAccessToken
```

In `nodes/Polar/Polar.node.ts`, delete these three lines:

```ts
import { organizationAccessTokenDescription } from './resources/organizationAccessToken';
					{ name: 'Organization Access Token', value: 'organizationAccessToken' },
			...organizationAccessTokenDescription,
```

In `nodes/Polar/shared/descriptions.ts`, delete the whole `export const availableScopeOptions: INodePropertyOptions[] = [ ... ];` block.

In `nodes/Polar/shared/errorHandling.ts`, delete the `organizationAccessToken: { ... },` entry of `OPERATION_SCOPES`. From the header comment, delete these three lines:

```ts
// `organizationAccessToken`'s endpoints aren't present in the versioned spec (token management
// isn't exposed there); its scopes come from the unversioned spec's prose annotations instead,
// which are unambiguous single-scope entries.
```

and change `checked 2026-08-21` to `checked 2026-09-25`.

In `README.md`, delete the line starting `- **Organization Access Token** —`.

- [ ] **Step 3: Verify**

Run: `npm run build && npm run lint && npm test && node scripts/audit-openapi.mjs | grep -c organization-access-tokens`
Expected: build, lint and tests PASS. The grep count is `0`. `grep -rn "organizationAccessToken\|availableScopeOptions" nodes` prints nothing.

- [ ] **Step 4: Commit**

```bash
git add -A nodes/Polar README.md
git commit -m "feat!: remove Organization Access Token resource (endpoints no longer in Polar's API)"
```

---

### Task 4: Migrate Member to customer-scoped endpoints

**Files:**
- Delete: `nodes/Polar/resources/member/get.ts`, `delete.ts`, `getByExternalId.ts`
- Create: `nodes/Polar/resources/member/identifiers.ts`
- Rewrite: `nodes/Polar/resources/member/index.ts`, `create.ts`, `getAll.ts`, `update.ts`
- Modify: `nodes/Polar/shared/errorHandling.ts` (`member` scopes)
- Create: `test/descriptions.test.mjs`
- Modify: `README.md` (Member bullet)

**Interfaces:**
- Parameter names (shared across Member operations through `displayOptions`): `customerId`, `externalCustomerId`, `memberId`, `externalId`.
- Operation values: `create`, `createExternal`, `delete`, `deleteExternal`, `get`, `getByExternalId`, `getAll`, `getAllExternal`, `update`, `updateExternal`.

- [ ] **Step 1: Write the failing backward-compatibility test**

Create `test/descriptions.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Polar } = require('../dist/nodes/Polar/Polar.node.js');
const properties = new Polar().description.properties;

const operationsOf = (resource) =>
	properties.find((p) => p.name === 'operation' && p.displayOptions?.show?.resource?.[0] === resource);

test('Member keeps every legacy operation value so saved workflows still open', () => {
	const values = operationsOf('member').options.map((o) => o.value);
	for (const legacy of ['create', 'delete', 'get', 'getAll', 'getByExternalId', 'update']) {
		assert.ok(values.includes(legacy), `missing legacy Member operation "${legacy}"`);
	}
});

test('Member operations all target /customers/.../members', () => {
	for (const option of operationsOf('member').options) {
		assert.match(option.routing.request.url, /^=\/customers\/(external\/)?\{\{.+\}\}\/members/);
	}
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run build && npm test`
Expected: FAIL on "Member operations all target /customers/.../members" (URLs are still `=/members/...`).

- [ ] **Step 3: Write `identifiers.ts`**

Create `nodes/Polar/resources/member/identifiers.ts`:

```ts
import type { INodeProperties } from 'n8n-workflow';

const byId = ['create', 'delete', 'get', 'getAll', 'update'];
const byExternalId = ['createExternal', 'deleteExternal', 'getAllExternal', 'getByExternalId', 'updateExternal'];

export const memberIdentifierProperties: INodeProperties[] = [
	{
		displayName: 'Customer ID',
		name: 'customerId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: { resource: ['member'], operation: byId } },
		description: 'The customer this member belongs to',
	},
	{
		displayName: 'External Customer ID',
		name: 'externalCustomerId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: { resource: ['member'], operation: byExternalId } },
		description: 'The customer ID in your own system, as set when the customer was created',
	},
	{
		displayName: 'Member ID',
		name: 'memberId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: { resource: ['member'], operation: ['delete', 'get', 'update'] } },
	},
	{
		displayName: 'External Member ID',
		name: 'externalId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: { resource: ['member'], operation: ['deleteExternal', 'getByExternalId', 'updateExternal'] },
		},
		description: "The member's ID in your own system",
	},
];
```

- [ ] **Step 4: Rewrite `create.ts`**

Replace `nodes/Polar/resources/member/create.ts` with:

```ts
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['member'], operation: ['create', 'createExternal'] };

export const memberCreateDescription: INodeProperties[] = [
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'name@email.com',
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

- [ ] **Step 5: Rewrite `getAll.ts`**

Replace `nodes/Polar/resources/member/getAll.ts` with:

```ts
import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../shared/descriptions';

const show = { resource: ['member'], operation: ['getAll', 'getAllExternal'] };

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

- [ ] **Step 6: Rewrite `update.ts`**

Replace `nodes/Polar/resources/member/update.ts` with:

```ts
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['member'], operation: ['update', 'updateExternal'] };

export const memberUpdateDescription: INodeProperties[] = [
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show },
		options: [
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				default: '',
				placeholder: 'name@email.com',
				routing: { request: { body: { email: '={{$value}}' } } },
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

- [ ] **Step 7: Rewrite `index.ts`**

```bash
git rm -q nodes/Polar/resources/member/get.ts nodes/Polar/resources/member/delete.ts nodes/Polar/resources/member/getByExternalId.ts
```

Replace `nodes/Polar/resources/member/index.ts` with:

```ts
import type { INodeProperties } from 'n8n-workflow';
import { handlePolarApiError, scopeNoticesForResource } from '../../shared/errorHandling';
import { memberIdentifierProperties } from './identifiers';
import { memberGetAllDescription } from './getAll';
import { memberCreateDescription } from './create';
import { memberUpdateDescription } from './update';

const showOnlyForMember = { resource: ['member'] };

const byId = '=/customers/{{$parameter["customerId"]}}/members';
const byExternalId = '=/customers/external/{{$parameter["externalCustomerId"]}}/members';

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
				description: 'Add a member to a B2B customer',
				routing: {
					request: { method: 'POST', url: byId, ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Create for External Customer',
				value: 'createExternal',
				action: 'Create a member for an external customer',
				description: "Add a member to a customer identified by your system's external ID",
				routing: {
					request: { method: 'POST', url: byExternalId, ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a member',
				description: 'Remove a member from a customer',
				routing: {
					request: {
						method: 'DELETE',
						url: `${byId}/{{$parameter["memberId"]}}`,
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Delete by External ID',
				value: 'deleteExternal',
				action: 'Delete a member by external ID',
				description: 'Remove a member, both identified by external IDs',
				routing: {
					request: {
						method: 'DELETE',
						url: `${byExternalId}/{{$parameter["externalId"]}}`,
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a member',
				description: 'Get a single member of a customer',
				routing: {
					request: {
						method: 'GET',
						url: `${byId}/{{$parameter["memberId"]}}`,
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Get by External ID',
				value: 'getByExternalId',
				action: 'Get a member by external ID',
				description: 'Get a single member, customer and member both identified by external IDs',
				routing: {
					request: {
						method: 'GET',
						url: `${byExternalId}/{{$parameter["externalId"]}}`,
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many members',
				description: 'List the members of a customer',
				routing: {
					request: { method: 'GET', url: byId, ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Get Many for External Customer',
				value: 'getAllExternal',
				action: 'Get many members of an external customer',
				description: "List the members of a customer identified by your system's external ID",
				routing: {
					request: { method: 'GET', url: byExternalId, ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a member',
				description: "Update a member's name, email or role",
				routing: {
					request: {
						method: 'PATCH',
						url: `${byId}/{{$parameter["memberId"]}}`,
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Update by External ID',
				value: 'updateExternal',
				action: 'Update a member by external ID',
				description: 'Update a member, customer and member both identified by external IDs',
				routing: {
					request: {
						method: 'PATCH',
						url: `${byExternalId}/{{$parameter["externalId"]}}`,
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
		],
		default: 'getAll',
	},
	...scopeNoticesForResource('member'),
	...memberIdentifierProperties,
	...memberGetAllDescription,
	...memberCreateDescription,
	...memberUpdateDescription,
];
```

- [ ] **Step 8: Update Member scopes**

In `nodes/Polar/shared/errorHandling.ts`, replace the `member: { ... },` entry with:

```ts
	member: {
		create: ['members:write'],
		createExternal: ['members:write'],
		delete: ['members:write'],
		deleteExternal: ['members:write'],
		get: ['members:read', 'members:write'],
		getAll: ['members:read', 'members:write'],
		getAllExternal: ['members:read', 'members:write'],
		getByExternalId: ['members:read', 'members:write'],
		update: ['members:write'],
		updateExternal: ['members:write'],
	},
```

- [ ] **Step 9: Update README**

Replace the `- **Member** — ...` line with:

```md
- **Member** — Create, Create for External Customer, Delete, Delete by External ID, Get, Get by External ID, Get Many, Get Many for External Customer, Update, Update by External ID — manage individual people within a B2B customer (requires the organization's member-management feature). Every operation is scoped to a customer, by Polar ID or by your external ID.
```

- [ ] **Step 10: Verify**

Run: `npm run build && npm run lint && npm test && node scripts/audit-openapi.mjs | grep -i members`
Expected: build, lint and tests PASS. The grep prints nothing (no `NOT IN API`, `MISSING` or `SCOPES` line mentions members).

- [ ] **Step 11: Commit**

```bash
git add -A nodes/Polar/resources/member nodes/Polar/shared/errorHandling.ts test/descriptions.test.mjs README.md
git commit -m "feat: migrate Member resource to customer-scoped /customers/{id}/members endpoints"
```

---

### Task 5: Small additions — Benefit Get Files, Customer Export + Payment Methods by External ID, Dispute Accept, License Key Rotate, Product Delete

**Files:**
- Create: `nodes/Polar/resources/benefit/getFiles.ts`, `nodes/Polar/resources/customer/getPaymentMethodsExternal.ts`, `nodes/Polar/resources/dispute/accept.ts`, `nodes/Polar/resources/licenseKey/rotate.ts`, `nodes/Polar/resources/product/delete.ts`
- Modify: the five matching `index.ts` files, `nodes/Polar/shared/errorHandling.ts`, `README.md`

**Interfaces:**
- Consumes: `csvToBinary` from `nodes/Polar/shared/binary.ts` (Task 2).
- Operation values: `benefit.getFiles`, `customer.export`, `customer.getPaymentMethodsExternal`, `dispute.accept`, `licenseKey.rotate`, `product.delete`.

- [ ] **Step 1: Confirm the audit flags them**

Run: `node scripts/audit-openapi.mjs | grep -E "benefits/\{\}/files|customers/export|external/\{\}/payment-methods|disputes/\{\}/accept|license-keys/\{\}/rotate|DELETE /products"`
Expected: 6 `MISSING` lines.

- [ ] **Step 2: Benefit → Get Files**

Create `nodes/Polar/resources/benefit/getFiles.ts`:

```ts
import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../shared/descriptions';

const show = { resource: ['benefit'], operation: ['getFiles'] };

export const benefitGetFilesDescription: INodeProperties[] = [
	{
		displayName: 'Benefit ID',
		name: 'benefitId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'ID of a Downloadables benefit',
	},
	...paginationProperties(show),
];
```

In `nodes/Polar/resources/benefit/index.ts`, add `import { benefitGetFilesDescription } from './getFiles';`. Insert this option immediately **before** the `Get Grants` option:

```ts
			{
				name: 'Get Files',
				value: 'getFiles',
				action: 'Get benefit files',
				description: 'List the files attached to a Downloadables benefit',
				routing: {
					request: {
						method: 'GET',
						url: '=/benefits/{{$parameter["benefitId"]}}/files',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
```

Then append `...benefitGetFilesDescription,` to the exported properties array.

- [ ] **Step 3: Customer → Export and Get Payment Methods by External ID**

Create `nodes/Polar/resources/customer/getPaymentMethodsExternal.ts`:

```ts
import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../shared/descriptions';

const show = { resource: ['customer'], operation: ['getPaymentMethodsExternal'] };

export const customerGetPaymentMethodsExternalDescription: INodeProperties[] = [
	{
		displayName: 'External Customer ID',
		name: 'externalCustomerId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'The customer ID in your own system, as set when the customer was created',
	},
	...paginationProperties(show),
];
```

In `nodes/Polar/resources/customer/index.ts`, add the imports:

```ts
import { csvToBinary } from '../../shared/binary';
import { customerGetPaymentMethodsExternalDescription } from './getPaymentMethodsExternal';
```

Insert the `Export` option between `Delete by External ID` and `Get`:

```ts
			{
				name: 'Export',
				value: 'export',
				action: 'Export customers',
				description: 'Download all customers as a CSV file (binary property "data")',
				routing: {
					request: {
						method: 'GET',
						url: '=/customers/export',
						ignoreHttpStatusErrors: true,
						encoding: 'arraybuffer',
						json: false,
						arrayFormat: 'repeat',
						headers: { Accept: 'text/csv' },
					},
					output: { postReceive: [handlePolarApiError, csvToBinary('customers-export.csv')] },
				},
			},
```

Insert immediately **after** `Get Payment Methods`:

```ts
			{
				name: 'Get Payment Methods by External ID',
				value: 'getPaymentMethodsExternal',
				action: 'Get a customer payment methods by external ID',
				description: "List saved payment methods for a customer identified by your system's external ID",
				routing: {
					request: {
						method: 'GET',
						url: '=/customers/external/{{$parameter["externalCustomerId"]}}/payment-methods',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
```

Append `...customerGetPaymentMethodsExternalDescription,` to the exported properties.

- [ ] **Step 4: Dispute → Accept**

Create `nodes/Polar/resources/dispute/accept.ts`:

```ts
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['dispute'], operation: ['accept'] };

export const disputeAcceptDescription: INodeProperties[] = [
	{
		displayName: 'Dispute ID',
		name: 'disputeId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'Accepting concedes the dispute to the customer. This cannot be undone.',
	},
];
```

In `nodes/Polar/resources/dispute/index.ts`, add `import { disputeAcceptDescription } from './accept';`. Insert as the **first** option:

```ts
			{
				name: 'Accept',
				value: 'accept',
				action: 'Accept a dispute',
				description: 'Concede a dispute without contesting it (irreversible)',
				routing: {
					request: {
						method: 'POST',
						url: '=/disputes/{{$parameter["disputeId"]}}/accept',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
```

Append `...disputeAcceptDescription,` to the exported properties.

- [ ] **Step 5: License Key → Rotate**

Create `nodes/Polar/resources/licenseKey/rotate.ts`:

```ts
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['licenseKey'], operation: ['rotate'] };

export const licenseKeyRotateDescription: INodeProperties[] = [
	{
		displayName: 'License Key ID',
		name: 'licenseKeyId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'The current key stops working immediately; the response contains the new key',
	},
];
```

In `nodes/Polar/resources/licenseKey/index.ts`, add `import { licenseKeyRotateDescription } from './rotate';`. Insert between `Get Many` and `Update`:

```ts
			{
				name: 'Rotate',
				value: 'rotate',
				action: 'Rotate a license key',
				description: 'Replace a license key with a newly generated one',
				routing: {
					request: {
						method: 'POST',
						url: '=/license-keys/{{$parameter["licenseKeyId"]}}/rotate',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
```

Append `...licenseKeyRotateDescription,` to the exported properties.

- [ ] **Step 6: Product → Delete**

Create `nodes/Polar/resources/product/delete.ts`:

```ts
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['product'], operation: ['delete'] };

export const productDeleteDescription: INodeProperties[] = [
	{
		displayName: 'Product ID',
		name: 'productId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description:
			'Only products with no orders, subscriptions, trials or discounts can be deleted — archive products in use with Update instead',
	},
];
```

In `nodes/Polar/resources/product/index.ts`, add `import { productDeleteDescription } from './delete';`. Insert between `Create` and `Get`:

```ts
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a product',
				description: 'Permanently delete an unused product',
				routing: {
					request: {
						method: 'DELETE',
						url: '=/products/{{$parameter["productId"]}}',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
```

Append `...productDeleteDescription,` to the exported properties.

- [ ] **Step 7: Scopes**

In `nodes/Polar/shared/errorHandling.ts` `OPERATION_SCOPES`, add these keys to the existing resource entries:

```ts
	// benefit
		getFiles: ['benefits:read', 'benefits:write'],
	// customer
		export: ['customers:read', 'customers:write'],
		getPaymentMethodsExternal: ['customers:read', 'customers:write'],
	// dispute
		accept: ['disputes:write'],
	// licenseKey
		rotate: ['license_keys:write'],
	// product
		delete: ['products:write'],
```

(The `// resource` lines only say where each key goes. Do not paste them.)

- [ ] **Step 8: README**

Update these bullets in `README.md`:

```md
- **Benefit** — Get Many, Get, Create, Update, Delete, Get Files, Get Grants
- **Customer** — Get Many, Get, Get by External ID, Create, Update, Update by External ID, Delete, Delete by External ID, Get State, Get State by External ID, Get Payment Methods, Get Payment Methods by External ID, Export (CSV file)
- **Dispute** — Accept, Get, Get Many — payment disputes/chargebacks; Accept concedes a dispute (irreversible)
- **License Key** — Activate, Deactivate, Get, Get Activation, Get Many, Rotate, Update, Validate — license-gated software activation and validation
- **Product** — Get Many, Get, Create, Update, Update Benefits, Delete (unused products only)
```

- [ ] **Step 9: Verify**

Run: `npm run build && npm run lint && npm test && node scripts/audit-openapi.mjs | grep -E "benefits/\{\}/files|customers/export|external/\{\}/payment-methods|disputes/\{\}/accept|license-keys/\{\}/rotate|DELETE /products|SCOPES"`
Expected: build, lint and tests PASS. The grep prints nothing.

- [ ] **Step 10: Commit**

```bash
git add -A nodes/Polar README.md
git commit -m "feat: add Benefit Get Files, Customer Export/Payment Methods by External ID, Dispute Accept, License Key Rotate, Product Delete"
```

---

### Task 6: Order Export and Subscription Export

**Files:**
- Create: `nodes/Polar/resources/order/export.ts`, `nodes/Polar/resources/subscription/export.ts`
- Modify: `nodes/Polar/resources/order/index.ts`, `nodes/Polar/resources/subscription/index.ts`, `nodes/Polar/shared/errorHandling.ts`, `README.md`

**Interfaces:**
- Consumes: `csvToBinary` (Task 2).
- Operation values: `order.export`, `subscription.export`.

- [ ] **Step 1: Confirm the audit flags them**

Run: `node scripts/audit-openapi.mjs | grep -E "(orders|subscriptions)/export"`
Expected: 2 `MISSING` lines.

- [ ] **Step 2: Order export fields**

Create `nodes/Polar/resources/order/export.ts`:

```ts
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['order'], operation: ['export'] };

export const orderExportDescription: INodeProperties[] = [
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show },
		options: [
			{
				displayName: 'Columns',
				name: 'columns',
				type: 'multiOptions',
				options: [
					{ name: 'Billing Country', value: 'billing_country' },
					{ name: 'Billing Name', value: 'billing_name' },
					{ name: 'Billing Reason', value: 'billing_reason' },
					{ name: 'Created At', value: 'created_at' },
					{ name: 'Currency', value: 'currency' },
					{ name: 'Customer Name', value: 'customer_name' },
					{ name: 'Discount Amount', value: 'discount_amount' },
					{ name: 'Email', value: 'email' },
					{ name: 'Invoice Number', value: 'invoice_number' },
					{ name: 'Net Amount', value: 'net_amount' },
					{ name: 'Product', value: 'product' },
					{ name: 'Refunded Amount', value: 'refunded_amount' },
					{ name: 'Status', value: 'status' },
					{ name: 'Subtotal Amount', value: 'subtotal_amount' },
					{ name: 'Tax Amount', value: 'tax_amount' },
					{ name: 'Total Amount', value: 'total_amount' },
				],
				default: [],
				description: "Columns to include, in the order Polar returns them. Leave empty for Polar's default set.",
				routing: { request: { qs: { columns: '={{$value}}' } } },
			},
			{
				displayName: 'Created After',
				name: 'created_after',
				type: 'dateTime',
				default: '',
				routing: { request: { qs: { created_after: '={{$value}}' } } },
			},
			{
				displayName: 'Created Before',
				name: 'created_before',
				type: 'dateTime',
				default: '',
				routing: { request: { qs: { created_before: '={{$value}}' } } },
			},
			{
				displayName: 'Product ID',
				name: 'product_id',
				type: 'string',
				default: '',
				routing: { request: { qs: { product_id: '={{$value}}' } } },
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'multiOptions',
				options: [
					{ name: 'Draft', value: 'draft' },
					{ name: 'Paid', value: 'paid' },
					{ name: 'Partially Refunded', value: 'partially_refunded' },
					{ name: 'Pending', value: 'pending' },
					{ name: 'Refunded', value: 'refunded' },
					{ name: 'Void', value: 'void' },
				],
				default: [],
				routing: { request: { qs: { status: '={{$value}}' } } },
			},
			{
				displayName: 'Timezone',
				name: 'timezone',
				type: 'string',
				default: '',
				placeholder: 'Europe/Paris',
				description: 'IANA time zone used to render dates in the CSV (defaults to UTC)',
				routing: { request: { qs: { timezone: '={{$value}}' } } },
			},
		],
	},
];
```

In `nodes/Polar/resources/order/index.ts`, add:

```ts
import { csvToBinary } from '../../shared/binary';
import { orderExportDescription } from './export';
```

Insert between `Create` and `Finalize`:

```ts
			{
				name: 'Export',
				value: 'export',
				action: 'Export orders',
				description: 'Download orders as a CSV file (binary property "data")',
				routing: {
					request: {
						method: 'GET',
						url: '=/orders/export',
						ignoreHttpStatusErrors: true,
						encoding: 'arraybuffer',
						json: false,
						arrayFormat: 'repeat',
						headers: { Accept: 'text/csv' },
					},
					output: { postReceive: [handlePolarApiError, csvToBinary('orders-export.csv')] },
				},
			},
```

Append `...orderExportDescription,` to the exported properties.

- [ ] **Step 3: Subscription export fields**

Create `nodes/Polar/resources/subscription/export.ts`:

```ts
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['subscription'], operation: ['export'] };

export const subscriptionExportDescription: INodeProperties[] = [
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show },
		options: [
			{
				displayName: 'Cancel at Period End',
				name: 'cancel_at_period_end',
				type: 'boolean',
				default: true,
				description: 'Whether to only include subscriptions set (or not set) to cancel at period end',
				routing: { request: { qs: { cancel_at_period_end: '={{$value}}' } } },
			},
			{
				displayName: 'Columns',
				name: 'columns',
				type: 'multiOptions',
				options: [
					{ name: 'Amount', value: 'amount' },
					{ name: 'Billing Country', value: 'billing_country' },
					{ name: 'Billing Name', value: 'billing_name' },
					{ name: 'Cancel at Period End', value: 'cancel_at_period_end' },
					{ name: 'Canceled At', value: 'canceled_at' },
					{ name: 'Cancellation Reason', value: 'cancellation_reason' },
					{ name: 'Currency', value: 'currency' },
					{ name: 'Current Period End', value: 'current_period_end' },
					{ name: 'Current Period Start', value: 'current_period_start' },
					{ name: 'Customer Name', value: 'customer_name' },
					{ name: 'Discount', value: 'discount' },
					{ name: 'Email', value: 'email' },
					{ name: 'Ended At', value: 'ended_at' },
					{ name: 'Ends At', value: 'ends_at' },
					{ name: 'Net Amount', value: 'net_amount' },
					{ name: 'Product', value: 'product' },
					{ name: 'Recurring Interval', value: 'recurring_interval' },
					{ name: 'Seats', value: 'seats' },
					{ name: 'Started At', value: 'started_at' },
					{ name: 'Status', value: 'status' },
					{ name: 'Trial End', value: 'trial_end' },
					{ name: 'Trial Start', value: 'trial_start' },
				],
				default: [],
				description: "Columns to include, in the order Polar returns them. Leave empty for Polar's default set.",
				routing: { request: { qs: { columns: '={{$value}}' } } },
			},
			{
				displayName: 'Product ID',
				name: 'product_id',
				type: 'string',
				default: '',
				routing: { request: { qs: { product_id: '={{$value}}' } } },
			},
			{
				displayName: 'Started After',
				name: 'started_after',
				type: 'dateTime',
				default: '',
				routing: { request: { qs: { started_after: '={{$value}}' } } },
			},
			{
				displayName: 'Started Before',
				name: 'started_before',
				type: 'dateTime',
				default: '',
				routing: { request: { qs: { started_before: '={{$value}}' } } },
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'multiOptions',
				options: [
					{ name: 'Active', value: 'active' },
					{ name: 'Canceled', value: 'canceled' },
					{ name: 'Incomplete', value: 'incomplete' },
					{ name: 'Incomplete Expired', value: 'incomplete_expired' },
					{ name: 'Past Due', value: 'past_due' },
					{ name: 'Paused', value: 'paused' },
					{ name: 'Trialing', value: 'trialing' },
					{ name: 'Unpaid', value: 'unpaid' },
				],
				default: [],
				routing: { request: { qs: { status: '={{$value}}' } } },
			},
			{
				displayName: 'Timezone',
				name: 'timezone',
				type: 'string',
				default: '',
				placeholder: 'Europe/Paris',
				description: 'IANA time zone used to render dates in the CSV (defaults to UTC)',
				routing: { request: { qs: { timezone: '={{$value}}' } } },
			},
		],
	},
];
```

In `nodes/Polar/resources/subscription/index.ts`, add:

```ts
import { csvToBinary } from '../../shared/binary';
import { subscriptionExportDescription } from './export';
```

Insert between `Create` and `Get`, keeping alphabetical order with the existing options:

```ts
			{
				name: 'Export',
				value: 'export',
				action: 'Export subscriptions',
				description: 'Download subscriptions as a CSV file (binary property "data")',
				routing: {
					request: {
						method: 'GET',
						url: '=/subscriptions/export',
						ignoreHttpStatusErrors: true,
						encoding: 'arraybuffer',
						json: false,
						arrayFormat: 'repeat',
						headers: { Accept: 'text/csv' },
					},
					output: { postReceive: [handlePolarApiError, csvToBinary('subscriptions-export.csv')] },
				},
			},
```

Append `...subscriptionExportDescription,` to the exported properties.

- [ ] **Step 4: Scopes**

In `OPERATION_SCOPES`, add `export: ['orders:read'],` to `order` and `export: ['subscriptions:read', 'subscriptions:write'],` to `subscription`.

- [ ] **Step 5: README**

Append `, Export (CSV file)` to the end of the operation lists of the **Order** and **Subscription** bullets.

- [ ] **Step 6: Verify**

Run: `npm run build && npm run lint && npm test && node scripts/audit-openapi.mjs | grep -E "export|SCOPES|ARRAYFORMAT"`
Expected: build, lint and tests PASS. The grep prints nothing. If lint reorders or flags the `columns` options, apply `npm run lint:fix` or reorder by hand to match what lint expects.

- [ ] **Step 7: Commit**

```bash
git add -A nodes/Polar README.md
git commit -m "feat: add Order Export and Subscription Export (CSV as binary)"
```

---

### Task 7: Metric and Metric Dashboard resources

**Files:**
- Create: `nodes/Polar/resources/metric/index.ts`, `nodes/Polar/resources/metric/query.ts`
- Create: `nodes/Polar/resources/metricDashboard/index.ts`, `create.ts`, `get.ts`, `update.ts`
- Modify: `nodes/Polar/Polar.node.ts`, `nodes/Polar/shared/errorHandling.ts`, `test/descriptions.test.mjs`, `README.md`

**Interfaces:**
- Consumes: `csvToBinary` (Task 2).
- Resource values: `metric` (operations `export`, `get`, `getLimits`) and `metricDashboard` (operations `create`, `delete`, `get`, `getAll`, `update`).
- `metricDashboardId` is shared by `get`, `update` and `delete` (defined in `get.ts`).

- [ ] **Step 1: Write the failing test**

Append to `test/descriptions.test.mjs`:

```js
test('Metric start/end dates are truncated to YYYY-MM-DD before sending', () => {
	for (const name of ['startDate', 'endDate']) {
		const prop = properties.find((p) => p.name === name && p.displayOptions?.show?.resource?.[0] === 'metric');
		assert.ok(prop, `missing metric ${name}`);
		assert.equal(prop.routing.send.value, '={{ String($value).slice(0, 10) }}');
	}
});

test('Metric Dashboard Get Many does not use pagination (bare array response)', () => {
	const paginated = properties.find(
		(p) => p.name === 'returnAll' && p.displayOptions?.show?.resource?.[0] === 'metricDashboard',
	);
	assert.equal(paginated, undefined);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run build && npm test`
Expected: FAIL with "missing metric startDate".

- [ ] **Step 3: Metric query fields**

Create `nodes/Polar/resources/metric/query.ts`:

```ts
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['metric'], operation: ['export', 'get'] };

export const metricQueryProperties: INodeProperties[] = [
	{
		displayName: 'Start Date',
		name: 'startDate',
		type: 'dateTime',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'Only the date part is used',
		routing: { send: { type: 'query', property: 'start_date', value: '={{ String($value).slice(0, 10) }}' } },
	},
	{
		displayName: 'End Date',
		name: 'endDate',
		type: 'dateTime',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'Only the date part is used',
		routing: { send: { type: 'query', property: 'end_date', value: '={{ String($value).slice(0, 10) }}' } },
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
		routing: { send: { type: 'query', property: 'interval' } },
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
				displayName: 'Billing Type',
				name: 'billing_type',
				type: 'multiOptions',
				options: [
					{ name: 'One Time', value: 'one_time' },
					{ name: 'Recurring', value: 'recurring' },
				],
				default: [],
				routing: { request: { qs: { billing_type: '={{$value}}' } } },
			},
			{
				displayName: 'Customer ID',
				name: 'customer_id',
				type: 'string',
				default: '',
				routing: { request: { qs: { customer_id: '={{$value}}' } } },
			},
			{
				displayName: 'Metrics',
				name: 'metrics',
				type: 'string',
				default: '',
				placeholder: 'revenue, orders',
				description: 'Comma-separated metric slugs to compute. Leave empty for all metrics.',
				routing: {
					request: {
						qs: {
							metrics: '={{ $value.split(",").map(s => s.trim()).filter(s => s) }}',
						},
					},
				},
			},
			{
				displayName: 'Product ID',
				name: 'product_id',
				type: 'string',
				default: '',
				routing: { request: { qs: { product_id: '={{$value}}' } } },
			},
			{
				displayName: 'Timezone',
				name: 'timezone',
				type: 'string',
				default: '',
				placeholder: 'Europe/Paris',
				description: 'IANA time zone for the timestamps (defaults to UTC)',
				routing: { request: { qs: { timezone: '={{$value}}' } } },
			},
		],
	},
];
```

- [ ] **Step 4: Metric resource**

Create `nodes/Polar/resources/metric/index.ts`:

```ts
import type { INodeProperties } from 'n8n-workflow';
import { csvToBinary } from '../../shared/binary';
import { handlePolarApiError, scopeNoticesForResource } from '../../shared/errorHandling';
import { metricQueryProperties } from './query';

const showOnlyForMetric = { resource: ['metric'] };

export const metricDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForMetric },
		options: [
			{
				name: 'Export',
				value: 'export',
				action: 'Export metrics',
				description: 'Download metrics over a period as a CSV file (binary property "data")',
				routing: {
					request: {
						method: 'GET',
						url: '=/metrics/export',
						ignoreHttpStatusErrors: true,
						encoding: 'arraybuffer',
						json: false,
						arrayFormat: 'repeat',
						headers: { Accept: 'text/csv' },
					},
					output: { postReceive: [handlePolarApiError, csvToBinary('metrics-export.csv')] },
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get metrics',
				description: 'Get revenue, order and subscription metrics over a period',
				routing: {
					request: { method: 'GET', url: '=/metrics/', ignoreHttpStatusErrors: true, arrayFormat: 'repeat' },
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Get Limits',
				value: 'getLimits',
				action: 'Get metrics limits',
				description: 'Get the allowed date range and intervals for metrics queries',
				routing: {
					request: { method: 'GET', url: '=/metrics/limits', ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
		],
		default: 'get',
	},
	...scopeNoticesForResource('metric'),
	...metricQueryProperties,
];
```

- [ ] **Step 5: Metric Dashboard fields**

Create `nodes/Polar/resources/metricDashboard/get.ts`:

```ts
import type { INodeProperties } from 'n8n-workflow';

export const metricDashboardIdProperty: INodeProperties = {
	displayName: 'Metric Dashboard ID',
	name: 'metricDashboardId',
	type: 'string',
	default: '',
	required: true,
	displayOptions: { show: { resource: ['metricDashboard'], operation: ['delete', 'get', 'update'] } },
};
```

Create `nodes/Polar/resources/metricDashboard/create.ts`:

```ts
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['metricDashboard'], operation: ['create'] };

export const metricDashboardCreateDescription: INodeProperties[] = [
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
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show },
		options: [
			{
				displayName: 'Metrics',
				name: 'metrics',
				type: 'string',
				default: '',
				placeholder: 'revenue, orders',
				description: 'Comma-separated metric slugs to display (max 10)',
				routing: {
					request: { body: { metrics: '={{ $value.split(",").map(s => s.trim()).filter(s => s) }}' } },
				},
			},
		],
	},
];
```

Create `nodes/Polar/resources/metricDashboard/update.ts`:

```ts
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['metricDashboard'], operation: ['update'] };

export const metricDashboardUpdateDescription: INodeProperties[] = [
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show },
		options: [
			{
				displayName: 'Metrics',
				name: 'metrics',
				type: 'string',
				default: '',
				placeholder: 'revenue, orders',
				description: 'Comma-separated metric slugs to display (max 10). Replaces the current list.',
				routing: {
					request: { body: { metrics: '={{ $value.split(",").map(s => s.trim()).filter(s => s) }}' } },
				},
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				routing: { request: { body: { name: '={{$value}}' } } },
			},
		],
	},
];
```

- [ ] **Step 6: Metric Dashboard resource**

Create `nodes/Polar/resources/metricDashboard/index.ts`:

```ts
import type { INodeProperties } from 'n8n-workflow';
import { handlePolarApiError, scopeNoticesForResource } from '../../shared/errorHandling';
import { metricDashboardIdProperty } from './get';
import { metricDashboardCreateDescription } from './create';
import { metricDashboardUpdateDescription } from './update';

const showOnlyForMetricDashboard = { resource: ['metricDashboard'] };
const byId = '=/metrics/dashboards/{{$parameter["metricDashboardId"]}}';

export const metricDashboardDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForMetricDashboard },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a metric dashboard',
				description: 'Create a custom metrics dashboard',
				routing: {
					request: { method: 'POST', url: '=/metrics/dashboards', ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a metric dashboard',
				description: 'Delete a custom metrics dashboard',
				routing: {
					request: { method: 'DELETE', url: byId, ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a metric dashboard',
				description: 'Get a single metrics dashboard by ID',
				routing: {
					request: { method: 'GET', url: byId, ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many metric dashboards',
				description: 'List all custom metrics dashboards',
				routing: {
					request: { method: 'GET', url: '=/metrics/dashboards', ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a metric dashboard',
				description: "Rename a dashboard or change its metrics",
				routing: {
					request: { method: 'PATCH', url: byId, ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
		],
		default: 'getAll',
	},
	...scopeNoticesForResource('metricDashboard'),
	metricDashboardIdProperty,
	...metricDashboardCreateDescription,
	...metricDashboardUpdateDescription,
];
```

- [ ] **Step 7: Register both resources**

In `nodes/Polar/Polar.node.ts`, add after the `meterDescription` import:

```ts
import { metricDescription } from './resources/metric';
import { metricDashboardDescription } from './resources/metricDashboard';
```

After `{ name: 'Meter', value: 'meter' },` in the Resource options, add:

```ts
					{ name: 'Metric', value: 'metric' },
					{ name: 'Metric Dashboard', value: 'metricDashboard' },
```

After `...meterDescription,`, add:

```ts
			...metricDescription,
			...metricDashboardDescription,
```

- [ ] **Step 8: Scopes**

Add to `OPERATION_SCOPES` (alphabetical position, after `meter`):

```ts
	metric: {
		export: ['metrics:read'],
		get: ['metrics:read'],
		getLimits: ['metrics:read'],
	},
	metricDashboard: {
		create: ['metrics:write'],
		delete: ['metrics:write'],
		get: ['metrics:read'],
		getAll: ['metrics:read'],
		update: ['metrics:write'],
	},
```

- [ ] **Step 9: README**

After the **Meter** bullet, add:

```md
- **Metric** — Get, Export (CSV file), Get Limits — revenue/order/subscription analytics over a date range and interval
- **Metric Dashboard** — Create, Delete, Get, Get Many, Update — custom metrics dashboards shown in the Polar app
```

- [ ] **Step 10: Verify**

Run: `npm run build && npm run lint && npm test && node scripts/audit-openapi.mjs | grep -E "metrics|SCOPES|ARRAYFORMAT"`
Expected: build, lint and tests PASS. The grep prints nothing. If lint rejects the arrow functions inside expression strings (it shouldn't — they are plain strings), leave them. If a later sandbox run shows the n8n expression engine rejects them, replace `s => s.trim()` with `function (s) { return s.trim(); }` and `s => s` with `function (s) { return s; }`.

- [ ] **Step 11: Commit**

```bash
git add -A nodes/Polar test/descriptions.test.mjs README.md
git commit -m "feat: add Metric and Metric Dashboard resources"
```

---

### Task 8: Organization resource

**Files:**
- Create: `nodes/Polar/resources/organization/index.ts`, `getAll.ts`, `get.ts`, `update.ts`
- Modify: `nodes/Polar/Polar.node.ts`, `nodes/Polar/shared/errorHandling.ts`, `README.md`

**Interfaces:**
- Resource value `organization`, operations `get`, `getAll`, `update`. Parameter `organizationId` is shared by `get` and `update`.

- [ ] **Step 1: Confirm the audit flags it**

Run: `node scripts/audit-openapi.mjs | grep organizations`
Expected: 3 `MISSING` lines (`GET /organizations`, `GET /organizations/{}`, `PATCH /organizations/{}`). `POST /organizations` is excluded.

- [ ] **Step 2: Fields**

Create `nodes/Polar/resources/organization/get.ts`:

```ts
import type { INodeProperties } from 'n8n-workflow';

export const organizationIdProperty: INodeProperties = {
	displayName: 'Organization ID',
	name: 'organizationId',
	type: 'string',
	default: '',
	required: true,
	displayOptions: { show: { resource: ['organization'], operation: ['get', 'update'] } },
	description: "Use the Get Many operation to find your token's organization ID",
};
```

Create `nodes/Polar/resources/organization/getAll.ts`:

```ts
import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../shared/descriptions';

const show = { resource: ['organization'], operation: ['getAll'] };

export const organizationGetAllDescription: INodeProperties[] = [
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
				displayName: 'Slug',
				name: 'slug',
				type: 'string',
				default: '',
				routing: { request: { qs: { slug: '={{$value}}' } } },
			},
		],
	},
];
```

Create `nodes/Polar/resources/organization/update.ts`:

```ts
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['organization'], operation: ['update'] };

export const organizationUpdateDescription: INodeProperties[] = [
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show },
		options: [
			{
				displayName: 'Avatar URL',
				name: 'avatar_url',
				type: 'string',
				default: '',
				routing: { request: { body: { avatar_url: '={{$value}}' } } },
			},
			{
				displayName: 'Country',
				name: 'country',
				type: 'string',
				default: '',
				placeholder: 'FR',
				description: 'Two-letter country code (ISO 3166-1 alpha-2)',
				routing: { request: { body: { country: '={{$value}}' } } },
			},
			{
				displayName: 'Default Presentment Currency',
				name: 'default_presentment_currency',
				type: 'string',
				default: '',
				placeholder: 'eur',
				description: 'Lowercase ISO 4217 currency code',
				routing: { request: { body: { default_presentment_currency: '={{$value}}' } } },
			},
			{
				displayName: 'Default Tax Behavior',
				name: 'default_tax_behavior',
				type: 'options',
				options: [
					{ name: 'Exclusive', value: 'exclusive' },
					{ name: 'Inclusive', value: 'inclusive' },
					{ name: 'Location', value: 'location' },
				],
				default: 'location',
				description: 'Default tax behavior applied on products',
				routing: { request: { body: { default_tax_behavior: '={{$value}}' } } },
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				default: '',
				placeholder: 'name@email.com',
				description: 'Public support email',
				routing: { request: { body: { email: '={{$value}}' } } },
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				routing: { request: { body: { name: '={{$value}}' } } },
			},
			{
				displayName: 'Website',
				name: 'website',
				type: 'string',
				default: '',
				routing: { request: { body: { website: '={{$value}}' } } },
			},
		],
	},
];
```

- [ ] **Step 3: Resource**

Create `nodes/Polar/resources/organization/index.ts`:

```ts
import type { INodeProperties } from 'n8n-workflow';
import { handlePolarApiError, scopeNoticesForResource } from '../../shared/errorHandling';
import { organizationIdProperty } from './get';
import { organizationGetAllDescription } from './getAll';
import { organizationUpdateDescription } from './update';

const showOnlyForOrganization = { resource: ['organization'] };

export const organizationDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForOrganization },
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get an organization',
				description: 'Get an organization by ID',
				routing: {
					request: {
						method: 'GET',
						url: '=/organizations/{{$parameter["organizationId"]}}',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many organizations',
				description:
					"List organizations. With an Organization Access Token this returns the token's own organization.",
				routing: {
					request: { method: 'GET', url: '=/organizations/', ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update an organization',
				description: "Update the organization's public profile and defaults",
				routing: {
					request: {
						method: 'PATCH',
						url: '=/organizations/{{$parameter["organizationId"]}}',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
		],
		default: 'getAll',
	},
	...scopeNoticesForResource('organization'),
	organizationIdProperty,
	...organizationGetAllDescription,
	...organizationUpdateDescription,
];
```

- [ ] **Step 4: Register**

In `nodes/Polar/Polar.node.ts`: add `import { organizationDescription } from './resources/organization';` after the `orderDescription` import. Add `{ name: 'Organization', value: 'organization' },` after the `Order` Resource option. Add `...organizationDescription,` after `...orderDescription,`.

- [ ] **Step 5: Scopes**

Add to `OPERATION_SCOPES` after `order`:

```ts
	organization: {
		get: ['organizations:read', 'organizations:write'],
		getAll: ['organizations:read', 'organizations:write'],
		update: ['organizations:write'],
	},
```

- [ ] **Step 6: README**

After the **Order** bullet, add:

```md
- **Organization** — Get, Get Many, Update — your token's organization (Get Many is the easy way to find its ID); Update covers the public profile and defaults (name, avatar, support email, website, country, presentment currency, tax behavior)
```

- [ ] **Step 7: Verify — full audit must now pass**

Run: `npm run build && npm run lint && npm test && node scripts/audit-openapi.mjs`
Expected: build, lint and tests PASS. **The audit exits 0** and prints `0 problem(s)`.

- [ ] **Step 8: Commit**

```bash
git add -A nodes/Polar README.md
git commit -m "feat: add Organization resource (Get, Get Many, Update)"
```

---

### Task 9: Final verification and Sandbox run

**Files:**
- Modify: `README.md` (a short "Upgrading to 1.1" note)

- [ ] **Step 1: Add the upgrade note**

At the end of the `### Polar` section of `README.md` (right before `### Polar Trigger`), add:

```md
#### Upgrading to 1.1

- **Organization Access Token** resource removed — Polar no longer exposes these endpoints in its API; manage tokens from the Polar dashboard.
- **Member** operations now require the customer (by ID, or by external ID for the "External" variants). Re-open existing Member nodes and fill in the Customer ID; the old Get Many filters (Customer ID / External Customer ID) are gone.
```

- [ ] **Step 2: Full check**

Run: `npm run build && npm run lint && npm test && node scripts/audit-openapi.mjs`
Expected: all PASS, and the audit prints `0 problem(s)`.

- [ ] **Step 3: Sandbox run (manual, with the user)**

Start `npm run dev`. Workflow JSON imported into the dev instance must use node type `CUSTOM.polar`. With a **Sandbox** credential, run:
1. Organization → Get Many → returns 1 org. Then Get with its `id`.
2. Customer → Create (test email). Member → Create (that customer ID, email) → Get → Update (name) → Get Many → Delete.
3. Order → Export with Status = Paid + Refunded → one item with a binary `data` file named `orders-export.csv`. Check in the execution log that the request query contains `status=paid&status=refunded`.
4. Metric → Get with an **expression** start date `{{ $now.minus({ days: 30 }) }}`, end date `{{ $now }}`, interval Day → JSON with `periods`.
5. Metric Dashboard → Create (name "n8n test") → Delete.
6. Order → Export with Created After = `not-a-date` via expression → the error shows Polar's validation detail, not a generic message.

Record any failure and fix it before committing. Likely suspects: the arrow-function expressions (Task 7 Step 10), and `encoding: 'arraybuffer'` bodies.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: add 1.1 upgrade notes for Member and Organization Access Token changes"
```

- [ ] **Step 5: Release (user)**

The user runs `npm run release` and picks **minor (1.1.0)**. release-it bumps `package.json` and auto-changelog writes the CHANGELOG entry from these commits.
