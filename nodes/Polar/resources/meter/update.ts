import type { INodeProperties } from 'n8n-workflow';
import { metadataField } from '../../shared/descriptions';

const show = { resource: ['meter'], operation: ['update'] };
const showAggregationProperty = { ...show, aggregationFunc: ['avg', 'max', 'min', 'sum', 'unique'] };
const showAggregationCount = { ...show, aggregationFunc: ['count'] };

export const meterUpdateDescription: INodeProperties[] = [
	{
		displayName: 'Meter ID',
		name: 'meterId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
	metadataField('metadata', 'metadata', 'Metadata', show),
	{
		displayName: 'Filter Conjunction',
		name: 'filterConjunction',
		type: 'options',
		options: [
			{ name: 'AND (All Clauses Must Match)', value: 'and' },
			{ name: 'OR (Any Clause May Match)', value: 'or' },
		],
		default: 'and',
		displayOptions: { show },
		description:
			'How the filter clauses below are combined. Ignored (and the meter\'s existing filter left unchanged) if neither Filter Clauses nor Filter (JSON) below are set.',
	},
	{
		displayName: 'Filter Clauses',
		name: 'filterClauses',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true, multipleValueButtonText: 'Add Clause' },
		default: {},
		displayOptions: { show },
		description: 'Leave empty (and "Filter (JSON)" below empty too) to keep the meter\'s existing filter unchanged',
		options: [
			{
				displayName: 'Clause',
				name: 'clause',
				values: [
					{ displayName: 'Property', name: 'property', type: 'string', default: '' },
					{
						displayName: 'Operator',
						name: 'operator',
						type: 'options',
						options: [
							{ name: 'Equals', value: 'eq' },
							{ name: 'Greater Than', value: 'gt' },
							{ name: 'Greater Than or Equal', value: 'gte' },
							{ name: 'Less Than', value: 'lt' },
							{ name: 'Less Than or Equal', value: 'lte' },
							{ name: 'Like', value: 'like' },
							{ name: 'Not Equals', value: 'ne' },
							{ name: 'Not Like', value: 'not_like' },
						],
						default: 'eq',
					},
					{ displayName: 'Value', name: 'value', type: 'string', default: '' },
				],
			},
		],
	},
	{
		displayName: 'Filter (JSON)',
		name: 'filterJson',
		type: 'string',
		typeOptions: { rows: 4 },
		default: '',
		displayOptions: { show },
		description:
			'Advanced: paste a raw Polar filter object as JSON to support nested filter groups. Overrides "Filter Conjunction"/"Filter Clauses" when set.',
		routing: {
			send: {
				type: 'body',
				property: 'filter',
				value:
					'={{ $value ? JSON.parse($value) : (($parameter["filterClauses"].clause || []).length ? { conjunction: $parameter["filterConjunction"], clauses: $parameter["filterClauses"].clause.map((c) => ({ property: c.property, operator: c.operator, value: c.value })) } : undefined) }}',
			},
		},
	},
	{
		displayName: 'Aggregation Function',
		name: 'aggregationFunc',
		type: 'options',
		options: [
			{ name: 'Average', value: 'avg' },
			{ name: 'Count', value: 'count' },
			{ name: 'Do Not Change', value: '' },
			{ name: 'Maximum', value: 'max' },
			{ name: 'Minimum', value: 'min' },
			{ name: 'Sum', value: 'sum' },
			{ name: 'Unique', value: 'unique' },
		],
		default: '',
		displayOptions: { show },
		description: "Leave as 'Do Not Change' to keep the meter's existing aggregation unchanged",
	},
	{
		displayName: 'Aggregation (Count)',
		name: 'aggregationCount',
		type: 'hidden',
		default: {},
		displayOptions: { show: showAggregationCount },
		routing: {
			send: {
				type: 'body',
				property: 'aggregation',
				value: '={{ { func: "count" } }}',
			},
		},
	},
	{
		displayName: 'Aggregation Property',
		name: 'aggregationProperty',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: showAggregationProperty },
		description: 'Event property to aggregate, e.g. a metadata key holding a numeric value',
		routing: {
			send: {
				type: 'body',
				property: 'aggregation',
				value: '={{ { func: $parameter["aggregationFunc"], property: $value } }}',
			},
		},
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show },
		options: [
			{
				displayName: 'Custom Label',
				name: 'custom_label',
				type: 'string',
				default: '',
				description: "Only used when Unit below is set to 'custom'",
				routing: { request: { body: { custom_label: '={{$value}}' } } },
			},
			{
				displayName: 'Custom Multiplier',
				name: 'custom_multiplier',
				type: 'number',
				default: 1,
				description: "Only used when Unit below is set to 'custom'",
				routing: { request: { body: { custom_multiplier: '={{$value}}' } } },
			},
			{
				displayName: 'Is Archived',
				name: 'is_archived',
				type: 'boolean',
				default: false,
				description: 'Whether to archive (or unarchive) the meter',
				routing: { request: { body: { is_archived: '={{$value}}' } } },
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: "The meter's name. Shown on customer invoices and usage.",
				routing: { request: { body: { name: '={{$value}}' } } },
			},
			{
				displayName: 'Unit',
				name: 'unit',
				type: 'options',
				options: [
					{ name: 'Custom', value: 'custom' },
					{ name: 'Scalar', value: 'scalar' },
					{ name: 'Token', value: 'token' },
				],
				default: 'scalar',
				routing: { request: { body: { unit: '={{$value}}' } } },
			},
		],
	},
];
