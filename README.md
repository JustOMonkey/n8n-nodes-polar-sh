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

- **Benefit** — Get Many, Get, Create, Update, Delete, Get Grants
- **Benefit Grant** — Get Many
- **Checkout** — Get Many, Get, Create, Update
- **Checkout Link** — Get Many, Get, Create, Update, Delete
- **Custom Field** — Create, Delete, Get, Get Many, Update — org-defined extra data fields (text/number/date/checkbox/select) collected on checkout
- **Customer** — Get Many, Get, Get by External ID, Create, Update, Update by External ID, Delete, Delete by External ID, Get State, Get State by External ID, Get Payment Methods
- **Customer Meter** — Get Many, Get
- **Discount** — Get Many, Get, Create, Update, Delete
- **Dispute** — Get, Get Many — read-only view of payment disputes/chargebacks
- **Event** — Get Many, Get, Ingest, List Names
- **Event Type** — Get Many, Update
- **File** — Complete Upload, Create, Delete, Get Many, Update — declarative primitives for Polar's S3 multipart file upload flow (Create returns presigned upload URLs; actually PUTing file bytes to S3 is done in your own workflow, e.g. with an HTTP Request node, before calling Complete Upload)
- **License Key** — Activate, Deactivate, Get, Get Activation, Get Many, Update, Validate — license-gated software activation and validation
- **Meter** — Create, Get, Get Many, Get Quantities, Update
- **Order** — Get Many, Get, Create, Update, Finalize, Generate Invoice, Get Invoice, Get Receipt
- **Product** — Get Many, Get, Create, Update, Update Benefits
- **Refund** — Get Many, Create
- **Subscription** — Get Many, Get, Create, Update, Update Seats, Update Billing Period, Cancel, Revoke, Pause, Resume, Clear Pending Update

### Polar Trigger

A webhook trigger node for Polar's ~30 event types (`checkout.*`, `customer.*`, `subscription.*`, `order.*`, `refund.*`, `benefit_grant.*`, `benefit.*`, `product.*`, `discount.*`, `organization.updated`). You create the webhook endpoint by hand in the Polar dashboard, pointing it at this node's webhook URL, and paste the generated signing secret into the node. Signatures are verified against the [Standard Webhooks](https://www.standardwebhooks.com/) spec.

By default the node listens for a single event type. Turn on **Allow Multiple Events** (mirrors n8n's core Webhook node's "Allow Multiple HTTP Methods" setting) to select several event types at once — the node then exposes one output per selected event, in the order selected, and routes each incoming webhook to the output matching its `type`.

The webhook **Path** field is empty by default, in which case the node's URL ends in its own automatically-generated unique ID (the same behavior as n8n's core Webhook node) — no two `Polar Trigger` nodes ever collide on the same URL. Set your own value only if you need a specific, predictable path. If you activate a workflow, change the Path, and reactivate, update the corresponding endpoint URL in the Polar dashboard to match.

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
