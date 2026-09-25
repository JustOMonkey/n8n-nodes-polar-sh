# Polar Node — Lot 3a: Core API Alignment with the 2026-10 OpenAPI Spec

**Status:** Approved by user 2026-09-25, ready for implementation planning.

## Context

Lots 1 and 2 (merged) built the `Polar` node's 25 resources, the `Polar Trigger`, and the `Polar API` credential, followed by scope-aware error handling (commit 20f3e47).

An audit of every `(method, url)` the node calls against Polar's versioned spec `https://polar.sh/docs/openapi/2026-10.openapi.json` (190 operations, fetched 2026-09-25) found:

- **Called but absent from the spec:** the whole `Member` resource (`/v1/members/...` — members now live under `/v1/customers/{id}/members`) and the whole `Organization Access Token` resource (`/v1/organization-access-tokens` no longer exists).
- **Present in the spec but not covered:** a set of Core API operations listed below, plus 7 webhook event types.
- **Field-level audit:** apart from those two resources, every query/body field used by the existing operations still exists in the 2026-10 spec. No field renames needed.

The 47 `/v1/customer-portal/*` operations are **out of scope** here. They authenticate with `customer_session` / `member_session` tokens, not Organization Access Tokens, and will ship as a separate `Polar Customer Portal` node in **Lot 3b**. OAuth2 (`/v1/oauth2/*`) and client-side checkout (`/v1/checkouts/client/{client_secret}`) are deliberately excluded: they are auth plumbing and a browser-facing flow.

Target release: **1.1.0** (user decision). Removing Organization Access Token is technically breaking, but those operations already fail against the live API.

## Global constraints (carried from Lots 1–2, unchanged)

- Reuse the existing `Polar API` credential. No new credential, no new runtime npm dependency.
- One file per operation under `nodes/Polar/resources/<resource>/`, an `index.ts` wiring the Operation dropdown, declarative routing only, plus `nodes/Polar/shared/*` helpers.
- Every operation's routing sets `ignoreHttpStatusErrors: true` + `output.postReceive: [handlePolarApiError]`, and the resource's properties include `...scopeNoticesForResource('<resource>')`, same as every existing resource.
- ID fields are plain `type: 'string'`.
- Update operations use the self-omitting "Update Fields" `collection` pattern.
- 5+-item `options`/`multiOptions` arrays are alphabetized by display name (lint's `localeCompare` comparator). Boolean descriptions contain "whether".
- `organization_id` and `sorting` are never exposed. Array-capable ID filters are exposed as a single plain string field. Only genuine fixed enums get `multiOptions`.
- Very large enums (`timezone`, `country`, `default_presentment_currency`) are exposed as plain string fields with a description/example, not as dropdowns.
- Ground every field and endpoint in the 2026-10 spec, never guess.

## 1. Migrations and removals

### Member: migrated to customer-scoped endpoints

The resource keeps the name `member`. The six existing operation values keep their meaning (`create`, `get`, `getAll`, `update`, `delete`, `getByExternalId`) so saved workflows still open. The package follows Customer's convention of one operation per "by ID" / "by External ID" variant. Final list, 10 operations (alphabetized by display name):

| Operation (value) | Method + path | Fields |
|---|---|---|
| Create (`create`) | `POST /customers/{id}/members` | `customerId` (req, path), `email` (req, body), Additional Fields: `name`, `external_id`, `role` (Billing Manager/Member) |
| Create for External Customer (`createExternal`) | `POST /customers/external/{external_id}/members` | `externalCustomerId` (req), same body as Create |
| Delete (`delete`) | `DELETE /customers/{id}/members/{member_id}` | `customerId`, `memberId` |
| Delete by External ID (`deleteExternal`) | `DELETE /customers/external/{external_id}/members/{member_external_id}` | `externalCustomerId`, `externalId` |
| Get (`get`) | `GET /customers/{id}/members/{member_id}` | `customerId`, `memberId` |
| Get by External ID (`getByExternalId`) | `GET /customers/external/{external_id}/members/{member_external_id}` | `externalCustomerId`, `externalId` (existing param name kept) |
| Get Many (`getAll`) | `GET /customers/{id}/members` | `customerId`, pagination, Filters: `role` (Billing Manager/Member/Owner) |
| Get Many for External Customer (`getAllExternal`) | `GET /customers/external/{external_id}/members` | `externalCustomerId`, pagination, same `role` filter |
| Update (`update`) | `PATCH /customers/{id}/members/{member_id}` | `customerId`, `memberId`, Update Fields: `name`, `email`, `role` (Billing Manager/Member/Owner) |
| Update by External ID (`updateExternal`) | `PATCH /customers/external/{external_id}/members/{member_external_id}` | `externalCustomerId`, `externalId`, same Update Fields |

- Body schemas: `MemberCreateFromCustomer` (required `email`; `role` enum `member|billing_manager`) and `MemberUpdate` (`role` enum `owner|billing_manager|member`).
- The old Get Many filters `customer_id` / `external_customer_id` and the old Get by External ID `filters` collection are removed. The customer is now part of the path.
- `customerId` moves from a body `routing.send` field to a path-only parameter used in the URL expression.
- Field names are shared across operations (`customerId`, `externalCustomerId`, `memberId`, `externalId`), each with its own `displayOptions`.

### Organization Access Token: removed

- Delete `nodes/Polar/resources/organizationAccessToken/`, its import, its Resource option and its `...organizationAccessTokenDescription` spread in `Polar.node.ts`.
- Delete `availableScopeOptions` from `shared/descriptions.ts` (only used there).
- Delete the `organizationAccessToken` entry and its explanatory comment from `OPERATION_SCOPES`.

## 2. Additions to existing resources

| Resource | Operation (value) | Method + path | Fields / notes |
|---|---|---|---|
| Benefit | Get Files (`getFiles`) | `GET /benefits/{id}/files` | `benefitId`, pagination (`ListResource_BenefitDownloadableFile_`) |
| Customer | Export (`export`) | `GET /customers/export` | No fields (only `organization_id` exists). CSV → binary. |
| Customer | Get Payment Methods by External ID (`getPaymentMethodsExternal`) | `GET /customers/external/{external_id}/payment-methods` | `externalCustomerId`, pagination |
| Dispute | Accept (`accept`) | `POST /disputes/{id}/accept` | `disputeId`, no body. Description warns that accepting concedes the dispute and cannot be undone. |
| License Key | Rotate (`rotate`) | `POST /license-keys/{id}/rotate` | `licenseKeyId`, no body. Returns `RotatedLicenseKey`. Description notes the old key stops working. |
| Order | Export (`export`) | `GET /orders/export` | Filters: `product_id` (string), `status` (multiOptions: Draft/Paid/Partially Refunded/Pending/Refunded/Void), `created_after`/`created_before` (dateTime), `timezone` (string, e.g. `Europe/Paris`), `columns` (multiOptions, 16 values of the `columns` enum, alphabetized). CSV → binary. |
| Product | Delete (`delete`) | `DELETE /products/{id}` | `productId`. 204. Description notes that only products with no orders, subscriptions, trials or discounts can be deleted; products in use must be archived instead via Update (the API returns an error, passed through as usual). |
| Subscription | Export (`export`) | `GET /subscriptions/export` | Filters: `product_id`, `status` (multiOptions, 8 values), `cancel_at_period_end` (boolean), `started_after`/`started_before` (dateTime), `timezone`, `columns` (multiOptions, 22 values). CSV → binary. |

### CSV → binary: shared `postReceive`

New helper in `nodes/Polar/shared/` (e.g. `binary.ts`): `csvToBinary(fileName: string)` returns a `postReceive` function that:

1. Runs after `handlePolarApiError` in the `postReceive` array, so errors are still surfaced the usual way.
2. Takes the response body, which is a CSV string (request sets `json: false` / text encoding so n8n doesn't try to parse it), and calls `this.helpers.prepareBinaryData(Buffer.from(body, 'utf8'), fileName, 'text/csv')`.
3. Returns one item `{ json: {}, binary: { data } }`.

File names: `customers-export.csv`, `orders-export.csv`, `subscriptions-export.csv`, `metrics-export.csv`.

Multi-value query params (`status`, `columns`, `metrics`, `billing_type`) are sent as repeated keys (`status=paid&status=refunded`), which is what FastAPI expects. The plan must check how n8n declarative routing serializes array `qs` values and set `arrayFormat: 'repeat'` (or equivalent) if needed.

## 3. New resources

Resource dropdown after this lot, 27 entries: Benefit, Benefit Grant, Checkout, Checkout Link, Custom Field, Customer, Customer Meter, Customer Seat, Customer Session, Discount, Dispute, Event, Event Type, File, License Key, Member, Meter, **Metric**, **Metric Dashboard**, Order, **Organization**, Payment, Product, Refund, Subscription, Webhook Delivery, Webhook Endpoint.

### Metric (`metric`)

| Operation (value) | Method + path | Fields |
|---|---|---|
| Export (`export`) | `GET /metrics/export` | Same fields as Get. CSV → binary. |
| Get (`get`) | `GET /metrics/` | Required: `start_date`, `end_date` (dateTime, sent as `YYYY-MM-DD`: the spec types them `format: date`, so the routing expression truncates to the date part), `interval` (options: Day/Hour/Month/Week/Year). Filters: `timezone` (string, default UTC), `product_id`, `customer_id` (strings), `billing_type` (multiOptions: One Time/Recurring), `metrics` (string, comma-separated metric slugs split into repeated params). |
| Get Limits (`getLimits`) | `GET /metrics/limits` | No fields. Returns `MetricsLimits`. |

### Metric Dashboard (`metricDashboard`)

| Operation (value) | Method + path | Fields |
|---|---|---|
| Create (`create`) | `POST /metrics/dashboards` | `name` (req), Additional Fields: `metrics` (comma-separated slugs → array, max 10) |
| Delete (`delete`) | `DELETE /metrics/dashboards/{id}` | `metricDashboardId`. 204. |
| Get (`get`) | `GET /metrics/dashboards/{id}` | `metricDashboardId` |
| Get Many (`getAll`) | `GET /metrics/dashboards` | No fields. **Not paginated:** the response is a bare JSON array, so `paginationProperties` is not used. The array is split into items. |
| Update (`update`) | `PATCH /metrics/dashboards/{id}` | `metricDashboardId`, Update Fields: `name`, `metrics` |

### Organization (`organization`)

No Create, in line with the package's single-org-per-token model.

| Operation (value) | Method + path | Fields |
|---|---|---|
| Get (`get`) | `GET /organizations/{id}` | `organizationId` |
| Get Many (`getAll`) | `GET /organizations/` | Pagination, Filters: `slug`. Description notes that with an Organization Access Token it returns the token's own organization, which is the easiest way to find its ID. |
| Update (`update`) | `PATCH /organizations/{id}` | `organizationId`, Update Fields (flat fields only from `OrganizationUpdate`): `name`, `avatar_url`, `email`, `website`, `country` (string, ISO 3166-1 alpha-2), `default_presentment_currency` (string, lowercase ISO 4217), `default_tax_behavior` (options: Exclusive/Inclusive/Location). Nested settings objects (`details`, `socials`, `*_settings`, `embed_hosts`, `sso_enforced`) are out of scope. |

## 4. Trigger, scopes, docs

- **`webhookEventTypeOptions`** (`shared/descriptions.ts`): add the 7 missing `WebhookEventType` values: `subscription.cycled`, `subscription.paused`, `subscription.resumed`, `subscription.migrated`, `discount.created`, `discount.updated`, `discount.deleted`. That makes 42, re-alphabetized with the same `"<Resource>: <Action>"` label format. The Polar Trigger, Webhook Endpoint and Webhook Delivery pick this up automatically.
- **`OPERATION_SCOPES`** (`shared/errorHandling.ts`): every entry for new, migrated or added operations comes from the 2026-10 spec's `security` → `oat` requirement (AND semantics, as documented in the file's header comment). Existing entries are re-checked against the same spec. Update the header comment's "checked" date. Examples: Member reads `['members:read','members:write']`, writes `['members:write']`; exports `customers:read+write` / `orders:read` / `subscriptions:read+write`; Metric `metrics:read`; Metric Dashboard reads `metrics:read` and writes `metrics:write`; Organization reads `organizations:read+write` and Update `organizations:write`.
- **README**: resource/operation list updated (Member re-described, Organization Access Token removed, new resources/operations listed, export-as-binary noted).
- **CHANGELOG / version**: produced by `npm run release` (release-it + auto-changelog), the user picks minor → 1.1.0; upgrade notes go in the README instead. The README gets an "Upgrading to 1.1" note covering the Organization Access Token removal (endpoints gone from Polar's API) and the Member migration (Customer ID now required; old Get Many filters removed).

## Out of scope

- Customer Portal API (Lot 3b, separate node).
- OAuth2 endpoints, client-secret checkout endpoints, Organization Create.
- Nested organization settings objects.
- Any field additions to existing operations beyond those listed above (the field audit found no removals to fix).

## Verification

- `npm run lint` and `npm run build` clean.
- Re-run the endpoint diff script (spec vs. `routing.request` URLs). The only "in spec, not used" entries left should be customer-portal, OAuth2, client checkout and `POST /organizations`. There should be no "used but not in spec" entries.
- Sandbox run (`npm run dev`, node type `CUSTOM.polar`):
  - Organization Get Many → Get
  - Member Create → Get → Update → Get Many → Delete, on a sandbox customer
  - Order Export → a binary `orders-export.csv` output
  - Metric Get (last 30 days, interval Day)
  - Metric Dashboard Create → Delete
