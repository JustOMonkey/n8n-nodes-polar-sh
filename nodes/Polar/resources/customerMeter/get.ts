import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['customerMeter'], operation: ['get'] };

export const customerMeterGetDescription: INodeProperties[] = [
	{
		displayName: 'Customer Meter ID',
		name: 'customerMeterId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
];
