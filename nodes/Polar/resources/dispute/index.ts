import type { INodeProperties } from 'n8n-workflow';
import { handlePolarApiError, scopeNoticesForResource } from '../../shared/errorHandling';
import { disputeGetAllDescription } from './getAll';
import { disputeGetDescription } from './get';
import { disputeAcceptDescription } from './accept';

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
				name: 'Accept',
				value: 'accept',
				action: 'Accept a dispute',
				description: 'Concede a dispute without contesting it (irreversible)',
				routing: {
					request: {
						method: 'POST',
						url: '=/disputes/{{$parameter["disputeId"]}}/accept',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a dispute',
				description: 'Get a single dispute by ID',
				routing: {
					request: {
						method: 'GET',
						url: '=/disputes/{{$parameter["disputeId"]}}',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many disputes',
				description: 'Get many disputes',
				routing: {
					request: { method: 'GET', url: '=/disputes/', ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
		],
		default: 'getAll',
	},
	...scopeNoticesForResource('dispute'),
	...disputeGetAllDescription,
	...disputeGetDescription,
	...disputeAcceptDescription,
];
