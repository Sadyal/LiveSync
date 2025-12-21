import axios from 'axios';

// ✅ Base API URL — make sure VITE_BACKEND_URL = http://localhost:4000 (no /api)
const BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/api/docs`;

export const createNewDoc = async () => {
  const res = await axios.post(
    BASE_URL,
    {}, // No body needed
    { withCredentials: true }
  );
  return res.data.id;
};

export const getAllDocs = async () => {
  const res = await axios.get(BASE_URL, { withCredentials: true });
  return res.data;
};

export const renameDoc = async (docId, newTitle) => {
  const res = await axios.patch(
    `${BASE_URL}/${docId}`,
    { title: newTitle },
    { withCredentials: true }
  );
  return res.data;
};

// ✅ Delete a document
export const deleteDoc = async (docId) => {
  const res = await axios.delete(`${BASE_URL}/${docId}`, {
    withCredentials: true,
  });
  return res.data;
};

// ✅ Fetch a single document (for download etc.)
export const getDocById = async (docId) => {
  const res = await axios.get(`${BASE_URL}/${docId}`, {
    withCredentials: true,
  });
  return res.data;
};
