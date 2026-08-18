# n8n-nodes-polar-sh — Lot 1 Design (Core Billing)

Status: approved by user 2026-08-18, pending spec review.

## 1. Goal & scope

Build a complete n8n community node package for [Polar.sh](https://polar.sh) (a
merchant-of-record billing platform for developers): one credential, one
declarative-routing resource/operation node (`Polar`), and one webhook trigger
node (`Polar Trigger`).

The full Polar API surface (~20 resource groups, ~30 webhook events) is too
large for a single implementation pass. This spec covers **Lot 1**: the
credential, the trigger, and the core billing resources needed to run a
checkout → order → subscription lifecycle end-to-end. Lot 2 (deferred, not
detailed here) covers License Keys, Files, Meters, Events, Metrics,
Organizations, Members, Customer Seats, Customer Sessions, Custom Fields,
Payments, Disputes, Event Types, and Webhook Endpoint management via the API.

Permanently out of scope: Polar's OAuth2 client-registration endpoints
(`oauth2:*`, for building third-party Polar Connect apps) and the Customer
Portal API (`customer_portal:*`, a separate customer-scoped auth model for
building self-serve customer UIs) — neither fits the organization-automation
use case this package targets.

## 2. Ground truth

The real OpenAPI 3.1 spec was fetched from `https://polar.sh/docs/openapi.json`
(2.6 MB; the `api.polar.sh/v1/openapi.json` / `api.polar.sh/openapi.json` URLs
commonly cited online both 404). Servers declared in the spec:

- Production: `https://api.polar.sh`
- Sandbox: `https://sandbox-api.polar.sh`

All endpoints referenced below are verified against this spec, not assumed.
During implementation of each resource file, re-check the exact request/response
schema in the spec (cache a fresh copy if it's gone stale) rather than guessing
field names — this is what "no defaults, no guessing" means in practice for
this project.

## 3. Repo housekeeping

- Delete `nodes/Example/`, `nodes/GithubIssues/`, `credentials/GithubIssuesApi.credentials.ts`,
  `credentials/GithubIssuesOAuth2Api.credentials.ts`, `icons/github.svg`, `icons/github.dark.svg`.
  `icons/polar.svg` / `icons/polar.dark.svg` already exist and are reused for
  the credential, the `Polar` node, and the `Polar Trigger` node.
- Update `package.json`: `name: "n8n-nodes-polar-sh"`, `author.email` and
  `repository.author` (if present) set to `contact@justonemonkey.space`
  (not the session-identity email — confirmed with user), `n8n.credentials`
  and `n8n.nodes` arrays point at the new dist paths.

## 4. Credential: `PolarApi`

File: `credentials/PolarApi.credentials.ts`

Properties:
- `Environment` — options `Production` (`production`) / `Sandbox` (`sandbox`), default `Production`.
- `Access Token` — string, `typeOptions: { password: true }`. This is a Polar
  Organization Access Token (`polar_oat_...`), organization-scoped, obtained
  from the Polar dashboard.

Behavior:
- `authenticate`: generic, `Authorization: Bearer {{$credentials.accessToken}}`.
- `test`: `GET /v1/organizations/` against the environment-selected base URL.
- The `Polar` node's `requestDefaults.baseURL` is an expression driven by
  `$credentials.environment` (e.g.
  `={{$credentials.environment === "sandbox" ? "https://sandbox-api.polar.sh" : "https://api.polar.sh"}}/v1`),
  so every declarative-routing operation automatically hits the right
  environment without a custom transport wrapper for the common case.

## 5. Node: `Polar`

File: `nodes/Polar/Polar.node.ts` (+ `resources/*`, `listSearch/*`, `shared/*`
following the existing `nodes/GithubIssues` file layout/pattern already in
this repo: one file per operation, an `index.ts` per resource that assembles
`INodeProperties[]`, shared `descriptions.ts`/`transport.ts`/`utils.ts`).

Top-level UI: `Resource` dropdown, then `Operation` dropdown scoped to that
resource (`displayOptions.show`), matching how `GithubIssues.node.ts`
composes `issueDescription` / `issueCommentDescription`.

### 5.1 Resource → Operation → Endpoint map (Lot 1)

| Resource | Operation | Method & path |
|---|---|---|
| Product | Get Many | `GET /v1/products/` |
| Product | Get | `GET /v1/products/{id}` |
| Product | Create | `POST /v1/products/` |
| Product | Update | `PATCH /v1/products/{id}` |
| Product | Update Benefits | `POST /v1/products/{id}/benefits` |
| Checkout | Get Many | `GET /v1/checkouts/` |
| Checkout | Get | `GET /v1/checkouts/{id}` |
| Checkout | Create | `POST /v1/checkouts/` |
| Checkout | Update | `PATCH /v1/checkouts/{id}` |
| Checkout Link | Get Many | `GET /v1/checkout-links/` |
| Checkout Link | Get | `GET /v1/checkout-links/{id}` |
| Checkout Link | Create | `POST /v1/checkout-links/` |
| Checkout Link | Update | `PATCH /v1/checkout-links/{id}` |
| Checkout Link | Delete | `DELETE /v1/checkout-links/{id}` |
| Customer | Get Many | `GET /v1/customers/` |
| Customer | Get | `GET /v1/customers/{id}` |
| Customer | Get by External ID | `GET /v1/customers/external/{external_id}` |
| Customer | Create | `POST /v1/customers/` |
| Customer | Update | `PATCH /v1/customers/{id}` |
| Customer | Update by External ID | `PATCH /v1/customers/external/{external_id}` |
| Customer | Delete | `DELETE /v1/customers/{id}` |
| Customer | Delete by External ID | `DELETE /v1/customers/external/{external_id}` |
| Customer | Get State | `GET /v1/customers/{id}/state` |
| Customer | Get State by External ID | `GET /v1/customers/external/{external_id}/state` |
| Customer | Get Payment Methods | `GET /v1/customers/{id}/payment-methods` |
| Order | Get Many | `GET /v1/orders/` |
| Order | Get | `GET /v1/orders/{id}` |
| Order | Create | `POST /v1/orders/` |
| Order | Update | `PATCH /v1/orders/{id}` |
| Order | Finalize | `POST /v1/orders/{id}/finalize` |
| Order | Generate Invoice | `POST /v1/orders/{id}/invoice` |
| Order | Get Invoice | `GET /v1/orders/{id}/invoice` |
| Order | Get Receipt | `GET /v1/orders/{id}/receipt` |
| Subscription | Get Many | `GET /v1/subscriptions/` |
| Subscription | Get | `GET /v1/subscriptions/{id}` |
| Subscription | Create | `POST /v1/subscriptions/` |
| Subscription | Update | `PATCH /v1/subscriptions/{id}` |
| Subscription | Update Seats | `PATCH /v1/subscriptions/{id}` |
| Subscription | Update Billing Period | `PATCH /v1/subscriptions/{id}` |
| Subscription | Cancel | `PATCH /v1/subscriptions/{id}` |
| Subscription | Pause | `PATCH /v1/subscriptions/{id}` |
| Subscription | Resume | `PATCH /v1/subscriptions/{id}` |
| Subscription | Clear Pending Update | `PATCH /v1/subscriptions/{id}` |
| Subscription | Revoke | `DELETE /v1/subscriptions/{id}` |
| Discount | Get Many | `GET /v1/discounts/` |
| Discount | Get | `GET /v1/discounts/{id}` |
| Discount | Create | `POST /v1/discounts/` |
| Discount | Update | `PATCH /v1/discounts/{id}` |
| Discount | Delete | `DELETE /v1/discounts/{id}` |
| Refund | Get Many | `GET /v1/refunds/` |
| Refund | Create | `POST /v1/refunds/` |
| Benefit | Get Many | `GET /v1/benefits/` |
| Benefit | Get | `GET /v1/benefits/{id}` |
| Benefit | Create | `POST /v1/benefits/` |
| Benefit | Update | `PATCH /v1/benefits/{id}` |
| Benefit | Delete | `DELETE /v1/benefits/{id}` |
| Benefit | Get Grants | `GET /v1/benefits/{id}/grants` |
| Benefit Grant | Get Many | `GET /v1/benefit-grants/` |

`PATCH /v1/subscriptions/{id}` is itself an 8-way discriminated union in the
real OpenAPI spec (update product/discount/trial, resize seats, move the
billing period, cancel, revoke via this same endpoint, pause, resume, or
clear a pending change) — discovered during implementation planning, after
this table was first drafted. Each variant is exposed as its own Operation
rather than one generic "Update" hiding an internal switch, consistent with
this spec's own stated preference (§5.2) for type selectors over hidden
discriminators. "Revoke" still uses `DELETE /v1/subscriptions/{id}` rather
than the redundant `PATCH` `revoke: true` variant, since both perform the
same action and `DELETE` is the more direct match.

Excluded from Checkout: `GET/PATCH /v1/checkouts/client/{client_secret}` and
`POST /v1/checkouts/client/{client_secret}/confirm` — these are authenticated
by a client secret returned to a browser session for building a custom
checkout UI, not by the organization Bearer token, so they don't fit a
backend automation node.

Excluded from Customer: the six `customers:members:*` endpoints (B2B seat
members nested under a customer) — deferred to Lot 2 alongside Customer
Seats, which covers the same concept at the top level.

### 5.2 Cross-cutting patterns

- **Get Many pagination**: every list endpoint takes `page`/`limit` query
  params and returns `{ items, pagination: { total_count, max_page } }`
  (verified against the Product list endpoint schema). Standard n8n
  `Return All` boolean + `Limit` number, looping `page` until exhausted when
  `Return All` is set.
- **Resource locators** (`listSearch`, `nodes/Polar/listSearch/*.ts`): Product,
  Customer, Discount, and Benefit ID fields use `resourceLocator` (List /
  by ID / by expression) backed by a search call against the resource's list
  endpoint with the `query` filter param, mirroring `getRepositories.ts` /
  `getUsers.ts` in the existing `GithubIssues` node.
- **Polymorphic bodies**: Benefit `Create`/`Update` payloads are discriminated
  by a `type` field (e.g. `custom`, `discord`, `github_repository`,
  `downloadables`, `license_keys`, `meter_credit`) with different fields per
  type in the OpenAPI schema; the node exposes a `Type` select first, then
  type-scoped fields via `displayOptions`, one sub-file per type under
  `resources/benefit/create/`.
- **Money fields**: all amounts in the Polar API are integer minor units
  (cents); node fields for prices/amounts are numbers documented as such,
  no currency conversion performed by the node.

## 6. Node: `Polar Trigger`

File: `nodes/PolarTrigger/PolarTrigger.node.ts`. Webhook-type trigger node,
manual setup (no auto-registration via the Webhooks API — that's Lot 2's
`webhooks:*` endpoints; for Lot 1 the user creates the endpoint by hand in
the Polar dashboard, pointing at the n8n webhook production/test URL shown
on the node).

Properties:
- `Events` — multi-select of the ~30 event names (`checkout.created`,
  `checkout.updated`, `checkout.expired`, `customer.created`,
  `customer.updated`, `customer.deleted`, `customer.state_changed`,
  `subscription.created`, `subscription.active`, `subscription.uncanceled`,
  `subscription.cycled`, `subscription.canceled`, `subscription.past_due`,
  `subscription.updated`, `subscription.revoked`, `subscription.paused`,
  `subscription.resumed`, `order.created`, `order.paid`, `order.updated`,
  `order.refunded`, `refund.created`, `refund.updated`,
  `benefit_grant.created`, `benefit_grant.updated`, `benefit_grant.revoked`,
  `benefit.created`, `benefit.updated`, `product.created`, `product.updated`,
  `discount.created`, `discount.updated`, `discount.deleted`,
  `organization.updated`). Required, no default selection.
- `Webhook Secret` — string, `typeOptions: { password: true }`, pasted from
  the Polar dashboard when the endpoint is created there.

Behavior:
- `webhook()` reads the raw request body, verifies it against the
  **Standard Webhooks** spec using Node's built-in `crypto` module only (no
  added npm dependency): headers `webhook-id`, `webhook-timestamp`,
  `webhook-signature`; signed content is `` `${id}.${timestamp}.${rawBody}` ``;
  HMAC-SHA256 keyed by the signing secret, base64-encoded output, compared
  (constant-time) against each `v1,<sig>` entry in `webhook-signature`
  (space-separated, since Polar may rotate secrets). **Key derivation is
  provider-specific, not generic Standard Webhooks**: Polar's dashboard
  secret is raw UTF-8 key material used as-is (confirmed against
  `@polar-sh/sdk`'s `validateEvent`, which base64-*encodes* the secret
  before handing it to a generic Standard Webhooks verifier that then
  decodes it straight back) — only an explicitly `whsec_`-prefixed secret
  is base64-decoded after stripping the prefix. Assuming every Standard
  Webhooks secret is base64 (the naive reading of the spec) breaks Polar
  specifically; this was caught in Lot 1a's Task 10 code review, not during
  design, and is called out here so it isn't reintroduced.
- `webhook-timestamp` is checked against the current time with a ±300
  second tolerance (also required by the Standard Webhooks spec, missed in
  the original Task 10 draft and added during code review): after the
  header-presence check but before the signature is computed, a
  missing/non-numeric/out-of-tolerance timestamp is rejected with `400`.
  An empty `Webhook Secret` is also explicitly rejected (an empty HMAC key
  would otherwise not throw and would produce a computable, forgeable
  digest, rather than failing loudly).
- Requests with an invalid signature respond `400` and do not trigger the
  workflow. Requests whose `type` isn't in the selected `Events` list still
  respond `200` (so Polar doesn't retry) but don't trigger the workflow —
  filtering happens after verification, not before, so an attacker can't use
  event-type mismatches to probe signature validity.
- On success, returns the parsed JSON payload (`type` + `data`) as the
  workflow's input item.

## 7. Local testing (before push)

To be written up in the README:

1. `npm install`, then `npm run dev` — `@n8n/node-cli` starts a local n8n
   instance with the package linked and live-reloaded on file changes.
2. Add a `Polar API` credential in the local n8n UI using a **Sandbox**
   Polar Organization Access Token (create one at polar.sh in a sandbox
   organization) — exercise every `Polar` node operation against sandbox
   data first.
3. For the `Polar Trigger` node: `npm run dev` exposes a local n8n reachable
   only on localhost, so testing inbound webhooks needs a tunnel (n8n's
   built-in `--tunnel` mode, or `ngrok http 5678`) to get a public URL to
   register as the Polar sandbox webhook endpoint's target. Trigger a real
   sandbox event (e.g. create a sandbox checkout) and confirm the workflow
   fires and the signature check passes.
4. `npm run lint` (n8n community node ESLint rules) and `npm run build`
   must both pass before pushing.

## 8. Testing approach for implementation

Per-resource-file manual verification against Sandbox during implementation
(this is a thin declarative-routing wrapper around a well-typed REST API;
unit tests would mostly re-assert the OpenAPI schema, so the primary
verification is exercising each operation against the Polar sandbox via
`npm run dev`, plus `npm run lint`/`npm run build` as a correctness gate on
every file).
