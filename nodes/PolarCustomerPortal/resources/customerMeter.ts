import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../Polar/shared/descriptions';
import { portalRouting } from '../shared/errorHandling';

const resource = ['customerMeter'];
const showGetAll = { resource, operation: ['getAll'] };

export const customerMeterDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource } },
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get a customer meter',
				description: "Get the customer's usage and balance on one meter",
				routing: portalRouting('GET', '=/customer-portal/meters/{{$parameter["customerMeterId"]}}'),
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many customer meters',
				description: "List the customer's usage meters",
				routing: portalRouting('GET', '=/customer-portal/meters/'),
			},
		],
		default: 'getAll',
	},
	{
		displayName: 'Customer Meter ID',
		name: 'customerMeterId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: { resource, operation: ['get'] } },
	},
	...paginationProperties(showGetAll),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show: showGetAll },
		options: [
			{
				displayName: 'Meter ID',
				name: 'meter_id',
				type: 'string',
				default: '',
				routing: { request: { qs: { meter_id: '={{$value}}' } } },
			},
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				default: '',
				description: 'Free-text search',
				routing: { request: { qs: { query: '={{$value}}' } } },
			},
		],
	},
];
