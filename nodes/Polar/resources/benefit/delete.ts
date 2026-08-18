import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['benefit'], operation: ['delete'] };

export const benefitDeleteDescription: INodeProperties[] = [
	{
		displayName: 'Benefit ID',
		name: 'benefitId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
];
