import type { INodeProperties } from 'n8n-workflow';
import { handlePolarApiError, scopeNoticesForResource } from '../../shared/errorHandling';
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
				routing: {
					request: { method: 'POST', url: '=/license-keys/activate', ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Deactivate',
				value: 'deactivate',
				action: 'Deactivate a license key',
				description: 'Deactivate a license key instance',
				routing: {
					request: {
						method: 'POST',
						url: '=/license-keys/deactivate',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Get',
				value: 'get',
				action: 'Get a license key',
				description: 'Get a single license key by ID',
				routing: {
					request: {
						method: 'GET',
						url: '=/license-keys/{{$parameter["licenseKeyId"]}}',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
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
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many license keys',
				description: 'Get many license keys',
				routing: {
					request: { method: 'GET', url: '=/license-keys/', ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Update',
				value: 'update',
				action: 'Update a license key',
				description: 'Update an existing license key',
				routing: {
					request: {
						method: 'PATCH',
						url: '=/license-keys/{{$parameter["licenseKeyId"]}}',
						ignoreHttpStatusErrors: true,
					},
					output: { postReceive: [handlePolarApiError] },
				},
			},
			{
				name: 'Validate',
				value: 'validate',
				action: 'Validate a license key',
				description: 'Validate a license key',
				routing: {
					request: { method: 'POST', url: '=/license-keys/validate', ignoreHttpStatusErrors: true },
					output: { postReceive: [handlePolarApiError] },
				},
			},
		],
		default: 'getAll',
	},
	...scopeNoticesForResource('licenseKey'),
	...licenseKeyGetAllDescription,
	...licenseKeyGetDescription,
	...licenseKeyUpdateDescription,
	...licenseKeyGetActivationDescription,
	...licenseKeyValidateDescription,
	...licenseKeyActivateDescription,
	...licenseKeyDeactivateDescription,
];
