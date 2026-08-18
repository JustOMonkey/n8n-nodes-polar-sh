import type { INodeProperties } from 'n8n-workflow';
import { refundGetAllDescription } from './getAll';
import { refundCreateDescription } from './create';

const showOnlyForRefund = { resource: ['refund'] };

export const refundDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForRefund },
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many refunds',
				description: 'Get many refunds',
				routing: { request: { method: 'GET', url: '=/refunds/' } },
			},
			{
				name: 'Create',
				value: 'create',
				action: 'Create a refund',
				description: 'Refund all or part of an order',
				routing: { request: { method: 'POST', url: '=/refunds/' } },
			},
		],
		default: 'getAll',
	},
	...refundGetAllDescription,
	...refundCreateDescription,
];
