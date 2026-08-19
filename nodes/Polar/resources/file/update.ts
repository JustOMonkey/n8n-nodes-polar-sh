import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['file'], operation: ['update'] };

export const fileUpdateDescription: INodeProperties[] = [
	{
		displayName: 'File ID',
		name: 'fileId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show },
		options: [
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				routing: { request: { body: { name: '={{$value}}' } } },
			},
			{
				displayName: 'Version',
				name: 'version',
				type: 'string',
				default: '',
				routing: { request: { body: { version: '={{$value}}' } } },
			},
		],
	},
];
