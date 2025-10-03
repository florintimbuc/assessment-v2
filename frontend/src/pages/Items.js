import React, { useEffect, useState } from "react";
import { FixedSizeList } from "react-window";
import { useData } from "../state/DataContext";
import { Link } from "react-router-dom";

function Items() {
  const { items, loading, error, pagination, fetchItems } = useData();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce search query to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch items with AbortController to prevent memory leak
  useEffect(() => {
    const abortController = new AbortController();

    fetchItems({
      page: currentPage,
      pageSize: 50,
      q: debouncedQuery,
      signal: abortController.signal,
    }).catch((err) => {
      if (err.name !== "AbortError") {
        console.error("Error fetching items:", err);
      }
    });

    // Cleanup: abort the request if component unmounts or dependencies change
    return () => {
      abortController.abort();
    };
  }, [fetchItems, currentPage, debouncedQuery]);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < pagination.totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Error state
  if (error) {
    return (
      <div
        className="p-6 bg-red-50 border-2 border-red-200 rounded-lg text-red-700 mx-auto max-w-4xl mt-8"
        role="alert"
      >
        <strong className="block mb-2 font-semibold">Error:</strong> {error}
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Items</h1>

      {/* Search Input */}
      <div className="mb-8">
        <label
          htmlFor="search-input"
          className="block mb-2 font-semibold text-gray-700 text-sm"
        >
          Search items:
        </label>
        <input
          id="search-input"
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search by name..."
          className="w-full px-4 py-3 text-base border-2 border-gray-300 rounded-lg
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                     disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60
                     transition-colors"
          aria-label="Search items by name"
          disabled={loading}
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div
          className="flex flex-col items-center justify-center py-12 text-gray-600"
          role="status"
          aria-live="polite"
        >
          <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p className="text-lg">Loading items...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && items.length === 0 && (
        <div className="text-center py-12 text-gray-600">
          <p className="text-lg mb-4">
            No items found{debouncedQuery ? ` for "${debouncedQuery}"` : ""}.
          </p>
          {debouncedQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600
                         transition-colors font-medium"
            >
              Clear Search
            </button>
          )}
        </div>
      )}

      {/* Items List with Virtualization */}
      {!loading && items.length > 0 && (
        <>
          <div className="mb-8 border border-gray-200 rounded-lg overflow-hidden">
            <FixedSizeList
              height={600}
              itemCount={items.length}
              itemSize={70}
              width="100%"
              role="list"
            >
              {({ index, style }) => {
                const item = items[index];
                return (
                  <div style={style} className="p-2">
                    <Link
                      to={"/items/" + item.id}
                      className="flex justify-between items-center h-full px-5 py-4
                                 bg-white border border-gray-200 rounded-lg
                                  hover:shadow-sm
                                 focus:outline-none focus:ring-2 focus:ring-blue-500
                                 transition-all duration-200 hover:-translate-y-0.5"
                    >
                      <span className="font-medium text-gray-800">
                        {item.name}
                      </span>
                      {item.price !== undefined && (
                        <span
                          className="font-semibold text-blue-600 text-lg"
                          aria-label={`Price: ${item.price} dollars`}
                        >
                          ${item.price}
                        </span>
                      )}
                    </Link>
                  </div>
                );
              }}
            </FixedSizeList>
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-between gap-6 p-6 bg-gray-50 rounded-lg flex-wrap">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1 || loading}
              className="px-6 py-2 h-10 bg-blue-500 text-white rounded-lg font-medium
                         hover:bg-blue-600 hover:-translate-y-0.5 hover:shadow-lg
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                         disabled:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-60
                         disabled:hover:translate-y-0 disabled:hover:shadow-none
                         transition-all duration-200 min-w-[110px]"
              aria-label="Go to previous page"
            >
              ← Previous
            </button>

            <span
              className="font-medium text-gray-800 text-cente text-sm"
              aria-live="polite"
              aria-atomic="true"
            >
              Page {pagination.page} of {pagination.totalPages}
              <span className="block text-xs text-gray-600 mt-1">
                ({pagination.total} total items)
              </span>
            </span>

            <button
              onClick={handleNextPage}
              disabled={currentPage >= pagination.totalPages || loading}
              className="px-6 py-2 h-10 bg-blue-500 text-white rounded-lg font-medium
                         hover:bg-blue-600 hover:-translate-y-0.5 hover:shadow-lg
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                         disabled:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-60
                         disabled:hover:translate-y-0 disabled:hover:shadow-none
                         transition-all duration-200 min-w-[110px]"
              aria-label="Go to next page"
            >
              Next →
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Items;
