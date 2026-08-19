# Polar Node — Lot 2c: Members, Customer Seats, Customer Sessions, Organization Access Tokens Design

**Status:** Approved by user 2026-08-19, ready for implementation planning.

## Context

Lot 1 (merged to `master`) shipped the `Polar` node's first 10 resources, the `Polar Trigger` webhook node, and the `Polar API` credential. Lot 2a (merged) added Meter, Event, Event Type, Customer Meter. Lot 2b (merged) added Custom Field, Dispute, File, License Key — bringing the node to 18 resources.

This spec covers **Lot 2c**, the third of four thematic Lot 2 sub-lots: **Member** (individual people within a B2B customer, for organizations with the member-management feature), **Customer Seat** (assigning/revoking/claiming those member seats against a seat-based subscription or order), **Customer Session** (one-time customer-portal access token generation), and **Organization Access Token** (managing the org-scoped API tokens themselves — the same kind of token this package's own credential uses).

Later sub-lot (not yet designed): 2d (Payments, Webhook Endpoints management API). `Organizations` (get/update) remains explicitly excluded from all of Lot 2, per the Lot 2a spec's reasoning.

## Global constraints (carried from Lot 1 / Lot 2a / Lot 2b, unchanged)

- Auth: reuse the existing `Polar API` credential and its Bearer-token `authenticate` — no new credential, **except** where noted below (Customer Seat's Get Claim Info / Claim Seat are genuinely unauthenticated per the real API — see that resource's section).
- Follow the established file/routing conventions: one file per operation under `nodes/Polar/resources/<resource>/`, an `index.ts` exporting the Resource+Operation dropdown wiring, declarative `routing.send`/`routing.request` only, reuse of `nodes/Polar/shared/descriptions.ts` helpers (`metadataField`, `typedMetadataField`, `paginationProperties`, `customerLocator`) wherever the shape matches.
- Cross-resource and own-resource ID fields are plain `type: 'string'`, never `resourceLocator`/`loadOptions`.
- Update operations use the self-omitting `type: 'collection'` "Update Fields" pattern wherever the target schema's fields are all independently optional.
- 5+-item `options`/`collection`/`fixedCollection` `options` arrays must be alphabetized by `displayName` — this lot's largest instance is Organization Access Token's `scopes` field, a 62-value `multiOptions` (the full `AvailableScope` enum) that must be fully alphabetized; ground the exact 62 values verbatim from the live OpenAPI spec when writing the plan, do not transcribe from memory.
- Boolean field descriptions must contain the word "whether".
- No new runtime npm dependency.
- Ground every field name and endpoint in the real OpenAPI spec (`https://polar.sh/docs/openapi.yaml`, re-fetched and cached during this design session) — never guess.
- Resource dropdown stays alphabetical. Inserting Customer Seat, Customer Session, Member, Organization Access Token into the existing 18 gives 22 total: Benefit, Benefit Grant, Checkout, Checkout Link, Custom Field, Customer, Customer Meter, **Customer Seat**, **Customer Session**, Discount, Dispute, Event, Event Type, File, License Key, **Member**, Meter, Order, **Organization Access Token**, Product, Refund, Subscription.
- `organization_id` is never exposed as a field/filter anywhere in this lot — every endpoint's `organization_id` is optional-with-null or query-filter-only, and the credential's token is already org-scoped (established Lot 1 convention, reconfirmed for every resource in Lot 2a/2b). Organization Access Token's List operation has an `organization_id` filter in the real schema; omit it per this same convention, consistent with every other list filter of this shape across the whole package.
- No `sorting` filter exposed on any Get Many operation in this lot, matching the established convention (Member's `getAll` and Organization Access Token's `list` both have a real `sorting` parameter in the schema; both are omitted, same as every prior lot).

## Resources

### Member

Standard CRUD plus a lookup-by-external-ID convenience. Requires the organization to have the member-management feature enabled — Polar returns a 403 otherwise; no client-side gating needed, the API's own error is sufficient (matches how every other "not permitted" 403 in this package is already handled — by not handling it specially, letting the HTTP error surface as-is).

| Operation | Method + path | Notes |
|---|---|---|
| Get Many | `GET /v1/members/` | Filters: `customer_id`, `external_customer_id`, `role` (`MemberRole`: owner/billing_manager/member). |
| Get | `GET /v1/members/{id}` | Plain `memberId` string field. |
| Get by External ID | `GET /v1/members/external/{external_id}` | Path `externalId` (required) + a Filters collection with `customer_id`/`external_customer_id` (both optional in the schema, but the description states one is required to disambiguate — same "API validates, node doesn't" precedent as Lot 2a's Aggregation Property). |
| Create | `POST /v1/members/` | `customer_id` (required), `email` (required), `name` (optional, max 256), `external_id` (optional), `role` — **note the Create-time role enum is only `member`/`billing_manager`** (2 values, not 3 — `owner` is excluded from `MemberCreate`'s own enum; the description says to use Update for ownership transfer). Do not add `owner` as a Create option — it isn't in the real schema. |
| Update | `PATCH /v1/members/{id}` | Self-omitting Update Fields collection: `name`, `role` — **Update's role uses the full `MemberRole` (owner/billing_manager/member), unlike Create's**. This 2-value-vs-3-value asymmetry between Create and Update is real and load-bearing, not a typo to "fix" into consistency. |
| Delete | `DELETE /v1/members/{id}` | Plain ID field, no request body. |

### Customer Seat

Two distinct auth contexts on one resource — mirrors License Key's admin-vs-customer-facing split from Lot 2b, but here the split is auth itself (Bearer-token org operations vs genuinely no-auth customer operations), not just a different identifying key.

**Org-authenticated operations** (use the credential normally):

| Operation | Method + path | Notes |
|---|---|---|
| List Seats | `GET /v1/customer-seats` | Filters: `subscription_id`, `order_id` (both optional UUIDs). Response is `SeatsList` (`seats: CustomerSeat[]`, `available_seats`, `total_seats`) — not a standard `ListResource_*` paginated shape, so this operation does **not** use `paginationProperties` — pass the response through as-is (matches Meter's Get Quantities precedent from Lot 2a, which also skipped pagination for a non-list-shaped response). |
| Assign Seat | `POST /v1/customer-seats` | Body: `subscription_id` OR `order_id` (locates the seat pool; one required per the description, not client-validated) + one of `email`/`customer_id`/`external_customer_id`/`member_id`/`external_member_id` (locates the recipient) + optional `checkout_id`, `immediate_claim` (boolean, default false), and `metadata` (genuinely arbitrary JSON — see below). All identifier fields are independently optional top-level fields; the API enforces the "at least one of X" constraints server-side. |
| Revoke Seat | `DELETE /v1/customer-seats/{seat_id}` | Plain `seatId` string field. Despite being a DELETE, the response body is the revoked `CustomerSeat` (200, not 204) — pass through as-is. |
| Resend Invitation | `POST /v1/customer-seats/{seat_id}/resend` | Plain `seatId` string field, no body. |

**Unauthenticated operations** (per the approved design decision — included for completeness, matching License Key's customer-facing operations precedent from Lot 2b):

| Operation | Method + path | Notes |
|---|---|---|
| Get Claim Info | `GET /v1/customer-seats/claim/{invitation_token}` | Path `invitationToken` (required). Genuinely no auth (`security: []` in the spec) — the routing still goes through the same `Polar API` credential mechanically (n8n's declarative routing always attaches the configured credential's auth), but Polar's server ignores/doesn't require it for this endpoint, so this works with or without valid credentials configured. No special node-level handling needed — document this in the field description, not in code. |
| Claim Seat | `POST /v1/customer-seats/claim` | Body: `invitation_token` (required). Same no-auth note as above. Response includes a `customer_session_token` for immediate portal access — pass through as-is. |

**The `metadata`/`seat_metadata` JSON problem**: `SeatAssign.metadata` (`additionalProperties: true`) is genuinely arbitrary JSON — any shape, any nesting — unlike License Key's `conditions`/`meta` or Custom Field's `metadata`, which are constrained to a flat string/integer/number/boolean union that `typedMetadataField` was built for. Forcing arbitrary JSON through a flat key-value builder would silently lose the ability to represent arrays or nested objects. **Approved approach:** a raw JSON string field (`type: 'string'`, `typeOptions: { rows: 4 }`, description explaining it accepts any valid JSON object), sent via `={{ $value ? JSON.parse($value) : undefined }}` — this is the exact same idiom already established and reviewed-safe for Meter's "Filter (JSON)" override field in Lot 2a, just applied to a field that has no flat-builder alternative at all (since there's no fixed key/value-type contract to build a flat UI against).

### Customer Session

A single action: generate a one-time customer-portal access token/URL.

| Operation | Method + path | Notes |
|---|---|---|
| Create | `POST /v1/customer-sessions/` | Discriminated by customer identity — **exactly the same toggle idiom already used for Event Ingest's per-entry customer identification in Lot 2a** (a mode selector gating which of `customerId`/`externalCustomerId` is sent), just for a single object instead of an array entry. Common optional fields regardless of identity mode: `member_id`, `external_member_id`, `return_url` (max 2083 chars). No Get/List/Delete — this is a pure token-minting action, same shape class as License Key's Validate/Activate. |

### Organization Access Token

Manage the org-scoped API tokens themselves.

| Operation | Method + path | Notes |
|---|---|---|
| Get Many | `GET /v1/organization-access-tokens/` | Pagination only — the only real filter is `organization_id`, omitted per this package's established convention. |
| Create | `POST /v1/organization-access-tokens/` | `comment` (required), `expires_in` (optional ISO-8601 duration string, e.g. `P30D` — plain string field with a description explaining the format, no special duration widget needed), `scopes` (required `multiOptions`, all 62 `AvailableScope` enum values, alphabetized by display label — ground the exact list from the live spec when writing the plan). Response is `OrganizationAccessTokenCreateResponse` (`{ organization_access_token, token }`) — the raw `token` string is only ever returned here, at creation time (never retrievable again) — pass through as-is, no special handling, but worth a one-line description note on the operation itself so users know to capture it immediately. |
| Update | `PATCH /v1/organization-access-tokens/{id}` | Self-omitting Update Fields collection: `comment`, `scopes` (same 62-value `multiOptions`, both independently nullable-optional per `OrganizationAccessTokenUpdate`). |
| Delete | `DELETE /v1/organization-access-tokens/{id}` | Plain ID field, no request body. |

No singular Get — genuinely absent from the API (same class of gap as File in Lot 2b), not an oversight.

## What this sub-lot deliberately does NOT do

- No Member Create with `role: owner` — genuinely absent from `MemberCreate`'s enum (only Update can produce/transfer ownership).
- No pagination properties on Customer Seat's List Seats — its response (`SeatsList`) isn't a standard paginated list shape.
- No attempt to force Customer Seat's arbitrary-JSON `metadata` through the `typedMetadataField` flat-builder pattern — a raw JSON string field is used instead, matching Meter's Filter (JSON) precedent.
- No client-side "one of X required" validation anywhere identifier clusters appear (Member's Get-by-External-ID filters, Customer Seat's Assign Seat pool/recipient identifiers) — consistent with this package's established practice of letting Polar's own 422 surface rather than duplicating its validation logic client-side.
- No Organization Access Token Get-by-ID — genuinely absent from the API.

## Testing note

Customer Seat's full lifecycle depends on a seat-based subscription or order actually existing in Sandbox (seat-based pricing must be enabled for the organization) — Assign Seat → List Seats → (optionally) Resend Invitation → Get Claim Info (with the invitation token from the assigned seat) → Claim Seat, is the realistic end-to-end sequence to verify manually, mirroring the rigor of Lot 2a's Meter/Event testing note. Organization Access Token Create should be verified to actually return a usable `token` string once, and that a second Get Many/Update never exposes it again (matches Polar's own stated one-time-reveal behavior).
