import React, { createContext, useCallback, useContext, useState } from "react";

const DataContext = createContext();

export function DataProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 50,
    total: 0,
    totalPages: 0,
  });

  const fetchItems = useCallback(
    async ({ page = 1, pageSize = 50, q = "", signal } = {}) => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: page.toString(),
          pageSize: pageSize.toString(),
        });

        if (q) {
          params.append("q", q);
        }

        const res = await fetch(`/api/items?${params.toString()}`, { signal });

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const json = await res.json();

        // Only update state if the request wasn't aborted
        if (!signal?.aborted) {
          const itemsData = json.data || json;
          const paginationData = json.pagination || {
            page,
            pageSize,
            total: itemsData.length,
            totalPages: 1,
          };

          setItems(itemsData);
          setPagination(paginationData);
        }
      } catch (err) {
        if (err.name !== "AbortError" && !signal?.aborted) {
          setError(err.message);
          console.error("Error fetching items:", err);
        }
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    []
  );

  return (
    <DataContext.Provider
      value={{ items, loading, error, pagination, fetchItems }}
    >
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
