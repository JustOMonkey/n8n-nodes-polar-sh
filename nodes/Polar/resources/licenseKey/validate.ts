import type { INodeProperties } from 'n8n-workflow';
import { typedMetadataField } from '../../shared/descriptions';

const show = { resource: ['licenseKey'], operation: ['validate'] };

export const licenseKeyValidateDescription: INodeProperties[] = [
	{
		displayName: 'Key',
		name: 'key',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'The license key string to validate',
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
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show },
		options: [
			{
				displayName: 'Activation ID',
				name: 'activation_id',
				type: 'string',
				default: '',
				description: 'Required if the license key benefit has activations enabled',
				routing: { request: { body: { activation_id: '={{$value}}' } } },
			},
			{
				displayName: 'Benefit ID',
				name: 'benefit_id',
				type: 'string',
				default: '',
				routing: { request: { body: { benefit_id: '={{$value}}' } } },
			},
			{
				displayName: 'Customer ID',
				name: 'customer_id',
				type: 'string',
				default: '',
				routing: { request: { body: { customer_id: '={{$value}}' } } },
			},
			{
				displayName: 'Increment Usage',
				name: 'increment_usage',
				type: 'number',
				default: 0,
				typeOptions: { minValue: 0 },
				description: 'Amount to increment the license key usage counter by during this validation',
				routing: { request: { body: { increment_usage: '={{$value}}' } } },
			},
		],
	},
	typedMetadataField('conditions', 'conditions', 'Conditions', show),
];
