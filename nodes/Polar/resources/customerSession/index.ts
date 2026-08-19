import type { INodeProperties } from 'n8n-workflow';
import { customerSessionCreateDescription } from './create';

const showOnlyForCustomerSession = { resource: ['customerSession'] };

export const customerSessionDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForCustomerSession },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a customer session',
				description: 'Generate a one-time customer portal access token',
				routing: { request: { method: 'POST', url: '=/customer-sessions/' } },
			},
		],
		default: 'create',
	},
	...customerSessionCreateDescription,
];
