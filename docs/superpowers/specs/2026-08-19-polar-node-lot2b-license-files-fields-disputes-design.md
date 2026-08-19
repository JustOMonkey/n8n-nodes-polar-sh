# Polar Node — Lot 2b: License Keys, Files, Custom Fields, Disputes Design

**Status:** Approved by user 2026-08-19, ready for implementation planning.

## Context

Lot 1 (merged to `master`) shipped the `Polar` node's first 10 resources (Benefit, Benefit Grant, Checkout, Checkout Link, Customer, Discount, Order, Product, Refund, Subscription), the `Polar Trigger` webhook node, and the `Polar API` credential (Bearer Organization Access Token, Sandbox/Production environments). Lot 2a (merged to `master`) added Meter, Event, Event Type, Customer Meter (usage-based billing).

This spec covers **Lot 2b**, the second of four thematic Lot 2 sub-lots: **License Keys** (license-gated software activation/validation), **Files** (downloadable/product-media/organization-avatar file records), **Custom Fields** (org-defined extra data collected on checkout), and **Disputes** (read-only view of payment disputes/chargebacks). These four share no functional dependency on each other or on Lot 2a — they're grouped only by "everything left that isn't usage-billing, membership, or payments/webhooks-management" per the original 4-way split.

Later sub-lots (not yet designed): 2c (Members, Customer Seats, Customer Sessions, Organization Access Tokens), 2d (Payments, Webhook Endpoints management API). `Organizations` (get/update) remains explicitly excluded from all of Lot 2, per the Lot 2a spec's reasoning.

## Global constraints (carried from Lot 1 / Lot 2a, unchanged)

- Auth: reuse the existing `Polar API` credential and its Bearer-token `authenticate` — no new credential.
- Follow the established file/routing conventions: one file per operation under `nodes/Polar/resources/<resource>/`, an `index.ts` exporting the Resource+Operation dropdown wiring, declarative `routing.send`/`routing.request` only (no custom `execute()` — see the File Create scope decision below for why this still holds even for the S3 upload flow), reuse of `nodes/Polar/shared/descriptions.ts` helpers (`metadataField`, `paginationProperties`, `customerLocator`, `currencyOptions`, `ShowCondition`) wherever the shape matches.
- Cross-resource and own-resource ID fields are plain `type: 'string'`, never `resourceLocator`/`loadOptions`, matching Lot 1/1b/2a's established convention (`benefitId`, `productId`, `meterId`, etc.).
- Update operations use the self-omitting `type: 'collection'` "Update Fields" pattern wherever the target schema's fields are all independently optional (matches `discount/update.ts`'s reference pattern, reused throughout Lot 2a).
- 5+-item `options`/`collection`/`fixedCollection` arrays must be alphabetized by `displayName` (project lint rule).
- Boolean field descriptions must contain the word "whether".
- No new runtime npm dependency.
- Ground every field name and endpoint in the real OpenAPI spec (`https://polar.sh/docs/openapi.yaml`, re-fetched and cached during this design session) — never guess.
- Resource dropdown stays alphabetical. Inserting Custom Field, Dispute, File, License Key into the existing 14 gives: Benefit, Benefit Grant, Checkout, Checkout Link, **Custom Field**, Customer, Customer Meter, Discount, **Dispute**, Event, Event Type, **File**, **License Key**, Meter, Order, Product, Refund, Subscription.

## Shared: typed key-value field helper

Several schemas in this sub-lot (`LicenseKeyActivate.conditions`, `LicenseKeyActivate.meta`, `LicenseKeyValidate.conditions`, and every Custom Field Create/Update variant's `metadata`) declare their key-value bag as `additionalProperties: anyOf[string(maxLength 500), integer, number, boolean]` — genuinely typed values, not the plain-string `Metadata` shape the existing `metadataField` helper in `shared/descriptions.ts` was built for (which always sends every value as a JSON string).

Lot 2a's final whole-branch review caught exactly this bug class in Meter's Filter clause `value` field (numeric/boolean-looking values sent as strings, silently corrupting `gt`/`lt`/etc. comparisons against Polar's actually-typed field) — the fix coerced `"true"`/`"false"` to real booleans and numeric-looking strings to real numbers. This sub-lot needs the same coercion in three more places, so it belongs in a shared helper instead of being hand-rolled a third and fourth time.

**Add `typedMetadataField` to `shared/descriptions.ts`**: same `fixedCollection` shape as `metadataField` (repeatable Key/Value pairs), but the routing expression coerces each value with the same ternary used in the Lot 2a fix (`v === "true" ? true : (v === "false" ? false : (v !== "" && !isNaN(Number(v)) ? Number(v) : v))`) before assembling the object via `Object.fromEntries`. Existing `metadataField` call sites are untouched — this is a new, additional helper, not a replacement (the plain-string `metadata` fields elsewhere in the package have their own separate, already-correct, string-only API contract; forcing them through the typed helper would be an unrelated behavior change out of this sub-lot's scope).

## Resources

### Dispute (read-only)

Disputes are Stripe-managed; the Polar API only exposes reads — no Create/Update/Delete exists, and this isn't an oversight.

| Operation | Method + path | Notes |
|---|---|---|
| Get Many | `GET /v1/disputes/` | Filters: `organization_id` (omit per Lot 1's single-org convention), `order_id`, `status` (`DisputeStatus`: prevented/early_warning/needs_response/under_review/lost/won), `sorting` (`DisputeSortProperty`: created_at/amount, default `-created_at`). Standard `paginationProperties`. |
| Get | `GET /v1/disputes/{id}` | Plain `disputeId` string field. |

### Custom Field

A 5-way discriminated union by `type` (`text`/`number`/`date`/`checkbox`/`select`) on **both** Create and Update — structurally like Meter's Aggregation discriminator from Lot 2a, but the discriminator sits at the top level of the resource (drives the whole "Properties" sub-shape) rather than gating a single sibling field.

Every type shares three optional form-display fields inside `properties`: `form_label`, `form_help_text`, `form_placeholder` (all `minLength: 1` when set — omit rather than send empty strings). Beyond that:
- **Number** & **Date**: add `ge`/`le` (int32-bounded) — numeric/date bounds.
- **Text**: adds `textarea` (boolean), `min_length`, `max_length` (int, `minimum: 0`).
- **Checkbox**: no extra fields beyond the shared three.
- **Select**: adds `options` (required, `minItems: 1`, array of `{value, label}`, both required strings) — a nested repeatable `fixedCollection`, same shape class as Meter's Filter Clauses builder.

| Operation | Method + path | Notes |
|---|---|---|
| Get Many | `GET /v1/custom-fields/` | Filters: `organization_id` (omit), `query` (name/slug search string), `type` (`CustomFieldType` filter), `sorting` (`CustomFieldSortProperty`: created_at/slug/name/type, default `slug`). |
| Get | `GET /v1/custom-fields/{id}` | Plain `customFieldId` string field. |
| Create | `POST /v1/custom-fields/` | `slug` (required, pattern `^[a-z0-9-_]+$`), `name` (required), `organization_id` (omit), `typedMetadataField`-based `metadata`, plus a required **Type** dropdown (text/number/date/checkbox/select) whose value both feeds the `type` const/discriminator key *and* gates which of the type-specific `properties` fields are shown — composited into the request body's `properties` object via the same discriminated composite-assembly idiom as Meter's Aggregation. |
| Update | `PATCH /v1/custom-fields/{id}` | `type` is immutable (required `const` on every `CustomFieldUpdate*` variant) — the operation needs its own required **Type** selector (must match the field's actual existing type; document this in the field's description since the node has no way to look up the existing value first) to know which `properties` shape to composite, exactly mirroring Create's discriminator. `name`/`slug` (both nullable-optional) and `metadata` sit in a self-omitting Update Fields collection; the type-specific `properties` sub-fields are individually optional too (the whole `properties` object is itself nullable on every Update variant) — omit the `properties` key entirely when none of its sub-fields were touched, same discipline as Meter Update's `filter`/`aggregation` omission. |
| Delete | `DELETE /v1/custom-fields/{id}` | Plain ID field, no request body. |

### License Key

Two distinct access patterns share this resource: an **admin CRUD API** keyed by the license key's UUID `id` (List/Get/Update/Get Activation), and a **customer-facing operations API** keyed by the raw `key` string + `organization_id` (Validate/Activate/Deactivate) — grouped together here because Polar's own SDKs group them under one `license_keys` namespace, but they take genuinely different identifying parameters, so each operation's brief must be explicit about which one it expects.

| Operation | Method + path | Notes |
|---|---|---|
| Get Many | `GET /v1/license-keys/` | Filters: `organization_id` (omit), `benefit_id`, `status` (`LicenseKeyStatus`: granted/revoked/disabled). |
| Get | `GET /v1/license-keys/{id}` | Plain `licenseKeyId` string field. Returns `LicenseKeyWithActivations` (the key plus its activation list) — pass through as-is. |
| Update | `PATCH /v1/license-keys/{id}` | Self-omitting Update Fields collection: `status` (`LicenseKeyStatus`, nullable), `usage` (int, default 0), `limit_activations` (int, 1–1000, nullable), `limit_usage` (int, nullable), `expires_at` (date-time, nullable). All fields are independently optional per the schema — no discriminator needed here. |
| Get Activation | `GET /v1/license-keys/{id}/activations/{activation_id}` | Two plain ID fields: `licenseKeyId` (path `id`) + `activationId`. |
| Validate | `POST /v1/license-keys/validate` | Body: `key` + `organization_id` (both required), `activation_id`, `benefit_id`, `customer_id` (all optional UUIDs), `increment_usage` (optional int ≥ 0), `conditions` (optional, `typedMetadataField`). |
| Activate | `POST /v1/license-keys/activate` | Body: `key` + `organization_id` + `label` (all required), `conditions` + `meta` (both optional, `typedMetadataField`). Returns `LicenseKeyActivationRead`. Note from the spec: "License key activation not supported or limit reached" is a documented 403 — surface Polar's error message as-is, no special handling needed (matches how every other resource already lets `routing`'s default error passthrough handle non-2xx). |
| Deactivate | `POST /v1/license-keys/deactivate` | Body: `key` + `organization_id` + `activation_id` (all required). Returns `204 No Content`. |

### File

Polar's real upload flow is a genuine S3 multipart upload with no single API call that does the whole thing: `POST /v1/files/` declares the file and its parts and returns presigned S3 URLs; the caller then PUTs binary bytes to each URL directly against S3 (not the Polar API) and collects the returned ETags; `POST /v1/files/{id}/uploaded` reports those ETags/checksums back to complete the upload. Polar's own SDKs don't hide this either — their "create file" helpers are userland wrappers around these same two raw API calls plus the caller's own S3 PUT logic.

**Approved scope: declarative primitives only.** Create and Complete Upload are implemented as plain declarative POST calls — pure data entry, identical in kind to every other Create/action operation in this package. The actual S3 PUT step is left to the user's own workflow (a standard n8n HTTP Request node, using the presigned URLs this node's Create operation returns). This keeps the whole package free of binary-data handling, checksum computation, and multi-step orchestration — explicitly rejected alternatives were (a) a full non-declarative `execute()`-based upload orchestrator, and (b) dropping Create/Complete Upload entirely and offering only metadata operations.

There is no singular `GET /v1/files/{id}` endpoint in this API — Get Many with the `ids` filter is the only way to fetch a specific file, and this sub-lot does not add a synthetic single-Get wrapper around it (consistent with Event Type's Lot 2a precedent of only offering what the API actually exposes).

Create and the `service`-discriminated Update response are both a 3-way union by `service` (`downloadable`/`product_media`/`organization_avatar`); Create's discriminator determines request shape, but all three variants share an *identical* field set (`organization_id` omit, `name`, `mime_type`, `size`, `checksum_sha256_base64` optional, `upload`, `version` optional on `downloadable` only — confirm during planning whether `product_media`/`organization_avatar` also expose `version`, since only `DownloadableFileCreate` was confirmed to have it in this research pass) — the only real differences are documentation-level (size caps: 10 MB downloadable-unbounded-in-practice / 10 MB product_media / 1 MB organization_avatar; MIME pattern `^image/(jpeg|png|gif|webp|svg\+xml)$` restricts product_media and organization_avatar to images only, downloadable accepts any MIME type). Since the request *shape* doesn't change across the three (only the `service` const value and validation limits), this composites more like Discount's 2-way type toggle than a full field-set-swapping discriminator — the Service dropdown just feeds the `service` body key, with size-limit/MIME-pattern guidance surfaced in field descriptions rather than enforced client-side.

| Operation | Method + path | Notes |
|---|---|---|
| Get Many | `GET /v1/files/` | Filters: `organization_id` (omit), `ids` (accepts one or many UUIDs). |
| Create | `POST /v1/files/` | `service` (Downloadable/Product Media/Organization Avatar dropdown, required), `name`, `mime_type`, `size` (all required), `checksum_sha256_base64` (optional), `version` (optional — confirm per-variant applicability when writing the plan), and an Upload Parts builder: repeatable `fixedCollection` of `{number, chunk_start, chunk_end, checksum_sha256_base64 (optional)}` composited into `upload: { parts: [...] }`. Returns `FileUpload` including the presigned `upload.parts[].url` — pass through as-is for the user's own S3 PUT step. |
| Complete Upload | `POST /v1/files/{id}/uploaded` | `fileId` (path), `path` (body, required — the storage path Polar returned from Create), and a Completed Parts builder: repeatable `fixedCollection` of `{number, checksum_etag (required), checksum_sha256_base64 (optional)}`, composited into `parts: [...]`. Returns the completed file record (discriminated by `service`, same 3-way union as above) — pass through as-is. |
| Update | `PATCH /v1/files/{id}` | Self-omitting Update Fields collection: `name`, `version` (both nullable-optional per `FilePatch`). |
| Delete | `DELETE /v1/files/{id}` | Plain ID field, no request body. |

## What this sub-lot deliberately does NOT do

- No File single-Get — genuinely absent from the API (see above), not an oversight.
- No binary upload/download handling anywhere in this sub-lot — File Create/Complete Upload are declarative primitives only, per the approved scope decision; actually moving bytes is the user's own workflow's job.
- No Dispute Create/Update/Delete — disputes are Stripe-managed and the API only exposes reads.
- No Custom Field Type change on Update — `type` is immutable in the schema itself (every `CustomFieldUpdate*` variant's `type` is a `const`), so the Update operation's Type selector exists only to pick which shape to send, never to actually change the field's type.

## Open questions carried into the plan

- Confirm whether `version` is present on `ProductMediaFileCreate`/`OrganizationAvatarFileCreate` (only confirmed on `DownloadableFileCreate` during this design pass) — affects whether the Version field is shown for all three Service values or gated to Downloadable only.
- Decide the exact query-param encoding for License Key Get Many's `status` and Custom Field Get Many's `type` filters if arrays are supported (both schemas allow `anyOf[single, array, null]` like every other Lot 2a list filter) — same pattern already solved in Lot 2a, just needs the same treatment applied here.

## Testing note

License Key Validate/Activate/Deactivate and Custom Field's discriminated Create/Update are this sub-lot's highest-risk surfaces (typed-value coercion bugs and discriminator gap/overlap bugs are exactly the bug classes Lot 2a's final review caught). Manual Sandbox verification should include: create a Custom Field of each of the 5 types and confirm each type's specific `properties` round-trip correctly; activate a License Key with `conditions`/`meta` containing a mix of string/number/boolean values and confirm Polar's stored values keep their real JSON types (not stringified); run a full File Create → (manual S3 PUT via a separate HTTP Request node in the test workflow) → Complete Upload sequence at least once to confirm the two Polar-side calls compose correctly end-to-end.
