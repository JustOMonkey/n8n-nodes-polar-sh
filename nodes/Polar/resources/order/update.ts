import type { INodeProperties } from 'n8n-workflow';
import { billingAddressField } from '../../shared/descriptions';

const show = { resource: ['order'], operation: ['update'] };

export const orderUpdateDescription: INodeProperties[] = [
	{
		displayName: 'Order ID',
		name: 'orderId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
	billingAddressField('billingAddress', 'billing_address', show),
	{
		displayName: 'Billing Name',
		name: 'billingName',
		type: 'string',
		default: '',
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'billing_name' } },
	},
];
