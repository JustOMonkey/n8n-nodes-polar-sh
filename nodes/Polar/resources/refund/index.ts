import type { INodeProperties } from 'n8n-workflow';
import { handlePolarApiError, scopeNoticesForResource } from '../../shared/errorHandling';
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
				routing: {
					request: { method: 'GET', url: '=/refunds/', ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Create',
				value: 'create',
				action: 'Create a refund',
				description: 'Refund all or part of an order',
				routing: {
					request: { method: 'POST', url: '=/refunds/', ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
		],
		default: 'getAll',
	},
	...scopeNoticesForResource('refund'),
	...refundGetAllDescription,
	...refundCreateDescription,
];
