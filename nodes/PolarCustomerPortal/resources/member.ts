import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../Polar/shared/descriptions';
import { portalRouting } from '../shared/errorHandling';

const resource = ['member'];

const roleOptions = [
	{ name: 'Billing Manager', value: 'billing_manager' },
	{ name: 'Member', value: 'member' },
	{ name: 'Owner', value: 'owner' },
];

export const memberDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource } },
		options: [
			{
				name: 'Add',
				value: 'add',
				action: 'Add a member',
				description: "Add a person to the customer's team (member session of an owner or billing manager)",
				routing: portalRouting('POST', '=/customer-portal/members'),
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many members',
				description: "List the people on the customer's team (member session)",
				routing: portalRouting('GET', '=/customer-portal/members'),
			},
			{
				name: 'Remove',
				value: 'remove',
				action: 'Remove a member',
				description: "Remove a person from the customer's team (member session)",
				routing: portalRouting('DELETE', '=/customer-portal/members/{{$parameter["memberId"]}}'),
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a member',
				description: "Change a team member's name or role (member session)",
				routing: portalRouting('PATCH', '=/customer-portal/members/{{$parameter["memberId"]}}'),
			},
		],
		default: 'getAll',
	},
	{
		displayName: 'These operations need a member session token (B2B customers), not a plain customer session',
		name: 'memberSessionNotice',
		type: 'notice',
		default: '',
		displayOptions: { show: { resource } },
	},
	{
		displayName: 'Member ID',
		name: 'memberId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: { resource, operation: ['remove', 'update'] } },
	},
	...paginationProperties({ resource, operation: ['getAll'] }),
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'name@email.com',
		displayOptions: { show: { resource, operation: ['add'] } },
		routing: { send: { type: 'body', property: 'email' } },
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource, operation: ['add'] } },
		options: [
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
				options: roleOptions,
				default: 'member',
				routing: { request: { body: { role: '={{$value}}' } } },
			},
		],
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: { resource, operation: ['update'] } },
		options: [
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
				options: roleOptions,
				default: 'member',
				description: "Assigning 'Owner' transfers ownership of the customer to this member",
				routing: { request: { body: { role: '={{$value}}' } } },
			},
		],
	},
];
