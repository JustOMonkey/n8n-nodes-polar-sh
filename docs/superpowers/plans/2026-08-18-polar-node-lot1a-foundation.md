# Polar Node — Lot 1a: Foundation & Core Billing Flow — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a working, installable `n8n-nodes-polar-sh` package: the `PolarApi` credential, a `Polar` node covering the Checkout → Order → Subscription → Refund lifecycle (Checkout, Checkout Link, Customer, Order, Subscription, Refund resources), and the `Polar Trigger` webhook node — fully testable end-to-end against a Polar Sandbox organization via `npm run dev`.

**Architecture:** Declarative-routing n8n node following this repo's existing `nodes/GithubIssues` pattern exactly: one file per operation under `resources/<resource>/`, an `index.ts` per resource assembling `INodeProperties[]`, a top-level `Resource` → `Operation` dropdown pair in `Polar.node.ts`, `methods.listSearch` / `methods.loadOptions` for dynamic pickers, and a shared `shared/` folder for cross-cutting field builders (pagination, metadata, billing address, country list) and the raw HTTP transport used outside declarative routing. `Polar Trigger` is a standard webhook-type node with hand-rolled Standard Webhooks HMAC verification (Node's built-in `crypto`, no new dependency).

Product, Discount, Benefit, and Benefit Grant (the three resources with 2-to-8-way polymorphic create/update bodies) are **out of scope for this plan** — they ship in a follow-up plan (Lot 1b) that extends the same `Polar.node.ts` Resource dropdown. This plan's `Polar` node is fully functional and independently useful without them (Checkout/Order/Subscription/Refund are the highest-value automation surface), which is why it's split out rather than blocking on the harder resources.

**Tech Stack:** TypeScript, `n8n-workflow` types, `@n8n/node-cli` (build/lint/dev), no test framework beyond `npm run lint` + `npm run build` + manual Sandbox verification via `npm run dev` (this repo has no unit test runner configured — see Global Constraints).

**Spec:** `docs/superpowers/specs/2026-08-18-polar-node-lot1-design.md`

## Global Constraints

- No new runtime npm dependencies. Use `n8n-workflow` types and Node's built-in `crypto`/`URL` only — matches the existing `GithubIssues` example which has zero extra dependencies.
- All request/response field names, types, and required flags below are taken verbatim from Polar's live OpenAPI spec (`https://polar.sh/docs/openapi.json`, fetched 2026-08-18) — do not add or rename fields.
- Money fields are integer minor units (cents) — no currency conversion in the node.
- Follow the existing `nodes/GithubIssues` file layout and code style exactly (see `nodes/GithubIssues/GithubIssues.node.ts`, `nodes/GithubIssues/resources/issue/*`, `nodes/GithubIssues/shared/*`, `nodes/GithubIssues/listSearch/*` for the reference pattern).
- Credential name: `polarApi`. Node name: `polar` (displayName `Polar`). Trigger node name: `polarTrigger` (displayName `Polar Trigger`).
- Base URL: `https://api.polar.sh/v1` (production) / `https://sandbox-api.polar.sh/v1` (sandbox), selected by the credential's `Environment` field.
- `organization_id` is omitted from every Create body below where the API lists it as optional — an Organization Access Token is already scoped to a single organization, and multi-org tokens are out of scope for this plan.
- No test framework exists in this repo (`package.json` has no `test` script, no jest/vitest dependency) — do not add one as part of this plan. Each task's verification is `npm run lint` + `npm run build` succeeding, plus a manual exercise of the new operation(s) against Sandbox via `npm run dev` (documented per task).
- `npm install` has not been run yet in this repo — Task 1 covers it.

---

## File Structure

```
credentials/
  PolarApi.credentials.ts

nodes/
  Polar/
    Polar.node.ts
    Polar.node.json
    resources/
      checkout/
        index.ts
        getAll.ts
        get.ts
        create.ts
        update.ts
      checkoutLink/
        index.ts
        getAll.ts
        get.ts
        create.ts
        update.ts
        delete.ts
      customer/
        index.ts
        getAll.ts
        get.ts
        create.ts
        update.ts
        delete.ts
        getState.ts
        getPaymentMethods.ts
      order/
        index.ts
        getAll.ts
        get.ts
        create.ts
        update.ts
        finalize.ts
        generateInvoice.ts
        getInvoice.ts
        getReceipt.ts
      subscription/
        index.ts
        getAll.ts
        get.ts
        create.ts
        update.ts
        updateSeats.ts
        updateBillingPeriod.ts
        cancel.ts
        revoke.ts
        pause.ts
        resume.ts
        clearPendingUpdate.ts
      refund/
        index.ts
        getAll.ts
        create.ts
    listSearch/
      getProducts.ts
      getCustomers.ts
    loadOptions/
      getProductOptions.ts
    shared/
      descriptions.ts
      transport.ts
      utils.ts
  PolarTrigger/
    PolarTrigger.node.ts
    PolarTrigger.node.json

icons/
  polar.svg (existing, reused)
  polar.dark.svg (existing, reused)
```

Each resource's `index.ts` exports one `INodeProperties[]` (an `Operation` dropdown + the operation-specific fields), exactly like `nodes/GithubIssues/resources/issue/index.ts`. `Polar.node.ts` imports every resource's array, lists all resources in the top-level `Resource` dropdown, and spreads every resource array into `description.properties`.

---

### Task 1: Repo housekeeping & package metadata

**Files:**
- Delete: `nodes/Example/` (entire directory)
- Delete: `nodes/GithubIssues/` (entire directory)
- Delete: `credentials/GithubIssuesApi.credentials.ts`
- Delete: `credentials/GithubIssuesOAuth2Api.credentials.ts`
- Delete: `icons/github.svg`, `icons/github.dark.svg`
- Modify: `package.json`

**Interfaces:**
- Produces: a clean repo with only `icons/polar.svg` / `icons/polar.dark.svg` as icon assets, and a `package.json` with `n8n.credentials`/`n8n.nodes` arrays pointing at paths this plan will create (`dist/credentials/PolarApi.credentials.js`, `dist/nodes/Polar/Polar.node.js`, `dist/nodes/PolarTrigger/PolarTrigger.node.js`).

- [ ] **Step 1: Install dependencies**

Run: `npm install`
Expected: completes without error, creates `node_modules/` and `package-lock.json` update.

- [ ] **Step 2: Confirm the existing scaffold builds before touching it**

Run: `npm run build`
Expected: succeeds (baseline sanity check before deleting anything).

- [ ] **Step 3: Delete the starter-template scaffold**

```bash
git rm -r nodes/Example
git rm -r nodes/GithubIssues
git rm credentials/GithubIssuesApi.credentials.ts
git rm credentials/GithubIssuesOAuth2Api.credentials.ts
git rm icons/github.svg icons/github.dark.svg
```

- [ ] **Step 4: Update `package.json`**

Replace the whole file with:

```json
{
	"name": "n8n-nodes-polar-sh",
	"version": "0.1.0",
	"description": "n8n community node to manage Polar.sh (checkouts, orders, subscriptions, customers, benefits and more) directly from n8n workflows.",
	"license": "MIT",
	"homepage": "https://github.com/JUSTONEMONKEY/n8n-nodes-polar-sh",
	"keywords": [
		"n8n-community-node-package",
		"polar",
		"polar.sh",
		"billing",
		"payments"
	],
	"author": {
		"name": "JUSTONEMONKEY",
		"email": "contact@justonemonkey.space"
	},
	"repository": {
		"type": "git",
		"url": "https://github.com/JUSTONEMONKEY/n8n-nodes-polar-sh.git"
	},
	"scripts": {
		"build": "n8n-node build",
		"build:watch": "tsc --watch",
		"dev": "n8n-node dev",
		"lint": "n8n-node lint",
		"lint:fix": "n8n-node lint --fix",
		"release": "n8n-node release",
		"prepublishOnly": "n8n-node prerelease"
	},
	"files": [
		"dist"
	],
	"n8n": {
		"n8nNodesApiVersion": 1,
		"strict": true,
		"credentials": [
			"dist/credentials/PolarApi.credentials.js"
		],
		"nodes": [
			"dist/nodes/Polar/Polar.node.js",
			"dist/nodes/PolarTrigger/PolarTrigger.node.js"
		]
	},
	"devDependencies": {
		"@n8n/node-cli": "*",
		"eslint": "9.39.4",
		"prettier": "3.8.3",
		"release-it": "20.2.0",
		"typescript": "5.9.3"
	},
	"peerDependencies": {
		"n8n-workflow": "*"
	}
}
```

(`repository.url`/`homepage` use a placeholder GitHub org — update to the real one before publishing if different; not blocking for local testing.)

- [ ] **Step 5: Verify lint/build still run cleanly on the now-empty node set**

Run: `npm run lint && npm run build`
Expected: both succeed (there are no nodes/credentials referenced yet from source, but the CLI itself should still run without config errors). If `n8n-node build` fails because `n8n.nodes`/`n8n.credentials` point at files that don't exist yet, that's expected at this point — note the failure and proceed; Task 2 onward will create those files. Do not attempt to fix by re-adding placeholders.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: remove starter scaffold, set package metadata for n8n-nodes-polar-sh"
```

---

### Task 2: Credential `PolarApi`

**Files:**
- Create: `credentials/PolarApi.credentials.ts`

**Interfaces:**
- Produces: credential type name `polarApi`, with properties `environment` (`'production' | 'sandbox'`) and `accessToken` (string). Every later task's declarative `routing.request` relies on `$credentials.environment` being one of exactly those two string values.

- [ ] **Step 1: Write the credential**

```typescript
import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class PolarApi implements ICredentialType {
	name = 'polarApi';

	displayName = 'Polar API';

	icon: Icon = { light: 'file:../icons/polar.svg', dark: 'file:../icons/polar.dark.svg' };

	documentationUrl = 'https://polar.sh/docs/api-reference/introduction';

	properties: INodeProperties[] = [
		{
			displayName: 'Environment',
			name: 'environment',
			type: 'options',
			options: [
				{ name: 'Production', value: 'production' },
				{ name: 'Sandbox', value: 'sandbox' },
			],
			default: 'production',
			description: 'Whether to call the live Polar API or the Sandbox environment',
		},
		{
			displayName: 'Access Token',
			name: 'accessToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'A Polar Organization Access Token (polar_oat_...), created from the Polar dashboard',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.accessToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL:
				'={{$credentials.environment === "sandbox" ? "https://sandbox-api.polar.sh" : "https://api.polar.sh"}}',
			url: '/v1/organizations/',
			method: 'GET',
		},
	};
}
```

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: no errors reported for `credentials/PolarApi.credentials.ts`.

- [ ] **Step 3: Commit**

```bash
git add credentials/PolarApi.credentials.ts
git commit -m "feat: add PolarApi credential"
```

---

### Task 3: Shared scaffolding + `Polar` node skeleton

**Files:**
- Create: `nodes/Polar/shared/utils.ts`
- Create: `nodes/Polar/shared/transport.ts`
- Create: `nodes/Polar/shared/descriptions.ts`
- Create: `nodes/Polar/Polar.node.ts`
- Create: `nodes/Polar/Polar.node.json`

**Interfaces:**
- Produces (from `shared/utils.ts`): `nextPageInfo(currentUrl: string, maxPage: number): { next?: string }`.
- Produces (from `shared/transport.ts`): `polarApiRequest(this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions, method: IHttpRequestMethods, endpoint: string, qs?: IDataObject, body?: IDataObject): Promise<any>`.
- Produces (from `shared/descriptions.ts`): `countryOptions: INodePropertyOptions[]`, `currencyOptions: INodePropertyOptions[]`, `billingAddressField(name: string, bodyProperty: string, show: IDisplayOptions): INodeProperties`, `metadataField(fieldName: string, bodyProperty: string, displayName: string, show: IDisplayOptions): INodeProperties`, `paginationProperties(show: IDisplayOptions): INodeProperties[]`, `customerLocator(show: IDisplayOptions, required?: boolean): INodeProperties`, `productLocator(paramName: string, displayName: string, show: IDisplayOptions, required?: boolean): INodeProperties`.
- Consumes (in `Polar.node.ts`): every resource's `index.ts` array (created in later tasks) and `listSearch`/`loadOptions` functions (created in later tasks). This task creates `Polar.node.ts` with **empty placeholders for those imports removed later task-by-task** — see Step 4, which explains exactly how each later task edits this file.

- [ ] **Step 1: Write `shared/utils.ts`**

```typescript
export function nextPageInfo(currentUrl: string, maxPage: number): { next?: string } {
	const url = new URL(currentUrl);
	const currentPage = Number(url.searchParams.get('page') || '1');
	if (currentPage >= maxPage) {
		return {};
	}
	url.searchParams.set('page', String(currentPage + 1));
	return { next: url.toString() };
}
```

- [ ] **Step 2: Write `shared/transport.ts`**

```typescript
import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
} from 'n8n-workflow';

export async function polarApiRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	qs: IDataObject = {},
	body: IDataObject | undefined = undefined,
) {
	const credentials = await this.getCredentials('polarApi');
	const baseURL =
		credentials.environment === 'sandbox' ? 'https://sandbox-api.polar.sh' : 'https://api.polar.sh';

	const options: IHttpRequestOptions = {
		method,
		qs,
		body,
		url: `${baseURL}/v1${endpoint}`,
		json: true,
	};

	return this.helpers.httpRequestWithAuthentication.call(this, 'polarApi', options);
}
```

- [ ] **Step 3: Write `shared/descriptions.ts`**

```typescript
import type { IDisplayOptions, INodeProperties, INodePropertyOptions } from 'n8n-workflow';
import { nextPageInfo } from './utils';

const countryCodes = [
	'AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM', 'AO', 'AQ', 'AR', 'AS', 'AT', 'AU', 'AW', 'AX', 'AZ',
	'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI', 'BJ', 'BL', 'BM', 'BN', 'BO', 'BQ', 'BR', 'BS',
	'BT', 'BV', 'BW', 'BY', 'BZ', 'CA', 'CC', 'CD', 'CF', 'CG', 'CH', 'CI', 'CK', 'CL', 'CM', 'CN',
	'CO', 'CR', 'CV', 'CW', 'CX', 'CY', 'CZ', 'DE', 'DJ', 'DK', 'DM', 'DO', 'DZ', 'EC', 'EE', 'EG',
	'EH', 'ER', 'ES', 'ET', 'FI', 'FJ', 'FK', 'FM', 'FO', 'FR', 'GA', 'GB', 'GD', 'GE', 'GF', 'GG',
	'GH', 'GI', 'GL', 'GM', 'GN', 'GP', 'GQ', 'GR', 'GS', 'GT', 'GU', 'GW', 'GY', 'HK', 'HM', 'HN',
	'HR', 'HT', 'HU', 'ID', 'IE', 'IL', 'IM', 'IN', 'IO', 'IQ', 'IS', 'IT', 'JE', 'JM', 'JO', 'JP',
	'KE', 'KG', 'KH', 'KI', 'KM', 'KN', 'KR', 'KW', 'KY', 'KZ', 'LA', 'LB', 'LC', 'LI', 'LK', 'LR',
	'LS', 'LT', 'LU', 'LV', 'LY', 'MA', 'MC', 'MD', 'ME', 'MF', 'MG', 'MH', 'MK', 'ML', 'MM', 'MN',
	'MO', 'MP', 'MQ', 'MR', 'MS', 'MT', 'MU', 'MV', 'MW', 'MX', 'MY', 'MZ', 'NA', 'NC', 'NE', 'NF',
	'NG', 'NI', 'NL', 'NO', 'NP', 'NR', 'NU', 'NZ', 'OM', 'PA', 'PE', 'PF', 'PG', 'PH', 'PK', 'PL',
	'PM', 'PN', 'PR', 'PS', 'PT', 'PW', 'PY', 'QA', 'RE', 'RO', 'RS', 'RW', 'SA', 'SB', 'SC', 'SD',
	'SE', 'SG', 'SH', 'SI', 'SJ', 'SK', 'SL', 'SM', 'SN', 'SO', 'SR', 'SS', 'ST', 'SV', 'SX', 'SZ',
	'TC', 'TD', 'TF', 'TG', 'TH', 'TJ', 'TK', 'TL', 'TM', 'TN', 'TO', 'TR', 'TT', 'TV', 'TW', 'TZ',
	'UA', 'UG', 'UM', 'US', 'UY', 'UZ', 'VA', 'VC', 'VE', 'VG', 'VI', 'VN', 'VU', 'WF', 'WS', 'YE',
	'YT', 'ZA', 'ZM', 'ZW',
];

// Polar's OpenAPI spec only exposes ISO 3166-1 alpha-2 codes for this enum, with no
// human-readable country names in the schema, so code is used as both name and value.
export const countryOptions: INodePropertyOptions[] = countryCodes.map((code) => ({
	name: code,
	value: code,
}));

const currencyCodes = [
	'aed', 'all', 'amd', 'aoa', 'ars', 'aud', 'awg', 'azn', 'bam', 'bbd', 'bdt', 'bif', 'bmd', 'bnd',
	'bob', 'brl', 'bsd', 'bwp', 'bzd', 'cad', 'cdf', 'chf', 'clp', 'cny', 'cop', 'crc', 'cve', 'czk',
	'djf', 'dkk', 'dop', 'dzd', 'egp', 'etb', 'eur', 'fjd', 'fkp', 'gbp', 'gel', 'gip', 'gmd', 'gnf',
	'gtq', 'gyd', 'hkd', 'hnl', 'htg', 'huf', 'idr', 'ils', 'inr', 'isk', 'jmd', 'jpy', 'kes', 'kgs',
	'khr', 'kmf', 'krw', 'kyd', 'kzt', 'lak', 'lkr', 'lrd', 'lsl', 'mad', 'mdl', 'mga', 'mkd', 'mnt',
	'mop', 'mur', 'mvr', 'mwk', 'mxn', 'myr', 'mzn', 'nad', 'ngn', 'nio', 'nok', 'npr', 'nzd', 'pab',
	'pen', 'pgk', 'php', 'pkr', 'pln', 'pyg', 'qar', 'ron', 'rsd', 'rwf', 'sar', 'sbd', 'scr', 'sek',
	'sgd', 'shp', 'sos', 'srd', 'szl', 'thb', 'tjs', 'top', 'try', 'ttd', 'twd', 'tzs', 'uah', 'ugx',
	'usd', 'uyu', 'uzs', 'vnd', 'vuv', 'wst', 'xaf', 'xcd', 'xcg', 'xof', 'xpf', 'yer', 'zar', 'zmw',
];

// Same rationale as countryOptions: the spec exposes lowercase ISO 4217 codes only.
export const currencyOptions: INodePropertyOptions[] = currencyCodes.map((code) => ({
	name: code,
	value: code,
}));

export function billingAddressField(
	name: string,
	bodyProperty: string,
	show: IDisplayOptions,
): INodeProperties {
	return {
		displayName: 'Billing Address',
		name,
		type: 'collection',
		placeholder: 'Add Address Field',
		default: {},
		displayOptions: { show },
		description:
			'Country is required by Polar if any billing address field is set. Leave all fields empty to omit the billing address entirely.',
		options: [
			{ displayName: 'Line 1', name: 'line1', type: 'string', default: '' },
			{ displayName: 'Line 2', name: 'line2', type: 'string', default: '' },
			{ displayName: 'Postal Code', name: 'postal_code', type: 'string', default: '' },
			{ displayName: 'City', name: 'city', type: 'string', default: '' },
			{ displayName: 'State', name: 'state', type: 'string', default: '' },
			{
				displayName: 'Country (ISO 3166-1 Alpha-2)',
				name: 'country',
				type: 'options',
				options: countryOptions,
				default: 'US',
			},
		],
		routing: {
			send: {
				type: 'body',
				property: bodyProperty,
				value: '={{ Object.keys($value).length ? $value : undefined }}',
			},
		},
	};
}

export function metadataField(
	fieldName: string,
	bodyProperty: string,
	displayName: string,
	show: IDisplayOptions,
): INodeProperties {
	return {
		displayName,
		name: fieldName,
		type: 'fixedCollection',
		typeOptions: { multipleValues: true, multipleValueButtonText: 'Add Metadata Field' },
		default: {},
		displayOptions: { show },
		description:
			'Key-value pairs to store additional information (max 50 pairs, key max 40 characters, string value max 500 characters)',
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
				value: '={{ Object.fromEntries(($value.field || []).map((f) => [f.key, f.value])) }}',
			},
		},
	};
}

export function paginationProperties(show: IDisplayOptions): INodeProperties[] {
	return [
		{
			displayName: 'Return All',
			name: 'returnAll',
			type: 'boolean',
			default: false,
			displayOptions: { show },
			description: 'Whether to return all results or only up to a given limit',
			routing: {
				send: {
					paginate: '={{$value}}',
					type: 'query',
					property: 'limit',
					value: '100',
				},
				operations: {
					pagination: {
						type: 'generic',
						properties: {
							continue: `={{ !!(${nextPageInfo.toString()})($request.url, $response.body.pagination.max_page).next }}`,
							request: {
								url: `={{ (${nextPageInfo.toString()})($request.url, $response.body.pagination.max_page).next ?? $request.url }}`,
							},
						},
					},
				},
			},
		},
		{
			displayName: 'Limit',
			name: 'limit',
			type: 'number',
			default: 50,
			typeOptions: { minValue: 1, maxValue: 100 },
			displayOptions: { show: { ...show, returnAll: [false] } },
			description: 'Max number of results to return',
			routing: { send: { type: 'query', property: 'limit' } },
		},
	];
}

export function customerLocator(show: IDisplayOptions, required = true): INodeProperties {
	return {
		displayName: 'Customer',
		name: 'customer',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required,
		displayOptions: { show },
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				placeholder: 'Select a customer...',
				typeOptions: { searchListMethod: 'getCustomers', searchable: true },
			},
			{
				displayName: 'ID',
				name: 'id',
				type: 'string',
				placeholder: 'e.g. 8b32e60d-6b7b-4a1f-9c9a-2b0f6a2b8f21',
				validation: [
					{
						type: 'regex',
						properties: {
							regex: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
							errorMessage: 'Not a valid Customer ID (expected a UUID)',
						},
					},
				],
			},
		],
	};
}

export function productLocator(
	paramName: string,
	displayName: string,
	show: IDisplayOptions,
	required = true,
): INodeProperties {
	return {
		displayName,
		name: paramName,
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required,
		displayOptions: { show },
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				placeholder: 'Select a product...',
				typeOptions: { searchListMethod: 'getProducts', searchable: true },
			},
			{
				displayName: 'ID',
				name: 'id',
				type: 'string',
				placeholder: 'e.g. 8b32e60d-6b7b-4a1f-9c9a-2b0f6a2b8f21',
				validation: [
					{
						type: 'regex',
						properties: {
							regex: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
							errorMessage: 'Not a valid Product ID (expected a UUID)',
						},
					},
				],
			},
		],
	};
}
```

- [ ] **Step 4: Write `Polar.node.ts` skeleton**

This is the file every later resource task edits. It starts with an empty `Resource` dropdown and no operation arrays; each of Tasks 4-9 adds one `import`, one entry to the `Resource` options array, and one `...xDescription` spread to `properties`, plus (where relevant) entries under `methods.listSearch` / `methods.loadOptions`. Write the starting skeleton exactly as follows (the `properties: []` and `methods` bodies are intentionally empty — later tasks fill them in with precise, targeted edits, never a placeholder comment):

```typescript
import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';

export class Polar implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Polar',
		name: 'polar',
		icon: { light: 'file:../../icons/polar.svg', dark: 'file:../../icons/polar.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Consume the Polar.sh API',
		defaults: {
			name: 'Polar',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'polarApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL:
				'={{$credentials.environment === "sandbox" ? "https://sandbox-api.polar.sh" : "https://api.polar.sh"}}/v1',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [],
				default: '',
			},
		],
	};

	methods = {
		listSearch: {},
		loadOptions: {},
	};
}
```

- [ ] **Step 5: Write `Polar.node.json`**

```json
{
	"node": "n8n-nodes-polar-sh.polar",
	"nodeVersion": "1.0",
	"codexVersion": "1.0",
	"categories": ["Finance", "Developer Tools"],
	"resources": {
		"credentialDocumentation": [
			{ "url": "https://polar.sh/docs/api-reference/introduction" }
		],
		"primaryDocumentation": [
			{ "url": "https://polar.sh/docs/api-reference/introduction" }
		]
	}
}
```

- [ ] **Step 6: Lint**

Run: `npm run lint`
Expected: no errors. (`resource` options being empty with `default: ''` is valid at this stage — it becomes populated in Task 4.)

- [ ] **Step 7: Commit**

```bash
git add nodes/Polar/shared nodes/Polar/Polar.node.ts nodes/Polar/Polar.node.json
git commit -m "feat: add Polar node shared scaffolding and skeleton"
```

---

### Task 4: Checkout resource + `getProducts`/`getCustomers`/`getProductOptions` pickers

**Files:**
- Create: `nodes/Polar/listSearch/getProducts.ts`
- Create: `nodes/Polar/listSearch/getCustomers.ts`
- Create: `nodes/Polar/loadOptions/getProductOptions.ts`
- Create: `nodes/Polar/resources/checkout/index.ts`
- Create: `nodes/Polar/resources/checkout/getAll.ts`
- Create: `nodes/Polar/resources/checkout/get.ts`
- Create: `nodes/Polar/resources/checkout/create.ts`
- Create: `nodes/Polar/resources/checkout/update.ts`
- Modify: `nodes/Polar/Polar.node.ts`

**Interfaces:**
- Consumes: `polarApiRequest` (Task 3), `paginationProperties`/`billingAddressField`/`metadataField`/`customerLocator`/`currencyOptions` (Task 3).
- Produces: `getProducts`/`getCustomers` (listSearch functions, signature `(this: ILoadOptionsFunctions, filter?: string, paginationToken?: string) => Promise<INodeListSearchResult>`), `getProductOptions` (loadOptions function, signature `(this: ILoadOptionsFunctions) => Promise<INodePropertyOptions[]>`), `checkoutDescription: INodeProperties[]` — all consumed by later tasks (Order/Subscription reuse `getCustomers`/`getProducts`/`getProductOptions`; Task 10's README references this task's manual test steps).

Omitted from Checkout Create/Update, with rationale: `custom_field_data` (depends on the Custom Fields resource, which ships in Lot 2) and `prices` (an advanced per-product custom-price override map, not needed for the standard checkout flow this plan targets).

- [ ] **Step 1: Write `listSearch/getProducts.ts`**

```typescript
import type { ILoadOptionsFunctions, INodeListSearchItems, INodeListSearchResult } from 'n8n-workflow';
import { polarApiRequest } from '../shared/transport';

type ProductItem = { id: string; name: string };
type ProductListResponse = { items: ProductItem[]; pagination: { total_count: number; max_page: number } };

export async function getProducts(
	this: ILoadOptionsFunctions,
	filter?: string,
	paginationToken?: string,
): Promise<INodeListSearchResult> {
	const page = paginationToken ? +paginationToken : 1;
	const responseData: ProductListResponse = await polarApiRequest.call(this, 'GET', '/products/', {
		query: filter,
		page,
		limit: 50,
	});

	const results: INodeListSearchItems[] = responseData.items.map((item) => ({
		name: item.name,
		value: item.id,
	}));

	const nextPaginationToken = page < responseData.pagination.max_page ? page + 1 : undefined;
	return { results, paginationToken: nextPaginationToken };
}
```

- [ ] **Step 2: Write `listSearch/getCustomers.ts`**

```typescript
import type { ILoadOptionsFunctions, INodeListSearchItems, INodeListSearchResult } from 'n8n-workflow';
import { polarApiRequest } from '../shared/transport';

type CustomerItem = { id: string; name: string | null; email: string };
type CustomerListResponse = { items: CustomerItem[]; pagination: { total_count: number; max_page: number } };

export async function getCustomers(
	this: ILoadOptionsFunctions,
	filter?: string,
	paginationToken?: string,
): Promise<INodeListSearchResult> {
	const page = paginationToken ? +paginationToken : 1;
	const responseData: CustomerListResponse = await polarApiRequest.call(this, 'GET', '/customers/', {
		query: filter,
		page,
		limit: 50,
	});

	const results: INodeListSearchItems[] = responseData.items.map((item) => ({
		name: item.name ? `${item.name} (${item.email})` : item.email,
		value: item.id,
	}));

	const nextPaginationToken = page < responseData.pagination.max_page ? page + 1 : undefined;
	return { results, paginationToken: nextPaginationToken };
}
```

- [ ] **Step 3: Write `loadOptions/getProductOptions.ts`**

```typescript
import type { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import { polarApiRequest } from '../shared/transport';

type ProductItem = { id: string; name: string };
type ProductListResponse = { items: ProductItem[] };

export async function getProductOptions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const responseData: ProductListResponse = await polarApiRequest.call(this, 'GET', '/products/', {
		limit: 100,
		is_archived: false,
	});

	return responseData.items.map((item) => ({ name: item.name, value: item.id }));
}
```

- [ ] **Step 4: Write `resources/checkout/getAll.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../shared/descriptions';

const show = { resource: ['checkout'], operation: ['getAll'] };

export const checkoutGetAllDescription: INodeProperties[] = [
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
				description: "Search by customer name/email, checkout ID, or the checkout's product names",
				routing: { request: { qs: { query: '={{$value}}' } } },
			},
			{
				displayName: 'Product ID',
				name: 'product_id',
				type: 'string',
				default: '',
				routing: { request: { qs: { product_id: '={{$value}}' } } },
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
				displayName: 'Status',
				name: 'status',
				type: 'multiOptions',
				options: [
					{ name: 'Open', value: 'open' },
					{ name: 'Expired', value: 'expired' },
					{ name: 'Confirmed', value: 'confirmed' },
					{ name: 'Succeeded', value: 'succeeded' },
					{ name: 'Failed', value: 'failed' },
				],
				default: [],
				routing: { request: { qs: { status: '={{$value}}' } } },
			},
		],
	},
];
```

- [ ] **Step 5: Write `resources/checkout/get.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['checkout'], operation: ['get'] };

export const checkoutGetDescription: INodeProperties[] = [
	{
		displayName: 'Checkout ID',
		name: 'checkoutId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'The ID of the checkout session',
	},
];
```

- [ ] **Step 6: Write `resources/checkout/create.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { billingAddressField, currencyOptions, customerLocator, metadataField } from '../../shared/descriptions';

const show = { resource: ['checkout'], operation: ['create'] };

export const checkoutCreateDescription: INodeProperties[] = [
	{
		displayName: 'Products',
		name: 'products',
		type: 'multiOptions',
		typeOptions: { loadOptionsMethod: 'getProductOptions' },
		default: [],
		required: true,
		displayOptions: { show },
		description: 'Products available to select at this checkout. The first one is preselected.',
		routing: { send: { type: 'body', property: 'products' } },
	},
	{
		...customerLocator(show, false),
		description: 'Attach the checkout to an existing customer (optional)',
		routing: { send: { type: 'body', property: 'customer_id', value: '={{$value.value}}' } },
	},
	metadataField('metadata', 'metadata', 'Metadata', show),
	metadataField('customerMetadata', 'customer_metadata', 'Customer Metadata', show),
	billingAddressField('customerBillingAddress', 'customer_billing_address', show),
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show },
		options: [
			{
				displayName: 'Trial Interval',
				name: 'trial_interval',
				type: 'options',
				options: [
					{ name: 'Day', value: 'day' },
					{ name: 'Week', value: 'week' },
					{ name: 'Month', value: 'month' },
					{ name: 'Year', value: 'year' },
				],
				default: 'month',
				routing: { request: { body: { trial_interval: '={{$value}}' } } },
			},
			{
				displayName: 'Trial Interval Count',
				name: 'trial_interval_count',
				type: 'number',
				default: 1,
				routing: { request: { body: { trial_interval_count: '={{$value}}' } } },
			},
			{
				displayName: 'Allow Trial',
				name: 'allow_trial',
				type: 'boolean',
				default: true,
				description: 'Whether to honor a trial configured on the product. If false, the trial is disabled for this checkout.',
				routing: { request: { body: { allow_trial: '={{$value}}' } } },
			},
			{
				displayName: 'Discount ID',
				name: 'discount_id',
				type: 'string',
				default: '',
				routing: { request: { body: { discount_id: '={{$value}}' } } },
			},
			{
				displayName: 'Allow Discount Codes',
				name: 'allow_discount_codes',
				type: 'boolean',
				default: true,
				routing: { request: { body: { allow_discount_codes: '={{$value}}' } } },
			},
			{
				displayName: 'Require Billing Address',
				name: 'require_billing_address',
				type: 'boolean',
				default: false,
				description: 'Whether to require the full billing address instead of just the country',
				routing: { request: { body: { require_billing_address: '={{$value}}' } } },
			},
			{
				displayName: 'Amount (Cents)',
				name: 'amount',
				type: 'number',
				default: 0,
				description: "Amount in cents before discounts/taxes. Only used for custom (pay-what-you-want) prices.",
				routing: { request: { body: { amount: '={{$value}}' } } },
			},
			{
				displayName: 'Seats',
				name: 'seats',
				type: 'number',
				default: 1,
				routing: { request: { body: { seats: '={{$value}}' } } },
			},
			{
				displayName: 'Min Seats',
				name: 'min_seats',
				type: 'number',
				default: 1,
				routing: { request: { body: { min_seats: '={{$value}}' } } },
			},
			{
				displayName: 'Max Seats',
				name: 'max_seats',
				type: 'number',
				default: 1,
				routing: { request: { body: { max_seats: '={{$value}}' } } },
			},
			{
				displayName: 'Is Business Customer',
				name: 'is_business_customer',
				type: 'boolean',
				default: false,
				routing: { request: { body: { is_business_customer: '={{$value}}' } } },
			},
			{
				displayName: 'External Customer ID',
				name: 'external_customer_id',
				type: 'string',
				default: '',
				routing: { request: { body: { external_customer_id: '={{$value}}' } } },
			},
			{
				displayName: 'Customer Name',
				name: 'customer_name',
				type: 'string',
				default: '',
				routing: { request: { body: { customer_name: '={{$value}}' } } },
			},
			{
				displayName: 'Customer Email',
				name: 'customer_email',
				type: 'string',
				placeholder: 'name@email.com',
				default: '',
				routing: { request: { body: { customer_email: '={{$value}}' } } },
			},
			{
				displayName: 'Customer IP Address',
				name: 'customer_ip_address',
				type: 'string',
				default: '',
				routing: { request: { body: { customer_ip_address: '={{$value}}' } } },
			},
			{
				displayName: 'Customer Billing Name',
				name: 'customer_billing_name',
				type: 'string',
				default: '',
				routing: { request: { body: { customer_billing_name: '={{$value}}' } } },
			},
			{
				displayName: 'Customer Tax ID',
				name: 'customer_tax_id',
				type: 'string',
				default: '',
				routing: { request: { body: { customer_tax_id: '={{$value}}' } } },
			},
			{
				displayName: 'Subscription ID',
				name: 'subscription_id',
				type: 'string',
				default: '',
				description: 'Upgrade this existing subscription instead of creating a new one',
				routing: { request: { body: { subscription_id: '={{$value}}' } } },
			},
			{
				displayName: 'Success URL',
				name: 'success_url',
				type: 'string',
				default: '',
				routing: { request: { body: { success_url: '={{$value}}' } } },
			},
			{
				displayName: 'Return URL',
				name: 'return_url',
				type: 'string',
				default: '',
				routing: { request: { body: { return_url: '={{$value}}' } } },
			},
			{
				displayName: 'Embed Origin',
				name: 'embed_origin',
				type: 'string',
				default: '',
				routing: { request: { body: { embed_origin: '={{$value}}' } } },
			},
			{
				displayName: 'Locale',
				name: 'locale',
				type: 'string',
				placeholder: 'e.g. en, en-US, fr-FR',
				default: '',
				routing: { request: { body: { locale: '={{$value}}' } } },
			},
			{
				displayName: 'Currency',
				name: 'currency',
				type: 'options',
				options: currencyOptions,
				default: 'usd',
				routing: { request: { body: { currency: '={{$value}}' } } },
			},
		],
	},
];
```

- [ ] **Step 7: Write `resources/checkout/update.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { billingAddressField, currencyOptions, metadataField } from '../../shared/descriptions';

const show = { resource: ['checkout'], operation: ['update'] };

export const checkoutUpdateDescription: INodeProperties[] = [
	{
		displayName: 'Checkout ID',
		name: 'checkoutId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'The ID of the checkout session to update',
	},
	metadataField('metadata', 'metadata', 'Metadata', show),
	metadataField('customerMetadata', 'customer_metadata', 'Customer Metadata', show),
	billingAddressField('customerBillingAddress', 'customer_billing_address', show),
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show },
		options: [
			{
				displayName: 'Product ID',
				name: 'product_id',
				type: 'string',
				default: '',
				description: 'Switch the checkout to a different product',
				routing: { request: { body: { product_id: '={{$value}}' } } },
			},
			{
				displayName: 'Product Price ID',
				name: 'product_price_id',
				type: 'string',
				default: '',
				routing: { request: { body: { product_price_id: '={{$value}}' } } },
			},
			{
				displayName: 'Amount (Cents)',
				name: 'amount',
				type: 'number',
				default: 0,
				routing: { request: { body: { amount: '={{$value}}' } } },
			},
			{
				displayName: 'Seats',
				name: 'seats',
				type: 'number',
				default: 1,
				routing: { request: { body: { seats: '={{$value}}' } } },
			},
			{
				displayName: 'Is Business Customer',
				name: 'is_business_customer',
				type: 'boolean',
				default: false,
				routing: { request: { body: { is_business_customer: '={{$value}}' } } },
			},
			{
				displayName: 'Customer Name',
				name: 'customer_name',
				type: 'string',
				default: '',
				routing: { request: { body: { customer_name: '={{$value}}' } } },
			},
			{
				displayName: 'Customer Email',
				name: 'customer_email',
				type: 'string',
				default: '',
				routing: { request: { body: { customer_email: '={{$value}}' } } },
			},
			{
				displayName: 'Customer Billing Name',
				name: 'customer_billing_name',
				type: 'string',
				default: '',
				routing: { request: { body: { customer_billing_name: '={{$value}}' } } },
			},
			{
				displayName: 'Customer Tax ID',
				name: 'customer_tax_id',
				type: 'string',
				default: '',
				routing: { request: { body: { customer_tax_id: '={{$value}}' } } },
			},
			{
				displayName: 'Customer IP Address',
				name: 'customer_ip_address',
				type: 'string',
				default: '',
				routing: { request: { body: { customer_ip_address: '={{$value}}' } } },
			},
			{
				displayName: 'Locale',
				name: 'locale',
				type: 'string',
				default: '',
				routing: { request: { body: { locale: '={{$value}}' } } },
			},
			{
				displayName: 'Trial Interval',
				name: 'trial_interval',
				type: 'options',
				options: [
					{ name: 'Day', value: 'day' },
					{ name: 'Week', value: 'week' },
					{ name: 'Month', value: 'month' },
					{ name: 'Year', value: 'year' },
				],
				default: 'month',
				routing: { request: { body: { trial_interval: '={{$value}}' } } },
			},
			{
				displayName: 'Trial Interval Count',
				name: 'trial_interval_count',
				type: 'number',
				default: 1,
				routing: { request: { body: { trial_interval_count: '={{$value}}' } } },
			},
			{
				displayName: 'Currency',
				name: 'currency',
				type: 'options',
				options: currencyOptions,
				default: 'usd',
				routing: { request: { body: { currency: '={{$value}}' } } },
			},
			{
				displayName: 'Discount ID',
				name: 'discount_id',
				type: 'string',
				default: '',
				routing: { request: { body: { discount_id: '={{$value}}' } } },
			},
			{
				displayName: 'Allow Discount Codes',
				name: 'allow_discount_codes',
				type: 'boolean',
				default: true,
				routing: { request: { body: { allow_discount_codes: '={{$value}}' } } },
			},
			{
				displayName: 'Require Billing Address',
				name: 'require_billing_address',
				type: 'boolean',
				default: false,
				routing: { request: { body: { require_billing_address: '={{$value}}' } } },
			},
			{
				displayName: 'Allow Trial',
				name: 'allow_trial',
				type: 'boolean',
				default: true,
				routing: { request: { body: { allow_trial: '={{$value}}' } } },
			},
			{
				displayName: 'Success URL',
				name: 'success_url',
				type: 'string',
				default: '',
				routing: { request: { body: { success_url: '={{$value}}' } } },
			},
			{
				displayName: 'Return URL',
				name: 'return_url',
				type: 'string',
				default: '',
				routing: { request: { body: { return_url: '={{$value}}' } } },
			},
			{
				displayName: 'Embed Origin',
				name: 'embed_origin',
				type: 'string',
				default: '',
				routing: { request: { body: { embed_origin: '={{$value}}' } } },
			},
		],
	},
];
```

- [ ] **Step 8: Write `resources/checkout/index.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { checkoutGetAllDescription } from './getAll';
import { checkoutGetDescription } from './get';
import { checkoutCreateDescription } from './create';
import { checkoutUpdateDescription } from './update';

const showOnlyForCheckout = { resource: ['checkout'] };

export const checkoutDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForCheckout },
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many checkouts',
				description: 'Get many checkout sessions',
				routing: { request: { method: 'GET', url: '=/checkouts/' } },
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a checkout',
				description: 'Get a single checkout session by ID',
				routing: { request: { method: 'GET', url: '=/checkouts/{{$parameter["checkoutId"]}}' } },
			},
			{
				name: 'Create',
				value: 'create',
				action: 'Create a checkout',
				description: 'Create a new checkout session',
				routing: { request: { method: 'POST', url: '=/checkouts/' } },
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a checkout',
				description: 'Update an existing checkout session',
				routing: { request: { method: 'PATCH', url: '=/checkouts/{{$parameter["checkoutId"]}}' } },
			},
		],
		default: 'getAll',
	},
	...checkoutGetAllDescription,
	...checkoutGetDescription,
	...checkoutCreateDescription,
	...checkoutUpdateDescription,
];
```

- [ ] **Step 9: Wire Checkout into `Polar.node.ts`**

In `nodes/Polar/Polar.node.ts`:

1. Add imports:

```typescript
import { checkoutDescription } from './resources/checkout';
import { getProducts } from './listSearch/getProducts';
import { getCustomers } from './listSearch/getCustomers';
import { getProductOptions } from './loadOptions/getProductOptions';
```

2. Change the `Resource` property's `options`/`default` to:

```typescript
options: [{ name: 'Checkout', value: 'checkout' }],
default: 'checkout',
```

3. Add `...checkoutDescription,` after the `Resource` property object in the `properties` array (so `properties` is now `[{ ...Resource... }, ...checkoutDescription]`).

4. Replace the `methods` block with:

```typescript
methods = {
	listSearch: {
		getProducts,
		getCustomers,
	},
	loadOptions: {
		getProductOptions,
	},
};
```

- [ ] **Step 10: Lint and build**

Run: `npm run lint && npm run build`
Expected: both succeed.

- [ ] **Step 11: Manual Sandbox verification**

Run: `npm run dev`. In the local n8n UI:
1. Create a `Polar API` credential with a Sandbox Organization Access Token.
2. Add a `Polar` node, resource `Checkout`, operation `Create`: pick at least one product via the `Products` field (this exercises `getProductOptions`), execute, confirm a checkout session comes back with a `url`.
3. Switch operation to `Get Many`, execute, confirm the created checkout appears; toggle `Return All` and confirm pagination doesn't error.
4. Switch to `Get` with the checkout ID from step 2, confirm it returns the same session.
5. Switch to `Update`, change e.g. `Customer Email` in Update Fields, execute, confirm the response reflects the change.

- [ ] **Step 12: Commit**

```bash
git add nodes/Polar
git commit -m "feat: add Checkout resource with product/customer pickers"
```

---

### Task 5: Checkout Link resource

**Files:**
- Create: `nodes/Polar/resources/checkoutLink/index.ts`
- Create: `nodes/Polar/resources/checkoutLink/getAll.ts`
- Create: `nodes/Polar/resources/checkoutLink/get.ts`
- Create: `nodes/Polar/resources/checkoutLink/create.ts`
- Create: `nodes/Polar/resources/checkoutLink/update.ts`
- Create: `nodes/Polar/resources/checkoutLink/delete.ts`
- Modify: `nodes/Polar/Polar.node.ts`

**Interfaces:**
- Consumes: `paginationProperties`, `metadataField`, `productLocator` (Task 3); `getProducts` listSearch and `getProductOptions` loadOptions (Task 4, already registered on the node).
- Produces: `checkoutLinkDescription: INodeProperties[]`.

Polar's `POST /v1/checkout-links/` body is a 3-way union (link to one product, one specific price, or several products) discriminated only by which field is present, not by an explicit `type` property — modeled here as a `Link Type` select that shows exactly one of the three reference fields, matching the design's "type selector + type-scoped fields" pattern.

- [ ] **Step 1: Write `resources/checkoutLink/getAll.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../shared/descriptions';

const show = { resource: ['checkoutLink'], operation: ['getAll'] };

export const checkoutLinkGetAllDescription: INodeProperties[] = [
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
				displayName: 'Organization ID',
				name: 'organization_id',
				type: 'string',
				default: '',
				routing: { request: { qs: { organization_id: '={{$value}}' } } },
			},
			{
				displayName: 'Product ID',
				name: 'product_id',
				type: 'string',
				default: '',
				routing: { request: { qs: { product_id: '={{$value}}' } } },
			},
		],
	},
];
```

- [ ] **Step 2: Write `resources/checkoutLink/get.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['checkoutLink'], operation: ['get'] };

export const checkoutLinkGetDescription: INodeProperties[] = [
	{
		displayName: 'Checkout Link ID',
		name: 'checkoutLinkId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
];
```

- [ ] **Step 3: Write `resources/checkoutLink/delete.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['checkoutLink'], operation: ['delete'] };

export const checkoutLinkDeleteDescription: INodeProperties[] = [
	{
		displayName: 'Checkout Link ID',
		name: 'checkoutLinkId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
];
```

- [ ] **Step 4: Write `resources/checkoutLink/create.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { metadataField, productLocator } from '../../shared/descriptions';

const show = { resource: ['checkoutLink'], operation: ['create'] };
const showSingleProduct = { ...show, linkType: ['singleProduct'] };
const showSinglePrice = { ...show, linkType: ['singlePrice'] };
const showMultipleProducts = { ...show, linkType: ['multipleProducts'] };

export const checkoutLinkCreateDescription: INodeProperties[] = [
	{
		displayName: 'Link Type',
		name: 'linkType',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show },
		options: [
			{ name: 'Single Product', value: 'singleProduct', description: 'Link to one product; the customer picks its default price' },
			{ name: 'Single Product Price', value: 'singlePrice', description: 'Link to one specific price of a product' },
			{ name: 'Multiple Products', value: 'multipleProducts', description: 'Let the customer choose among several products at checkout' },
		],
		default: 'singleProduct',
	},
	{
		...productLocator('productId', 'Product', showSingleProduct),
		routing: { send: { type: 'body', property: 'product_id', value: '={{$value.value}}' } },
	},
	{
		displayName: 'Product Price ID',
		name: 'productPriceId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: showSinglePrice },
		routing: { send: { type: 'body', property: 'product_price_id' } },
	},
	{
		displayName: 'Products',
		name: 'products',
		type: 'multiOptions',
		typeOptions: { loadOptionsMethod: 'getProductOptions' },
		default: [],
		required: true,
		displayOptions: { show: showMultipleProducts },
		routing: { send: { type: 'body', property: 'products' } },
	},
	metadataField('metadata', 'metadata', 'Metadata', show),
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show },
		options: [
			{
				displayName: 'Payment Processor',
				name: 'payment_processor',
				type: 'options',
				options: [{ name: 'Stripe', value: 'stripe' }],
				default: 'stripe',
				description: 'Only Stripe is currently supported by the Polar API',
				routing: { request: { body: { payment_processor: '={{$value}}' } } },
			},
			{
				displayName: 'Label',
				name: 'label',
				type: 'string',
				default: '',
				routing: { request: { body: { label: '={{$value}}' } } },
			},
			{
				displayName: 'Discount ID',
				name: 'discount_id',
				type: 'string',
				default: '',
				routing: { request: { body: { discount_id: '={{$value}}' } } },
			},
			{
				displayName: 'Allow Discount Codes',
				name: 'allow_discount_codes',
				type: 'boolean',
				default: true,
				routing: { request: { body: { allow_discount_codes: '={{$value}}' } } },
			},
			{
				displayName: 'Require Billing Address',
				name: 'require_billing_address',
				type: 'boolean',
				default: false,
				routing: { request: { body: { require_billing_address: '={{$value}}' } } },
			},
			{
				displayName: 'Seats',
				name: 'seats',
				type: 'number',
				default: 1,
				routing: { request: { body: { seats: '={{$value}}' } } },
			},
			{
				displayName: 'Trial Interval',
				name: 'trial_interval',
				type: 'options',
				options: [
					{ name: 'Day', value: 'day' },
					{ name: 'Week', value: 'week' },
					{ name: 'Month', value: 'month' },
					{ name: 'Year', value: 'year' },
				],
				default: 'month',
				routing: { request: { body: { trial_interval: '={{$value}}' } } },
			},
			{
				displayName: 'Trial Interval Count',
				name: 'trial_interval_count',
				type: 'number',
				default: 1,
				routing: { request: { body: { trial_interval_count: '={{$value}}' } } },
			},
			{
				displayName: 'Success URL',
				name: 'success_url',
				type: 'string',
				default: '',
				routing: { request: { body: { success_url: '={{$value}}' } } },
			},
			{
				displayName: 'Return URL',
				name: 'return_url',
				type: 'string',
				default: '',
				routing: { request: { body: { return_url: '={{$value}}' } } },
			},
		],
	},
];
```

- [ ] **Step 5: Write `resources/checkoutLink/update.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { metadataField } from '../../shared/descriptions';

const show = { resource: ['checkoutLink'], operation: ['update'] };

export const checkoutLinkUpdateDescription: INodeProperties[] = [
	{
		displayName: 'Checkout Link ID',
		name: 'checkoutLinkId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
	metadataField('metadata', 'metadata', 'Metadata', show),
	{
		displayName: 'Products',
		name: 'products',
		type: 'multiOptions',
		typeOptions: { loadOptionsMethod: 'getProductOptions' },
		default: [],
		displayOptions: { show },
		description: 'Leave empty to keep the existing products',
		routing: {
			send: {
				type: 'body',
				property: 'products',
				value: '={{ $value.length ? $value : undefined }}',
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
				displayName: 'Label',
				name: 'label',
				type: 'string',
				default: '',
				routing: { request: { body: { label: '={{$value}}' } } },
			},
			{
				displayName: 'Discount ID',
				name: 'discount_id',
				type: 'string',
				default: '',
				routing: { request: { body: { discount_id: '={{$value}}' } } },
			},
			{
				displayName: 'Allow Discount Codes',
				name: 'allow_discount_codes',
				type: 'boolean',
				default: true,
				routing: { request: { body: { allow_discount_codes: '={{$value}}' } } },
			},
			{
				displayName: 'Require Billing Address',
				name: 'require_billing_address',
				type: 'boolean',
				default: false,
				routing: { request: { body: { require_billing_address: '={{$value}}' } } },
			},
			{
				displayName: 'Seats',
				name: 'seats',
				type: 'number',
				default: 1,
				routing: { request: { body: { seats: '={{$value}}' } } },
			},
			{
				displayName: 'Trial Interval',
				name: 'trial_interval',
				type: 'options',
				options: [
					{ name: 'Day', value: 'day' },
					{ name: 'Week', value: 'week' },
					{ name: 'Month', value: 'month' },
					{ name: 'Year', value: 'year' },
				],
				default: 'month',
				routing: { request: { body: { trial_interval: '={{$value}}' } } },
			},
			{
				displayName: 'Trial Interval Count',
				name: 'trial_interval_count',
				type: 'number',
				default: 1,
				routing: { request: { body: { trial_interval_count: '={{$value}}' } } },
			},
			{
				displayName: 'Success URL',
				name: 'success_url',
				type: 'string',
				default: '',
				routing: { request: { body: { success_url: '={{$value}}' } } },
			},
			{
				displayName: 'Return URL',
				name: 'return_url',
				type: 'string',
				default: '',
				routing: { request: { body: { return_url: '={{$value}}' } } },
			},
		],
	},
];
```

- [ ] **Step 6: Write `resources/checkoutLink/index.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { checkoutLinkGetAllDescription } from './getAll';
import { checkoutLinkGetDescription } from './get';
import { checkoutLinkCreateDescription } from './create';
import { checkoutLinkUpdateDescription } from './update';
import { checkoutLinkDeleteDescription } from './delete';

const showOnlyForCheckoutLink = { resource: ['checkoutLink'] };

export const checkoutLinkDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForCheckoutLink },
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many checkout links',
				description: 'Get many checkout links',
				routing: { request: { method: 'GET', url: '=/checkout-links/' } },
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a checkout link',
				description: 'Get a single checkout link by ID',
				routing: { request: { method: 'GET', url: '=/checkout-links/{{$parameter["checkoutLinkId"]}}' } },
			},
			{
				name: 'Create',
				value: 'create',
				action: 'Create a checkout link',
				description: 'Create a new checkout link',
				routing: { request: { method: 'POST', url: '=/checkout-links/' } },
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a checkout link',
				description: 'Update an existing checkout link',
				routing: { request: { method: 'PATCH', url: '=/checkout-links/{{$parameter["checkoutLinkId"]}}' } },
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a checkout link',
				description: 'Delete a checkout link',
				routing: { request: { method: 'DELETE', url: '=/checkout-links/{{$parameter["checkoutLinkId"]}}' } },
			},
		],
		default: 'getAll',
	},
	...checkoutLinkGetAllDescription,
	...checkoutLinkGetDescription,
	...checkoutLinkCreateDescription,
	...checkoutLinkUpdateDescription,
	...checkoutLinkDeleteDescription,
];
```

- [ ] **Step 7: Wire Checkout Link into `Polar.node.ts`**

1. Add `import { checkoutLinkDescription } from './resources/checkoutLink';`.
2. Add `{ name: 'Checkout Link', value: 'checkoutLink' }` to the `Resource` options array (after `Checkout`).
3. Add `...checkoutLinkDescription,` to `properties` (after `...checkoutDescription,`).

No `methods.listSearch`/`loadOptions` additions — this resource reuses `getProducts`/`getProductOptions` already registered in Task 4.

- [ ] **Step 8: Lint and build**

Run: `npm run lint && npm run build`
Expected: both succeed.

- [ ] **Step 9: Manual Sandbox verification**

Run `npm run dev`. Add a `Polar` node, resource `Checkout Link`:
1. `Create` with Link Type `Single Product`, pick a product, execute, confirm a link URL comes back.
2. `Get Many`, confirm the created link appears.
3. `Get` with that link's ID, confirm it matches.
4. `Update`, change `Label` in Update Fields, execute, confirm the response reflects it.
5. `Delete`, execute, then `Get Many` again and confirm it's gone.

- [ ] **Step 10: Commit**

```bash
git add nodes/Polar
git commit -m "feat: add Checkout Link resource"
```

---

### Task 6: Customer resource

**Files:**
- Create: `nodes/Polar/resources/customer/index.ts`
- Create: `nodes/Polar/resources/customer/getAll.ts`
- Create: `nodes/Polar/resources/customer/get.ts`
- Create: `nodes/Polar/resources/customer/create.ts`
- Create: `nodes/Polar/resources/customer/update.ts`
- Create: `nodes/Polar/resources/customer/delete.ts`
- Create: `nodes/Polar/resources/customer/getState.ts`
- Create: `nodes/Polar/resources/customer/getPaymentMethods.ts`
- Modify: `nodes/Polar/Polar.node.ts`

**Interfaces:**
- Consumes: `paginationProperties`, `metadataField`, `billingAddressField` (Task 3).
- Produces: `customerDescription: INodeProperties[]`. Twelve operations, six of which come in ID/External-ID pairs (`get`/`getExternal`, `update`/`updateExternal`, `delete`/`deleteExternal`, `getState`/`getStateExternal`) sharing one "By" selector pattern: each pair is exposed as two distinct Operation dropdown entries rather than one operation with a hidden toggle, per the "no defaults" design principle — each maps to exactly one real endpoint.

- [ ] **Step 1: Write `resources/customer/getAll.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../shared/descriptions';

const show = { resource: ['customer'], operation: ['getAll'] };

export const customerGetAllDescription: INodeProperties[] = [
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
				description: 'Search by name or email',
				routing: { request: { qs: { query: '={{$value}}' } } },
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				default: '',
				routing: { request: { qs: { email: '={{$value}}' } } },
			},
			{
				displayName: 'Only Active',
				name: 'active',
				type: 'boolean',
				default: true,
				description: 'Whether to only return non-deleted, non-blocked customers',
				routing: { request: { qs: { active: '={{$value}}' } } },
			},
		],
	},
];
```

- [ ] **Step 2: Write `resources/customer/get.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';

const showById = { resource: ['customer'], operation: ['get'] };
const showByExternalId = { resource: ['customer'], operation: ['getExternal'] };

export const customerGetDescription: INodeProperties[] = [
	{
		displayName: 'Customer ID',
		name: 'customerId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: showById },
	},
	{
		displayName: 'External Customer ID',
		name: 'externalCustomerId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: showByExternalId },
		description: 'The customer ID in your own system, as set when the customer was created',
	},
];
```

- [ ] **Step 3: Write `resources/customer/getState.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';

const showById = { resource: ['customer'], operation: ['getState'] };
const showByExternalId = { resource: ['customer'], operation: ['getStateExternal'] };

export const customerGetStateDescription: INodeProperties[] = [
	{
		displayName: 'Customer ID',
		name: 'customerId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: showById },
		description: 'Returns a consolidated view of active subscriptions, orders and benefit grants for this customer',
	},
	{
		displayName: 'External Customer ID',
		name: 'externalCustomerId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: showByExternalId },
	},
];
```

- [ ] **Step 4: Write `resources/customer/getPaymentMethods.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../shared/descriptions';

const show = { resource: ['customer'], operation: ['getPaymentMethods'] };

export const customerGetPaymentMethodsDescription: INodeProperties[] = [
	{
		displayName: 'Customer ID',
		name: 'customerId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
	...paginationProperties(show),
];
```

- [ ] **Step 5: Write `resources/customer/delete.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';

const showById = { resource: ['customer'], operation: ['delete'] };
const showByExternalId = { resource: ['customer'], operation: ['deleteExternal'] };

export const customerDeleteDescription: INodeProperties[] = [
	{
		displayName: 'Customer ID',
		name: 'customerId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: showById },
	},
	{
		displayName: 'External Customer ID',
		name: 'externalCustomerId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: showByExternalId },
	},
	{
		displayName: 'Anonymize',
		name: 'anonymize',
		type: 'boolean',
		default: false,
		displayOptions: { show: { resource: ['customer'], operation: ['delete', 'deleteExternal'] } },
		description: 'Whether to scrub personally identifiable information instead of just soft-deleting the customer',
		routing: { request: { qs: { anonymize: '={{$value}}' } } },
	},
];
```

- [ ] **Step 6: Write `resources/customer/create.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { billingAddressField, metadataField } from '../../shared/descriptions';

const show = { resource: ['customer'], operation: ['create'] };
const showIndividual = { ...show, customerType: ['individual'] };
const showTeam = { ...show, customerType: ['team'] };

export const customerCreateDescription: INodeProperties[] = [
	{
		displayName: 'Customer Type',
		name: 'customerType',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show },
		options: [
			{ name: 'Individual', value: 'individual' },
			{ name: 'Team', value: 'team' },
		],
		default: 'individual',
		routing: { send: { type: 'body', property: 'type' } },
	},
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		placeholder: 'name@email.com',
		default: '',
		required: true,
		displayOptions: { show: showIndividual },
		description: 'Must be unique within the organization',
		routing: { send: { type: 'body', property: 'email' } },
	},
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		placeholder: 'name@email.com',
		default: '',
		displayOptions: { show: showTeam },
		description: 'Must be unique within the organization',
		routing: { send: { type: 'body', property: 'email' } },
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'name' } },
	},
	{
		displayName: 'External ID',
		name: 'externalId',
		type: 'string',
		default: '',
		displayOptions: { show },
		description: 'The customer ID in your own system, to reference it later without an extra lookup',
		routing: { send: { type: 'body', property: 'external_id' } },
	},
	billingAddressField('billingAddress', 'billing_address', show),
	metadataField('metadata', 'metadata', 'Metadata', show),
	{
		displayName: 'Owner',
		name: 'owner',
		type: 'collection',
		placeholder: 'Add Owner Field',
		default: {},
		displayOptions: { show },
		description: 'For team customers, the member who owns the account (required by the API when set)',
		options: [
			{ displayName: 'Email', name: 'email', type: 'string', default: '' },
			{ displayName: 'Name', name: 'name', type: 'string', default: '' },
			{ displayName: 'External ID', name: 'external_id', type: 'string', default: '' },
		],
		routing: {
			send: {
				type: 'body',
				property: 'owner',
				value: '={{ Object.keys($value).length ? $value : undefined }}',
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
				displayName: 'Tax ID',
				name: 'tax_id',
				type: 'string',
				default: '',
				routing: { request: { body: { tax_id: '={{$value}}' } } },
			},
			{
				displayName: 'Locale',
				name: 'locale',
				type: 'string',
				placeholder: 'e.g. en, en-US, fr-FR',
				default: '',
				routing: { request: { body: { locale: '={{$value}}' } } },
			},
		],
	},
];
```

- [ ] **Step 7: Write `resources/customer/update.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { billingAddressField, metadataField } from '../../shared/descriptions';

const showById = { resource: ['customer'], operation: ['update'] };
const showByExternalId = { resource: ['customer'], operation: ['updateExternal'] };
const showBoth = { resource: ['customer'], operation: ['update', 'updateExternal'] };

export const customerUpdateDescription: INodeProperties[] = [
	{
		displayName: 'Customer ID',
		name: 'customerId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: showById },
	},
	{
		displayName: 'External Customer ID',
		name: 'externalCustomerId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: showByExternalId },
	},
	billingAddressField('billingAddress', 'billing_address', showBoth),
	metadataField('metadata', 'metadata', 'Metadata', showBoth),
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: showBoth },
		options: [
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				default: '',
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
				displayName: 'External ID',
				name: 'external_id',
				type: 'string',
				default: '',
				routing: { request: { body: { external_id: '={{$value}}' } } },
			},
			{
				displayName: 'Tax ID',
				name: 'tax_id',
				type: 'string',
				default: '',
				routing: { request: { body: { tax_id: '={{$value}}' } } },
			},
			{
				displayName: 'Locale',
				name: 'locale',
				type: 'string',
				default: '',
				routing: { request: { body: { locale: '={{$value}}' } } },
			},
			{
				displayName: 'Customer Type',
				name: 'type',
				type: 'options',
				options: [
					{ name: 'Individual', value: 'individual' },
					{ name: 'Team', value: 'team' },
				],
				default: 'individual',
				routing: { request: { body: { type: '={{$value}}' } } },
			},
		],
	},
];
```

- [ ] **Step 8: Write `resources/customer/index.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { customerGetAllDescription } from './getAll';
import { customerGetDescription } from './get';
import { customerCreateDescription } from './create';
import { customerUpdateDescription } from './update';
import { customerDeleteDescription } from './delete';
import { customerGetStateDescription } from './getState';
import { customerGetPaymentMethodsDescription } from './getPaymentMethods';

const showOnlyForCustomer = { resource: ['customer'] };

export const customerDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForCustomer },
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many customers',
				description: 'Get many customers',
				routing: { request: { method: 'GET', url: '=/customers/' } },
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a customer',
				description: 'Get a single customer by ID',
				routing: { request: { method: 'GET', url: '=/customers/{{$parameter["customerId"]}}' } },
			},
			{
				name: 'Get by External ID',
				value: 'getExternal',
				action: 'Get a customer by external ID',
				description: "Get a single customer by your system's external ID",
				routing: { request: { method: 'GET', url: '=/customers/external/{{$parameter["externalCustomerId"]}}' } },
			},
			{
				name: 'Create',
				value: 'create',
				action: 'Create a customer',
				description: 'Create a new customer',
				routing: { request: { method: 'POST', url: '=/customers/' } },
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a customer',
				description: 'Update an existing customer',
				routing: { request: { method: 'PATCH', url: '=/customers/{{$parameter["customerId"]}}' } },
			},
			{
				name: 'Update by External ID',
				value: 'updateExternal',
				action: 'Update a customer by external ID',
				description: "Update a customer identified by your system's external ID",
				routing: { request: { method: 'PATCH', url: '=/customers/external/{{$parameter["externalCustomerId"]}}' } },
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a customer',
				description: 'Delete a customer',
				routing: { request: { method: 'DELETE', url: '=/customers/{{$parameter["customerId"]}}' } },
			},
			{
				name: 'Delete by External ID',
				value: 'deleteExternal',
				action: 'Delete a customer by external ID',
				description: "Delete a customer identified by your system's external ID",
				routing: { request: { method: 'DELETE', url: '=/customers/external/{{$parameter["externalCustomerId"]}}' } },
			},
			{
				name: 'Get State',
				value: 'getState',
				action: 'Get a customer state',
				description: 'Get a consolidated view of a customer’s active subscriptions, orders and benefit grants',
				routing: { request: { method: 'GET', url: '=/customers/{{$parameter["customerId"]}}/state' } },
			},
			{
				name: 'Get State by External ID',
				value: 'getStateExternal',
				action: 'Get a customer state by external ID',
				description: "Get a consolidated customer state by your system's external ID",
				routing: { request: { method: 'GET', url: '=/customers/external/{{$parameter["externalCustomerId"]}}/state' } },
			},
			{
				name: 'Get Payment Methods',
				value: 'getPaymentMethods',
				action: 'Get a customer payment methods',
				description: 'List saved payment methods for a customer',
				routing: { request: { method: 'GET', url: '=/customers/{{$parameter["customerId"]}}/payment-methods' } },
			},
		],
		default: 'getAll',
	},
	...customerGetAllDescription,
	...customerGetDescription,
	...customerCreateDescription,
	...customerUpdateDescription,
	...customerDeleteDescription,
	...customerGetStateDescription,
	...customerGetPaymentMethodsDescription,
];
```

- [ ] **Step 9: Wire Customer into `Polar.node.ts`**

1. Add `import { customerDescription } from './resources/customer';`.
2. Add `{ name: 'Customer', value: 'customer' }` to the `Resource` options array.
3. Add `...customerDescription,` to `properties`.

- [ ] **Step 10: Lint and build**

Run: `npm run lint && npm run build`
Expected: both succeed.

- [ ] **Step 11: Manual Sandbox verification**

Run `npm run dev`. Resource `Customer`:
1. `Create` (Individual, with an Email), execute, note the returned `id`.
2. `Get` with that ID, confirm match. `Get State` with that ID, confirm subscriptions/orders/benefit grants arrays come back empty.
3. `Update`, change `Name` in Update Fields, execute, confirm it changed.
4. `Create` again with an `External ID` set, then `Get by External ID`, confirm it resolves the same customer.
5. `Delete` the first customer, then `Get Many` and confirm it's gone (or marked deleted, per `Only Active` filter behavior).

- [ ] **Step 12: Commit**

```bash
git add nodes/Polar
git commit -m "feat: add Customer resource"
```

---

### Task 7: Order resource

**Files:**
- Create: `nodes/Polar/resources/order/index.ts`
- Create: `nodes/Polar/resources/order/getAll.ts`
- Create: `nodes/Polar/resources/order/get.ts`
- Create: `nodes/Polar/resources/order/create.ts`
- Create: `nodes/Polar/resources/order/update.ts`
- Create: `nodes/Polar/resources/order/finalize.ts`
- Create: `nodes/Polar/resources/order/generateInvoice.ts`
- Create: `nodes/Polar/resources/order/getInvoice.ts`
- Create: `nodes/Polar/resources/order/getReceipt.ts`
- Modify: `nodes/Polar/Polar.node.ts`

**Interfaces:**
- Consumes: `paginationProperties`, `billingAddressField`, `customerLocator`, `productLocator`, `currencyOptions` (Task 3); `getCustomers`/`getProducts` (Task 4, already registered).
- Produces: `orderDescription: INodeProperties[]`.

`POST /v1/orders/` creates a manual order for a **free or fixed-price one-time product** only (per the API description) — it does not accept custom/pay-what-you-want pricing.

- [ ] **Step 1: Write `resources/order/getAll.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../shared/descriptions';

const show = { resource: ['order'], operation: ['getAll'] };

export const orderGetAllDescription: INodeProperties[] = [
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
				displayName: 'Product ID',
				name: 'product_id',
				type: 'string',
				default: '',
				routing: { request: { qs: { product_id: '={{$value}}' } } },
			},
			{
				displayName: 'Product Billing Type',
				name: 'product_billing_type',
				type: 'options',
				options: [
					{ name: 'One Time', value: 'one_time' },
					{ name: 'Recurring', value: 'recurring' },
				],
				default: 'one_time',
				routing: { request: { qs: { product_billing_type: '={{$value}}' } } },
			},
			{
				displayName: 'Discount ID',
				name: 'discount_id',
				type: 'string',
				default: '',
				routing: { request: { qs: { discount_id: '={{$value}}' } } },
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
				displayName: 'Checkout ID',
				name: 'checkout_id',
				type: 'string',
				default: '',
				routing: { request: { qs: { checkout_id: '={{$value}}' } } },
			},
			{
				displayName: 'Subscription ID',
				name: 'subscription_id',
				type: 'string',
				default: '',
				routing: { request: { qs: { subscription_id: '={{$value}}' } } },
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'multiOptions',
				options: [
					{ name: 'Draft', value: 'draft' },
					{ name: 'Pending', value: 'pending' },
					{ name: 'Paid', value: 'paid' },
					{ name: 'Refunded', value: 'refunded' },
					{ name: 'Partially Refunded', value: 'partially_refunded' },
					{ name: 'Void', value: 'void' },
				],
				default: [],
				routing: { request: { qs: { status: '={{$value}}' } } },
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
		],
	},
];
```

- [ ] **Step 2: Write `resources/order/get.ts`, `finalize.ts` (field), `generateInvoice.ts`, `getInvoice.ts`, `getReceipt.ts`**

`get.ts`:

```typescript
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['order'], operation: ['get'] };

export const orderGetDescription: INodeProperties[] = [
	{
		displayName: 'Order ID',
		name: 'orderId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
];
```

`finalize.ts`:

```typescript
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['order'], operation: ['finalize'] };

export const orderFinalizeDescription: INodeProperties[] = [
	{
		displayName: 'Order ID',
		name: 'orderId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'The ID of the draft order to finalize and charge off-session',
	},
	{
		displayName: 'Payment Method ID',
		name: 'paymentMethodId',
		type: 'string',
		default: '',
		displayOptions: { show },
		description: "ID of the payment method to charge. Falls back to the customer's default payment method when left empty.",
		routing: {
			send: {
				type: 'body',
				property: 'payment_method_id',
				value: '={{ $value || undefined }}',
			},
		},
	},
];
```

`generateInvoice.ts`:

```typescript
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['order'], operation: ['generateInvoice'] };

export const orderGenerateInvoiceDescription: INodeProperties[] = [
	{
		displayName: 'Order ID',
		name: 'orderId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'Triggers generation of an invoice PDF for this order (async — poll Get Invoice for the URL)',
	},
];
```

`getInvoice.ts`:

```typescript
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['order'], operation: ['getInvoice'] };

export const orderGetInvoiceDescription: INodeProperties[] = [
	{
		displayName: 'Order ID',
		name: 'orderId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
];
```

`getReceipt.ts`:

```typescript
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['order'], operation: ['getReceipt'] };

export const orderGetReceiptDescription: INodeProperties[] = [
	{
		displayName: 'Order ID',
		name: 'orderId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
];
```

- [ ] **Step 3: Write `resources/order/create.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { currencyOptions, customerLocator, metadataField, productLocator } from '../../shared/descriptions';

const show = { resource: ['order'], operation: ['create'] };

export const orderCreateDescription: INodeProperties[] = [
	{
		...customerLocator(show, true),
		description: 'Must belong to the same organization as the order',
		routing: { send: { type: 'body', property: 'customer_id', value: '={{$value.value}}' } },
	},
	{
		...productLocator('productId', 'Product', show, true),
		description: 'A free or fixed-price one-time product to charge for',
		routing: { send: { type: 'body', property: 'product_id', value: '={{$value.value}}' } },
	},
	metadataField('metadata', 'metadata', 'Metadata', show),
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show },
		options: [
			{
				displayName: 'Currency',
				name: 'currency',
				type: 'options',
				options: currencyOptions,
				default: 'usd',
				routing: { request: { body: { currency: '={{$value}}' } } },
			},
			{
				displayName: 'Amount (Cents)',
				name: 'amount',
				type: 'number',
				default: 0,
				routing: { request: { body: { amount: '={{$value}}' } } },
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				routing: { request: { body: { description: '={{$value}}' } } },
			},
		],
	},
];
```

- [ ] **Step 4: Write `resources/order/update.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { billingAddressField } from '../../shared/descriptions';

const show = { resource: ['order'], operation: ['update'] };

export const orderUpdateDescription: INodeProperties[] = [
	{
		displayName: 'Order ID',
		name: 'orderId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
	billingAddressField('billingAddress', 'billing_address', show),
	{
		displayName: 'Billing Name',
		name: 'billingName',
		type: 'string',
		default: '',
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'billing_name' } },
	},
];
```

- [ ] **Step 5: Write `resources/order/index.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { orderGetAllDescription } from './getAll';
import { orderGetDescription } from './get';
import { orderCreateDescription } from './create';
import { orderUpdateDescription } from './update';
import { orderFinalizeDescription } from './finalize';
import { orderGenerateInvoiceDescription } from './generateInvoice';
import { orderGetInvoiceDescription } from './getInvoice';
import { orderGetReceiptDescription } from './getReceipt';

const showOnlyForOrder = { resource: ['order'] };

export const orderDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForOrder },
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many orders',
				description: 'Get many orders',
				routing: { request: { method: 'GET', url: '=/orders/' } },
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get an order',
				description: 'Get a single order by ID',
				routing: { request: { method: 'GET', url: '=/orders/{{$parameter["orderId"]}}' } },
			},
			{
				name: 'Create',
				value: 'create',
				action: 'Create an order',
				description: 'Create a manual order for a free or fixed-price one-time product',
				routing: { request: { method: 'POST', url: '=/orders/' } },
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update an order',
				description: "Update an order's billing name/address",
				routing: { request: { method: 'PATCH', url: '=/orders/{{$parameter["orderId"]}}' } },
			},
			{
				name: 'Finalize',
				value: 'finalize',
				action: 'Finalize an order',
				description: 'Finalize a draft order and trigger an off-session charge',
				routing: { request: { method: 'POST', url: '=/orders/{{$parameter["orderId"]}}/finalize' } },
			},
			{
				name: 'Generate Invoice',
				value: 'generateInvoice',
				action: 'Generate an order invoice',
				description: 'Trigger generation of an invoice for this order',
				routing: { request: { method: 'POST', url: '=/orders/{{$parameter["orderId"]}}/invoice' } },
			},
			{
				name: 'Get Invoice',
				value: 'getInvoice',
				action: 'Get an order invoice',
				description: 'Get the generated invoice details/URL for an order',
				routing: { request: { method: 'GET', url: '=/orders/{{$parameter["orderId"]}}/invoice' } },
			},
			{
				name: 'Get Receipt',
				value: 'getReceipt',
				action: 'Get an order receipt',
				description: 'Get the receipt URL for a paid order',
				routing: { request: { method: 'GET', url: '=/orders/{{$parameter["orderId"]}}/receipt' } },
			},
		],
		default: 'getAll',
	},
	...orderGetAllDescription,
	...orderGetDescription,
	...orderCreateDescription,
	...orderUpdateDescription,
	...orderFinalizeDescription,
	...orderGenerateInvoiceDescription,
	...orderGetInvoiceDescription,
	...orderGetReceiptDescription,
];
```

- [ ] **Step 6: Wire Order into `Polar.node.ts`**

1. Add `import { orderDescription } from './resources/order';`.
2. Add `{ name: 'Order', value: 'order' }` to the `Resource` options array.
3. Add `...orderDescription,` to `properties`.

- [ ] **Step 7: Lint and build**

Run: `npm run lint && npm run build`
Expected: both succeed.

- [ ] **Step 8: Manual Sandbox verification**

Set up a free one-time product in the Sandbox dashboard first (orders can only be created manually for free/fixed one-time products). Run `npm run dev`, resource `Order`:
1. `Create` with that product and a customer, execute, note the returned order `id` and its `status` (likely `draft` if the product isn't free).
2. `Get` with that ID, confirm match.
3. `Get Many`, confirm it appears; try the `Status` filter.
4. If the order is a draft, `Finalize` it, then `Get` again and confirm `status` becomes `paid`.
5. `Generate Invoice` then `Get Invoice`, confirm an invoice reference/URL is returned (may need a short delay since generation is async).

- [ ] **Step 9: Commit**

```bash
git add nodes/Polar
git commit -m "feat: add Order resource"
```

---

### Task 8: Subscription resource

**Files:**
- Create: `nodes/Polar/resources/subscription/index.ts`
- Create: `nodes/Polar/resources/subscription/getAll.ts`
- Create: `nodes/Polar/resources/subscription/get.ts`
- Create: `nodes/Polar/resources/subscription/create.ts`
- Create: `nodes/Polar/resources/subscription/update.ts`
- Create: `nodes/Polar/resources/subscription/updateSeats.ts`
- Create: `nodes/Polar/resources/subscription/updateBillingPeriod.ts`
- Create: `nodes/Polar/resources/subscription/cancel.ts`
- Create: `nodes/Polar/resources/subscription/revoke.ts`
- Create: `nodes/Polar/resources/subscription/pause.ts`
- Create: `nodes/Polar/resources/subscription/resume.ts`
- Create: `nodes/Polar/resources/subscription/clearPendingUpdate.ts`
- Modify: `nodes/Polar/Polar.node.ts`

**Interfaces:**
- Consumes: `paginationProperties`, `metadataField`, `productLocator` (Task 3); `getProducts` (Task 4, already registered).
- Produces: `subscriptionDescription: INodeProperties[]`.

`PATCH /v1/subscriptions/{id}` is itself an 8-way discriminated union in the OpenAPI spec (update product/discount/trial, resize seats, move the billing period, cancel, revoke, pause, resume, or clear a pending change). Rather than one "Update" operation hiding eight different actions behind an internal switch, each variant is its own Operation dropdown entry — this is a closer fit to "no defaults" than a single generic Update, and it matches how the API itself models these as distinct actions. The "Revoke" action is exposed via `DELETE /v1/subscriptions/{id}` (operation ID `subscriptions:revoke`) rather than the redundant `PATCH` `revoke: true` variant, since they perform the same action and the `DELETE` verb is the more direct match for it.

- [ ] **Step 1: Write `resources/subscription/getAll.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../shared/descriptions';

const show = { resource: ['subscription'], operation: ['getAll'] };

export const subscriptionGetAllDescription: INodeProperties[] = [
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
				displayName: 'Product ID',
				name: 'product_id',
				type: 'string',
				default: '',
				routing: { request: { qs: { product_id: '={{$value}}' } } },
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
				displayName: 'Discount ID',
				name: 'discount_id',
				type: 'string',
				default: '',
				routing: { request: { qs: { discount_id: '={{$value}}' } } },
			},
			{
				displayName: 'Only Active',
				name: 'active',
				type: 'boolean',
				default: true,
				routing: { request: { qs: { active: '={{$value}}' } } },
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'multiOptions',
				options: [
					{ name: 'Incomplete', value: 'incomplete' },
					{ name: 'Incomplete Expired', value: 'incomplete_expired' },
					{ name: 'Trialing', value: 'trialing' },
					{ name: 'Active', value: 'active' },
					{ name: 'Past Due', value: 'past_due' },
					{ name: 'Canceled', value: 'canceled' },
					{ name: 'Unpaid', value: 'unpaid' },
					{ name: 'Paused', value: 'paused' },
				],
				default: [],
				routing: { request: { qs: { status: '={{$value}}' } } },
			},
			{
				displayName: 'Cancel at Period End',
				name: 'cancel_at_period_end',
				type: 'boolean',
				default: true,
				routing: { request: { qs: { cancel_at_period_end: '={{$value}}' } } },
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
				displayName: 'Canceled After',
				name: 'canceled_at_after',
				type: 'dateTime',
				default: '',
				routing: { request: { qs: { canceled_at_after: '={{$value}}' } } },
			},
			{
				displayName: 'Canceled Before',
				name: 'canceled_at_before',
				type: 'dateTime',
				default: '',
				routing: { request: { qs: { canceled_at_before: '={{$value}}' } } },
			},
		],
	},
];
```

- [ ] **Step 2: Write the single-field operation files**

`get.ts`:

```typescript
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['subscription'], operation: ['get'] };

export const subscriptionGetDescription: INodeProperties[] = [
	{
		displayName: 'Subscription ID',
		name: 'subscriptionId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
];
```

`revoke.ts`:

```typescript
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['subscription'], operation: ['revoke'] };

export const subscriptionRevokeDescription: INodeProperties[] = [
	{
		displayName: 'Subscription ID',
		name: 'subscriptionId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'Cancels and revokes the subscription immediately, along with any granted benefits',
	},
];
```

`resume.ts`:

```typescript
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['subscription'], operation: ['resume'] };

export const subscriptionResumeDescription: INodeProperties[] = [
	{
		displayName: 'Subscription ID',
		name: 'subscriptionId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'Resumes a paused subscription immediately and starts a new billing period',
		routing: { send: { type: 'body', property: 'resume', value: '=true' } },
	},
];
```

`clearPendingUpdate.ts`:

```typescript
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['subscription'], operation: ['clearPendingUpdate'] };

export const subscriptionClearPendingUpdateDescription: INodeProperties[] = [
	{
		displayName: 'Subscription ID',
		name: 'subscriptionId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'Clears any scheduled subscription change (e.g. a pending downgrade)',
		routing: { send: { type: 'body', property: 'pending_update', value: '={{null}}' } },
	},
];
```

- [ ] **Step 3: Write `resources/subscription/updateBillingPeriod.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['subscription'], operation: ['updateBillingPeriod'] };

export const subscriptionUpdateBillingPeriodDescription: INodeProperties[] = [
	{
		displayName: 'Subscription ID',
		name: 'subscriptionId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
	{
		displayName: 'New Billing Period End',
		name: 'currentBillingPeriodEnd',
		type: 'dateTime',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'Must be in the future; the subscription will renew on this date',
		routing: { send: { type: 'body', property: 'current_billing_period_end' } },
	},
];
```

- [ ] **Step 4: Write `resources/subscription/updateSeats.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['subscription'], operation: ['updateSeats'] };

export const subscriptionUpdateSeatsDescription: INodeProperties[] = [
	{
		displayName: 'Subscription ID',
		name: 'subscriptionId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
	{
		displayName: 'Seats',
		name: 'seats',
		type: 'number',
		default: 1,
		required: true,
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'seats' } },
	},
	{
		displayName: 'Proration Behavior',
		name: 'prorationBehavior',
		type: 'options',
		options: [
			{ name: 'Invoice', value: 'invoice' },
			{ name: 'Prorate', value: 'prorate' },
			{ name: 'Next Period', value: 'next_period' },
			{ name: 'Reset', value: 'reset' },
		],
		default: 'prorate',
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'proration_behavior' } },
	},
];
```

- [ ] **Step 5: Write `resources/subscription/pause.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['subscription'], operation: ['pause'] };

export const subscriptionPauseDescription: INodeProperties[] = [
	{
		displayName: 'Subscription ID',
		name: 'subscriptionId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
	{
		displayName: 'Pause at Period End',
		name: 'pauseAtPeriodEnd',
		type: 'boolean',
		default: true,
		required: true,
		displayOptions: { show },
		description: 'If false, the subscription pauses immediately instead of at the end of the current period',
		routing: { send: { type: 'body', property: 'pause_at_period_end' } },
	},
	{
		displayName: 'Resumes At',
		name: 'resumesAt',
		type: 'dateTime',
		default: '',
		displayOptions: { show },
		description: 'Optional date to automatically resume the subscription',
		routing: {
			send: {
				type: 'body',
				property: 'resumes_at',
				value: '={{ $value || undefined }}',
			},
		},
	},
];
```

- [ ] **Step 6: Write `resources/subscription/cancel.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['subscription'], operation: ['cancel'] };

export const subscriptionCancelDescription: INodeProperties[] = [
	{
		displayName: 'Subscription ID',
		name: 'subscriptionId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
	{
		displayName: 'Cancel at Period End',
		name: 'cancelAtPeriodEnd',
		type: 'boolean',
		default: true,
		required: true,
		displayOptions: { show },
		description: 'Schedules cancellation once the current billing period ends (set to false to un-cancel a scheduled cancellation)',
		routing: { send: { type: 'body', property: 'cancel_at_period_end' } },
	},
	{
		displayName: 'Cancellation Reason',
		name: 'customerCancellationReason',
		type: 'options',
		options: [
			{ name: 'Customer Service', value: 'customer_service' },
			{ name: 'Low Quality', value: 'low_quality' },
			{ name: 'Missing Features', value: 'missing_features' },
			{ name: 'Switched Service', value: 'switched_service' },
			{ name: 'Too Complex', value: 'too_complex' },
			{ name: 'Too Expensive', value: 'too_expensive' },
			{ name: 'Unused', value: 'unused' },
			{ name: 'Other', value: 'other' },
		],
		default: 'other',
		displayOptions: { show },
		routing: {
			send: {
				type: 'body',
				property: 'customer_cancellation_reason',
				value: '={{ $value || undefined }}',
			},
		},
	},
	{
		displayName: 'Cancellation Comment',
		name: 'customerCancellationComment',
		type: 'string',
		default: '',
		displayOptions: { show },
		routing: {
			send: {
				type: 'body',
				property: 'customer_cancellation_comment',
				value: '={{ $value || undefined }}',
			},
		},
	},
];
```

- [ ] **Step 7: Write `resources/subscription/update.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { productLocator } from '../../shared/descriptions';

const show = { resource: ['subscription'], operation: ['update'] };

export const subscriptionUpdateDescription: INodeProperties[] = [
	{
		displayName: 'Subscription ID',
		name: 'subscriptionId',
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
				displayName: 'New Product ID',
				name: 'product_id',
				type: 'string',
				default: '',
				description: 'Move the subscription to a different recurring product',
				routing: { request: { body: { product_id: '={{$value}}' } } },
			},
			{
				displayName: 'Discount ID',
				name: 'discount_id',
				type: 'string',
				default: '',
				description: "Set to an empty value to remove the subscription's discount",
				routing: { request: { body: { discount_id: '={{$value}}' } } },
			},
			{
				displayName: 'Trial End',
				name: 'trial_end',
				type: 'dateTime',
				default: '',
				description: "Extend or set the trial end date. Leave empty to leave unchanged.",
				routing: { request: { body: { trial_end: '={{$value}}' } } },
			},
			{
				displayName: 'Proration Behavior',
				name: 'proration_behavior',
				type: 'options',
				options: [
					{ name: 'Invoice', value: 'invoice' },
					{ name: 'Prorate', value: 'prorate' },
					{ name: 'Next Period', value: 'next_period' },
					{ name: 'Reset', value: 'reset' },
				],
				default: 'prorate',
				routing: { request: { body: { proration_behavior: '={{$value}}' } } },
			},
		],
	},
];
```

(`productLocator` is imported for consistency with other resource files but not used as a field here — the API accepts a plain `product_id` string in this PATCH body, so `Update Fields` uses a plain string sub-field instead of a top-level resourceLocator, matching the "Update Fields collection can only hold simple field types" rule from Task 4/7. Remove the unused import if the linter flags it.)

- [ ] **Step 8: Write `resources/subscription/create.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { metadataField, productLocator } from '../../shared/descriptions';

const show = { resource: ['subscription'], operation: ['create'] };
const showCustomerId = { ...show, customerReferenceType: ['customerId'] };
const showExternalId = { ...show, customerReferenceType: ['externalId'] };

export const subscriptionCreateDescription: INodeProperties[] = [
	{
		...productLocator('productId', 'Product', show, true),
		description: 'Must be a free recurring product — paid products require the checkout flow',
		routing: { send: { type: 'body', property: 'product_id', value: '={{$value.value}}' } },
	},
	{
		displayName: 'Customer Reference Type',
		name: 'customerReferenceType',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show },
		options: [
			{ name: 'Customer ID', value: 'customerId' },
			{ name: 'External Customer ID', value: 'externalId' },
		],
		default: 'customerId',
	},
	{
		displayName: 'Customer ID',
		name: 'customerId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: showCustomerId },
		routing: { send: { type: 'body', property: 'customer_id' } },
	},
	{
		displayName: 'External Customer ID',
		name: 'externalCustomerId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: showExternalId },
		routing: { send: { type: 'body', property: 'external_customer_id' } },
	},
	metadataField('metadata', 'metadata', 'Metadata', show),
];
```

- [ ] **Step 9: Write `resources/subscription/index.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { subscriptionGetAllDescription } from './getAll';
import { subscriptionGetDescription } from './get';
import { subscriptionCreateDescription } from './create';
import { subscriptionUpdateDescription } from './update';
import { subscriptionUpdateSeatsDescription } from './updateSeats';
import { subscriptionUpdateBillingPeriodDescription } from './updateBillingPeriod';
import { subscriptionCancelDescription } from './cancel';
import { subscriptionRevokeDescription } from './revoke';
import { subscriptionPauseDescription } from './pause';
import { subscriptionResumeDescription } from './resume';
import { subscriptionClearPendingUpdateDescription } from './clearPendingUpdate';

const showOnlyForSubscription = { resource: ['subscription'] };

export const subscriptionDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForSubscription },
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many subscriptions',
				description: 'Get many subscriptions',
				routing: { request: { method: 'GET', url: '=/subscriptions/' } },
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a subscription',
				description: 'Get a single subscription by ID',
				routing: { request: { method: 'GET', url: '=/subscriptions/{{$parameter["subscriptionId"]}}' } },
			},
			{
				name: 'Create',
				value: 'create',
				action: 'Create a subscription',
				description: 'Create a free subscription directly, without a checkout',
				routing: { request: { method: 'POST', url: '=/subscriptions/' } },
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a subscription',
				description: 'Change the product, discount, trial end, or proration behavior',
				routing: { request: { method: 'PATCH', url: '=/subscriptions/{{$parameter["subscriptionId"]}}' } },
			},
			{
				name: 'Update Seats',
				value: 'updateSeats',
				action: 'Update subscription seats',
				description: 'Change the number of seats on a seat-based subscription',
				routing: { request: { method: 'PATCH', url: '=/subscriptions/{{$parameter["subscriptionId"]}}' } },
			},
			{
				name: 'Update Billing Period',
				value: 'updateBillingPeriod',
				action: 'Update subscription billing period',
				description: 'Move the end date of the current billing period',
				routing: { request: { method: 'PATCH', url: '=/subscriptions/{{$parameter["subscriptionId"]}}' } },
			},
			{
				name: 'Cancel',
				value: 'cancel',
				action: 'Cancel a subscription',
				description: 'Schedule (or un-schedule) cancellation at the end of the current period',
				routing: { request: { method: 'PATCH', url: '=/subscriptions/{{$parameter["subscriptionId"]}}' } },
			},
			{
				name: 'Revoke',
				value: 'revoke',
				action: 'Revoke a subscription',
				description: 'Cancel and revoke a subscription immediately',
				routing: { request: { method: 'DELETE', url: '=/subscriptions/{{$parameter["subscriptionId"]}}' } },
			},
			{
				name: 'Pause',
				value: 'pause',
				action: 'Pause a subscription',
				description: 'Pause an active subscription',
				routing: { request: { method: 'PATCH', url: '=/subscriptions/{{$parameter["subscriptionId"]}}' } },
			},
			{
				name: 'Resume',
				value: 'resume',
				action: 'Resume a subscription',
				description: 'Resume a paused subscription immediately',
				routing: { request: { method: 'PATCH', url: '=/subscriptions/{{$parameter["subscriptionId"]}}' } },
			},
			{
				name: 'Clear Pending Update',
				value: 'clearPendingUpdate',
				action: 'Clear a pending subscription update',
				description: 'Clear any scheduled change on the subscription',
				routing: { request: { method: 'PATCH', url: '=/subscriptions/{{$parameter["subscriptionId"]}}' } },
			},
		],
		default: 'getAll',
	},
	...subscriptionGetAllDescription,
	...subscriptionGetDescription,
	...subscriptionCreateDescription,
	...subscriptionUpdateDescription,
	...subscriptionUpdateSeatsDescription,
	...subscriptionUpdateBillingPeriodDescription,
	...subscriptionCancelDescription,
	...subscriptionRevokeDescription,
	...subscriptionPauseDescription,
	...subscriptionResumeDescription,
	...subscriptionClearPendingUpdateDescription,
];
```

- [ ] **Step 10: Wire Subscription into `Polar.node.ts`**

1. Add `import { subscriptionDescription } from './resources/subscription';`.
2. Add `{ name: 'Subscription', value: 'subscription' }` to the `Resource` options array.
3. Add `...subscriptionDescription,` to `properties`.

- [ ] **Step 11: Lint and build**

Run: `npm run lint && npm run build`
Expected: both succeed.

- [ ] **Step 12: Manual Sandbox verification**

Set up a free recurring product in Sandbox first. Run `npm run dev`, resource `Subscription`:
1. `Create` with that product and an existing customer ID, execute, note the returned subscription `id` (status should be `active` since it's free).
2. `Get`, confirm match. `Get Many` with `Status` filter `Active`, confirm it appears.
3. `Pause` it, `Get` again and confirm `status` is `paused`; `Resume` it, confirm it's `active` again.
4. `Cancel` with `Cancel at Period End` true, `Get` again and confirm `cancel_at_period_end`/`ends_at` reflect it; `Cancel` again with false to un-cancel.
5. `Revoke` it, then `Get` and confirm `status` is `revoked`/`canceled` and `revoked_at` is set.

- [ ] **Step 13: Commit**

```bash
git add nodes/Polar
git commit -m "feat: add Subscription resource"
```

---

### Task 9: Refund resource

**Files:**
- Create: `nodes/Polar/resources/refund/index.ts`
- Create: `nodes/Polar/resources/refund/getAll.ts`
- Create: `nodes/Polar/resources/refund/create.ts`
- Modify: `nodes/Polar/Polar.node.ts`

**Interfaces:**
- Consumes: `paginationProperties`, `metadataField` (Task 3).
- Produces: `refundDescription: INodeProperties[]`.

- [ ] **Step 1: Write `resources/refund/getAll.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../shared/descriptions';

const show = { resource: ['refund'], operation: ['getAll'] };

export const refundGetAllDescription: INodeProperties[] = [
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
				routing: { request: { qs: { order_id: '={{$value}}' } } },
			},
			{
				displayName: 'Subscription ID',
				name: 'subscription_id',
				type: 'string',
				default: '',
				routing: { request: { qs: { subscription_id: '={{$value}}' } } },
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
				displayName: 'Only Succeeded',
				name: 'succeeded',
				type: 'boolean',
				default: true,
				routing: { request: { qs: { succeeded: '={{$value}}' } } },
			},
		],
	},
];
```

- [ ] **Step 2: Write `resources/refund/create.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { metadataField } from '../../shared/descriptions';

const show = { resource: ['refund'], operation: ['create'] };

export const refundCreateDescription: INodeProperties[] = [
	{
		displayName: 'Order ID',
		name: 'orderId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'order_id' } },
	},
	{
		displayName: 'Reason',
		name: 'reason',
		type: 'options',
		options: [
			{ name: 'Duplicate', value: 'duplicate' },
			{ name: 'Fraudulent', value: 'fraudulent' },
			{ name: 'Customer Request', value: 'customer_request' },
			{ name: 'Service Disruption', value: 'service_disruption' },
			{ name: 'Satisfaction Guarantee', value: 'satisfaction_guarantee' },
			{ name: 'Other', value: 'other' },
		],
		default: 'customer_request',
		required: true,
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'reason' } },
	},
	{
		displayName: 'Amount (Cents)',
		name: 'amount',
		type: 'number',
		typeOptions: { minValue: 1 },
		default: 1,
		required: true,
		displayOptions: { show },
		description: 'Amount to refund in cents. Minimum is 1.',
		routing: { send: { type: 'body', property: 'amount' } },
	},
	metadataField('metadata', 'metadata', 'Metadata', show),
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
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
				displayName: 'Revoke Benefits',
				name: 'revoke_benefits',
				type: 'boolean',
				default: false,
				description: 'Whether this refund should also revoke the customer benefits granted by the order',
				routing: { request: { body: { revoke_benefits: '={{$value}}' } } },
			},
		],
	},
];
```

- [ ] **Step 3: Write `resources/refund/index.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { refundGetAllDescription } from './getAll';
import { refundCreateDescription } from './create';

const showOnlyForRefund = { resource: ['refund'] };

export const refundDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForRefund },
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many refunds',
				description: 'Get many refunds',
				routing: { request: { method: 'GET', url: '=/refunds/' } },
			},
			{
				name: 'Create',
				value: 'create',
				action: 'Create a refund',
				description: 'Refund all or part of an order',
				routing: { request: { method: 'POST', url: '=/refunds/' } },
			},
		],
		default: 'getAll',
	},
	...refundGetAllDescription,
	...refundCreateDescription,
];
```

- [ ] **Step 4: Wire Refund into `Polar.node.ts`**

1. Add `import { refundDescription } from './resources/refund';`.
2. Add `{ name: 'Refund', value: 'refund' }` to the `Resource` options array.
3. Add `...refundDescription,` to `properties`.

- [ ] **Step 5: Lint and build**

Run: `npm run lint && npm run build`
Expected: both succeed.

- [ ] **Step 6: Manual Sandbox verification**

Run `npm run dev`, resource `Refund`, using a paid order ID from Sandbox (e.g. from Task 7's finalized order):
1. `Create` with that order ID, a small `Amount`, reason `Customer Request`, execute, confirm a refund object comes back.
2. `Get Many` filtered by that `Order ID`, confirm the refund appears.

- [ ] **Step 7: Commit**

```bash
git add nodes/Polar
git commit -m "feat: add Refund resource"
```

---

### Task 10: `Polar Trigger` webhook node

**Files:**
- Create: `nodes/PolarTrigger/PolarTrigger.node.ts`
- Create: `nodes/PolarTrigger/PolarTrigger.node.json`
- Modify: `package.json` (`n8n.nodes` — already lists `dist/nodes/PolarTrigger/PolarTrigger.node.js` from Task 1, nothing to change here)

**Interfaces:**
- Produces: `Polar Trigger` node (`name: 'polarTrigger'`), no credential, two node parameters (`events: string[]`, `webhookSecret: string`).

Manual setup only: the user creates the webhook endpoint in the Polar dashboard by hand, pointing it at the URL n8n shows on this node, and pastes the endpoint's signing secret into `Webhook Secret`. Verification implements the [Standard Webhooks](https://github.com/standard-webhooks/standard-webhooks/blob/main/spec/standard-webhooks.md) spec directly against the raw request body (`req.rawBody`, captured by n8n's webhook layer before JSON parsing — re-serializing a parsed body would not byte-match the original signed payload) using Node's built-in `crypto`, mirroring the pattern n8n's own GitHub Trigger node uses for its signature check.

- [ ] **Step 1: Write `nodes/PolarTrigger/PolarTrigger.node.ts`**

```typescript
import { createHmac, timingSafeEqual } from 'crypto';
import {
	NodeConnectionTypes,
	type IDataObject,
	type IHookFunctions,
	type INodeType,
	type INodeTypeDescription,
	type IWebhookFunctions,
	type IWebhookResponseData,
} from 'n8n-workflow';

const POLAR_EVENTS = [
	'checkout.created',
	'checkout.updated',
	'checkout.expired',
	'customer.created',
	'customer.updated',
	'customer.deleted',
	'customer.state_changed',
	'subscription.created',
	'subscription.active',
	'subscription.uncanceled',
	'subscription.cycled',
	'subscription.canceled',
	'subscription.past_due',
	'subscription.updated',
	'subscription.revoked',
	'subscription.paused',
	'subscription.resumed',
	'order.created',
	'order.paid',
	'order.updated',
	'order.refunded',
	'refund.created',
	'refund.updated',
	'benefit_grant.created',
	'benefit_grant.updated',
	'benefit_grant.revoked',
	'benefit.created',
	'benefit.updated',
	'product.created',
	'product.updated',
	'discount.created',
	'discount.updated',
	'discount.deleted',
	'organization.updated',
] as const;

function resolveSigningKey(secret: string): Buffer {
	// Standard Webhooks providers serialize the key as `whsec_<base64>`. Polar does
	// not: its dashboard secret is an arbitrary UTF-8 string used directly as the
	// HMAC key (Polar's SDK base64-encodes it before handing it to a Standard
	// Webhooks verifier, which decodes it straight back) — confirmed against
	// @polar-sh/sdk's `validateEvent`. Only decode base64 for an actual
	// `whsec_`-prefixed secret; otherwise use the raw UTF-8 bytes.
	if (secret.startsWith('whsec_')) {
		return Buffer.from(secret.slice('whsec_'.length), 'base64');
	}
	return Buffer.from(secret, 'utf8');
}

function computeExpectedSignature(secret: string, id: string, timestamp: string, rawBody: string): Buffer {
	const signedContent = `${id}.${timestamp}.${rawBody}`;
	return createHmac('sha256', resolveSigningKey(secret)).update(signedContent, 'utf8').digest();
}

function isValidSignature(signatureHeader: string, expected: Buffer): boolean {
	return signatureHeader
		.split(' ')
		.filter(Boolean)
		.some((entry) => {
			const [, encodedSignature] = entry.split(',');
			if (!encodedSignature) return false;
			let provided: Buffer;
			try {
				provided = Buffer.from(encodedSignature, 'base64');
			} catch {
				return false;
			}
			if (provided.length !== expected.length) return false;
			return timingSafeEqual(provided, expected);
		});
}

export class PolarTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Polar Trigger',
		name: 'polarTrigger',
		icon: { light: 'file:../../icons/polar.svg', dark: 'file:../../icons/polar.dark.svg' },
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["events"].join(", ")}}',
		description: 'Starts the workflow when a Polar.sh webhook event is received',
		defaults: {
			name: 'Polar Trigger',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				required: true,
				default: [],
				options: POLAR_EVENTS.map((event) => ({ name: event, value: event })),
				description: 'Only these event types will trigger the workflow. Create a webhook endpoint for these events in the Polar dashboard, pointed at this node\'s webhook URL.',
			},
			{
				displayName: 'Webhook Secret',
				name: 'webhookSecret',
				type: 'string',
				typeOptions: { password: true },
				required: true,
				default: '',
				description: 'The signing secret shown when you create the webhook endpoint in the Polar dashboard',
			},
		],
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject();
		const headers = this.getHeaderData() as IDataObject;
		const res = this.getResponseObject();

		const webhookId = headers['webhook-id'] as string | undefined;
		const webhookTimestamp = headers['webhook-timestamp'] as string | undefined;
		const webhookSignature = headers['webhook-signature'] as string | undefined;
		const rawBody = (req as unknown as { rawBody?: Buffer }).rawBody;

		if (!webhookId || !webhookTimestamp || !webhookSignature || !rawBody) {
			res.status(400).json({ message: 'Missing Standard Webhooks signature headers or request body' });
			return { noWebhookResponse: true };
		}

		const secret = this.getNodeParameter('webhookSecret') as string;
		if (!secret) {
			res.status(500).json({ message: 'Webhook Secret is not configured on this node' });
			return { noWebhookResponse: true };
		}

		const timestampSeconds = Number(webhookTimestamp);
		const REPLAY_TOLERANCE_SECONDS = 300;
		if (
			!Number.isFinite(timestampSeconds) ||
			Math.abs(Math.floor(Date.now() / 1000) - timestampSeconds) > REPLAY_TOLERANCE_SECONDS
		) {
			res.status(400).json({ message: 'Webhook timestamp is missing, invalid, or outside the allowed tolerance' });
			return { noWebhookResponse: true };
		}

		const bodyString = rawBody.toString('utf8');
		const expected = computeExpectedSignature(secret, webhookId, webhookTimestamp, bodyString);

		if (!isValidSignature(webhookSignature, expected)) {
			res.status(400).json({ message: 'Invalid webhook signature' });
			return { noWebhookResponse: true };
		}

		let payload: { type?: string; data?: IDataObject };
		try {
			payload = JSON.parse(bodyString);
		} catch {
			res.status(400).json({ message: 'Invalid JSON payload' });
			return { noWebhookResponse: true };
		}

		const selectedEvents = this.getNodeParameter('events') as string[];
		if (!payload.type || !selectedEvents.includes(payload.type)) {
			res.status(200).json({ message: 'Event type not selected on this trigger, ignored' });
			return { noWebhookResponse: true };
		}

		return {
			workflowData: [this.helpers.returnJsonArray([payload as unknown as IDataObject])],
		};
	}
}
```

- [ ] **Step 2: Write `nodes/PolarTrigger/PolarTrigger.node.json`**

```json
{
	"node": "n8n-nodes-polar-sh.polarTrigger",
	"nodeVersion": "1.0",
	"codexVersion": "1.0",
	"categories": ["Finance", "Developer Tools"],
	"resources": {
		"primaryDocumentation": [
			{ "url": "https://polar.sh/docs/integrate/webhooks/endpoints" }
		]
	}
}
```

- [ ] **Step 3: Lint and build**

Run: `npm run lint && npm run build`
Expected: both succeed. If the linter flags the `IHookFunctions` import as unused (it isn't referenced in the final code above), remove it from the import list.

- [ ] **Step 4: Manual Sandbox verification**

Run `npm run dev --tunnel` (or run `npm run dev` and separately expose port 5678 with `ngrok http 5678`) so the local n8n instance has a public URL.
1. Add a `Polar Trigger` node to a workflow, select events `checkout.created` and `order.paid`, activate the workflow (or use "Listen for test event"), and copy the shown webhook URL.
2. In the Polar Sandbox dashboard, create a webhook endpoint with that URL, select at least `checkout.created`, and copy the generated secret into the node's `Webhook Secret` field.
3. Trigger a real Sandbox event (e.g. create a checkout via the `Polar` node from Task 4). Confirm the workflow fires with the parsed `{ type, data }` payload.
4. Temporarily paste a wrong `Webhook Secret` and trigger another event — confirm Polar's webhook delivery log shows a failed delivery (400) and the workflow does **not** fire, then restore the correct secret.

- [ ] **Step 5: Commit**

```bash
git add nodes/PolarTrigger
git commit -m "feat: add Polar Trigger webhook node"
```

---

### Task 11: README, full-package verification, and final pass

**Files:**
- Modify: `README.md`
- Delete: `README_TEMPLATE.md`

**Interfaces:**
- Produces: user-facing documentation covering installation, credential setup, the full Lot 1a operation list, and step-by-step local testing before pushing — this is the deliverable the original request asked for ("me dire comment tester mon plugin n8n en local avant de push").

- [ ] **Step 1: Replace `README.md`**

```markdown
![Banner image](./assets/Polar_Flow_03.webp)

# n8n-nodes-polar-sh

This is an n8n community node package. It lets you manage [Polar.sh](https://polar.sh) — checkouts, checkout links, customers, orders, subscriptions, and refunds — directly from n8n workflows, and react to Polar webhook events with a dedicated trigger node.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)
[Nodes](#nodes)
[Credentials](#credentials)
[Local development & testing](#local-development--testing)
[Compatibility](#compatibility)
[Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation, and install `n8n-nodes-polar-sh`.

## Nodes

### Polar

Resource + Operation node covering:

- **Checkout** — Get Many, Get, Create, Update
- **Checkout Link** — Get Many, Get, Create, Update, Delete
- **Customer** — Get Many, Get, Get by External ID, Create, Update, Update by External ID, Delete, Delete by External ID, Get State, Get State by External ID, Get Payment Methods
- **Order** — Get Many, Get, Create, Update, Finalize, Generate Invoice, Get Invoice, Get Receipt
- **Subscription** — Get Many, Get, Create, Update, Update Seats, Update Billing Period, Cancel, Revoke, Pause, Resume, Clear Pending Update
- **Refund** — Get Many, Create

Product, Discount, Benefit, and Benefit Grant resources ship in a follow-up release.

### Polar Trigger

A webhook trigger node for Polar's ~30 event types (`checkout.*`, `customer.*`, `subscription.*`, `order.*`, `refund.*`, `benefit_grant.*`, `benefit.*`, `product.*`, `discount.*`, `organization.updated`). You create the webhook endpoint by hand in the Polar dashboard, pointing it at this node's webhook URL, and paste the generated signing secret into the node. Signatures are verified against the [Standard Webhooks](https://www.standardwebhooks.com/) spec.

## Credentials

This node uses a **Polar API** credential:

1. In Polar, go to your organization's **Settings → API Keys** (or the Sandbox equivalent at [sandbox.polar.sh](https://sandbox.polar.sh) for testing) and create an **Organization Access Token**.
2. In n8n, create a new `Polar API` credential, choose **Environment** (`Production` or `Sandbox`), and paste the token into **Access Token**.

## Local development & testing

1. Clone the repo and install dependencies:

   ```bash
   npm install
   ```

2. Start n8n with the node loaded and hot-reloading:

   ```bash
   npm run dev
   ```

   This opens n8n at `http://localhost:5678`.

3. Create a **Polar API** credential using a **Sandbox** organization access token (sign up/create a sandbox org at [sandbox.polar.sh](https://sandbox.polar.sh) — it's a fully separate environment from production, safe to test destructive operations against).

4. Exercise every `Polar` node operation against Sandbox data before pushing — each task in the implementation plan (`docs/superpowers/plans/2026-08-18-polar-node-lot1a-foundation.md`) lists the specific operations to click through for that resource.

5. To test the **Polar Trigger** node, `npm run dev` only serves n8n on `localhost`, which Polar's servers can't reach. Expose it publicly first, then register a Sandbox webhook endpoint against the tunnel URL:

   ```bash
   npm run dev -- --tunnel
   ```

   (or run `npm run dev` in one terminal and `ngrok http 5678` in another, and use the `ngrok` URL). Copy the webhook URL n8n shows on the `Polar Trigger` node, create a matching endpoint in the Sandbox dashboard's **Webhooks** settings, select the events you want to test, and paste the generated secret into the node's `Webhook Secret` field. Trigger a real Sandbox event (e.g. run the `Polar` node's Checkout → Create) and confirm the workflow fires.

6. Before pushing, both of these must pass:

   ```bash
   npm run lint
   npm run build
   ```

## Compatibility

Requires n8n with the community nodes API version 1 (`n8nNodesApiVersion: 1`). Built and tested against Node.js v22+.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [Polar API reference](https://polar.sh/docs/api-reference/introduction)
- [Polar webhook events](https://polar.sh/docs/integrate/webhooks/events)
```

- [ ] **Step 2: Delete the now-unused template**

```bash
git rm README_TEMPLATE.md
```

- [ ] **Step 3: Full-package verification**

Run, in order:

```bash
npm run lint
npm run build
npm run dev
```

In the running n8n instance, confirm:
- Adding a `Polar` node shows all six resources (Checkout, Checkout Link, Customer, Order, Subscription, Refund) in the `Resource` dropdown, each with its full Operation list from the table in `README.md`.
- Adding a `Polar Trigger` node shows the `Events` multi-select and `Webhook Secret` field.
- Re-run the Task 4–10 manual verification checklists end-to-end once, back to back, against the same Sandbox organization, to catch any cross-resource regression (e.g. a shared `descriptions.ts` helper edited by a later task breaking an earlier resource).

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: document Polar node coverage, credential setup, and local testing"
```

---

## Definition of Done

- [ ] `npm run lint` and `npm run build` succeed with no errors.
- [ ] The `Polar` node exposes all 6 resources / ~43 operations listed in this plan's File Structure and README, each manually verified against a Polar Sandbox organization per its task's Step "Manual Sandbox verification".
- [ ] The `Polar Trigger` node receives, verifies, and correctly filters a real Sandbox webhook delivery.
- [ ] `README.md` documents installation, credential setup, and the local `npm run dev` + Sandbox testing flow.
- [ ] No new runtime npm dependency was added.

