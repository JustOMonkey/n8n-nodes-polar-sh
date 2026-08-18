import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['product'], operation: ['updateBenefits'] };

export const productUpdateBenefitsDescription: INodeProperties[] = [
	{
		displayName: 'Product ID',
		name: 'productId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
	},
	{
		displayName: 'Benefit Names or IDs',
		name: 'benefits',
		type: 'multiOptions',
		typeOptions: { loadOptionsMethod: 'getBenefitOptions' },
		default: [],
		required: true,
		displayOptions: { show },
		description:
			'This replaces the complete set of benefits for the product. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
		routing: { send: { type: 'body', property: 'benefits' } },
	},
];
