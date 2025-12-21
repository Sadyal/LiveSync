// src/Admin/DocsTable.jsx
import React from "react";

export default function DocsTable({ docs, loadingDocs, deleteDoc }) {
  if (loadingDocs) return <p>Loading documents...</p>;

  if (!docs || docs.length === 0) {
    return (
      <p className="text-center py-4 text-gray-500">No documents found</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-300 rounded">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-2 px-4 border-b">Title</th>
            <th className="py-2 px-4 border-b">Owner</th>
            <th className="py-2 px-4 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {docs.map(d => (
            <tr key={d._id} className="hover:bg-gray-50">
              <td className="py-2 px-4 border-b">{d.title}</td>
              <td className="py-2 px-4 border-b">
                {d.owner?.name} ({d.owner?.email})
              </td>
              <td className="py-2 px-4 border-b flex gap-2">
                <button
                  onClick={() => deleteDoc(d._id)}
                  className="px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
