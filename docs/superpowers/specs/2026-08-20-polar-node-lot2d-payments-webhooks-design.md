# Polar Node — Lot 2d: Payments, Webhook Endpoint, Webhook Delivery Design

**Status:** Approved by user 2026-08-20, ready for implementation planning.

## Context

Lot 1 (merged) shipped the `Polar` node's first 10 resources, the `Polar Trigger` webhook node, and the `Polar API` credential. Lot 2a (merged) added Meter, Event, Event Type, Customer Meter. Lot 2b (merged) added Custom Field, Dispute, File, License Key. Lot 2c (merged) added Customer Seat, Customer Session, Member, Organization Access Token — bringing the node to 22 resources.

This spec covers **Lot 2d**, the fourth and final of Lot 2's thematic sub-lots: **Payment** (read-only), **Webhook Endpoint** (full CRUD management of webhook subscriptions), and **Webhook Delivery** (delivery history + redelivery, split out of the same underlying `/v1/webhooks/*` API surface as Webhook Endpoint).

After this lot, the only remaining scoped-out item is `Organizations` (get/update), explicitly excluded from all of Lot 2 per the Lot 2a spec's reasoning — a single Organization Access Token maps to exactly one org, so List/Create-style multi-org flows don't fit this package's single-org-credential model.

## Global constraints (carried from Lot 1 / 2a / 2b / 2c, unchanged)

- Auth: reuse the existing `Polar API` credential and its Bearer-token `authenticate` — no new credential.
- Follow established file/routing conventions: one file per operation under `nodes/Polar/resources/<resource>/`, an `index.ts` exporting the Resource+Operation dropdown wiring, declarative `routing.send`/`routing.request` only, reuse `nodes/Polar/shared/descriptions.ts` helpers (`paginationProperties`) wherever the shape matches.
- Cross-resource and own-resource ID fields are plain `type: 'string'`, never `resourceLocator`/`loadOptions`.
- Update operations use the self-omitting `type: 'collection'` "Update Fields" pattern wherever the target schema's fields are all independently optional.
- 5+-item `options`/`multiOptions` arrays must be alphabetized by `displayName` (verified via the actual `localeCompare`-based lint comparator, not hand-reasoning) — this lot's instance is the 35-value `WebhookEventType` enum, exposed as a new shared constant `webhookEventTypeOptions` in `shared/descriptions.ts`.
- Boolean field descriptions must contain the word "whether".
- No new runtime npm dependency.
- Ground every field name and endpoint in the real OpenAPI spec (`https://polar.sh/docs/openapi.yaml`, re-fetched and cached during this design session) — never guess.
- Resource dropdown stays alphabetical. Inserting Payment, Webhook Delivery, Webhook Endpoint into the existing 22 gives 25 total: Benefit, Benefit Grant, Checkout, Checkout Link, Custom Field, Customer, Customer Meter, Customer Seat, Customer Session, Discount, Dispute, Event, Event Type, File, License Key, Member, Meter, Order, Organization Access Token, **Payment**, Product, Refund, Subscription, **Webhook Delivery**, **Webhook Endpoint**.
- `organization_id` is never exposed as a field/filter anywhere in this lot, per the established convention — every list endpoint in this lot has a real `organization_id` filter in the schema; all are omitted, same as every prior lot.
- No `sorting` filter exposed on any Get Many operation, matching the established convention (Payment's `list` has a real `sorting` parameter; omitted, same as every prior lot).
- Array-capable ID/free-text filters (schemas typed `anyOf: [T, array<T>, null]`) are exposed as a single plain field of type `T`, never as a multi-value input — this mirrors the existing convention already used throughout the package (e.g. Order's `customer_id`/`product_id` filters, which have the identical array-capable shape in the real spec but are single plain `string` fields). Only genuine fixed enums get `multiOptions`.

## Resources

### Payment

Read-only — the API exposes `payments:read` only, no `payments:write`, so there is no Create/Update/Delete. `Payment` itself is `anyOf: [CardPayment, GenericPayment]`; both variants are passed through as-is (no client-side discrimination needed, matches how other polymorphic response bodies are already handled in this package).

| Operation | Method + path | Notes |
|---|---|---|
| Get Many | `GET /v1/payments/` | Filters: `checkout_id`, `order_id`, `customer_id` (all plain string, array-capable in the real schema but exposed singular per convention), `status` (`multiOptions`: Failed/Pending/Succeeded — only 3 values, alphabetized), `method` (plain string, free text — no enum in the schema), `customer_email` (plain string). |
| Get | `GET /v1/payments/{id}` | Plain `paymentId` string field. |

### Webhook Endpoint

Full CRUD plus secret rotation. `organization_id` on Create is real (`WebhookEndpointCreate.organization_id`, nullable-optional, "required unless you use an organization token") but omitted per the standing convention — this package's credential is always org-scoped.

| Operation | Method + path | Notes |
|---|---|---|
| Get Many | `GET /v1/webhooks/endpoints` | Pagination only — the only real filter is `organization_id`, omitted. |
| Get | `GET /v1/webhooks/endpoints/{id}` | Plain `webhookEndpointId` string field. |
| Create | `POST /v1/webhooks/endpoints` | `url` (required, max 2083 chars), `name` (optional), `format` (required `options`: Discord/Raw/Slack, alphabetized — 3 values, `WebhookFormat` enum), `events` (required `multiOptions`, the 35-value `webhookEventTypeOptions` shared constant). |
| Update | `PATCH /v1/webhooks/endpoints/{id}` | Self-omitting Update Fields collection: `url`, `name`, `format`, `events`, `enabled` (boolean) — all independently nullable-optional per `WebhookEndpointUpdate`. |
| Delete | `DELETE /v1/webhooks/endpoints/{id}` | Plain ID field, no request body. 204 response. |
| Reset Secret | `PATCH /v1/webhooks/endpoints/{id}/secret` | Plain ID field, no request body. Returns the full `WebhookEndpoint` with the new `secret` — pass through as-is; worth a one-line operation description noting the old secret is invalidated immediately. |

### Webhook Delivery

Delivery history and redelivery — split from Webhook Endpoint because it operates on different underlying objects (`WebhookDelivery`, `WebhookEvent`) even though it shares the same `/v1/webhooks/*` API family. No Create/Update/Delete — deliveries are system-generated; the only write-shaped action is Redeliver, which schedules a new delivery attempt rather than mutating an existing record.

| Operation | Method + path | Notes |
|---|---|---|
| Get Many | `GET /v1/webhooks/deliveries` | Filters: `endpoint_id` (plain string, array-capable in schema but singular per convention), `start_timestamp`/`end_timestamp` (`dateTime`), `succeeded` (boolean), `query` (plain string, free-text search), `http_code_class` (`options`: 2xx/3xx/4xx/5xx — already in ascending order, which is also alphabetical), `event_type` (`multiOptions`, reusing the same 35-value `webhookEventTypeOptions` shared constant). Response is the standard `ListResource_WebhookDelivery_` shape — use `paginationProperties`. |
| Redeliver | `POST /v1/webhooks/events/{id}/redeliver` | Path field is a **webhook event ID**, not an endpoint or delivery ID — name it `webhookEventId` and say so explicitly in the field description to avoid confusion with Webhook Endpoint's ID field. No body. Response is 202 with an empty `{}` schema — pass through as-is (will render as an empty object in n8n, which is correct and expected). |

## New shared constant: `webhookEventTypeOptions`

Added to `nodes/Polar/shared/descriptions.ts`, analogous to Lot 2c's `availableScopeOptions`: the full 35-value `WebhookEventType` enum, formatted as `"<Resource>: <Action>"` (dots → colons, underscores → spaces, Title Case — e.g. `benefit_grant.created` → "Benefit Grant: Created"), alphabetized by that display label using the real `localeCompare`-based lint comparator. Consumed by Webhook Endpoint's Create/Update and Webhook Delivery's Get Many.

## What this sub-lot deliberately does NOT do

- No Payment Create/Update/Delete — genuinely absent from the API (`payments:read` only, no `payments:write` scope exists).
- No `multiOptions`/array inputs for array-capable-but-unbounded filters (Payment's `checkout_id`/`order_id`/`customer_id`/`method`/`customer_email`, Webhook Delivery's `endpoint_id`) — single plain fields, matching the package-wide convention for this schema shape.
- No client-side handling of Webhook Endpoint Create's "required unless organization token" note on `organization_id` — the field itself is omitted per the standing convention, so this is moot; the credential's token is always org-scoped.
- No special handling of Redeliver's empty `{}` response body — passed through as-is like every other endpoint in this package.

## Testing note

Webhook Endpoint's full lifecycle (Create → Get → Update → Reset Secret → Delete) is straightforward to verify against Sandbox. Webhook Delivery requires an actual delivered event to exist first — the realistic sequence is: Create a Webhook Endpoint pointed at a URL that will actually receive it (e.g. webhook.site), trigger any event covered by its `events` list (e.g. create a Checkout), then Get Many Deliveries filtered by that `endpoint_id`, and finally Redeliver using the `webhook_event.id` from one of the returned deliveries.
