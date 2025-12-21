// src/pages/Home.jsx
import React, { useContext, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AppContent } from "../context/AppContext";
import Navbar from "../components/Navbar";
import Header from "../components/Header";
import {
  createNewDoc,
  getAllDocs,
  renameDoc,
  deleteDoc,
  getDocById,
} from "../utils/api";
import {
  FiFileText,
  FiCheck,
  FiX,
  FiTrash2,
  FiDownload,
  FiPlus,
  FiVideo,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";

const Home = () => {
  const { isLoggedIn, authChecked } = useContext(AppContent);
  const [documents, setDocuments] = useState([]);
  const [editDocId, setEditDocId] = useState(null);
  const [titleInput, setTitleInput] = useState("");
  const [fabOpen, setFabOpen] = useState(false);
  const navigate = useNavigate();

  const blurTimeout = useRef(null);
  const latestTitle = useRef("");
  const latestDocId = useRef("");

  useEffect(() => {
    if (authChecked && isLoggedIn) {
      loadDocuments();
    }
  }, [authChecked, isLoggedIn]);

  const loadDocuments = async () => {
    try {
      const docs = await getAllDocs();
      setDocuments(docs);
    } catch (err) {
      console.error("Failed to load documents:", err);
      toast.error("Failed to load documents");
    }
  };

  const handleCreateDoc = async () => {
    try {
      const docId = await createNewDoc();
      navigate(`/docs/${docId}`);
    } catch (error) {
      console.error("Create document failed:", error);
      toast.error("Failed to create document. Please try again.");
    }
  };

  const handleOpenDoc = (id) => {
    if (blurTimeout.current) clearTimeout(blurTimeout.current);
    navigate(`/docs/${id}`);
  };

  const startEditing = (docId, currentTitle) => {
    setEditDocId(docId);
    setTitleInput(currentTitle || "");
    latestDocId.current = docId;
    latestTitle.current = currentTitle || "";
  };

  const handleTitleChange = (e) => {
    setTitleInput(e.target.value);
    latestTitle.current = e.target.value;
  };

  const handleTitleSubmit = async () => {
    const finalTitle = latestTitle.current.trim();
    const docId = latestDocId.current;

    if (!finalTitle) {
      setEditDocId(null);
      return;
    }

    const currentDoc = documents.find((d) => d._id === docId);
    if (currentDoc?.title === finalTitle) {
      setEditDocId(null);
      return;
    }

    try {
      await renameDoc(docId, finalTitle);
      setDocuments((prevDocs) =>
        prevDocs.map((doc) =>
          doc._id === docId ? { ...doc, title: finalTitle } : doc
        )
      );
      toast.success("Document renamed");
    } catch (error) {
      console.error("Rename failed:", error);
      toast.error("Rename failed");
    }

    setEditDocId(null);
    setTitleInput("");
  };

  const cancelEditing = () => {
    setEditDocId(null);
    setTitleInput("");
  };

  const handleDeleteDoc = async (id) => {
    try {
      await deleteDoc(id);
      setDocuments((prevDocs) => prevDocs.filter((doc) => doc._id !== id));
      toast.success("Document deleted");
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete document");
    }
  };

  const handleDownloadDoc = async (id, title) => {
    try {
      const doc = await getDocById(id);
      let textContent = "";
      if (doc.content?.ops) {
        textContent = doc.content.ops.map((op) => op.insert).join("");
      } else {
        textContent = JSON.stringify(doc.content, null, 2);
      }

      const blob = new Blob([textContent], { type: "text/plain" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${title || "Untitled Document"}.txt`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success("Document downloaded");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download document");
    }
  };

  if (!authChecked) {
    return (
      <div className="text-center mt-10 text-gray-500 animate-pulse">
        Checking login status...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative">
      <Navbar />
      <Header />

      {isLoggedIn && (
        <div className="max-w-6xl mx-auto px-4 sm:px-8 mt-10">
          {/* Empty State */}
          {documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-28 text-gray-700">
              <h2 className="text-4xl font-semibold text-gray-900 mb-4 text-center">
                Your Workspace is Empty
              </h2>
              <p className="text-lg text-gray-500 mb-8 text-center max-w-2xl">
                Start fresh by creating your first document or launching a video
                meeting. Your workspace is designed to keep everything simple
                and productive.
              </p>
              <button
                onClick={handleCreateDoc}
                className="px-8 py-3 bg-indigo-600 text-white font-medium rounded-lg shadow-md hover:bg-indigo-700 transition"
              >
                Create New Document
              </button>
            </div>
          ) : (
            <motion.div
              layout
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence>
                {documents.map((doc) => (
                  <motion.div
                    key={doc._id}
                    initial={{ opacity: 0, y: 25 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 15 }}
                    transition={{ duration: 0.25 }}
                    className="bg-gray-50 border border-gray-200 rounded-xl p-5 flex flex-col shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <FiFileText className="text-indigo-500 text-2xl" />
                      {editDocId === doc._id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input
                            value={titleInput}
                            onChange={handleTitleChange}
                            autoFocus
                            className="flex-1 bg-white border-b border-indigo-400 outline-none px-1 py-0.5 text-sm"
                            placeholder="Document title..."
                          />
                          <FiCheck
                            className="text-green-500 cursor-pointer hover:scale-110 transition"
                            onClick={handleTitleSubmit}
                          />
                          <FiX
                            className="text-red-500 cursor-pointer hover:scale-110 transition"
                            onClick={cancelEditing}
                          />
                        </div>
                      ) : (
                        <h4
                          onClick={() => startEditing(doc._id, doc.title)}
                          className="font-medium text-gray-900 cursor-pointer truncate hover:text-indigo-600 transition"
                          title="Click to rename"
                        >
                          {doc.title || "Untitled Document"}
                        </h4>
                      )}
                    </div>

                    <div className="flex justify-between items-center mt-auto">
                      <button
                        onClick={() => handleOpenDoc(doc._id)}
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition"
                      >
                        Open
                      </button>
                      <div className="flex gap-3 text-gray-600 text-lg">
                        <FiDownload
                          className="cursor-pointer hover:text-blue-500 transition"
                          onClick={() => handleDownloadDoc(doc._id, doc.title)}
                        />
                        <FiTrash2
                          className="cursor-pointer hover:text-red-500 transition"
                          onClick={() => handleDeleteDoc(doc._id)}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Floating Action Buttons */}
          <div className="fixed bottom-8 right-8 flex flex-col items-end gap-3">
            {fabOpen && (
              <>
                <button
                  onClick={handleCreateDoc}
                  className="flex items-center gap-2 bg-white border px-4 py-2 rounded-md shadow-sm hover:bg-gray-50 transition"
                >
                  <FiFileText className="w-5 h-5 text-indigo-500" /> New Document
                </button>

                <button
                  onClick={() => navigate("/video-call")}
                  className="flex items-center gap-2 bg-white border px-4 py-2 rounded-md shadow-sm hover:bg-gray-50 transition"
                >
                  <FiVideo className="w-5 h-5 text-purple-500" /> Video Call
                </button>
              </>
            )}

            <motion.button
              onClick={() => setFabOpen(!fabOpen)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="bg-indigo-600 text-white p-4 rounded-full shadow-md"
            >
              <FiPlus size={24} />
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
