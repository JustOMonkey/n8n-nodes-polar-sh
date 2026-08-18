import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['benefit'], operation: ['get'] };

export const benefitGetDescription: INodeProperties[] = [
	{
		displayName: 'Benefit ID',
		name: 'benefitId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
];
