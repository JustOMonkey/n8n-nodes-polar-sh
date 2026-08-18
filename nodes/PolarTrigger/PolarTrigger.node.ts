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
	const value = secret.startsWith('whsec_') ? secret.slice('whsec_'.length) : secret;
	return Buffer.from(value, 'base64');
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
