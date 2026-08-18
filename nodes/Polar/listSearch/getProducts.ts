import type { ILoadOptionsFunctions, INodeListSearchItems, INodeListSearchResult } from 'n8n-workflow';
import { polarApiRequest } from '../shared/transport';

type ProductItem = { id: string; name: string };
type ProductListResponse = { items: ProductItem[]; pagination: { total_count: number; max_page: number } };

export async function getProducts(
	this: ILoadOptionsFunctions,
	filter?: string,
	paginationToken?: string,
): Promise<INodeListSearchResult> {
	const page = paginationToken ? +paginationToken : 1;
	const responseData: ProductListResponse = await polarApiRequest.call(this, 'GET', '/products/', {
		query: filter,
		page,
		limit: 50,
	});

	const results: INodeListSearchItems[] = responseData.items.map((item) => ({
		name: item.name,
		value: item.id,
	}));

	const nextPaginationToken =
		page < responseData.pagination.max_page ? String(page + 1) : undefined;
	return { results, paginationToken: nextPaginationToken };
}
