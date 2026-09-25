import type { INodeProperties } from 'n8n-workflow';

const byId = ['create', 'delete', 'get', 'getAll', 'update'];
const byExternalId = ['createExternal', 'deleteExternal', 'getAllExternal', 'getByExternalId', 'updateExternal'];

export const memberIdentifierProperties: INodeProperties[] = [
	{
		displayName: 'Customer ID',
		name: 'customerId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: { resource: ['member'], operation: byId } },
		description: 'The customer this member belongs to',
	},
	{
		displayName: 'External Customer ID',
		name: 'externalCustomerId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: { resource: ['member'], operation: byExternalId } },
		description: 'The customer ID in your own system, as set when the customer was created',
	},
	{
		displayName: 'Member ID',
		name: 'memberId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: { resource: ['member'], operation: ['delete', 'get', 'update'] } },
	},
	{
		displayName: 'External Member ID',
		name: 'externalId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: { resource: ['member'], operation: ['deleteExternal', 'getByExternalId', 'updateExternal'] },
		},
		description: "The member's ID in your own system",
	},
];
