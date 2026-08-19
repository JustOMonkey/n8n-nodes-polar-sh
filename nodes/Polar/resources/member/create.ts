import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['member'], operation: ['create'] };

export const memberCreateDescription: INodeProperties[] = [
	{
		displayName: 'Customer ID',
		name: 'customerId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'The customer this member belongs to',
		routing: { send: { type: 'body', property: 'customer_id' } },
	},
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'name@email.com',
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'email' } },
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show },
		options: [
			{
				displayName: 'External ID',
				name: 'external_id',
				type: 'string',
				default: '',
				description: "The member's ID in your own system. Must be unique within the customer.",
				routing: { request: { body: { external_id: '={{$value}}' } } },
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				routing: { request: { body: { name: '={{$value}}' } } },
			},
			{
				displayName: 'Role',
				name: 'role',
				type: 'options',
				options: [
					{ name: 'Billing Manager', value: 'billing_manager' },
					{ name: 'Member', value: 'member' },
				],
				default: 'member',
				description:
					"To assign or transfer ownership, use the Update operation instead — 'Owner' is not a valid role on Create",
				routing: { request: { body: { role: '={{$value}}' } } },
			},
		],
	},
];
