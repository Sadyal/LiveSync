// src/components/FabMenu.jsx
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { AppContent } from "../context/AppContext";

export default function FabMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { backendUrl } = useContext(AppContent);

  const createNewDoc = async () => {
    try {
      const res = await axios.post(
        `${backendUrl}/api/docs`,
        { title: "Untitled Document", content: "" },
        { withCredentials: true }
      );

      // attempt several common response shapes to find the doc id
      const docId =
        res?.data?.doc?._id ||
        res?.data?._id ||
        res?.data?.id ||
        res?.data?.data?.doc?._id;

      if (!docId) {
        console.error("unexpected create doc response:", res?.data);
        toast.error("Unable to get new document id. Check console.");
        return;
      }

      navigate(`/docs/${docId}`);
    } catch (err) {
      console.error("createNewDoc error:", err);
      toast.error(err.response?.data?.message || "Failed to create document");
    }
  };

  return (
    <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3 z-50">
      {open && (
        <>
          <button
            onClick={() => {
              createNewDoc();
              setOpen(false);
            }}
            className="flex items-center gap-2 bg-white shadow-lg px-4 py-2 rounded-2xl hover:bg-gray-100 transition"
          >
            📝 Document
          </button>

          <button
            onClick={() => {
              navigate("/video-call");
              setOpen(false);
            }}
            className="flex items-center gap-2 bg-white shadow-lg px-4 py-2 rounded-2xl hover:bg-gray-100 transition"
          >
            🎥 Start Video Call
          </button>
        </>
      )}

      <button
        onClick={() => setOpen((s) => !s)}
        className="bg-blue-600 text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center hover:bg-blue-700 transition"
        title="Create"
      >
        <span style={{ fontSize: 22, lineHeight: 0 }}>+</span>
      </button>
    </div>
  );
}
