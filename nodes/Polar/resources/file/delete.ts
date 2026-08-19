import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['file'], operation: ['delete'] };

export const fileDeleteDescription: INodeProperties[] = [
	{
		displayName: 'File ID',
		name: 'fileId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
];
