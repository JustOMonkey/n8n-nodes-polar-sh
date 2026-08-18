import { createHmac, timingSafeEqual } from 'crypto';
import {
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

// Embedded into the `outputs` expression below via `.toString()` — the same technique
// this package's declarative routing already uses for `nextPageInfo`/`buildPricesArray`.
// n8n evaluates `outputs` expressions in an isolated context with only `$parameter`
// available, so this function must be fully self-contained (no closures, no imports).
function configuredOutputs(parameters: { events?: string | string[] }) {
	const events = parameters.events;
	if (!Array.isArray(events)) {
		return [{ type: 'main', displayName: events }];
	}
	return events.map((event) => ({ type: 'main', displayName: event }));
}

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
		subtitle: '={{ Array.isArray($parameter["events"]) ? $parameter["events"].join(", ") : $parameter["events"] }}',
		description: 'Starts the workflow when a Polar.sh webhook event is received',
		defaults: {
			name: 'Polar Trigger',
		},
		inputs: [],
		outputs: `={{(${configuredOutputs.toString()})($parameter)}}`,
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				// Every node with a `webhooks` definition gets an auto-generated `webhookId`
				// (UUID) whether or not it's ever used. Without `isFullPath: true`, n8n always
				// prefixes that UUID onto `path`, no matter what `path` is set to. Matches the
				// core Webhook node's `defaultWebhookDescription`.
				isFullPath: true,
				path: '={{$parameter["path"]}}',
			},
		],
		properties: [
			{
				displayName: 'Path',
				name: 'path',
				type: 'string',
				default: '',
				placeholder: 'webhook',
				description: "The webhook path that triggers this workflow. Leave empty to use this node's automatically-generated unique ID (matches the default behavior of n8n's core Webhook node); set your own value if you need a specific, predictable path.",
			},
			{
				displayName: 'Allow Multiple Events',
				name: 'multipleEvents',
				type: 'boolean',
				default: false,
				isNodeSetting: true,
				description: 'Whether to listen for multiple Polar event types, each routed to its own output',
			},
			{
				displayName: 'Event',
				name: 'events',
				type: 'options',
				required: true,
				default: 'checkout.created',
				displayOptions: { show: { multipleEvents: [false] } },
				options: POLAR_EVENTS.map((event) => ({ name: event, value: event })),
				description: 'Only this event type will trigger the workflow. Create a webhook endpoint for this event in the Polar dashboard, pointed at this node\'s webhook URL.',
			},
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				required: true,
				default: [],
				displayOptions: { show: { multipleEvents: [true] } },
				options: POLAR_EVENTS.map((event) => ({ name: event, value: event })),
				description: 'Only these event types will trigger the workflow, each routed to its own output in the order selected. Create a webhook endpoint for these events in the Polar dashboard, pointed at this node\'s webhook URL.',
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

	// Polar webhook endpoints are created by hand in the Polar dashboard (this
	// node has no credential and cannot call the Polar API to register or
	// remove one). checkExists always reports true so n8n's activation flow
	// never attempts create/delete against a service it has no access to.
	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				return true;
			},
			async create(this: IHookFunctions): Promise<boolean> {
				return true;
			},
			async delete(this: IHookFunctions): Promise<boolean> {
				return true;
			},
		},
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

		// `events` is a single string when "Allow Multiple Events" is off, or an array when
		// it's on — one output per selected event, matching `configuredOutputs` above.
		const events = this.getNodeParameter('events') as string | string[];
		const eventList = Array.isArray(events) ? events : [events];
		const outputIndex = payload.type ? eventList.indexOf(payload.type) : -1;

		if (outputIndex === -1) {
			res.status(200).json({ message: 'Event type not selected on this trigger, ignored' });
			return { noWebhookResponse: true };
		}

		const outputs: IDataObject[][] = eventList.map(() => []);
		outputs[outputIndex] = [payload as unknown as IDataObject];

		return {
			workflowData: outputs.map((items) => this.helpers.returnJsonArray(items)),
		};
	}
}
