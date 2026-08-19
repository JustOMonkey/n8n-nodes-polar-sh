import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['licenseKey'], operation: ['update'] };

export const licenseKeyUpdateDescription: INodeProperties[] = [
	{
		displayName: 'License Key ID',
		name: 'licenseKeyId',
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
				displayName: 'Expires At',
				name: 'expires_at',
				type: 'dateTime',
				default: '',
				routing: { request: { body: { expires_at: '={{$value}}' } } },
			},
			{
				displayName: 'Limit Activations',
				name: 'limit_activations',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 1000 },
				description: 'Maximum number of activations allowed for this license key',
				routing: { request: { body: { limit_activations: '={{$value}}' } } },
			},
			{
				displayName: 'Limit Usage',
				name: 'limit_usage',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1 },
				description: 'Maximum cumulative usage allowed for this license key',
				routing: { request: { body: { limit_usage: '={{$value}}' } } },
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'Disabled', value: 'disabled' },
					{ name: 'Granted', value: 'granted' },
					{ name: 'Revoked', value: 'revoked' },
				],
				default: 'granted',
				routing: { request: { body: { status: '={{$value}}' } } },
			},
			{
				displayName: 'Usage',
				name: 'usage',
				type: 'number',
				default: 0,
				description: "The license key's current cumulative usage count",
				routing: { request: { body: { usage: '={{$value}}' } } },
			},
		],
	},
];
