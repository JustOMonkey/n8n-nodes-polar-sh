import type { INodeProperties } from 'n8n-workflow';
import { countryOptions, currencyOptions } from '../../shared/descriptions';

const show = { resource: ['organization'], operation: ['update'] };

export const organizationUpdateDescription: INodeProperties[] = [
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show },
		options: [
			{
				displayName: 'Avatar URL',
				name: 'avatar_url',
				type: 'string',
				default: '',
				routing: { request: { body: { avatar_url: '={{$value}}' } } },
			},
			{
				displayName: 'Country',
				name: 'country',
				type: 'options',
				options: countryOptions,
				default: 'US',
				description: 'ISO 3166-1 alpha-2 country code',
				routing: { request: { body: { country: '={{$value}}' } } },
			},
			{
				displayName: 'Default Presentment Currency',
				name: 'default_presentment_currency',
				type: 'options',
				options: currencyOptions,
				default: 'usd',
				description: 'ISO 4217 currency code',
				routing: { request: { body: { default_presentment_currency: '={{$value}}' } } },
			},
			{
				displayName: 'Default Tax Behavior',
				name: 'default_tax_behavior',
				type: 'options',
				options: [
					{ name: 'Exclusive', value: 'exclusive' },
					{ name: 'Inclusive', value: 'inclusive' },
					{ name: 'Location', value: 'location' },
				],
				default: 'location',
				description: 'Default tax behavior applied on products',
				routing: { request: { body: { default_tax_behavior: '={{$value}}' } } },
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				default: '',
				placeholder: 'name@email.com',
				description: 'Public support email',
				routing: { request: { body: { email: '={{$value}}' } } },
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				routing: { request: { body: { name: '={{$value}}' } } },
			},
			{
				displayName: 'Website',
				name: 'website',
				type: 'string',
				default: '',
				routing: { request: { body: { website: '={{$value}}' } } },
			},
		],
	},
];
