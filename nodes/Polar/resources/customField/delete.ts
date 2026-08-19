import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['customField'], operation: ['delete'] };

export const customFieldDeleteDescription: INodeProperties[] = [
	{
		displayName: 'Custom Field ID',
		name: 'customFieldId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
];
