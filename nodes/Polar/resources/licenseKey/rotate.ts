import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['licenseKey'], operation: ['rotate'] };

export const licenseKeyRotateDescription: INodeProperties[] = [
	{
		displayName: 'License Key ID',
		name: 'licenseKeyId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'The current key stops working immediately; the response contains the new key',
	},
];
