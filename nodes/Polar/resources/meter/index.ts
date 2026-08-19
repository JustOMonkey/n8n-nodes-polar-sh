import type { INodeProperties } from 'n8n-workflow';
import { meterGetAllDescription } from './getAll';
import { meterGetDescription } from './get';
import { meterCreateDescription } from './create';
import { meterUpdateDescription } from './update';
import { meterGetQuantitiesDescription } from './getQuantities';

const showOnlyForMeter = { resource: ['meter'] };

export const meterDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForMeter },
		options: [
			{
				name: 'Create',
				value: 'create',
				action: 'Create a meter',
				description: 'Create a new meter',
				routing: { request: { method: 'POST', url: '=/meters/' } },
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a meter',
				description: 'Get a single meter by ID',
				routing: { request: { method: 'GET', url: '=/meters/{{$parameter["meterId"]}}' } },
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many meters',
				description: 'Get many meters',
				routing: { request: { method: 'GET', url: '=/meters/' } },
			},
			{
				name: 'Get Quantities',
				value: 'getQuantities',
				action: 'Get meter quantities',
				description: "Get a meter's usage quantities over a time period",
				routing: { request: { method: 'GET', url: '=/meters/{{$parameter["meterId"]}}/quantities' } },
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a meter',
				description: 'Update an existing meter',
				routing: { request: { method: 'PATCH', url: '=/meters/{{$parameter["meterId"]}}' } },
			},
		],
		default: 'getAll',
	},
	...meterGetAllDescription,
	...meterGetDescription,
	...meterCreateDescription,
	...meterUpdateDescription,
	...meterGetQuantitiesDescription,
];
