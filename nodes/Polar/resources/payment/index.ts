import type { INodeProperties } from 'n8n-workflow';
import { handlePolarApiError, scopeNoticesForResource } from '../../shared/errorHandling';
import { paymentGetAllDescription } from './getAll';
import { paymentGetDescription } from './get';

const showOnlyForPayment = { resource: ['payment'] };

export const paymentDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForPayment },
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get a payment',
				description: 'Get a single payment by ID',
				routing: {
					request: {
						method: 'GET',
						url: '=/payments/{{$parameter["paymentId"]}}',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many payments',
				description: 'Get many payments',
				routing: {
					request: { method: 'GET', url: '=/payments/', ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
		],
		default: 'getAll',
	},
	...scopeNoticesForResource('payment'),
	...paymentGetAllDescription,
	...paymentGetDescription,
];
