import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['member'], operation: ['update', 'updateExternal'] };

export const memberUpdateDescription: INodeProperties[] = [
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show },
		options: [
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				default: '',
				placeholder: 'name@email.com',
				routing: { request: { body: { email: '={{$value}}' } } },
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
					{ name: 'Owner', value: 'owner' },
				],
				default: 'member',
				description: "Assigning 'Owner' transfers ownership of the customer to this member",
				routing: { request: { body: { role: '={{$value}}' } } },
			},
		],
	},
];
