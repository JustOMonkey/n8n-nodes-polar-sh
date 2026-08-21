import type { INodeProperties } from 'n8n-workflow';
import { handlePolarApiError, scopeNoticesForResource } from '../../shared/errorHandling';
import { eventGetAllDescription } from './getAll';
import { eventGetDescription } from './get';
import { eventListNamesDescription } from './listNames';
import { eventIngestDescription } from './ingest';

const showOnlyForEvent = { resource: ['event'] };

export const eventDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForEvent },
		options: [
			{
				name: 'Get',
				value: 'get',
				action: 'Get an event',
				description: 'Get a single event by ID',
				routing: {
					request: {
						method: 'GET',
						url: '=/events/{{$parameter["eventId"]}}',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many events',
				description: 'Get many events',
				routing: {
					request: { method: 'GET', url: '=/events/', ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Ingest',
				value: 'ingest',
				action: 'Ingest events',
				description: 'Ingest a batch of usage events',
				routing: {
					request: { method: 'POST', url: '=/events/ingest', ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'List Names',
				value: 'listNames',
				action: 'List event names',
				description: 'List the distinct event names seen for this organization',
				routing: {
					request: { method: 'GET', url: '=/events/names', ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
		],
		default: 'getAll',
	},
	...scopeNoticesForResource('event'),
	...eventGetAllDescription,
	...eventGetDescription,
	...eventListNamesDescription,
	...eventIngestDescription,
];
