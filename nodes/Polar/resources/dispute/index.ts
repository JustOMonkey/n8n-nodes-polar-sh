import type { INodeProperties } from 'n8n-workflow';
import { disputeGetAllDescription } from './getAll';
import { disputeGetDescription } from './get';

const showOnlyForDispute = { resource: ['dispute'] };

export const disputeDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForDispute },
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get a dispute',
				description: 'Get a single dispute by ID',
				routing: { request: { method: 'GET', url: '=/disputes/{{$parameter["disputeId"]}}' } },
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many disputes',
				description: 'Get many disputes',
				routing: { request: { method: 'GET', url: '=/disputes/' } },
			},
		],
		default: 'getAll',
	},
	...disputeGetAllDescription,
	...disputeGetDescription,
];
