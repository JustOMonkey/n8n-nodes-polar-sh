import type { INodeProperties } from 'n8n-workflow';

export const organizationIdProperty: INodeProperties = {
	displayName: 'Organization ID',
	name: 'organizationId',
	type: 'string',
	default: '',
	required: true,
	displayOptions: { show: { resource: ['organization'], operation: ['get', 'update'] } },
	description: "Use the Get Many operation to find your token's organization ID",
};
