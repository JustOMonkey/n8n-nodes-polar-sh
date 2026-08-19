import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['customerSeat'], operation: ['getAll'] };

export const customerSeatGetAllDescription: INodeProperties[] = [
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show },
		description:
			'This response is not paginated — it returns every seat for the given subscription or order at once, along with the total and available seat counts',
		options: [
			{
				displayName: 'Order ID',
				name: 'order_id',
				type: 'string',
				default: '',
				description: 'Filter by the order the seats belong to (for one-time purchase seats)',
				routing: { request: { qs: { order_id: '={{$value}}' } } },
			},
			{
				displayName: 'Subscription ID',
				name: 'subscription_id',
				type: 'string',
				default: '',
				description: 'Filter by the subscription the seats belong to (for recurring seats)',
				routing: { request: { qs: { subscription_id: '={{$value}}' } } },
			},
		],
	},
];
