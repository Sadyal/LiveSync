import { useEffect, useRef, useContext } from "react";
import { useParams } from "react-router-dom";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { io } from "socket.io-client";
import { AppContent } from "../../context/AppContext";
import ShareDoc from "../../components/ShareDoc";

// ✅ DOCX download libs
import { Document, Packer, Paragraph, TextRun, ImageRun } from "docx";
import { saveAs } from "file-saver";

const TOOLBAR_OPTIONS = [
  ["bold", "italic", "underline", "strike"],
  [{ header: [1, 2, 3, false] }],
  [{ list: "ordered" }, { list: "bullet" }],
  ["blockquote", "code-block"],
  [{ script: "sub" }, { script: "super" }],
  [{ indent: "-1" }, { indent: "+1" }],
  [{ align: [] }],
  [{ color: [] }, { background: [] }],
  ["image"], // ✅ allow image upload
  ["clean"],
];

const SAVE_INTERVAL_MS = 2000;

const Editor = () => {
  const { id: docId } = useParams();
  const editorRef = useRef();
  const quillInstanceRef = useRef();
  const socketRef = useRef();
  const { backendUrl } = useContext(AppContent);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("⚠️ Token not found in localStorage. Please log in again.");
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
    });
    editor.disable();
    editor.setText("Loading...");
    quillInstanceRef.current = editor;

    socket.once("load-document", (document) => {
      editor.setContents(document);
      editor.enable();

      editor.on("text-change", (delta, oldDelta, source) => {
        if (source === "user") {
          socket.emit("send-changes", delta);
        }
      });

      socket.on("receive-changes", (delta) => {
        editor.updateContents(delta);
      });

      const interval = setInterval(() => {
        if (editor && typeof editor.getContents === "function") {
          socket.emit("save-document", editor.getContents());
        }
      }, SAVE_INTERVAL_MS);

      return () => {
        socket.disconnect();
        clearInterval(interval);
      };
    });

    socket.once("access-denied", () => {
      alert("🚫 You do not have access to this document.");
      editor.setText("Access denied.");
      editor.disable();
    });

    socket.emit("get-document", docId);
  }, [docId, backendUrl]);

  // ✅ Download as DOCX with text + images
  const handleDownload = async () => {
    if (!quillInstanceRef.current) return;

    const delta = quillInstanceRef.current.getContents();
    const children = [];

    for (const op of delta.ops) {
      if (typeof op.insert === "string") {
        // normal text
        children.push(
          new Paragraph({
            children: [new TextRun(op.insert)],
          })
        );
      } else if (op.insert && op.insert.image) {
        // base64 image from Quill
        const base64Data = op.insert.image.split(",")[1];
        const buffer = Uint8Array.from(atob(base64Data), (c) =>
          c.charCodeAt(0)
        );

        children.push(
          new Paragraph({
            children: [
              new ImageRun({
                data: buffer,
                transformation: { width: 300, height: 200 }, // adjust size
              }),
            ],
          })
        );
      }
    }

    const doc = new Document({
      sections: [{ children }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `document-${docId}.docx`);
  };

  return (
    <>
      <ShareDoc />

      <div className="flex justify-end p-4 bg-gray-100 border-b">
        <button
          onClick={handleDownload}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition"
        >
          Download as DOCX
        </button>
      </div>

      <div ref={editorRef} style={{ height: "100vh" }} />
    </>
  );
};

export default Editor;
