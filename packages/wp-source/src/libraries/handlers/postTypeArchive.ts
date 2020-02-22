import { Handler } from "../../../types";
import capitalize from "./utils/capitalize";
import { ServerError } from "@frontity/source";

const postTypeArchiveHandler = ({
  type,
  endpoint
}: {
  type: string;
  endpoint: string;
}): Handler => async ({ route, state, libraries }) => {
  const { api, populate, parse, getTotal, getTotalPages } = libraries.source;
  const { page, query, path } = parse(route);

  // 1. fetch the specified page
  const response = await api.get({
    endpoint: endpoint === "posts" ? state.source.postEndpoint : endpoint,
    params: {
      search: query.s,
      page,
      _embed: true,
      ...state.source.params
    }
  });

  // 2. populate response
  const items = await populate({
    response,
    state
  });
  if (page > 1 && items.length === 0)
    throw new ServerError(`post archive doesn't have page ${page}`, 404);

  // 3. get posts and pages count
  const total = getTotal(response, items.length);
  const totalPages = getTotalPages(response, 0);

  // returns true if next page exists
  const hasOlderPosts = page < totalPages;
  // returns true if previous page exists
  const hasNewerPosts = page > 1;

  const getPageLink = (page: number) =>
    libraries.source.stringify({
      path,
      query,
      page
    });

  // 4. add data to source
  const currentPageData = state.source.data[route];
  Object.assign(state.source.data[route], {
    type,
    items,
    total,
    totalPages,
    isArchive: true,
    isPostTypeArchive: true,
    [`is${capitalize(type)}Archive`]: true,
    prev: hasOlderPosts ? getPageLink(page - 1) : undefined,
    next: hasNewerPosts ? getPageLink(page + 1) : undefined
  });

  // 6. If it's a search, add the information.
  if (query.s) {
    currentPageData.isSearch = true;
    if (currentPageData.isSearch) {
      currentPageData.searchQuery = query.s;
    }
  }
};

export default postTypeArchiveHandler;
