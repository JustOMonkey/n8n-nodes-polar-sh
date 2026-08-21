import type { INodeProperties } from 'n8n-workflow';
import { handlePolarApiError, scopeNoticesForResource } from '../../shared/errorHandling';
import { customerMeterGetAllDescription } from './getAll';
import { customerMeterGetDescription } from './get';

const showOnlyForCustomerMeter = { resource: ['customerMeter'] };

export const customerMeterDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForCustomerMeter },
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get a customer meter',
				description: 'Get a single customer meter by ID',
				routing: {
					request: {
						method: 'GET',
						url: '=/customer-meters/{{$parameter["customerMeterId"]}}',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many customer meters',
				description: 'Get many customer meters',
				routing: {
					request: { method: 'GET', url: '=/customer-meters/', ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
		],
		default: 'getAll',
	},
	...scopeNoticesForResource('customerMeter'),
	...customerMeterGetAllDescription,
	...customerMeterGetDescription,
];
