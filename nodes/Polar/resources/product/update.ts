import type { INodeProperties } from 'n8n-workflow';
import { metadataField } from '../../shared/descriptions';

const show = { resource: ['product'], operation: ['update'] };

export const productUpdateDescription: INodeProperties[] = [
	{
		displayName: 'Product ID',
		name: 'productId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
	metadataField('metadata', 'metadata', 'Metadata', show),
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show },
		options: [
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				routing: { request: { body: { description: '={{$value}}' } } },
			},
			{
				displayName: 'Is Archived',
				name: 'is_archived',
				type: 'boolean',
				default: false,
				description: 'Whether to archive the product, hiding it from new checkouts without affecting existing subscribers',
				routing: { request: { body: { is_archived: '={{$value}}' } } },
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				typeOptions: { minLength: 3, maxLength: 64 },
				routing: { request: { body: { name: '={{$value}}' } } },
			},
			{
				displayName: 'Recurring Interval',
				name: 'recurring_interval',
				type: 'options',
				options: [
					{ name: 'Day', value: 'day' },
					{ name: 'Week', value: 'week' },
					{ name: 'Month', value: 'month' },
					{ name: 'Year', value: 'year' },
				],
				default: 'month',
				routing: { request: { body: { recurring_interval: '={{$value}}' } } },
			},
			{
				displayName: 'Recurring Interval Count',
				name: 'recurring_interval_count',
				type: 'number',
				default: 1,
				routing: { request: { body: { recurring_interval_count: '={{$value}}' } } },
			},
			{
				displayName: 'Trial Interval',
				name: 'trial_interval',
				type: 'options',
				options: [
					{ name: 'Day', value: 'day' },
					{ name: 'Week', value: 'week' },
					{ name: 'Month', value: 'month' },
					{ name: 'Year', value: 'year' },
				],
				default: 'month',
				routing: { request: { body: { trial_interval: '={{$value}}' } } },
			},
			{
				displayName: 'Trial Interval Count',
				name: 'trial_interval_count',
				type: 'number',
				default: 1,
				routing: { request: { body: { trial_interval_count: '={{$value}}' } } },
			},
			{
				displayName: 'Visibility',
				name: 'visibility',
				type: 'options',
				options: [
					{ name: 'Draft', value: 'draft' },
					{ name: 'Private', value: 'private' },
					{ name: 'Public', value: 'public' },
				],
				default: 'public',
				routing: { request: { body: { visibility: '={{$value}}' } } },
			},
		],
	},
];
