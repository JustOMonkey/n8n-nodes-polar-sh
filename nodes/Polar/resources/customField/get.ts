import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['customField'], operation: ['get'] };

export const customFieldGetDescription: INodeProperties[] = [
	{
		displayName: 'Custom Field ID',
		name: 'customFieldId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
];
