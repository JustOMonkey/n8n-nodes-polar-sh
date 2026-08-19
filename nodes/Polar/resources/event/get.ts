import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['event'], operation: ['get'] };

export const eventGetDescription: INodeProperties[] = [
	{
		displayName: 'Event ID',
		name: 'eventId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
];
