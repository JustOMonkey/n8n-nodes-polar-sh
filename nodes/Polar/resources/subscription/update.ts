import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['subscription'], operation: ['update'] };

export const subscriptionUpdateDescription: INodeProperties[] = [
	{
		displayName: 'Subscription ID',
		name: 'subscriptionId',
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
				displayName: 'New Product ID',
				name: 'product_id',
				type: 'string',
				default: '',
				description: 'Move the subscription to a different recurring product',
				routing: { request: { body: { product_id: '={{$value}}' } } },
			},
			{
				displayName: 'Discount ID',
				name: 'discount_id',
				type: 'string',
				default: '',
				description: "Set to an empty value to remove the subscription's discount",
				routing: { request: { body: { discount_id: '={{$value}}' } } },
			},
			{
				displayName: 'Trial End',
				name: 'trial_end',
				type: 'dateTime',
				default: '',
				description: 'Extend or set the trial end date. Leave empty to leave unchanged.',
				routing: { request: { body: { trial_end: '={{$value}}' } } },
			},
			{
				displayName: 'Proration Behavior',
				name: 'proration_behavior',
				type: 'options',
				options: [
					{ name: 'Invoice', value: 'invoice' },
					{ name: 'Prorate', value: 'prorate' },
					{ name: 'Next Period', value: 'next_period' },
					{ name: 'Reset', value: 'reset' },
				],
				default: 'prorate',
				routing: { request: { body: { proration_behavior: '={{$value}}' } } },
			},
		],
	},
];
