import type { INodeProperties } from 'n8n-workflow';
import { typedMetadataField } from '../../shared/descriptions';

const show = { resource: ['licenseKey'], operation: ['activate'] };

export const licenseKeyActivateDescription: INodeProperties[] = [
	{
		displayName: 'Key',
		name: 'key',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'The license key string to activate',
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
		displayName: 'Label',
		name: 'label',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'A label identifying this activation instance (e.g. a device or machine name)',
		routing: { send: { type: 'body', property: 'label' } },
	},
	typedMetadataField('conditions', 'conditions', 'Conditions', show),
	typedMetadataField('meta', 'meta', 'Meta', show),
];
