import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['dispute'], operation: ['accept'] };

export const disputeAcceptDescription: INodeProperties[] = [
	{
		displayName: 'Dispute ID',
		name: 'disputeId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'Accepting concedes the dispute to the customer. This cannot be undone.',
	},
];
