import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['dispute'], operation: ['get'] };

export const disputeGetDescription: INodeProperties[] = [
	{
		displayName: 'Dispute ID',
		name: 'disputeId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
];
