import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['subscription'], operation: ['updateSeats'] };

export const subscriptionUpdateSeatsDescription: INodeProperties[] = [
	{
		displayName: 'Subscription ID',
		name: 'subscriptionId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
	{
		displayName: 'Seats',
		name: 'seats',
		type: 'number',
		default: 1,
		required: true,
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'seats' } },
	},
	{
		displayName: 'Proration Behavior',
		name: 'prorationBehavior',
		type: 'options',
		options: [
			{ name: 'Invoice', value: 'invoice' },
			{ name: 'Prorate', value: 'prorate' },
			{ name: 'Next Period', value: 'next_period' },
			{ name: 'Reset', value: 'reset' },
		],
		default: 'prorate',
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'proration_behavior' } },
	},
];
