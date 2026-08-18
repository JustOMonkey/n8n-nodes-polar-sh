import type { INodeProperties } from 'n8n-workflow';
import { billingAddressField, metadataField } from '../../shared/descriptions';

const show = { resource: ['customer'], operation: ['create'] };
const showIndividual = { ...show, customerType: ['individual'] };
const showTeam = { ...show, customerType: ['team'] };

export const customerCreateDescription: INodeProperties[] = [
	{
		displayName: 'Customer Type',
		name: 'customerType',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show },
		options: [
			{ name: 'Individual', value: 'individual' },
			{ name: 'Team', value: 'team' },
		],
		default: 'individual',
		routing: { send: { type: 'body', property: 'type' } },
	},
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		placeholder: 'name@email.com',
		default: '',
		required: true,
		displayOptions: { show: showIndividual },
		description: 'Must be unique within the organization',
		routing: { send: { type: 'body', property: 'email' } },
	},
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		placeholder: 'name@email.com',
		default: '',
		displayOptions: { show: showTeam },
		description: 'Must be unique within the organization',
		routing: {
			send: {
				type: 'body',
				property: 'email',
				value: '={{ $value || undefined }}',
			},
		},
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		displayOptions: { show },
		routing: {
			send: {
				type: 'body',
				property: 'name',
				value: '={{ $value || undefined }}',
			},
		},
	},
	{
		displayName: 'External ID',
		name: 'externalId',
		type: 'string',
		default: '',
		displayOptions: { show },
		description: 'The customer ID in your own system, to reference it later without an extra lookup',
		routing: {
			send: {
				type: 'body',
				property: 'external_id',
				value: '={{ $value || undefined }}',
			},
		},
	},
	billingAddressField('billingAddress', 'billing_address', show),
	metadataField('metadata', 'metadata', 'Metadata', show),
	{
		displayName: 'Owner',
		name: 'owner',
		type: 'collection',
		placeholder: 'Add Owner Field',
		default: {},
		displayOptions: { show },
		description: 'For team customers, the member who owns the account (required by the API when set)',
		options: [
			{ displayName: 'Email', name: 'email', type: 'string', placeholder: 'name@email.com', default: '' },
			{ displayName: 'Name', name: 'name', type: 'string', default: '' },
			{ displayName: 'External ID', name: 'external_id', type: 'string', default: '' },
		],
		routing: {
			send: {
				type: 'body',
				property: 'owner',
				value: '={{ Object.keys($value).length ? $value : undefined }}',
			},
		},
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
				displayName: 'Tax ID',
				name: 'tax_id',
				type: 'string',
				default: '',
				routing: { request: { body: { tax_id: '={{$value}}' } } },
			},
			{
				displayName: 'Locale',
				name: 'locale',
				type: 'string',
				placeholder: 'e.g. en, en-US, fr-FR',
				default: '',
				routing: { request: { body: { locale: '={{$value}}' } } },
			},
		],
	},
];
