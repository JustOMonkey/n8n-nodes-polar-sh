import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['meter'], operation: ['get'] };

export const meterGetDescription: INodeProperties[] = [
	{
		displayName: 'Meter ID',
		name: 'meterId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
];
