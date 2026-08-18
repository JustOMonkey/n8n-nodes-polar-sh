import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['order'], operation: ['finalize'] };

export const orderFinalizeDescription: INodeProperties[] = [
	{
		displayName: 'Order ID',
		name: 'orderId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'The ID of the draft order to finalize and charge off-session',
	},
	{
		displayName: 'Payment Method ID',
		name: 'paymentMethodId',
		type: 'string',
		default: '',
		displayOptions: { show },
		description: "ID of the payment method to charge. Falls back to the customer's default payment method when left empty.",
		routing: {
			send: {
				type: 'body',
				property: 'payment_method_id',
				value: '={{ $value || undefined }}',
			},
		},
	},
];
