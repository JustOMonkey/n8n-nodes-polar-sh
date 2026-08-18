import type { INodeProperties } from 'n8n-workflow';
import { billingAddressField, metadataField } from '../../shared/descriptions';

const showById = { resource: ['customer'], operation: ['update'] };
const showByExternalId = { resource: ['customer'], operation: ['updateExternal'] };
const showBoth = { resource: ['customer'], operation: ['update', 'updateExternal'] };

export const customerUpdateDescription: INodeProperties[] = [
	{
		displayName: 'Customer ID',
		name: 'customerId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: showById },
	},
	{
		displayName: 'External Customer ID',
		name: 'externalCustomerId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: showByExternalId },
	},
	billingAddressField('billingAddress', 'billing_address', showBoth),
	metadataField('metadata', 'metadata', 'Metadata', showBoth),
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show: showBoth },
		options: [
			{
				displayName: 'Customer Type',
				name: 'type',
				type: 'options',
				options: [
					{ name: 'Individual', value: 'individual' },
					{ name: 'Team', value: 'team' },
				],
				default: 'individual',
				routing: { request: { body: { type: '={{$value}}' } } },
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				placeholder: 'name@email.com',
				default: '',
				routing: { request: { body: { email: '={{$value}}' } } },
			},
			{
				displayName: 'External ID',
				name: 'external_id',
				type: 'string',
				default: '',
				routing: { request: { body: { external_id: '={{$value}}' } } },
			},
			{
				displayName: 'Locale',
				name: 'locale',
				type: 'string',
				default: '',
				routing: { request: { body: { locale: '={{$value}}' } } },
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				routing: { request: { body: { name: '={{$value}}' } } },
			},
			{
				displayName: 'Tax ID',
				name: 'tax_id',
				type: 'string',
				default: '',
				routing: { request: { body: { tax_id: '={{$value}}' } } },
			},
		],
	},
];
