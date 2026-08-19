import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['licenseKey'], operation: ['getActivation'] };

export const licenseKeyGetActivationDescription: INodeProperties[] = [
	{
		displayName: 'License Key ID',
		name: 'licenseKeyId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
	{
		displayName: 'Activation ID',
		name: 'activationId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
];
