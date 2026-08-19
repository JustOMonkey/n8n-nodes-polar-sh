import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['licenseKey'], operation: ['get'] };

export const licenseKeyGetDescription: INodeProperties[] = [
	{
		displayName: 'License Key ID',
		name: 'licenseKeyId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'Returns the license key along with its activations',
	},
];
