import type { ILoadOptionsFunctions, INodeListSearchItems, INodeListSearchResult } from 'n8n-workflow';
import { polarApiRequest } from '../shared/transport';

type CustomerItem = { id: string; name: string | null; email: string };
type CustomerListResponse = { items: CustomerItem[]; pagination: { total_count: number; max_page: number } };

export async function getCustomers(
	this: ILoadOptionsFunctions,
	filter?: string,
	paginationToken?: string,
): Promise<INodeListSearchResult> {
	const page = paginationToken ? +paginationToken : 1;
	const responseData: CustomerListResponse = await polarApiRequest.call(this, 'GET', '/customers/', {
		query: filter,
		page,
		limit: 50,
	});

	const results: INodeListSearchItems[] = responseData.items.map((item) => ({
		name: item.name ? `${item.name} (${item.email})` : item.email,
		value: item.id,
	}));

	const nextPaginationToken =
		page < responseData.pagination.max_page ? String(page + 1) : undefined;
	return { results, paginationToken: nextPaginationToken };
}
