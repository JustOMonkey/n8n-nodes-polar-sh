# Polar Node — Lot 1b: Catalog Resources — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the already-shipped `Polar` node (Lot 1a: Checkout, Checkout Link, Customer, Order, Subscription, Refund) with the four remaining Lot-1 resources: Benefit, Benefit Grant, Product, and Discount — the resources with polymorphic (2-to-8-way discriminated) request bodies that were deliberately deferred out of Lot 1a.

**Architecture:** Same declarative-routing pattern as Lot 1a, reusing its shared helpers (`nodes/Polar/shared/{descriptions,transport,utils}.ts`) and its `Polar.node.ts` Resource/Operation dropdown. Each polymorphic Create/Update body is modeled as a single `fixedCollection` field with one named group per discriminator variant (`typeOptions.multipleValues: true`), NOT as several sibling fields that would each try to write the same body property (multiple properties targeting the same `routing.send.property` risk silently overwriting each other — a single field with named groups avoids that entirely). A local, file-scoped combiner function (serialized via `.toString()` into the routing expression, the same proven technique `paginationProperties` already uses for `nextPageInfo` in Lot 1a) flattens the grouped value into the flat array/object Polar's API expects.

**Tech Stack:** TypeScript, `n8n-workflow` types, `@n8n/node-cli`. No test framework (see Global Constraints).

**Spec:** `docs/superpowers/specs/2026-08-18-polar-node-lot1-design.md` (§5.1 resource/operation map; this plan's field-level detail is new, grounded directly in Polar's OpenAPI spec, not restated in the spec doc).

## Global Constraints

- No new runtime npm dependencies.
- All field names/types/required-flags below are taken verbatim from Polar's live OpenAPI spec (`https://polar.sh/docs/openapi.json`, re-checked 2026-08-18 for this plan) — do not guess.
- `organization_id` is omitted from every Create body where the API lists it as optional (Organization Access Tokens are already scoped to one org) — same rule as Lot 1a.
- Money fields are integer minor units (cents), except `ProductPriceMeteredUnitCreate.unit_amount` which Polar types as `number | string` to support up to 12 decimal places — model that one field as a `string` (not `number`) to avoid floating-point precision loss, and pass it through unmodified.
- Fields referencing resources not yet built (Meters, Files, Slack integrations — all Lot 2 or out of scope) are plain string/UUID fields, not resource-locators — there is no resource to search against.
- No test framework exists in this repo — `npm run lint` + `npm run build` are the correctness gates, plus manual Sandbox verification via `npm run dev` (each task lists concrete steps; skip and defer this step's specifics if no Sandbox environment is available when the task runs, same as every Lot 1a task).
- Follow the existing `nodes/Polar/resources/*` file layout and code style exactly (one file per operation, `index.ts` assembling the Operation dropdown, shared helpers from `shared/descriptions.ts`).
- Known lint patterns already discovered in Lot 1a — apply proactively without asking:
  1. `collection`/`options`/`multiOptions` arrays with 5+ items must be alphabetically sorted by `displayName`/`name` (non-autofixable ESLint rule).
  2. Fields literally named `email` need a `placeholder` (not expected to recur in this plan — no email fields here).
  3. Dynamic `multiOptions` fields backed by a `loadOptionsMethod` need n8n's naming convention (name ends "Names or IDs", description mentions "Choose from the list, or specify IDs using an expression").
  4. `INodeListSearchResult.paginationToken` must be typed `string`, not `number`.
  5. Boolean field `description`s must start with "Whether" (`n8n-nodes-base/node-param-description-boolean-without-whether`).
  6. `IDisplayOptions`-typed `show` parameters must actually be typed as the show-condition map, not the full `{show,hide,...}` wrapper (only relevant if adding a new shared helper — none of this plan's tasks add one).
  7. Any routing `value` expression for an OPTIONAL field must guard against the field's untouched default (`|| undefined` for scalars, `Object.keys($value).length ? $value : undefined` for objects) — a real Critical bug class found in Lot 1a's final review; every field below that isn't required already carries this guard in its code sample, don't drop it during implementation.

---

## File Structure

```
nodes/Polar/
  listSearch/
    getBenefits.ts
  loadOptions/
    getBenefitOptions.ts
  resources/
    benefit/
      index.ts
      getAll.ts
      get.ts
      create.ts
      update.ts
      delete.ts
      getGrants.ts
    benefitGrant/
      index.ts
      getAll.ts
    product/
      index.ts
      getAll.ts
      get.ts
      create.ts
      update.ts
      updateBenefits.ts
    discount/
      index.ts
      getAll.ts
      get.ts
      create.ts
      update.ts
      delete.ts
  Polar.node.ts (modified incrementally, once per task)

README.md (modified in the final task)
```

---

### Task 1: Benefit + Benefit Grant resources

**Files:**
- Create: `nodes/Polar/listSearch/getBenefits.ts`
- Create: `nodes/Polar/loadOptions/getBenefitOptions.ts`
- Create: `nodes/Polar/resources/benefit/index.ts`
- Create: `nodes/Polar/resources/benefit/getAll.ts`
- Create: `nodes/Polar/resources/benefit/get.ts`
- Create: `nodes/Polar/resources/benefit/create.ts`
- Create: `nodes/Polar/resources/benefit/update.ts`
- Create: `nodes/Polar/resources/benefit/delete.ts`
- Create: `nodes/Polar/resources/benefit/getGrants.ts`
- Create: `nodes/Polar/resources/benefitGrant/index.ts`
- Create: `nodes/Polar/resources/benefitGrant/getAll.ts`
- Modify: `nodes/Polar/Polar.node.ts`

**Interfaces:**
- Consumes: `paginationProperties`, `metadataField` (from `shared/descriptions.ts`, already in the repo); `polarApiRequest` (from `shared/transport.ts`).
- Produces: `getBenefits` (listSearch, same signature shape as Lot 1a's `getCustomers`/`getProducts`), `getBenefitOptions` (loadOptions, same shape as `getProductOptions`) — consumed by Task 2 (Product's "Update Benefits" operation). `benefitDescription`, `benefitGrantDescription: INodeProperties[]`.

`POST`/`PATCH /v1/benefits/{id}` are each 8-way discriminated unions (by `type`: `custom`, `discord`, `github_repository`, `downloadables`, `license_keys`, `meter_credit`, `feature_flag`, `slack_shared_channel`). Modeled as one "Benefit Type" `options` selector plus 8 type-scoped field blocks shown/hidden by it, matching this plan's Architecture section.

- [ ] **Step 1: Write `listSearch/getBenefits.ts`**

```typescript
import type { ILoadOptionsFunctions, INodeListSearchItems, INodeListSearchResult } from 'n8n-workflow';
import { polarApiRequest } from '../shared/transport';

type BenefitItem = { id: string; description: string };
type BenefitListResponse = { items: BenefitItem[]; pagination: { total_count: number; max_page: number } };

export async function getBenefits(
	this: ILoadOptionsFunctions,
	filter?: string,
	paginationToken?: string,
): Promise<INodeListSearchResult> {
	const page = paginationToken ? +paginationToken : 1;
	const responseData: BenefitListResponse = await polarApiRequest.call(this, 'GET', '/benefits/', {
		query: filter,
		page,
		limit: 50,
	});

	const results: INodeListSearchItems[] = responseData.items.map((item) => ({
		name: item.description,
		value: item.id,
	}));

	const nextPaginationToken = page < responseData.pagination.max_page ? String(page + 1) : undefined;
	return { results, paginationToken: nextPaginationToken };
}
```

- [ ] **Step 2: Write `loadOptions/getBenefitOptions.ts`**

```typescript
import type { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import { polarApiRequest } from '../shared/transport';

type BenefitItem = { id: string; description: string };
type BenefitListResponse = { items: BenefitItem[] };

export async function getBenefitOptions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const responseData: BenefitListResponse = await polarApiRequest.call(this, 'GET', '/benefits/', {
		limit: 100,
	});

	return responseData.items.map((item) => ({ name: item.description, value: item.id }));
}
```

- [ ] **Step 3: Write `resources/benefit/getAll.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../shared/descriptions';

const show = { resource: ['benefit'], operation: ['getAll'] };

export const benefitGetAllDescription: INodeProperties[] = [
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
				description: 'Search by benefit description',
				routing: { request: { qs: { query: '={{$value}}' } } },
			},
			{
				displayName: 'Type',
				name: 'type',
				type: 'options',
				options: [
					{ name: 'Custom', value: 'custom' },
					{ name: 'Discord', value: 'discord' },
					{ name: 'Downloadables', value: 'downloadables' },
					{ name: 'Feature Flag', value: 'feature_flag' },
					{ name: 'GitHub Repository', value: 'github_repository' },
					{ name: 'License Keys', value: 'license_keys' },
					{ name: 'Meter Credit', value: 'meter_credit' },
					{ name: 'Slack Shared Channel', value: 'slack_shared_channel' },
				],
				default: 'custom',
				routing: { request: { qs: { type: '={{$value}}' } } },
			},
		],
	},
];
```

- [ ] **Step 4: Write `resources/benefit/get.ts` and `delete.ts`**

`get.ts`:

```typescript
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['benefit'], operation: ['get'] };

export const benefitGetDescription: INodeProperties[] = [
	{
		displayName: 'Benefit ID',
		name: 'benefitId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
];
```

`delete.ts`:

```typescript
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['benefit'], operation: ['delete'] };

export const benefitDeleteDescription: INodeProperties[] = [
	{
		displayName: 'Benefit ID',
		name: 'benefitId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
];
```

- [ ] **Step 5: Write `resources/benefit/getGrants.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['benefit'], operation: ['getGrants'] };

export const benefitGetGrantsDescription: INodeProperties[] = [
	{
		displayName: 'Benefit ID',
		name: 'benefitId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: { show },
		description: 'Whether to return all results or only up to a given limit',
		routing: { send: { paginate: '={{$value}}' } },
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 50,
		typeOptions: { minValue: 1, maxValue: 100 },
		displayOptions: { show: { ...show, returnAll: [false] } },
		routing: { send: { type: 'query', property: 'limit' } },
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
				displayName: 'Only Granted',
				name: 'is_granted',
				type: 'boolean',
				default: true,
				description: 'Whether to only return grants that are still active (not revoked)',
				routing: { request: { qs: { is_granted: '={{$value}}' } } },
			},
			{
				displayName: 'Customer ID',
				name: 'customer_id',
				type: 'string',
				default: '',
				routing: { request: { qs: { customer_id: '={{$value}}' } } },
			},
			{
				displayName: 'Member ID',
				name: 'member_id',
				type: 'string',
				default: '',
				routing: { request: { qs: { member_id: '={{$value}}' } } },
			},
		],
	},
];
```

(This endpoint's own pagination has no `pagination.max_page` in its response — unlike every other list endpoint in this package, `GET /v1/benefits/{id}/grants` returns a plain array-style page without a `pagination` object, per the OpenAPI spec — so `paginationProperties`'s auto-pagination helper, which reads `$response.body.pagination.max_page`, is NOT reused here. `Return All` is provided as a simple `paginate` flag without the `operations.pagination` block; if the user enables it, n8n's declarative router paginates using the generic `hasMore`-less fallback of a single page, since there's no page-count endpoint to loop against. Document this in the field description if the implementer judges the UX unclear — do not add a custom pagination loop for this one endpoint, it's a minor/edge case for a rarely-paginated result set.)

- [ ] **Step 6: Write `resources/benefit/create.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { metadataField } from '../../shared/descriptions';

const show = { resource: ['benefit'], operation: ['create'] };
const showCustom = { ...show, benefitType: ['custom'] };
const showDiscord = { ...show, benefitType: ['discord'] };
const showGitHub = { ...show, benefitType: ['github_repository'] };
const showDownloadables = { ...show, benefitType: ['downloadables'] };
const showLicenseKeys = { ...show, benefitType: ['license_keys'] };
const showMeterCredit = { ...show, benefitType: ['meter_credit'] };
const showSlack = { ...show, benefitType: ['slack_shared_channel'] };
// 'feature_flag' has no type-specific fields at all — the API's properties object is empty for it.

export const benefitCreateDescription: INodeProperties[] = [
	{
		displayName: 'Benefit Type',
		name: 'benefitType',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show },
		options: [
			{ name: 'Custom', value: 'custom', description: 'A generic benefit with a private note for the customer' },
			{ name: 'Discord', value: 'discord', description: 'Grants a role in a Discord server' },
			{ name: 'Downloadables', value: 'downloadables', description: 'Grants access to downloadable files' },
			{ name: 'Feature Flag', value: 'feature_flag', description: 'A simple on/off entitlement flag' },
			{ name: 'GitHub Repository', value: 'github_repository', description: 'Grants access to a GitHub repository' },
			{ name: 'License Keys', value: 'license_keys', description: 'Issues a license key' },
			{ name: 'Meter Credit', value: 'meter_credit', description: 'Credits usage-based meter units' },
			{ name: 'Slack Shared Channel', value: 'slack_shared_channel', description: 'Grants access to a Slack Connect shared channel' },
		],
		default: 'custom',
		routing: { send: { type: 'body', property: 'type' } },
	},
	{
		displayName: 'Description',
		name: 'description',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'Displayed on products having this benefit',
		routing: { send: { type: 'body', property: 'description' } },
	},
	{
		displayName: 'Visibility',
		name: 'visibility',
		type: 'options',
		options: [
			{ name: 'Draft', value: 'draft' },
			{ name: 'Private', value: 'private' },
			{ name: 'Public', value: 'public' },
		],
		default: 'public',
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'visibility' } },
	},
	metadataField('metadata', 'metadata', 'Metadata', show),
	{
		displayName: 'Note',
		name: 'note',
		type: 'string',
		typeOptions: { rows: 3 },
		default: '',
		displayOptions: { show: showCustom },
		description: 'Private note shared with customers who have this benefit granted',
		routing: {
			send: { type: 'body', property: 'properties', value: '={{ { note: $value || null } }}' },
		},
	},
	{
		displayName: 'Discord Guild Token',
		name: 'guildToken',
		type: 'string',
		typeOptions: { password: true },
		default: '',
		required: true,
		displayOptions: { show: showDiscord },
		description: "The Discord server's bot/integration token used to manage role grants",
	},
	{
		displayName: 'Discord Role ID',
		name: 'roleId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: showDiscord },
		description: 'The ID of the Discord role to grant',
	},
	{
		displayName: 'Kick Member on Revocation',
		name: 'kickMember',
		type: 'boolean',
		default: false,
		required: true,
		displayOptions: { show: showDiscord },
		description: 'Whether to kick the member from the Discord server when this benefit is revoked',
		routing: {
			send: {
				type: 'body',
				property: 'properties',
				value: '={{ { guild_token: $parameter["guildToken"], role_id: $parameter["roleId"], kick_member: $value } }}',
			},
		},
	},
	{
		displayName: 'Repository Owner',
		name: 'repositoryOwner',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: showGitHub },
	},
	{
		displayName: 'Repository Name',
		name: 'repositoryName',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: showGitHub },
	},
	{
		displayName: 'Permission',
		name: 'permission',
		type: 'options',
		options: [
			{ name: 'Pull', value: 'pull' },
			{ name: 'Triage', value: 'triage' },
			{ name: 'Push', value: 'push' },
			{ name: 'Maintain', value: 'maintain' },
			{ name: 'Admin', value: 'admin' },
		],
		default: 'pull',
		required: true,
		displayOptions: { show: showGitHub },
		routing: {
			send: {
				type: 'body',
				property: 'properties',
				value:
					'={{ { repository_owner: $parameter["repositoryOwner"], repository_name: $parameter["repositoryName"], permission: $value } }}',
			},
		},
	},
	{
		displayName: 'File IDs',
		name: 'fileIds',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true, multipleValueButtonText: 'Add File ID' },
		default: {},
		displayOptions: { show: showDownloadables },
		description: 'IDs of previously-uploaded Polar files to grant access to (at least one required)',
		options: [
			{
				displayName: 'File',
				name: 'file',
				values: [{ displayName: 'File ID', name: 'id', type: 'string', default: '' }],
			},
		],
		routing: {
			send: {
				type: 'body',
				property: 'properties',
				value: '={{ { files: ($value.file || []).map((f) => f.id) } }}',
			},
		},
	},
	{
		displayName: 'License Key Fields',
		name: 'licenseKeyFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: showLicenseKeys },
		options: [
			{ displayName: 'Key Prefix', name: 'prefix', type: 'string', default: '' },
			{
				displayName: 'Expires After (TTL)',
				name: 'expires_ttl',
				type: 'number',
				default: 1,
			},
			{
				displayName: 'Expiration Timeframe',
				name: 'expires_timeframe',
				type: 'options',
				options: [
					{ name: 'Day', value: 'day' },
					{ name: 'Month', value: 'month' },
					{ name: 'Year', value: 'year' },
				],
				default: 'year',
			},
			{
				displayName: 'Activation Limit',
				name: 'activations_limit',
				type: 'number',
				default: 1,
			},
			{
				displayName: 'Customer Can Manage Activations',
				name: 'activations_enable_customer_admin',
				type: 'boolean',
				default: false,
				description: 'Whether the customer can view/deactivate their own activations from the customer portal',
			},
			{
				displayName: 'Usage Limit',
				name: 'limit_usage',
				type: 'number',
				default: 1,
			},
		],
		routing: {
			send: {
				type: 'body',
				property: 'properties',
				value: `={{ (() => {
					const v = $value;
					const properties = {};
					if (v.prefix) properties.prefix = v.prefix;
					if (v.expires_ttl && v.expires_timeframe) {
						properties.expires = { ttl: v.expires_ttl, timeframe: v.expires_timeframe };
					}
					if (v.activations_limit) {
						properties.activations = {
							limit: v.activations_limit,
							enable_customer_admin: !!v.activations_enable_customer_admin,
						};
					}
					if (v.limit_usage) properties.limit_usage = v.limit_usage;
					return properties;
				})() }}`,
			},
		},
	},
	{
		displayName: 'Units',
		name: 'meterUnits',
		type: 'number',
		default: 0,
		required: true,
		displayOptions: { show: showMeterCredit },
		description: 'Number of meter units to credit',
	},
	{
		displayName: 'Rollover',
		name: 'meterRollover',
		type: 'boolean',
		default: false,
		required: true,
		displayOptions: { show: showMeterCredit },
		description: "Whether unused credited units roll over to the customer's next billing period",
	},
	{
		displayName: 'Meter ID',
		name: 'meterId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: showMeterCredit },
		routing: {
			send: {
				type: 'body',
				property: 'properties',
				value:
					'={{ { units: $parameter["meterUnits"], rollover: $parameter["meterRollover"], meter_id: $value } }}',
			},
		},
	},
	{
		displayName: 'Slack Integration ID',
		name: 'slackIntegrationId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: showSlack },
		description: 'The Polar Slack integration to use for this benefit',
	},
	{
		displayName: 'Channel Name Template',
		name: 'channelNameTemplate',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: showSlack },
	},
	{
		displayName: 'Slack Channel Additional Fields',
		name: 'slackAdditionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: showSlack },
		options: [
			{ displayName: 'Private Channel', name: 'private', type: 'boolean', default: false },
			{ displayName: 'Welcome Message', name: 'welcome_message', type: 'string', default: '' },
			{ displayName: 'Archive Channel on Revoke', name: 'archive_on_revoke', type: 'boolean', default: true },
			{
				displayName: 'Team Invitees',
				name: 'team_invitees',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true, multipleValueButtonText: 'Add Invitee' },
				default: {},
				options: [
					{
						displayName: 'Invitee',
						name: 'invitee',
						values: [{ displayName: 'Team Member Email or ID', name: 'value', type: 'string', default: '' }],
					},
				],
			},
		],
		routing: {
			send: {
				type: 'body',
				property: 'properties',
				value: `={{ (() => {
					const v = $value;
					const properties = {
						slack_integration_id: $parameter["slackIntegrationId"],
						channel_name_template: $parameter["channelNameTemplate"],
					};
					if (v.private !== undefined) properties.private = v.private;
					if (v.welcome_message) properties.welcome_message = v.welcome_message;
					if (v.archive_on_revoke !== undefined) properties.archive_on_revoke = v.archive_on_revoke;
					if (v.team_invitees && v.team_invitees.invitee && v.team_invitees.invitee.length) {
						properties.team_invitees = v.team_invitees.invitee.map((i) => i.value);
					}
					return properties;
				})() }}`,
			},
		},
	},
];
```

(Note the pattern used above for multi-field types like Discord/GitHub/Meter Credit: only the LAST field of each group carries the `routing.send` that assembles the whole `properties` object via `$parameter["..."]` lookups on its sibling fields — the earlier fields in the same group have no `routing` block of their own, they just hold their value for the last field to read. This avoids two fields both writing to `properties` and colliding, the same class of bug the combiner-function pattern avoids for the "Prices" field in Task 2.)

- [ ] **Step 7: Write `resources/benefit/update.ts`**

Same structure as `create.ts`, minus `organization_id` (never present) and using each type's `*Update` shape instead of `*Create` (no `guild_token` on Discord Update — Polar's `BenefitDiscordUpdate` still requires it since Discord role management always needs the token; License Keys Update drops nothing; Downloadables Update is identical). Build it by copying `create.ts`'s structure with these changes:

- Drop the top-level `Benefit Type` selector's requirement to also send `visibility` for `discord`, `github_repository`, and `slack_shared_channel` types — per the spec, `BenefitDiscordUpdate`/`BenefitGitHubRepositoryUpdate`/`BenefitSlackSharedChannelUpdate` do NOT have a `visibility` field (only `custom`, `downloadables`, `license_keys`, `meter_credit`, `feature_flag` update variants do). Guard the shared `Visibility` field's `displayOptions.show` to only those five benefit types: `{ resource: ['benefit'], operation: ['update'], benefitType: ['custom', 'downloadables', 'license_keys', 'meter_credit', 'feature_flag'] }`.
- Add a required `Benefit ID` field (string) at the top, same pattern as `get.ts`.
- Change every field's `show` object's `operation` from `['create']` to `['update']`.
- All `properties`-assembling routing expressions are unchanged (the shapes are the same as Create for every type in this list).

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { metadataField } from '../../shared/descriptions';

const show = { resource: ['benefit'], operation: ['update'] };
const showVisibility = { ...show, benefitType: ['custom', 'downloadables', 'license_keys', 'meter_credit', 'feature_flag'] };
const showCustom = { ...show, benefitType: ['custom'] };
const showDiscord = { ...show, benefitType: ['discord'] };
const showGitHub = { ...show, benefitType: ['github_repository'] };
const showDownloadables = { ...show, benefitType: ['downloadables'] };
const showLicenseKeys = { ...show, benefitType: ['license_keys'] };
const showMeterCredit = { ...show, benefitType: ['meter_credit'] };
const showSlack = { ...show, benefitType: ['slack_shared_channel'] };

export const benefitUpdateDescription: INodeProperties[] = [
	{
		displayName: 'Benefit ID',
		name: 'benefitId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
	{
		displayName: 'Benefit Type',
		name: 'benefitType',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show },
		description: 'Must match the benefit\'s existing type — Polar does not support changing a benefit\'s type after creation',
		options: [
			{ name: 'Custom', value: 'custom' },
			{ name: 'Discord', value: 'discord' },
			{ name: 'Downloadables', value: 'downloadables' },
			{ name: 'Feature Flag', value: 'feature_flag' },
			{ name: 'GitHub Repository', value: 'github_repository' },
			{ name: 'License Keys', value: 'license_keys' },
			{ name: 'Meter Credit', value: 'meter_credit' },
			{ name: 'Slack Shared Channel', value: 'slack_shared_channel' },
		],
		default: 'custom',
		routing: { send: { type: 'body', property: 'type' } },
	},
	{
		displayName: 'Description',
		name: 'description',
		type: 'string',
		default: '',
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'description', value: '={{$value || undefined}}' } },
	},
	{
		displayName: 'Visibility',
		name: 'visibility',
		type: 'options',
		options: [
			{ name: 'Draft', value: 'draft' },
			{ name: 'Private', value: 'private' },
			{ name: 'Public', value: 'public' },
		],
		default: 'public',
		displayOptions: { show: showVisibility },
		routing: { send: { type: 'body', property: 'visibility' } },
	},
	metadataField('metadata', 'metadata', 'Metadata', show),
	{
		displayName: 'Note',
		name: 'note',
		type: 'string',
		typeOptions: { rows: 3 },
		default: '',
		required: true,
		displayOptions: { show: showCustom },
		routing: { send: { type: 'body', property: 'properties', value: '={{ { note: $value || null } }}' } },
	},
	{
		displayName: 'Discord Guild Token',
		name: 'guildToken',
		type: 'string',
		typeOptions: { password: true },
		default: '',
		required: true,
		displayOptions: { show: showDiscord },
	},
	{
		displayName: 'Discord Role ID',
		name: 'roleId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: showDiscord },
	},
	{
		displayName: 'Kick Member on Revocation',
		name: 'kickMember',
		type: 'boolean',
		default: false,
		required: true,
		displayOptions: { show: showDiscord },
		description: 'Whether to kick the member from the Discord server when this benefit is revoked',
		routing: {
			send: {
				type: 'body',
				property: 'properties',
				value: '={{ { guild_token: $parameter["guildToken"], role_id: $parameter["roleId"], kick_member: $value } }}',
			},
		},
	},
	{
		displayName: 'Repository Owner',
		name: 'repositoryOwner',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: showGitHub },
	},
	{
		displayName: 'Repository Name',
		name: 'repositoryName',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: showGitHub },
	},
	{
		displayName: 'Permission',
		name: 'permission',
		type: 'options',
		options: [
			{ name: 'Pull', value: 'pull' },
			{ name: 'Triage', value: 'triage' },
			{ name: 'Push', value: 'push' },
			{ name: 'Maintain', value: 'maintain' },
			{ name: 'Admin', value: 'admin' },
		],
		default: 'pull',
		required: true,
		displayOptions: { show: showGitHub },
		routing: {
			send: {
				type: 'body',
				property: 'properties',
				value:
					'={{ { repository_owner: $parameter["repositoryOwner"], repository_name: $parameter["repositoryName"], permission: $value } }}',
			},
		},
	},
	{
		displayName: 'File IDs',
		name: 'fileIds',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true, multipleValueButtonText: 'Add File ID' },
		default: {},
		displayOptions: { show: showDownloadables },
		description: 'IDs of previously-uploaded Polar files to grant access to (at least one required)',
		options: [
			{
				displayName: 'File',
				name: 'file',
				values: [{ displayName: 'File ID', name: 'id', type: 'string', default: '' }],
			},
		],
		routing: {
			send: {
				type: 'body',
				property: 'properties',
				value: '={{ { files: ($value.file || []).map((f) => f.id) } }}',
			},
		},
	},
	{
		displayName: 'License Key Fields',
		name: 'licenseKeyFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: showLicenseKeys },
		options: [
			{ displayName: 'Key Prefix', name: 'prefix', type: 'string', default: '' },
			{ displayName: 'Expires After (TTL)', name: 'expires_ttl', type: 'number', default: 1 },
			{
				displayName: 'Expiration Timeframe',
				name: 'expires_timeframe',
				type: 'options',
				options: [
					{ name: 'Day', value: 'day' },
					{ name: 'Month', value: 'month' },
					{ name: 'Year', value: 'year' },
				],
				default: 'year',
			},
			{ displayName: 'Activation Limit', name: 'activations_limit', type: 'number', default: 1 },
			{
				displayName: 'Customer Can Manage Activations',
				name: 'activations_enable_customer_admin',
				type: 'boolean',
				default: false,
				description: 'Whether the customer can view/deactivate their own activations from the customer portal',
			},
			{ displayName: 'Usage Limit', name: 'limit_usage', type: 'number', default: 1 },
		],
		routing: {
			send: {
				type: 'body',
				property: 'properties',
				value: `={{ (() => {
					const v = $value;
					const properties = {};
					if (v.prefix) properties.prefix = v.prefix;
					if (v.expires_ttl && v.expires_timeframe) {
						properties.expires = { ttl: v.expires_ttl, timeframe: v.expires_timeframe };
					}
					if (v.activations_limit) {
						properties.activations = {
							limit: v.activations_limit,
							enable_customer_admin: !!v.activations_enable_customer_admin,
						};
					}
					if (v.limit_usage) properties.limit_usage = v.limit_usage;
					return properties;
				})() }}`,
			},
		},
	},
	{
		displayName: 'Units',
		name: 'meterUnits',
		type: 'number',
		default: 0,
		required: true,
		displayOptions: { show: showMeterCredit },
	},
	{
		displayName: 'Rollover',
		name: 'meterRollover',
		type: 'boolean',
		default: false,
		required: true,
		displayOptions: { show: showMeterCredit },
		description: "Whether unused credited units roll over to the customer's next billing period",
	},
	{
		displayName: 'Meter ID',
		name: 'meterId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: showMeterCredit },
		routing: {
			send: {
				type: 'body',
				property: 'properties',
				value:
					'={{ { units: $parameter["meterUnits"], rollover: $parameter["meterRollover"], meter_id: $value } }}',
			},
		},
	},
	{
		displayName: 'Slack Integration ID',
		name: 'slackIntegrationId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: showSlack },
	},
	{
		displayName: 'Channel Name Template',
		name: 'channelNameTemplate',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: showSlack },
	},
	{
		displayName: 'Slack Channel Additional Fields',
		name: 'slackAdditionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: showSlack },
		options: [
			{ displayName: 'Private Channel', name: 'private', type: 'boolean', default: false },
			{ displayName: 'Welcome Message', name: 'welcome_message', type: 'string', default: '' },
			{ displayName: 'Archive Channel on Revoke', name: 'archive_on_revoke', type: 'boolean', default: true },
			{
				displayName: 'Team Invitees',
				name: 'team_invitees',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true, multipleValueButtonText: 'Add Invitee' },
				default: {},
				options: [
					{
						displayName: 'Invitee',
						name: 'invitee',
						values: [{ displayName: 'Team Member Email or ID', name: 'value', type: 'string', default: '' }],
					},
				],
			},
		],
		routing: {
			send: {
				type: 'body',
				property: 'properties',
				value: `={{ (() => {
					const v = $value;
					const properties = {
						slack_integration_id: $parameter["slackIntegrationId"],
						channel_name_template: $parameter["channelNameTemplate"],
					};
					if (v.private !== undefined) properties.private = v.private;
					if (v.welcome_message) properties.welcome_message = v.welcome_message;
					if (v.archive_on_revoke !== undefined) properties.archive_on_revoke = v.archive_on_revoke;
					if (v.team_invitees && v.team_invitees.invitee && v.team_invitees.invitee.length) {
						properties.team_invitees = v.team_invitees.invitee.map((i) => i.value);
					}
					return properties;
				})() }}`,
			},
		},
	},
];
```

- [ ] **Step 8: Write `resources/benefit/index.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { benefitGetAllDescription } from './getAll';
import { benefitGetDescription } from './get';
import { benefitCreateDescription } from './create';
import { benefitUpdateDescription } from './update';
import { benefitDeleteDescription } from './delete';
import { benefitGetGrantsDescription } from './getGrants';

const showOnlyForBenefit = { resource: ['benefit'] };

export const benefitDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForBenefit },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a benefit',
				description: 'Create a new benefit',
				routing: { request: { method: 'POST', url: '=/benefits/' } },
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a benefit',
				description: 'Delete a benefit',
				routing: { request: { method: 'DELETE', url: '=/benefits/{{$parameter["benefitId"]}}' } },
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a benefit',
				description: 'Get a single benefit by ID',
				routing: { request: { method: 'GET', url: '=/benefits/{{$parameter["benefitId"]}}' } },
			},
			{
				name: 'Get Grants',
				value: 'getGrants',
				action: 'Get benefit grants',
				description: 'List the grants of a benefit across customers',
				routing: { request: { method: 'GET', url: '=/benefits/{{$parameter["benefitId"]}}/grants' } },
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many benefits',
				description: 'Get many benefits',
				routing: { request: { method: 'GET', url: '=/benefits/' } },
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a benefit',
				description: 'Update an existing benefit',
				routing: { request: { method: 'PATCH', url: '=/benefits/{{$parameter["benefitId"]}}' } },
			},
		],
		default: 'getAll',
	},
	...benefitGetAllDescription,
	...benefitGetDescription,
	...benefitCreateDescription,
	...benefitUpdateDescription,
	...benefitDeleteDescription,
	...benefitGetGrantsDescription,
];
```

- [ ] **Step 9: Write `resources/benefitGrant/getAll.ts` and `index.ts`**

`getAll.ts`:

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../shared/descriptions';

const show = { resource: ['benefitGrant'], operation: ['getAll'] };

export const benefitGrantGetAllDescription: INodeProperties[] = [
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
				displayName: 'Only Granted',
				name: 'is_granted',
				type: 'boolean',
				default: true,
				description: 'Whether to only return grants that are still active (not revoked)',
				routing: { request: { qs: { is_granted: '={{$value}}' } } },
			},
		],
	},
];
```

`index.ts`:

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { benefitGrantGetAllDescription } from './getAll';

const showOnlyForBenefitGrant = { resource: ['benefitGrant'] };

export const benefitGrantDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForBenefitGrant },
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many benefit grants',
				description: 'Get many benefit grants across all benefits and customers',
				routing: { request: { method: 'GET', url: '=/benefit-grants/' } },
			},
		],
		default: 'getAll',
	},
	...benefitGrantGetAllDescription,
];
```

- [ ] **Step 10: Wire Benefit and Benefit Grant into `Polar.node.ts`**

1. Add imports: `benefitDescription` from `./resources/benefit`, `benefitGrantDescription` from `./resources/benefitGrant`, `getBenefits` from `./listSearch/getBenefits`, `getBenefitOptions` from `./loadOptions/getBenefitOptions`.
2. Add `{ name: 'Benefit', value: 'benefit' }` and `{ name: 'Benefit Grant', value: 'benefitGrant' }` to the `Resource` options array — check whether the array now has 8 entries and needs re-alphabetizing per the lint rule (Lot 1a's array was already alphabetical at 6 entries: Checkout, Checkout Link, Customer, Order, Refund, Subscription; adding Benefit and Benefit Grant alphabetically gives: Benefit, Benefit Grant, Checkout, Checkout Link, Customer, Order, Refund, Subscription — apply that order, don't just append).
3. Add `...benefitDescription,` and `...benefitGrantDescription,` to `properties`.
4. Add `getBenefits` to `methods.listSearch` and `getBenefitOptions` to `methods.loadOptions`.

- [ ] **Step 11: Lint and build**

Run: `npm run lint && npm run build`
Expected: both succeed.

- [ ] **Step 12: Manual Sandbox verification (skip if no Sandbox environment available; note as deferred)**

Run `npm run dev`, resource `Benefit`:
1. `Create` with Type `Custom` and a Note, execute, note the returned `id`.
2. `Get` with that ID, confirm the note round-trips. `Get Many`, confirm it appears.
3. `Update`, change the Note, confirm it changed. `Get Grants`, confirm an empty list (nothing granted yet).
4. `Delete`, then `Get Many`, confirm it's gone.
5. Resource `Benefit Grant`, `Get Many` with no filters — confirm it returns (likely empty, since nothing has been granted in this Sandbox org yet).

- [ ] **Step 13: Commit**

```bash
git add nodes/Polar
git commit -m "feat: add Benefit and Benefit Grant resources"
```

---

### Task 2: Product resource

**Files:**
- Create: `nodes/Polar/resources/product/index.ts`
- Create: `nodes/Polar/resources/product/getAll.ts`
- Create: `nodes/Polar/resources/product/get.ts`
- Create: `nodes/Polar/resources/product/create.ts`
- Create: `nodes/Polar/resources/product/update.ts`
- Create: `nodes/Polar/resources/product/updateBenefits.ts`
- Modify: `nodes/Polar/Polar.node.ts`

**Interfaces:**
- Consumes: `paginationProperties`, `metadataField`, `currencyOptions` (from `shared/descriptions.ts`); `getBenefitOptions` (Task 1, already registered in `methods.loadOptions`).
- Produces: `productDescription: INodeProperties[]`.

`POST /v1/products/` is discriminated by presence of `recurring_interval` (a real value = recurring product, `null` = one-time product) — modeled as a "Billing Type" selector. Each product's `prices` is an array where every entry is itself one of 4 discriminated types (`fixed`/`custom`/`seat_based`/`metered_unit`) — modeled as ONE `fixedCollection` field named `Prices` with 4 groups, combined into the flat array by a local `buildPricesArray` function serialized via `.toString()` (same technique as Lot 1a's `nextPageInfo` pagination trick — do not inline the combining logic as a bare template-literal expression without the function wrapper, the wrapper keeps it type-checked).

Product's `medias` (product images, needs the Files resource) and `attached_custom_fields` (needs the Custom Fields resource) are omitted from both Create and Update — both depend on Lot 2 resources this package doesn't have yet. Product Update omits changing `prices` entirely (mixing "keep this existing price by ID" entries with "add this new price" entries in one array doesn't map cleanly onto any pattern already established, and it's a rare edit — users needing to reprice should create a new product version, which is Polar's own recommended practice for pricing changes anyway).

- [ ] **Step 1: Write `resources/product/getAll.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../shared/descriptions';

const show = { resource: ['product'], operation: ['getAll'] };

export const productGetAllDescription: INodeProperties[] = [
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
				description: 'Search by product name',
				routing: { request: { qs: { query: '={{$value}}' } } },
			},
			{
				displayName: 'Product ID',
				name: 'id',
				type: 'string',
				default: '',
				routing: { request: { qs: { id: '={{$value}}' } } },
			},
			{
				displayName: 'Benefit ID',
				name: 'benefit_id',
				type: 'string',
				default: '',
				description: 'Only return products that grant this benefit',
				routing: { request: { qs: { benefit_id: '={{$value}}' } } },
			},
			{
				displayName: 'Only Archived',
				name: 'is_archived',
				type: 'boolean',
				default: true,
				routing: { request: { qs: { is_archived: '={{$value}}' } } },
			},
			{
				displayName: 'Only Recurring',
				name: 'is_recurring',
				type: 'boolean',
				default: true,
				routing: { request: { qs: { is_recurring: '={{$value}}' } } },
			},
			{
				displayName: 'Visibility',
				name: 'visibility',
				type: 'multiOptions',
				options: [
					{ name: 'Draft', value: 'draft' },
					{ name: 'Private', value: 'private' },
					{ name: 'Public', value: 'public' },
				],
				default: [],
				routing: { request: { qs: { visibility: '={{$value}}' } } },
			},
		],
	},
];
```

- [ ] **Step 2: Write `resources/product/get.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['product'], operation: ['get'] };

export const productGetDescription: INodeProperties[] = [
	{
		displayName: 'Product ID',
		name: 'productId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
];
```

- [ ] **Step 3: Write `resources/product/create.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { currencyOptions, metadataField } from '../../shared/descriptions';

const show = { resource: ['product'], operation: ['create'] };
const showRecurring = { ...show, billingType: ['recurring'] };

type PriceGroupValue = {
	fixedPrice?: Array<{ currency?: string; tax_behavior?: string; price_amount: number }>;
	customPrice?: Array<{
		currency?: string;
		tax_behavior?: string;
		minimum_amount?: number;
		maximum_amount?: number;
		preset_amount?: number;
	}>;
	seatBasedPrice?: Array<{
		currency?: string;
		tax_behavior?: string;
		seat_tier_type?: string;
		seatTiers?: { tier?: Array<{ min_seats: number; max_seats?: number; price_per_seat: number }> };
	}>;
	meteredPrice?: Array<{ currency?: string; tax_behavior?: string; meter_id: string; unit_amount: string; cap_amount?: number }>;
};

function buildPricesArray(v: PriceGroupValue) {
	const fixed = (v.fixedPrice || []).map((p) => ({
		amount_type: 'fixed',
		price_currency: p.currency,
		tax_behavior: p.tax_behavior || undefined,
		price_amount: p.price_amount,
	}));
	const custom = (v.customPrice || []).map((p) => ({
		amount_type: 'custom',
		price_currency: p.currency,
		tax_behavior: p.tax_behavior || undefined,
		minimum_amount: p.minimum_amount || undefined,
		maximum_amount: p.maximum_amount || undefined,
		preset_amount: p.preset_amount || undefined,
	}));
	const seatBased = (v.seatBasedPrice || []).map((p) => ({
		amount_type: 'seat_based',
		price_currency: p.currency,
		tax_behavior: p.tax_behavior || undefined,
		seat_tiers: {
			seat_tier_type: p.seat_tier_type,
			tiers: ((p.seatTiers && p.seatTiers.tier) || []).map((t) => ({
				min_seats: t.min_seats,
				max_seats: t.max_seats || undefined,
				price_per_seat: t.price_per_seat,
			})),
		},
	}));
	const metered = (v.meteredPrice || []).map((p) => ({
		amount_type: 'metered_unit',
		price_currency: p.currency,
		tax_behavior: p.tax_behavior || undefined,
		meter_id: p.meter_id,
		unit_amount: p.unit_amount,
		cap_amount: p.cap_amount || undefined,
	}));
	return [...fixed, ...custom, ...seatBased, ...metered];
}

const taxBehaviorOptions = [
	{ name: 'Based on Customer Location', value: 'location' },
	{ name: 'Inclusive', value: 'inclusive' },
	{ name: 'Exclusive', value: 'exclusive' },
];

const priceGroupOptions: INodeProperties['options'] = [
	{
		displayName: 'Fixed Price',
		name: 'fixedPrice',
		values: [
			{ displayName: 'Currency', name: 'currency', type: 'options', options: currencyOptions, default: 'usd' },
			{ displayName: 'Tax Behavior', name: 'tax_behavior', type: 'options', options: taxBehaviorOptions, default: 'exclusive' },
			{ displayName: 'Amount (Cents)', name: 'price_amount', type: 'number', default: 0, description: 'Set to 0 for a free price' },
		],
	},
	{
		displayName: 'Custom Price (Pay What You Want)',
		name: 'customPrice',
		values: [
			{ displayName: 'Currency', name: 'currency', type: 'options', options: currencyOptions, default: 'usd' },
			{ displayName: 'Tax Behavior', name: 'tax_behavior', type: 'options', options: taxBehaviorOptions, default: 'exclusive' },
			{ displayName: 'Minimum Amount (Cents)', name: 'minimum_amount', type: 'number', default: 0, description: 'Set to 0 to also accept $0' },
			{ displayName: 'Maximum Amount (Cents)', name: 'maximum_amount', type: 'number', default: 0 },
			{ displayName: 'Preset Amount (Cents)', name: 'preset_amount', type: 'number', default: 0 },
		],
	},
	{
		displayName: 'Seat-Based Price',
		name: 'seatBasedPrice',
		values: [
			{ displayName: 'Currency', name: 'currency', type: 'options', options: currencyOptions, default: 'usd' },
			{ displayName: 'Tax Behavior', name: 'tax_behavior', type: 'options', options: taxBehaviorOptions, default: 'exclusive' },
			{
				displayName: 'Seat Tier Type',
				name: 'seat_tier_type',
				type: 'options',
				options: [
					{ name: 'Volume (Flat Rate per Tier)', value: 'volume' },
					{ name: 'Graduated (per-Tier Range)', value: 'graduated' },
				],
				default: 'volume',
			},
			{
				displayName: 'Seat Tiers',
				name: 'seatTiers',
				type: 'fixedCollection',
				typeOptions: { multipleValues: true, multipleValueButtonText: 'Add Tier' },
				default: {},
				options: [
					{
						displayName: 'Tier',
						name: 'tier',
						values: [
							{ displayName: 'Min Seats', name: 'min_seats', type: 'number', default: 1, typeOptions: { minValue: 1 } },
							{ displayName: 'Max Seats', name: 'max_seats', type: 'number', default: 0, description: 'Leave 0 for unlimited' },
							{ displayName: 'Price Per Seat (Cents)', name: 'price_per_seat', type: 'number', default: 0 },
						],
					},
				],
			},
		],
	},
	{
		displayName: 'Metered Price',
		name: 'meteredPrice',
		values: [
			{ displayName: 'Currency', name: 'currency', type: 'options', options: currencyOptions, default: 'usd' },
			{ displayName: 'Tax Behavior', name: 'tax_behavior', type: 'options', options: taxBehaviorOptions, default: 'exclusive' },
			{ displayName: 'Meter ID', name: 'meter_id', type: 'string', default: '' },
			{
				displayName: 'Unit Amount (Cents)',
				name: 'unit_amount',
				type: 'string',
				default: '0',
				description: 'Price per unit in cents, as a string to preserve up to 12 decimal places',
			},
			{ displayName: 'Cap Amount (Cents)', name: 'cap_amount', type: 'number', default: 0, description: 'Maximum total charge per period; 0 for no cap' },
		],
	},
];

export const productCreateDescription: INodeProperties[] = [
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		typeOptions: { minLength: 3, maxLength: 64 },
		routing: { send: { type: 'body', property: 'name' } },
	},
	{
		displayName: 'Billing Type',
		name: 'billingType',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show },
		options: [
			{ name: 'One-Time', value: 'oneTime' },
			{ name: 'Recurring', value: 'recurring' },
		],
		default: 'oneTime',
	},
	{
		displayName: 'Recurring Interval',
		name: 'recurring_interval',
		type: 'options',
		options: [
			{ name: 'Day', value: 'day' },
			{ name: 'Week', value: 'week' },
			{ name: 'Month', value: 'month' },
			{ name: 'Year', value: 'year' },
		],
		default: 'month',
		required: true,
		displayOptions: { show: showRecurring },
		routing: { send: { type: 'body', property: 'recurring_interval' } },
	},
	{
		displayName: 'Recurring Interval Count',
		name: 'recurring_interval_count',
		type: 'number',
		default: 1,
		displayOptions: { show: showRecurring },
		description: 'If set to 2, the customer is charged every other interval instead of every interval',
		routing: { send: { type: 'body', property: 'recurring_interval_count' } },
	},
	{
		displayName: 'Prices',
		name: 'prices',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true, multipleValueButtonText: 'Add Price' },
		default: {},
		required: true,
		displayOptions: { show },
		description: 'At least one price is required; add one or more of the price types below',
		options: priceGroupOptions,
		routing: { send: { type: 'body', property: 'prices', value: `={{ (${buildPricesArray.toString()})($value) }}` } },
	},
	{
		displayName: 'Description',
		name: 'description',
		type: 'string',
		typeOptions: { rows: 3 },
		default: '',
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'description', value: '={{$value || undefined}}' } },
	},
	{
		displayName: 'Visibility',
		name: 'visibility',
		type: 'options',
		options: [
			{ name: 'Draft', value: 'draft' },
			{ name: 'Private', value: 'private' },
			{ name: 'Public', value: 'public' },
		],
		default: 'public',
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'visibility' } },
	},
	metadataField('metadata', 'metadata', 'Metadata', show),
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: showRecurring },
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
				displayName: 'Usage-Based Billing Interval',
				name: 'meter_interval',
				type: 'options',
				options: [
					{ name: 'Day', value: 'day' },
					{ name: 'Week', value: 'week' },
					{ name: 'Month', value: 'month' },
					{ name: 'Year', value: 'year' },
				],
				default: 'month',
				description: 'Billing cycle for metered-unit prices on this product, if different from the base recurring interval',
				routing: { request: { body: { meter_interval: '={{$value}}' } } },
			},
			{
				displayName: 'Usage-Based Billing Interval Count',
				name: 'meter_interval_count',
				type: 'number',
				default: 1,
				routing: { request: { body: { meter_interval_count: '={{$value}}' } } },
			},
		],
	},
];
```

- [ ] **Step 4: Write `resources/product/update.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { metadataField } from '../../shared/descriptions';

const show = { resource: ['product'], operation: ['update'] };

export const productUpdateDescription: INodeProperties[] = [
	{
		displayName: 'Product ID',
		name: 'productId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
	metadataField('metadata', 'metadata', 'Metadata', show),
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
				typeOptions: { minLength: 3, maxLength: 64 },
				routing: { request: { body: { name: '={{$value}}' } } },
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				routing: { request: { body: { description: '={{$value}}' } } },
			},
			{
				displayName: 'Visibility',
				name: 'visibility',
				type: 'options',
				options: [
					{ name: 'Draft', value: 'draft' },
					{ name: 'Private', value: 'private' },
					{ name: 'Public', value: 'public' },
				],
				default: 'public',
				routing: { request: { body: { visibility: '={{$value}}' } } },
			},
			{
				displayName: 'Is Archived',
				name: 'is_archived',
				type: 'boolean',
				default: false,
				description: 'Whether to archive the product, hiding it from new checkouts without affecting existing subscribers',
				routing: { request: { body: { is_archived: '={{$value}}' } } },
			},
			{
				displayName: 'Recurring Interval',
				name: 'recurring_interval',
				type: 'options',
				options: [
					{ name: 'Day', value: 'day' },
					{ name: 'Week', value: 'week' },
					{ name: 'Month', value: 'month' },
					{ name: 'Year', value: 'year' },
				],
				default: 'month',
				routing: { request: { body: { recurring_interval: '={{$value}}' } } },
			},
			{
				displayName: 'Recurring Interval Count',
				name: 'recurring_interval_count',
				type: 'number',
				default: 1,
				routing: { request: { body: { recurring_interval_count: '={{$value}}' } } },
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
		],
	},
];
```

- [ ] **Step 5: Write `resources/product/updateBenefits.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['product'], operation: ['updateBenefits'] };

export const productUpdateBenefitsDescription: INodeProperties[] = [
	{
		displayName: 'Product ID',
		name: 'productId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
	{
		displayName: 'Benefit Names or IDs',
		name: 'benefits',
		type: 'multiOptions',
		typeOptions: { loadOptionsMethod: 'getBenefitOptions' },
		default: [],
		required: true,
		displayOptions: { show },
		description: 'The complete set of benefits this product should grant — replaces the existing list. Choose from the list, or specify IDs using an expression.',
		routing: { send: { type: 'body', property: 'benefits' } },
	},
];
```

- [ ] **Step 6: Write `resources/product/index.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { productGetAllDescription } from './getAll';
import { productGetDescription } from './get';
import { productCreateDescription } from './create';
import { productUpdateDescription } from './update';
import { productUpdateBenefitsDescription } from './updateBenefits';

const showOnlyForProduct = { resource: ['product'] };

export const productDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForProduct },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a product',
				description: 'Create a new product',
				routing: { request: { method: 'POST', url: '=/products/' } },
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a product',
				description: 'Get a single product by ID',
				routing: { request: { method: 'GET', url: '=/products/{{$parameter["productId"]}}' } },
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many products',
				description: 'Get many products',
				routing: { request: { method: 'GET', url: '=/products/' } },
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a product',
				description: 'Update an existing product',
				routing: { request: { method: 'PATCH', url: '=/products/{{$parameter["productId"]}}' } },
			},
			{
				name: 'Update Benefits',
				value: 'updateBenefits',
				action: 'Update a product benefits',
				description: 'Replace the set of benefits granted by this product',
				routing: { request: { method: 'POST', url: '=/products/{{$parameter["productId"]}}/benefits' } },
			},
		],
		default: 'getAll',
	},
	...productGetAllDescription,
	...productGetDescription,
	...productCreateDescription,
	...productUpdateDescription,
	...productUpdateBenefitsDescription,
];
```

- [ ] **Step 7: Wire Product into `Polar.node.ts`**

1. Add `import { productDescription } from './resources/product';`.
2. Insert `{ name: 'Product', value: 'product' }` into the `Resource` options array in alphabetical position (after `Order`, before `Refund`).
3. Add `...productDescription,` to `properties`.

No `methods` changes — Product reuses `getBenefitOptions` already registered in Task 1.

- [ ] **Step 8: Lint and build**

Run: `npm run lint && npm run build`
Expected: both succeed. The `buildPricesArray` function must type-check under this repo's `noUnusedLocals`/strict TypeScript config — if the inline object-literal shapes inside it don't satisfy TypeScript without explicit return-type annotations, add them rather than using `any`.

- [ ] **Step 9: Manual Sandbox verification (skip if no Sandbox environment available; note as deferred)**

Run `npm run dev`, resource `Product`:
1. `Create`, Billing Type "One-Time", add one Fixed Price (e.g. 500 cents), execute — note the returned `id`.
2. `Create` again, Billing Type "Recurring", Recurring Interval "Month", add one Fixed Price — confirm it succeeds.
3. `Get Many`, confirm both appear. `Get` on one, confirm match.
4. `Update`, set `Is Archived` true, confirm the product no longer shows in `Get Many` with the `Only Archived` filter set to false (i.e. it's excluded from the "active only" view — check both directions of that filter).
5. `Update Benefits` with a benefit created in Task 1, confirm the response includes it in the product's benefits list.

- [ ] **Step 10: Commit**

```bash
git add nodes/Polar
git commit -m "feat: add Product resource"
```

---

### Task 3: Discount resource

**Files:**
- Create: `nodes/Polar/resources/discount/index.ts`
- Create: `nodes/Polar/resources/discount/getAll.ts`
- Create: `nodes/Polar/resources/discount/get.ts`
- Create: `nodes/Polar/resources/discount/create.ts`
- Create: `nodes/Polar/resources/discount/update.ts`
- Create: `nodes/Polar/resources/discount/delete.ts`
- Modify: `nodes/Polar/Polar.node.ts`

**Interfaces:**
- Consumes: `paginationProperties`, `metadataField`, `currencyOptions` (`shared/descriptions.ts`); `getProductOptions` (Lot 1a Task 4, already registered).
- Produces: `discountDescription: INodeProperties[]`.

`POST /v1/discounts/` is a 2-way union by `type` (`fixed`/`percentage`) — modeled as a "Discount Type" selector. `PATCH /v1/discounts/{id}` is a single flat schema (not polymorphic) accepting any subset of fields regardless of the discount's actual type — modeled as one "Update Fields" collection. `amounts` (a map of currency→fixed-amount for multi-currency fixed discounts) is omitted from both Create and Update — an advanced, rarely-needed override on top of the base `amount`/`currency` pair, consistent with this plan's other advanced-map omissions.

- [ ] **Step 1: Write `resources/discount/getAll.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../shared/descriptions';

const show = { resource: ['discount'], operation: ['getAll'] };

export const discountGetAllDescription: INodeProperties[] = [
	...paginationProperties(show),
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		default: '',
		displayOptions: { show },
		description: 'Search by discount name or code',
		routing: { request: { qs: { query: '={{$value}}' } } },
	},
];
```

- [ ] **Step 2: Write `resources/discount/get.ts` and `delete.ts`**

`get.ts`:

```typescript
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['discount'], operation: ['get'] };

export const discountGetDescription: INodeProperties[] = [
	{
		displayName: 'Discount ID',
		name: 'discountId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
];
```

`delete.ts`:

```typescript
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['discount'], operation: ['delete'] };

export const discountDeleteDescription: INodeProperties[] = [
	{
		displayName: 'Discount ID',
		name: 'discountId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
];
```

- [ ] **Step 3: Write `resources/discount/create.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { currencyOptions, metadataField } from '../../shared/descriptions';

const show = { resource: ['discount'], operation: ['create'] };
const showFixed = { ...show, discountType: ['fixed'] };
const showPercentage = { ...show, discountType: ['percentage'] };
const showRepeating = { ...show, duration: ['repeating'] };

export const discountCreateDescription: INodeProperties[] = [
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'Displayed to the customer when the discount is applied',
		routing: { send: { type: 'body', property: 'name' } },
	},
	{
		displayName: 'Discount Type',
		name: 'discountType',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show },
		options: [
			{ name: 'Fixed Amount', value: 'fixed' },
			{ name: 'Percentage', value: 'percentage' },
		],
		default: 'percentage',
		routing: { send: { type: 'body', property: 'type' } },
	},
	{
		displayName: 'Amount (Cents)',
		name: 'amount',
		type: 'number',
		default: 0,
		required: true,
		displayOptions: { show: showFixed },
		routing: { send: { type: 'body', property: 'amount' } },
	},
	{
		displayName: 'Currency',
		name: 'currency',
		type: 'options',
		options: currencyOptions,
		default: 'usd',
		displayOptions: { show: showFixed },
		routing: { send: { type: 'body', property: 'currency' } },
	},
	{
		displayName: 'Basis Points',
		name: 'basis_points',
		type: 'number',
		default: 1000,
		required: true,
		displayOptions: { show: showPercentage },
		description: 'Discount percentage in basis points (1000 = 10%)',
		routing: { send: { type: 'body', property: 'basis_points' } },
	},
	{
		displayName: 'Duration',
		name: 'duration',
		type: 'options',
		options: [
			{ name: 'Once', value: 'once' },
			{ name: 'Forever', value: 'forever' },
			{ name: 'Repeating', value: 'repeating' },
		],
		default: 'once',
		required: true,
		displayOptions: { show },
		description: 'For subscriptions: apply once on the first invoice, forever, or for a set number of months',
		routing: { send: { type: 'body', property: 'duration' } },
	},
	{
		displayName: 'Duration in Months',
		name: 'duration_in_months',
		type: 'number',
		default: 1,
		required: true,
		displayOptions: { show: showRepeating },
		routing: { send: { type: 'body', property: 'duration_in_months' } },
	},
	{
		displayName: 'Products',
		name: 'products',
		type: 'multiOptions',
		typeOptions: { loadOptionsMethod: 'getProductOptions' },
		default: [],
		displayOptions: { show },
		description: 'Products this discount can be applied to. Leave empty to allow it on any product. Choose from the list, or specify IDs using an expression.',
		routing: { send: { type: 'body', property: 'products', value: '={{ $value.length ? $value : undefined }}' } },
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
				displayName: 'Code',
				name: 'code',
				type: 'string',
				default: '',
				description: 'A code customers can enter at checkout to redeem this discount',
				routing: { request: { body: { code: '={{$value}}' } } },
			},
			{
				displayName: 'Starts At',
				name: 'starts_at',
				type: 'dateTime',
				default: '',
				routing: { request: { body: { starts_at: '={{$value}}' } } },
			},
			{
				displayName: 'Ends At',
				name: 'ends_at',
				type: 'dateTime',
				default: '',
				routing: { request: { body: { ends_at: '={{$value}}' } } },
			},
			{
				displayName: 'Max Redemptions',
				name: 'max_redemptions',
				type: 'number',
				default: 1,
				routing: { request: { body: { max_redemptions: '={{$value}}' } } },
			},
			{
				displayName: 'Max Redemptions Per Customer',
				name: 'max_redemptions_per_customer',
				type: 'number',
				default: 1,
				routing: { request: { body: { max_redemptions_per_customer: '={{$value}}' } } },
			},
		],
	},
];
```

- [ ] **Step 4: Write `resources/discount/update.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { currencyOptions, metadataField } from '../../shared/descriptions';

const show = { resource: ['discount'], operation: ['update'] };

export const discountUpdateDescription: INodeProperties[] = [
	{
		displayName: 'Discount ID',
		name: 'discountId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
	{
		displayName: 'Products',
		name: 'products',
		type: 'multiOptions',
		typeOptions: { loadOptionsMethod: 'getProductOptions' },
		default: [],
		displayOptions: { show },
		description: 'Leave empty to keep the existing products. Choose from the list, or specify IDs using an expression.',
		routing: { send: { type: 'body', property: 'products', value: '={{ $value.length ? $value : undefined }}' } },
	},
	metadataField('metadata', 'metadata', 'Metadata', show),
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
				displayName: 'Code',
				name: 'code',
				type: 'string',
				default: '',
				routing: { request: { body: { code: '={{$value}}' } } },
			},
			{
				displayName: 'Starts At',
				name: 'starts_at',
				type: 'dateTime',
				default: '',
				routing: { request: { body: { starts_at: '={{$value}}' } } },
			},
			{
				displayName: 'Ends At',
				name: 'ends_at',
				type: 'dateTime',
				default: '',
				routing: { request: { body: { ends_at: '={{$value}}' } } },
			},
			{
				displayName: 'Max Redemptions',
				name: 'max_redemptions',
				type: 'number',
				default: 1,
				routing: { request: { body: { max_redemptions: '={{$value}}' } } },
			},
			{
				displayName: 'Max Redemptions Per Customer',
				name: 'max_redemptions_per_customer',
				type: 'number',
				default: 1,
				routing: { request: { body: { max_redemptions_per_customer: '={{$value}}' } } },
			},
			{
				displayName: 'Duration',
				name: 'duration',
				type: 'options',
				options: [
					{ name: 'Once', value: 'once' },
					{ name: 'Forever', value: 'forever' },
					{ name: 'Repeating', value: 'repeating' },
				],
				default: 'once',
				routing: { request: { body: { duration: '={{$value}}' } } },
			},
			{
				displayName: 'Duration in Months',
				name: 'duration_in_months',
				type: 'number',
				default: 1,
				routing: { request: { body: { duration_in_months: '={{$value}}' } } },
			},
			{
				displayName: 'Discount Type',
				name: 'type',
				type: 'options',
				options: [
					{ name: 'Fixed Amount', value: 'fixed' },
					{ name: 'Percentage', value: 'percentage' },
				],
				default: 'percentage',
				routing: { request: { body: { type: '={{$value}}' } } },
			},
			{
				displayName: 'Amount (Cents)',
				name: 'amount',
				type: 'number',
				default: 0,
				routing: { request: { body: { amount: '={{$value}}' } } },
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
				displayName: 'Basis Points',
				name: 'basis_points',
				type: 'number',
				default: 1000,
				routing: { request: { body: { basis_points: '={{$value}}' } } },
			},
		],
	},
];
```

- [ ] **Step 5: Write `resources/discount/index.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { discountGetAllDescription } from './getAll';
import { discountGetDescription } from './get';
import { discountCreateDescription } from './create';
import { discountUpdateDescription } from './update';
import { discountDeleteDescription } from './delete';

const showOnlyForDiscount = { resource: ['discount'] };

export const discountDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForDiscount },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a discount',
				description: 'Create a new discount',
				routing: { request: { method: 'POST', url: '=/discounts/' } },
			},
			{
				name: 'Delete',
				value: 'delete',
				action: 'Delete a discount',
				description: 'Delete a discount',
				routing: { request: { method: 'DELETE', url: '=/discounts/{{$parameter["discountId"]}}' } },
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a discount',
				description: 'Get a single discount by ID',
				routing: { request: { method: 'GET', url: '=/discounts/{{$parameter["discountId"]}}' } },
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many discounts',
				description: 'Get many discounts',
				routing: { request: { method: 'GET', url: '=/discounts/' } },
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a discount',
				description: 'Update an existing discount',
				routing: { request: { method: 'PATCH', url: '=/discounts/{{$parameter["discountId"]}}' } },
			},
		],
		default: 'getAll',
	},
	...discountGetAllDescription,
	...discountGetDescription,
	...discountCreateDescription,
	...discountUpdateDescription,
	...discountDeleteDescription,
];
```

- [ ] **Step 6: Wire Discount into `Polar.node.ts`**

1. Add `import { discountDescription } from './resources/discount';`.
2. Insert `{ name: 'Discount', value: 'discount' }` into the `Resource` options array in alphabetical position (after `Customer`, before `Order`).
3. Add `...discountDescription,` to `properties`.

No `methods` changes.

- [ ] **Step 7: Lint and build**

Run: `npm run lint && npm run build`
Expected: both succeed.

- [ ] **Step 8: Manual Sandbox verification (skip if no Sandbox environment available; note as deferred)**

Run `npm run dev`, resource `Discount`:
1. `Create`, Type "Percentage", Basis Points 1000 (10%), Duration "Once" — execute, note the `id`.
2. `Get Many`, confirm it appears. `Get` on that ID, confirm match.
3. `Update`, add a `Code` in Update Fields, confirm it's set.
4. `Delete`, then `Get Many`, confirm it's gone.

- [ ] **Step 9: Commit**

```bash
git add nodes/Polar
git commit -m "feat: add Discount resource"
```

---

### Task 4: README update and full-package verification

**Files:**
- Modify: `README.md`

**Interfaces:**
- Produces: documentation reflecting the complete `Polar` node (10 resources, Lot 1a + Lot 1b) as it now ships.

- [ ] **Step 1: Update the "Nodes" section of `README.md`**

Add to the `### Polar` bullet list, after `Refund`, in alphabetical order to match the actual Resource dropdown order:

```markdown
- **Benefit** — Get Many, Get, Create, Update, Delete, Get Grants
- **Benefit Grant** — Get Many
- **Discount** — Get Many, Get, Create, Update, Delete
- **Product** — Get Many, Get, Create, Update, Update Benefits
```

Remove the sentence "Product, Discount, Benefit, and Benefit Grant resources ship in a follow-up release." (Lot 1b has now shipped it).

- [ ] **Step 2: Full-package verification**

Run, in order:

```bash
npm run lint
npm run build
```

Then statically cross-check `nodes/Polar/Polar.node.ts`'s `Resource` options array against every resource's actual `index.ts` Operation list (same method as Lot 1a's final task), confirming: 10 resources total (Benefit, Benefit Grant, Checkout, Checkout Link, Customer, Discount, Order, Product, Refund, Subscription), alphabetically ordered, and `methods` contains `getProducts`/`getCustomers`/`getBenefits` in `listSearch` and `getProductOptions`/`getBenefitOptions` in `loadOptions` — nothing missing, nothing extra.

If a Sandbox environment is available, re-run every "Manual Sandbox verification" script from Tasks 1-3 back to back against the same Sandbox organization to catch any cross-resource regression (e.g. Product's `Update Benefits` against a real Benefit ID from Task 1).

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: document Benefit, Benefit Grant, Product, and Discount resources"
```

---

## Definition of Done

- [ ] `npm run lint` and `npm run build` succeed with no errors.
- [ ] The `Polar` node exposes 10 resources total (all of Lot 1a plus Benefit, Benefit Grant, Product, Discount), each manually verified against a Polar Sandbox organization where an environment was available.
- [ ] `README.md` accurately lists every resource and its operations.
- [ ] No new runtime npm dependency was added.
- [ ] Every polymorphic Create/Update body (Product prices ×4 types, Benefit ×8 types, Discount ×2 types) sends exactly the fields for its selected variant, with no cross-variant field leakage — this is the one correctness risk this plan shares with Lot 1a's Subscription task, and should get the same file-by-file scrutiny in review.
