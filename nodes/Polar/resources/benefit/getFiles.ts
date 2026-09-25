import type { INodeProperties } from 'n8n-workflow';
import { paginationProperties } from '../../shared/descriptions';

const show = { resource: ['benefit'], operation: ['getFiles'] };

export const benefitGetFilesDescription: INodeProperties[] = [
	{
		displayName: 'Benefit ID',
		name: 'benefitId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'ID of a Downloadables benefit',
	},
	...paginationProperties(show),
];
