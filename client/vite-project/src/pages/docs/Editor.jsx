import { useEffect, useRef, useContext, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { io } from "socket.io-client";
import { AppContent } from "../../context/AppContext";
import ShareDoc from "../../components/ShareDoc";
import { Document, Packer, Paragraph, TextRun, ImageRun } from "docx";
import { saveAs } from "file-saver";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Download, Share2, Save, CloudCheck, CloudOff, Globe } from "lucide-react";
import { toast } from "react-toastify";

const TOOLBAR_OPTIONS = [
  ["bold", "italic", "underline", "strike"],
  [{ header: [1, 2, 3, false] }],
  [{ list: "ordered" }, { list: "bullet" }],
  ["blockquote", "code-block"],
  [{ align: [] }],
  [{ color: [] }, { background: [] }],
  ["image", "link"],
  ["clean"],
];

const SAVE_INTERVAL_MS = 2000;

const Editor = () => {
  const { id: docId } = useParams();
  const navigate = useNavigate();
  const editorRef = useRef();
  const quillInstanceRef = useRef();
  const socketRef = useRef();
  const { backendUrl } = useContext(AppContent);
  const [isSaving, setIsSaving] = useState(false);
  const [syncStatus, setSyncStatus] = useState("synced"); // synced, saving, error

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Authentication required");
      navigate("/login");
      return;
    }

    const socket = io(backendUrl, {
      transports: ["websocket"],
      withCredentials: true,
      auth: { token },
    });
    socketRef.current = socket;

    if (editorRef.current) editorRef.current.innerHTML = "";

    const editor = new Quill(editorRef.current, {
      theme: "snow",
      modules: { toolbar: TOOLBAR_OPTIONS },
      placeholder: "Write something brilliant..."
    });
    
    editor.disable();
    quillInstanceRef.current = editor;

    socket.once("load-document", (document) => {
      editor.setContents(document);
      editor.enable();

      editor.on("text-change", (delta, oldDelta, source) => {
        if (source === "user") {
          setSyncStatus("saving");
          socket.emit("send-changes", delta);
        }
      });

      socket.on("receive-changes", (delta) => {
        editor.updateContents(delta);
      });

      const interval = setInterval(() => {
        if (editor && typeof editor.getContents === "function") {
          socket.emit("save-document", editor.getContents());
          setSyncStatus("synced");
        }
      }, SAVE_INTERVAL_MS);

      return () => {
        socket.disconnect();
        clearInterval(interval);
      };
    });

    socket.once("access-denied", () => {
      toast.error("Access denied");
      navigate("/");
    });

    socket.emit("get-document", docId);
  }, [docId, backendUrl, navigate]);

  const handleDownload = async () => {
    if (!quillInstanceRef.current) return;
    try {
      const delta = quillInstanceRef.current.getContents();
      const children = [];

      for (const op of delta.ops) {
        if (typeof op.insert === "string") {
          children.push(new Paragraph({ children: [new TextRun(op.insert)] }));
        } else if (op.insert && op.insert.image) {
          const base64Data = op.insert.image.split(",")[1];
          const buffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
          children.push(new Paragraph({ children: [new ImageRun({ data: buffer, transformation: { width: 300, height: 200 } })] }));
        }
      }

      const doc = new Document({ sections: [{ children }] });
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `LiveSync-${docId.substring(0, 6)}.docx`);
      toast.success("DOCX Exported");
    } catch (err) {
      toast.error("Export failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-['Inter']">
      {/* Premium Editor Header */}
      <header className="h-16 md:h-20 bg-white border-b border-slate-200 sticky top-0 z-[100] px-4 md:px-8 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate("/")}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="hidden sm:block">
            <div className="flex items-center gap-2 mb-0.5">
               <h1 className="text-sm font-bold text-slate-900">Document Editor</h1>
               <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                 syncStatus === 'synced' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600 animate-pulse'
               }`}>
                 {syncStatus === 'synced' ? <><CloudCheck className="w-3 h-3"/> Saved</> : <><Save className="w-3 h-3"/> Saving</>}
               </div>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Auto-syncing to LiveSync Cloud</p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
           <div className="flex items-center bg-slate-100 rounded-xl p-1">
              <button 
                onClick={handleDownload}
                className="p-2 md:px-4 md:py-2 text-slate-600 hover:bg-white hover:shadow-sm rounded-lg text-xs font-bold transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> <span className="hidden md:inline">Export DOCX</span>
              </button>
           </div>
           
           <ShareDoc />
        </div>
      </header>

      {/* Editor Container */}
      <main className="max-w-5xl mx-auto py-6 md:py-12 px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 border border-slate-200 overflow-hidden min-h-[80vh]"
        >
          <div className="editor-wrapper prose prose-slate max-w-none">
             <div ref={editorRef} />
          </div>
        </motion.div>
        
        {/* Mobile Toolbar Indicator */}
        <div className="mt-6 flex items-center justify-center gap-4 md:hidden opacity-50">
           <Globe className="w-4 h-4" />
           <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Live Sync Enabled</p>
        </div>
      </main>

      <style>{`
        .ql-toolbar.ql-snow {
          border: none !important;
          border-bottom: 1px solid #f1f5f9 !important;
          padding: 1rem 1.5rem !important;
          background: #ffffff !important;
          position: sticky;
          top: 0;
          z-index: 50;
        }
        .ql-container.ql-snow {
          border: none !important;
          font-family: 'Inter', sans-serif !important;
          font-size: 16px !important;
          padding: 1.5rem !important;
        }
        @media (min-width: 768px) {
          .ql-container.ql-snow {
            padding: 3rem 4rem !important;
          }
        }
        .ql-editor {
          min-height: 70vh !important;
          line-height: 1.6 !important;
        }
        .ql-editor.ql-blank::before {
          color: #94a3b8 !important;
          font-style: normal !important;
        }
        /* Hide scrollbar for cleaner look */
        .ql-editor::-webkit-scrollbar {
          width: 0px;
        }
      `}</style>
    </div>
  );
};

export default Editor;
