import type { INodeProperties } from 'n8n-workflow';
import { metadataField } from '../../shared/descriptions';

const show = { resource: ['meter'], operation: ['create'] };
const showCustomUnit = { ...show, unit: ['custom'] };
const showAggregationProperty = { ...show, aggregationFunc: ['avg', 'max', 'min', 'sum', 'unique'] };
const showAggregationCount = { ...show, aggregationFunc: ['count'] };

export const meterCreateDescription: INodeProperties[] = [
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: "The meter's name. Shown on customer invoices and usage.",
		routing: { send: { type: 'body', property: 'name' } },
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
		displayOptions: { show },
		description: 'The unit of the meter',
		routing: { send: { type: 'body', property: 'unit' } },
	},
	{
		displayName: 'Custom Label',
		name: 'customLabel',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show: showCustomUnit },
		description: "The label for the custom unit, e.g. 'request'",
		routing: { send: { type: 'body', property: 'custom_label' } },
	},
	{
		displayName: 'Custom Multiplier',
		name: 'customMultiplier',
		type: 'number',
		default: 1,
		typeOptions: { minValue: 1, numberPrecision: 0 },
		displayOptions: { show: showCustomUnit },
		description: 'The multiplier to convert from the base unit to display scale, e.g. 1000 to display per 1000 units',
		routing: { send: { type: 'body', property: 'custom_multiplier' } },
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
		description: 'How the filter clauses below are combined',
	},
	{
		displayName: 'Filter Clauses',
		name: 'filterClauses',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true, multipleValueButtonText: 'Add Clause' },
		default: {},
		displayOptions: { show },
		description: 'Events must match this filter to be included in the meter. Ignored if "Filter (JSON)" below is set.',
		options: [
			{
				displayName: 'Clause',
				name: 'clause',
				values: [
					{
						displayName: 'Property',
						name: 'property',
						type: 'string',
						default: '',
						description: "Event property to filter on, e.g. 'name' or a metadata key",
					},
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
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						description: 'Compared as text by default; use a number- or boolean-looking value to compare numerically or as a boolean',
					},
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
			'Advanced: paste a raw Polar filter object as JSON to support nested filter groups (the visual builder above only supports one flat level). Overrides "Filter Conjunction"/"Filter Clauses" when set.',
		routing: {
			send: {
				type: 'body',
				property: 'filter',
				value:
					'={{ $value ? JSON.parse($value) : { conjunction: $parameter["filterConjunction"], clauses: ($parameter["filterClauses"].clause || []).map((c) => ({ property: c.property, operator: c.operator, value: (c.value === "true" ? true : (c.value === "false" ? false : (c.value !== "" && !isNaN(Number(c.value)) ? Number(c.value) : c.value))) })) } }}',
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
			{ name: 'Maximum', value: 'max' },
			{ name: 'Minimum', value: 'min' },
			{ name: 'Sum', value: 'sum' },
			{ name: 'Unique', value: 'unique' },
		],
		default: 'count',
		displayOptions: { show },
		description: 'How matched events are aggregated to calculate the meter',
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
		description: "Event property to aggregate, e.g. a metadata key holding a numeric value. Not used for 'Count'.",
		routing: {
			send: {
				type: 'body',
				property: 'aggregation',
				value: '={{ { func: $parameter["aggregationFunc"], property: $value } }}',
			},
		},
	},
];
