import type { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import { polarApiRequest } from '../shared/transport';

type ProductItem = { id: string; name: string };
type ProductListResponse = { items: ProductItem[] };

export async function getProductOptions(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
	const responseData: ProductListResponse = await polarApiRequest.call(this, 'GET', '/products/', {
		limit: 100,
		is_archived: false,
	});

	return responseData.items.map((item) => ({ name: item.name, value: item.id }));
}
