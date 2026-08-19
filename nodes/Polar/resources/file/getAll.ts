import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../shared/descriptions';

const show = { resource: ['file'], operation: ['getAll'] };

export const fileGetAllDescription: INodeProperties[] = [
	...paginationProperties(show),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show },
		description: 'There is no single "Get" operation for files — use this Get Many operation with the File IDs filter to fetch specific files',
		options: [
			{
				displayName: 'File IDs',
				name: 'ids',
				type: 'string',
				default: '',
				description: 'One or more file IDs, comma-separated',
				routing: {
					request: {
						qs: {
							ids: '={{ $value ? $value.split(",").map((s) => s.trim()).filter((s) => s) : undefined }}',
						},
					},
				},
			},
		],
	},
];
