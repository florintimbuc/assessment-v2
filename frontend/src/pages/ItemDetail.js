import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

function ItemDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const abortController = new AbortController();

    setLoading(true);
    setError(null);

    fetch("/api/items/" + id, { signal: abortController.signal })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("Item not found");
          }
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (!abortController.signal.aborted) {
          setItem(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError" && !abortController.signal.aborted) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => abortController.abort();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="flex flex-col items-center justify-center py-12 text-gray-600">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p className="text-lg">Loading item details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div
          className="p-6 bg-red-50 border-2 border-red-200 rounded-lg text-red-700"
          role="alert"
        >
          <strong className="block mb-2 font-semibold text-lg">Error</strong>
          <p className="mb-4">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              ← Back to Items
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center py-12 text-gray-600">
          <p className="text-lg mb-4">Item not found</p>
          <Link
            to="/"
            className="inline-block px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            ← Back to Items
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      {/* Back Button */}
      <Link
        to="/"
        className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 font-medium transition-colors"
      >
        ← Back to Items
      </Link>

      {/* Item Card */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">{item.name}</h1>

        <div className="space-y-4">
          {item.category && (
            <div className="flex items-start">
              <span className="font-semibold text-gray-700 min-w-[120px]">
                Category:
              </span>
              <span className="text-gray-600">{item.category}</span>
            </div>
          )}

          {item.price !== undefined && (
            <div className="flex items-start">
              <span className="font-semibold text-gray-700 min-w-[120px]">
                Price:
              </span>
              <span className="text-2xl font-bold text-blue-600">
                ${item.price}
              </span>
            </div>
          )}

          {item.description && (
            <div className="flex items-start">
              <span className="font-semibold text-gray-700 min-w-[120px]">
                Description:
              </span>
              <span className="text-gray-600">{item.description}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ItemDetail;
