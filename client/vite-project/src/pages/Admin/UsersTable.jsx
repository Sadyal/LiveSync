// src/Admin/UsersTable.jsx
import React from "react";

export default function UsersTable({ users, loadingUsers, toggleRole, deleteUser }) {
  if (loadingUsers) return <p>Loading users...</p>;

  if (!users || users.length === 0) {
    return (
      <p className="text-center py-4 text-gray-500">No users found</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-300 rounded">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-2 px-4 border-b">Name</th>
            <th className="py-2 px-4 border-b">Email</th>
            <th className="py-2 px-4 border-b">Role</th>
            <th className="py-2 px-4 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u._id} className="hover:bg-gray-50">
              <td className="py-2 px-4 border-b">{u.name}</td>
              <td className="py-2 px-4 border-b">{u.email}</td>
              <td className="py-2 px-4 border-b capitalize">{u.role}</td>
              <td className="py-2 px-4 border-b flex gap-2">
                <button
                  onClick={() => toggleRole(u._id, u.role)}
                  className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {u.role === "user" ? "Promote" : "Demote"}
                </button>
                <button
                  onClick={() => deleteUser(u._id)}
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
