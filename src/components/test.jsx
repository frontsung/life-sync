
const solution = (items, fetcher) => {

    const results = new Array(items.length);
    const queue = items.entries();
    qz
    return async (limit) => {
        const worker = async () => {
            for (const [index, data] of queue) {
                try {
                    results[index] = await fetcher(data);
                } catch (err) {
                    results[index] = { isError: true, error: err.message, failedData: data };
                }
            }
        };

        const workers = Array.from(
            { length: Math.min(limit, items.length) },
            worker
        );

        await Promise.all(workers);
        return results;
    };
};
