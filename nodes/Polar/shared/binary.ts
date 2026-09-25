import type {
	IExecuteSingleFunctions,
	IN8nHttpFullResponse,
	INodeExecutionData,
} from 'n8n-workflow';

/**
 * `postReceive` factory for Polar's CSV export endpoints. Place it after `handlePolarApiError`,
 * and send the request with `encoding: 'arraybuffer'` and `json: false` so the CSV reaches this
 * function as raw bytes instead of being parsed as JSON.
 */
export function csvToBinary(fileName: string) {
	return async function (
		this: IExecuteSingleFunctions,
		_items: INodeExecutionData[],
		response: IN8nHttpFullResponse,
	): Promise<INodeExecutionData[]> {
		const body = response.body as unknown;
		const buffer = Buffer.isBuffer(body)
			? body
			: Buffer.from(typeof body === 'string' ? body : '', 'utf8');
		const data = await this.helpers.prepareBinaryData(buffer, fileName, 'text/csv');
		return [{ json: { fileName, size: buffer.length }, binary: { data } }];
	};
}
