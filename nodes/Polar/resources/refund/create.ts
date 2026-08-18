import type { INodeProperties } from 'n8n-workflow';
import { metadataField } from '../../shared/descriptions';

const show = { resource: ['refund'], operation: ['create'] };

export const refundCreateDescription: INodeProperties[] = [
	{
		displayName: 'Order ID',
		name: 'orderId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'order_id' } },
	},
	{
		displayName: 'Reason',
		name: 'reason',
		type: 'options',
		options: [
			{ name: 'Customer Request', value: 'customer_request' },
			{ name: 'Duplicate', value: 'duplicate' },
			{ name: 'Fraudulent', value: 'fraudulent' },
			{ name: 'Other', value: 'other' },
			{ name: 'Satisfaction Guarantee', value: 'satisfaction_guarantee' },
			{ name: 'Service Disruption', value: 'service_disruption' },
		],
		default: 'customer_request',
		required: true,
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'reason' } },
	},
	{
		displayName: 'Amount (Cents)',
		name: 'amount',
		type: 'number',
		typeOptions: { minValue: 1 },
		default: 1,
		required: true,
		displayOptions: { show },
		description: 'Amount to refund in cents. Minimum is 1.',
		routing: { send: { type: 'body', property: 'amount' } },
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
				displayName: 'Comment',
				name: 'comment',
				type: 'string',
				default: '',
				routing: { request: { body: { comment: '={{$value}}' } } },
			},
			{
				displayName: 'Revoke Benefits',
				name: 'revoke_benefits',
				type: 'boolean',
				default: false,
				description: 'Whether this refund should also revoke the customer benefits granted by the order',
				routing: { request: { body: { revoke_benefits: '={{$value}}' } } },
			},
		],
	},
];
