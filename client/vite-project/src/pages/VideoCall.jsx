// src/pages/VideoCall.jsx
import React, { useEffect, useRef, useState, useContext } from "react";
import { io } from "socket.io-client";
import { AppContent } from "../context/AppContext";
import { toast } from "react-toastify";

export default function VideoCall() {
  const { backendUrl } = useContext(AppContent);
  const socketRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const [mySocketId, setMySocketId] = useState("");
  const [remoteId, setRemoteId] = useState("");
  const [incomingCall, setIncomingCall] = useState(null);
  const [inCallWith, setInCallWith] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(import.meta.env.VITE_BACKEND_URL || backendUrl, {
      withCredentials: true,
      auth: { token: localStorage.getItem("token") || "" },
    });

    const socket = socketRef.current;

    socket.on("connect", () => setMySocketId(socket.id));
    socket.on("call-made", async ({ from, offer }) => setIncomingCall({ from, offer }));
    socket.on("answer-made", async ({ answer }) => {
      if (pcRef.current) await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    });
    socket.on("ice-candidate", async ({ candidate }) => {
      if (pcRef.current && candidate) await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    });
    socket.on("call-ended", () => endCallLocal());

    return () => {
      socket.disconnect();
      endCallLocal();
    };
  }, []);

  const getLocalStream = async () => {
    if (!localStreamRef.current) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    }
    return localStreamRef.current;
  };

  const createPeer = (remoteSocketId) => {
    if (pcRef.current) return pcRef.current;

    const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });

    pc.onicecandidate = (event) => {
      if (event.candidate && remoteSocketId && socketRef.current) {
        socketRef.current.emit("ice-candidate", { to: remoteSocketId, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
    };

    pcRef.current = pc;
    return pc;
  };

  const startCall = async () => {
    if (!remoteId) return toast.error("Enter the contact ID");
    try {
      const stream = await getLocalStream();
      const pc = createPeer(remoteId);
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      setInCallWith(remoteId);
      if (socketRef.current) socketRef.current.emit("call-user", { to: remoteId, offer });
    } catch (err) {
      toast.error("Failed to start the call");
      endCallLocal();
    }
  };

  const acceptCall = async () => {
    if (!incomingCall) return;
    try {
      const stream = await getLocalStream();
      const pc = createPeer(incomingCall.from);
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      setInCallWith(incomingCall.from);
      if (socketRef.current) socketRef.current.emit("make-answer", { to: incomingCall.from, answer });
      setIncomingCall(null);
    } catch (err) {
      toast.error("Failed to accept the call");
      endCallLocal();
    }
  };

  const hangUp = () => {
    if (inCallWith && socketRef.current) socketRef.current.emit("hang-up", { to: inCallWith });
    endCallLocal();
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => (track.enabled = isMuted));
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => (track.enabled = !videoOff));
      setVideoOff(!videoOff);
    }
  };

  const endCallLocal = () => {
    if (pcRef.current) pcRef.current.close();
    pcRef.current = null;
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    setInCallWith(null);
    setIncomingCall(null);
    setIsMuted(false);
    setVideoOff(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      <h1 className="text-4xl font-bold mb-6 text-gray-800">Connect with a Friend</h1>

      {/* Videos */}
      <div className="flex flex-col md:flex-row gap-6 w-full max-w-6xl mb-6">
        <div className="flex flex-col items-center bg-white rounded-xl shadow-xl p-4 flex-1 hover:shadow-2xl transition-shadow duration-200">
          <span className="text-gray-600 font-medium mb-2">You</span>
          <video ref={localVideoRef} autoPlay muted playsInline className="rounded-lg w-full h-72 bg-black" />
        </div>
        <div className="flex flex-col items-center bg-white rounded-xl shadow-xl p-4 flex-1 hover:shadow-2xl transition-shadow duration-200">
          <span className="text-gray-600 font-medium mb-2">Friend</span>
          <video ref={remoteVideoRef} autoPlay playsInline className="rounded-lg w-full h-72 bg-black" />
        </div>
      </div>

      {/* Contact Info & Call Controls */}
      <div className="flex flex-col md:flex-row gap-4 w-full max-w-6xl">
        <div className="flex-1 bg-white p-5 rounded-xl shadow-lg flex flex-col gap-3 hover:shadow-xl transition-shadow duration-200">
          <span className="text-gray-500 text-sm">Your Contact ID</span>
          <div className="flex gap-2 items-center">
            <input readOnly value={mySocketId} className="border rounded px-3 py-2 w-full text-gray-700" />
            <button
              onClick={() => {
                navigator.clipboard.writeText(mySocketId);
                toast.success("Copied!");
              }}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition"
            >
              Copy
            </button>
          </div>
        </div>

        <div className="flex-1 bg-white p-5 rounded-xl shadow-lg flex flex-col gap-3 hover:shadow-xl transition-shadow duration-200">
          <span className="text-gray-500 text-sm">Connect to Friend</span>
          <div className="flex gap-2 items-center">
            <input
              value={remoteId}
              onChange={(e) => setRemoteId(e.target.value)}
              placeholder="Enter friend's Contact ID"
              className="border rounded px-3 py-2 w-full text-gray-700"
            />
            <button
              onClick={startCall}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
            >
              Call
            </button>
          </div>
        </div>
      </div>

      {/* Incoming Call */}
      {incomingCall && !inCallWith && (
        <div className="mt-6 bg-yellow-50 p-5 rounded-xl shadow-md w-full max-w-6xl flex flex-col md:flex-row justify-between items-center hover:shadow-lg transition-shadow duration-200">
          <span className="text-gray-700 font-medium">
            {incomingCall.from} wants to chat
          </span>
          <div className="flex gap-3 mt-3 md:mt-0">
            <button
              onClick={acceptCall}
              className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Accept
            </button>
            <button
              onClick={() => {
                if (socketRef.current) socketRef.current.emit("hang-up", { to: incomingCall.from });
                setIncomingCall(null);
              }}
              className="px-5 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {/* In-Call Controls */}
      {inCallWith && (
        <div className="mt-6 flex gap-4">
          <button
            onClick={toggleMute}
            className={`px-6 py-3 rounded-xl shadow-lg transition ${
              isMuted ? "bg-gray-400 text-white" : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {isMuted ? "Unmute" : "Mute"}
          </button>

          <button
            onClick={toggleVideo}
            className={`px-6 py-3 rounded-xl shadow-lg transition ${
              videoOff ? "bg-gray-400 text-white" : "bg-yellow-500 text-white hover:bg-yellow-600"
            }`}
          >
            {videoOff ? "Video On" : "Video Off"}
          </button>

          <button
            onClick={hangUp}
            className="px-6 py-3 bg-red-600 text-white rounded-xl shadow-lg hover:bg-red-700 transition"
          >
            End Call
          </button>
        </div>
      )}
    </div>
  );
}
