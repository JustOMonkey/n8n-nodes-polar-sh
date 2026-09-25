import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../Polar/shared/descriptions';
import { portalRouting } from '../shared/errorHandling';

const resource = ['downloadable'];
const showGetAll = { resource, operation: ['getAll'] };

export const downloadableDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource } },
		options: [
			{
				name: 'Get Many',
				value: 'getAll',
				action: 'Get many downloadables',
				description: 'List the files the customer can download, with download URLs',
				routing: portalRouting('GET', '=/customer-portal/downloadables/'),
			},
		],
		default: 'getAll',
	},
	...paginationProperties(showGetAll),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show: showGetAll },
		options: [
			{
				displayName: 'Benefit ID',
				name: 'benefit_id',
				type: 'string',
				default: '',
				routing: { request: { qs: { benefit_id: '={{$value}}' } } },
			},
		],
	},
];
