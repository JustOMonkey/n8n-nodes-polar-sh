import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['subscription'], operation: ['updateBillingPeriod'] };

export const subscriptionUpdateBillingPeriodDescription: INodeProperties[] = [
	{
		displayName: 'Subscription ID',
		name: 'subscriptionId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
	{
		displayName: 'New Billing Period End',
		name: 'currentBillingPeriodEnd',
		type: 'dateTime',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'Must be in the future; the subscription will renew on this date',
		routing: { send: { type: 'body', property: 'current_billing_period_end' } },
	},
];
