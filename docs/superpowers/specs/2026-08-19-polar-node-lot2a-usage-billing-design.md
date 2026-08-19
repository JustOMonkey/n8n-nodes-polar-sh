# Polar Node — Lot 2a: Usage & Billing (Meters, Events, Event Types, Customer Meters) Design

**Status:** Approved by user 2026-08-19, ready for implementation planning.

## Context

Lot 1 (merged to `master`) shipped the `Polar` node's first 10 resources (Benefit, Benefit Grant, Checkout, Checkout Link, Customer, Discount, Order, Product, Refund, Subscription), the `Polar Trigger` webhook node, and the `Polar API` credential (Bearer Organization Access Token, Sandbox/Production environments).

The remaining Polar API surface ("Lot 2", per project memory) is split into four thematic sub-lots. This spec covers **Lot 2a: usage-based billing** — the group of resources that let a workflow read and shape Polar's metered-billing pipeline: raw usage **Events**, the **Event Types** Polar derives from them, **Meters** that aggregate events into billable quantities, and **Customer Meters** (a customer's current balance against a meter). This ties directly into Lot 1b's `Meter Credit` benefit type and `Metered Unit` product price type — Lot 2a is what lets a workflow *create* the meters those already reference by ID, and *push* the events that drive them.

Later sub-lots (not yet designed): 2b (License Keys, Files, Custom Fields, Disputes), 2c (Members, Customer Seats, Customer Sessions, Organization Access Tokens), 2d (Payments, Webhook Endpoints management API). `Organizations` (get/update) is explicitly excluded from all of Lot 2 — a single Organization Access Token maps to exactly one org, and List/Create target a multi-org platform use case this package doesn't support.

## Global constraints (carried from Lot 1, unchanged)

- Auth: reuse the existing `Polar API` credential and its Bearer-token `authenticate` — no new credential.
- Follow the established file/routing conventions: one file per operation under `nodes/Polar/resources/<resource>/`, an `index.ts` exporting the Resource+Operation dropdown wiring, declarative `routing.send`/`routing.request`, reuse of `nodes/Polar/shared/descriptions.ts` helpers (`metadataField`, `paginationProperties`, `customerLocator`, `currencyOptions`, `ShowCondition`) wherever the shape matches.
- Resource dropdown stays alphabetical. Inserting Customer Meter, Event, Event Type, Meter into the existing 10 gives: Benefit, Benefit Grant, Checkout, Checkout Link, Customer, **Customer Meter**, Discount, **Event**, **Event Type**, **Meter**, Order, Product, Refund, Subscription.
- No new runtime npm dependency.
- Ground every field name and endpoint in the real OpenAPI spec (`https://polar.sh/docs/openapi.yaml`, cached during this design session) — never guess.

## Resources

### Meter

CRUD-ish, but with the sub-lot's one genuinely new architectural problem (see "The Filter problem" below).

| Operation | Method + path | Notes |
|---|---|---|
| Get Many | `GET /v1/meters/` | Standard `paginationProperties` + a Filters collection (`query` search string, `metadata` key/value, `is_archived` boolean, `organization_id` — omit org filtering per Lot 1's single-org convention, matching how Lot 1 resources never expose `organization_id` since the token is already org-scoped). |
| Get | `GET /v1/meters/{id}` | Plain `meterId` string field (own-resource ID, matches Lot 1's convention: `benefitId`, `productId`, `discountId` are plain strings, not `resourceLocator`). |
| Create | `POST /v1/meters/` | Body: `name` (string, min 3 chars, required), `unit` (`MeterUnit` enum: `scalar`/`token`/`custom`, default `scalar`), `custom_label` + `custom_multiplier` (both only meaningful when `unit: custom` — gate visibility on that), `metadata` (via `metadataField`), `filter` (`Filter`, required — see below), `aggregation` (discriminated union, required — see below). |
| Update | `PATCH /v1/meters/{id}` | Same fields as Create, all optional (PATCH semantics — omit untouched fields, same `undefined`-guard discipline as every Lot 1b Update fix), plus `is_archived` (boolean). |
| Get Quantities | `GET /v1/meters/{id}/quantities` | Time-bucketed usage query: `start_timestamp`, `end_timestamp` (both required date-times), `interval` (enum: hour/day/week/month/year), plus the same `customer_id`/`external_customer_id` filters as Events. Returns a time series — pass through as-is, no special handling needed. |

**Aggregation** (`aggregation`, required on Create, discriminated by `func`): a `fixedCollection` with **one visible "Aggregation Function" dropdown** (`count`/`avg`/`max`/`min`/`sum`/`unique`) plus a conditionally-shown `property` string field (required for every function except `count`) — this is structurally identical to Lot 1b's Discount 2-way or Product's price-type 4-way discriminator: one field feeds the `func` key, a sibling `property` field is included in the composite object only when relevant. No new pattern needed.

**The Filter problem** (`filter`, required on Create): Polar's real schema is a **recursive** filter tree —

```yaml
Filter:
  conjunction: and | or
  clauses: array of (FilterClause | Filter)   # a clause can itself be a nested Filter
FilterClause:
  property: string
  operator: eq | ne | gt | gte | lt | lte | like | not_like
  value: string | integer | boolean
```

n8n's static property schema cannot represent arbitrary recursion. **Approved approach:** ship a single-level filter builder — one `conjunction` (AND/OR) dropdown plus a repeatable `fixedCollection` of flat `FilterClause` leaves (`property` / `operator` / `value`) — covering the filter shapes almost every real meter needs. For the rare case of a genuinely nested filter tree, add a second, optional **"Filter (JSON)"** string field (`type: 'string'`, `typeOptions: { rows: 4 }`) that, when non-empty, is `JSON.parse`'d and sent as the `filter` value verbatim **instead of** the flat builder's output (mutually exclusive — the flat builder is ignored when JSON override is used). This mirrors Polar's own API design: the `GET /v1/events/` list endpoint's own `filter` query parameter is *itself* documented as "JSON string following the same schema as a meter filter clause" — Polar's own tooling already expects power users to hand-author this JSON for complex cases, so this isn't a workaround invented for n8n, it matches the grain of the real API.

### Event

Read-mostly, plus a write-side batch ingest endpoint.

| Operation | Method + path | Notes |
|---|---|---|
| Get Many | `GET /v1/events/` | Rich filter set beyond Lot 1's usual page/limit: `customer_id`/`external_customer_id` (customer identity filters — reuse `customerLocator` pattern conceptually, though these accept an array so may need a `multiOptions`-style or comma-separated string field, decide exact shape in the plan), `meter_id`, `name` (event name, string or array), `source` (`EventSource` enum), `query` (free-text search), `start_timestamp`/`end_timestamp`, `parent_id` + `depth` (event nesting — Polar's events can form parent/child trees for correlated usage; expose both, default `depth` unset = all descendants), `metadata` (deepObject-style key/value query, matches the `metadataField` query-side pattern if one already exists, else a simple key/value collection sent as individual `metadata[key]=value` query params), `sorting` (array of `EventSortProperty`, default `-timestamp`). All of this is still just an (unusually large) Filters collection — no new architectural pattern, just more fields than Lot 1 resources typically had. |
| Get | `GET /v1/events/{id}` | Plain `eventId` string field. |
| List Names | `GET /v1/events/names` | Distinct event names Polar has seen for this org — useful as a discovery/autocomplete helper. Simple list, own operation (not a `loadOptions`, since the plan may reuse it as one for the Event "Name" filter field — decide in planning: if reused as `loadOptions`, register as `getEventNames`). |
| Ingest | `POST /v1/events/ingest` | Body: `events` (array, required) of either `EventCreateCustomer` (identifies by internal `customer_id`) or `EventCreateExternalCustomer` (identifies by `external_customer_id`) — each item has `timestamp`, `name` (max 128 chars), `metadata`, and the customer identifier. **Design:** a repeatable `fixedCollection` (`multipleValues: true`) where each entry has a `Customer Identifier Type` toggle (Internal ID / External ID) gating which of the two ID fields is shown, mirroring the customer-identity split already used elsewhere (Lot 1's `customerLocator` for internal IDs, external-ID variants seen on Customer/Member operations) — assembled into the correct `EventCreateCustomer`/`EventCreateExternalCustomer` shape per array entry via the same `.toString()`-embedded-function trick used for `buildPricesArray`/`configuredOutputs`. This is the sub-lot's second non-trivial pattern (a *heterogeneous array*, vs. Lot 1's single discriminated *object*) — call this out explicitly in the plan's Global Constraints so the task brief has a concrete worked example, not just a description. |

### Event Type

Smallest resource in this sub-lot — Polar auto-derives an Event Type record the first time an event with that name is ingested; the API only lets you list them and edit their metadata/description, never create or delete directly.

| Operation | Method + path | Notes |
|---|---|---|
| Get Many | `GET /v1/event-types/` | Standard pagination + light filters (name, is_archived — confirm exact filter set when writing the plan). |
| Update | `PATCH /v1/event-types/{id}` | Metadata-only edit (display name, description, is_archived) — no Create/Delete/Get-by-id per the spec. |

### Customer Meter

Read-only view of a customer's live balance against a meter (their credited/consumed usage) — the org-scoped counterpart to the customer-portal's self-service "my meters" view (which stays out of scope, same as the rest of `customer_portal:*`).

| Operation | Method + path | Notes |
|---|---|---|
| Get Many | `GET /v1/customer-meters/` | Filters: `customer_id`/`external_customer_id`, `meter_id`. Reuse `customerLocator` for the customer filter exactly as Lot 1 resources already do. |
| Get | `GET /v1/customer-meters/{id}` | Plain `customerMeterId` string field. |

## What this sub-lot deliberately does NOT do

- No Meter Delete/Archive-as-delete beyond the `is_archived` flag Update already exposes — the API has no delete endpoint for meters (usage history must be preserved), so none is offered.
- No Event Create for a *single* event — only the batch `Ingest` endpoint exists in the API; a single-event convenience wrapper would just be `Ingest` with a one-item array, so the plan should consider whether to also expose a simpler "Ingest (Single Event)" operation as a thin convenience layer, or trust users to use a one-item Ingest — **flagged as an open question for the plan**, not decided here since it's a UX call, not an API-grounding call.
- No Event Type Create/Delete/Get-by-ID — genuinely absent from the API, not an oversight.

## Testing note

Meters/Events depend on each other end-to-end (a Meter's `filter` matches against ingested Events' `name`/properties, and a Customer Meter's balance only appears after real usage flows through). Manual Sandbox verification for this sub-lot needs a realistic sequence: create a Meter → ingest a matching Event via a real customer → confirm the Customer Meter balance reflects it — carry this exact sequence into the plan's verification steps, same rigor as Lot 1a's Subscription lifecycle testing note.
