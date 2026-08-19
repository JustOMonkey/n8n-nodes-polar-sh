import type { INodeProperties } from 'n8n-workflow';
import { licenseKeyGetAllDescription } from './getAll';
import { licenseKeyGetDescription } from './get';
import { licenseKeyUpdateDescription } from './update';
import { licenseKeyGetActivationDescription } from './getActivation';
import { licenseKeyValidateDescription } from './validate';
import { licenseKeyActivateDescription } from './activate';
import { licenseKeyDeactivateDescription } from './deactivate';

const showOnlyForLicenseKey = { resource: ['licenseKey'] };

export const licenseKeyDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showOnlyForLicenseKey },
		options: [
			{
				name: 'Activate',
				value: 'activate',
				action: 'Activate a license key',
				description: 'Activate a license key instance',
				routing: { request: { method: 'POST', url: '=/license-keys/activate' } },
			},
			{
				name: 'Deactivate',
				value: 'deactivate',
				action: 'Deactivate a license key',
				description: 'Deactivate a license key instance',
				routing: { request: { method: 'POST', url: '=/license-keys/deactivate' } },
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a license key',
				description: 'Get a single license key by ID',
				routing: { request: { method: 'GET', url: '=/license-keys/{{$parameter["licenseKeyId"]}}' } },
			},
			{
				name: 'Get Activation',
				value: 'getActivation',
				action: 'Get a license key activation',
				description: 'Get a single license key activation by ID',
				routing: {
					request: {
						method: 'GET',
						url: '=/license-keys/{{$parameter["licenseKeyId"]}}/activations/{{$parameter["activationId"]}}',
					},
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many license keys',
				description: 'Get many license keys',
				routing: { request: { method: 'GET', url: '=/license-keys/' } },
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a license key',
				description: 'Update an existing license key',
				routing: { request: { method: 'PATCH', url: '=/license-keys/{{$parameter["licenseKeyId"]}}' } },
			},
			{
				name: 'Validate',
				value: 'validate',
				action: 'Validate a license key',
				description: 'Validate a license key',
				routing: { request: { method: 'POST', url: '=/license-keys/validate' } },
			},
		],
		default: 'getAll',
	},
	...licenseKeyGetAllDescription,
	...licenseKeyGetDescription,
	...licenseKeyUpdateDescription,
	...licenseKeyGetActivationDescription,
	...licenseKeyValidateDescription,
	...licenseKeyActivateDescription,
	...licenseKeyDeactivateDescription,
];
