import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['member'], operation: ['delete'] };

export const memberDeleteDescription: INodeProperties[] = [
	{
		displayName: 'Member ID',
		name: 'memberId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
];
