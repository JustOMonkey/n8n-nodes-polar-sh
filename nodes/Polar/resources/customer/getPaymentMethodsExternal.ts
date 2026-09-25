import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../shared/descriptions';

const show = { resource: ['customer'], operation: ['getPaymentMethodsExternal'] };

export const customerGetPaymentMethodsExternalDescription: INodeProperties[] = [
	{
		displayName: 'External Customer ID',
		name: 'externalCustomerId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'The customer ID in your own system, as set when the customer was created',
	},
	...paginationProperties(show),
];
