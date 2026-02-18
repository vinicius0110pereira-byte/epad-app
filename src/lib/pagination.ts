export const DEFAULT_PAGE_SIZE = 15;

export function parsePaginationParams(searchParams: Record<string, string | string[] | undefined>) {
  const page = Math.max(1, Number(searchParams.page) || 1);
  const pageSize = DEFAULT_PAGE_SIZE;
  const skip = (page - 1) * pageSize;
  return { page, pageSize, skip };
}

export function getPaginationMeta(total: number, page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return {
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
