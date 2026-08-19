import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['member'], operation: ['get'] };

export const memberGetDescription: INodeProperties[] = [
	{
		displayName: 'Member ID',
		name: 'memberId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
];
