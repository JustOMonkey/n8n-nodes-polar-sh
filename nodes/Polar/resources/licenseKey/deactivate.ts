import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['licenseKey'], operation: ['deactivate'] };

export const licenseKeyDeactivateDescription: INodeProperties[] = [
	{
		displayName: 'Key',
		name: 'key',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'The license key string to deactivate an instance of',
		routing: { send: { type: 'body', property: 'key' } },
	},
	{
		displayName: 'Organization ID',
		name: 'organizationId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'organization_id' } },
	},
	{
		displayName: 'Activation ID',
		name: 'activationId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'activation_id' } },
	},
];
