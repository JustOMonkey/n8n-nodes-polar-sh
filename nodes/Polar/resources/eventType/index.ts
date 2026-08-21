import type { INodeProperties } from 'n8n-workflow';
import { handlePolarApiError, scopeNoticesForResource } from '../../shared/errorHandling';
import { eventTypeGetAllDescription } from './getAll';
import { eventTypeUpdateDescription } from './update';

const showOnlyForEventType = { resource: ['eventType'] };

export const eventTypeDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForEventType },
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many event types',
				description: 'Get many event types',
				routing: {
					request: { method: 'GET', url: '=/event-types/', ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update an event type',
				description: "Update an event type's label",
				routing: {
					request: {
						method: 'PATCH',
						url: '=/event-types/{{$parameter["eventTypeId"]}}',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
		],
		default: 'getAll',
	},
	...scopeNoticesForResource('eventType'),
	...eventTypeGetAllDescription,
	...eventTypeUpdateDescription,
];
