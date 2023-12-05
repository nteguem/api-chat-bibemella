function Pagination(totalItems, page = 1, limit = 10) {
    const totalPages = Math.ceil(totalItems / limit);
    const offset = (page - 1) * limit;
  
    return {
      page,
      limit,
      totalItemsPerPage: limit,
      totalItems,
      totalPages,
      offset,
    };
  }
  
  module.exports = Pagination;  