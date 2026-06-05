import React, { useEffect, useRef, useState, useContext, useCallback } from "react";
import { io } from "socket.io-client";
import { AppContent } from "../context/AppContext";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Copy, UserCheck, ShieldCheck } from "lucide-react";

/**
 * PRODUCTION-GRADE VIDEO CALL MODULE
 * Features:
 * - Low-latency optimized WebRTC configuration
 * - Robust ICE candidate buffering
 * - Multiple STUN redundancy
 * - Modern Glassmorphic UI with Framer Motion
 * - High-quality constraints
 */

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
  ],
  iceCandidatePoolSize: 10,
};

export default function VideoCall() {
  const { backendUrl, user } = useContext(AppContent);
  const [callState, setCallState] = useState("idle"); // idle, calling, incoming, in-call
  const [mySocketId, setMySocketId] = useState("");
  const [remoteId, setRemoteId] = useState("");
  const [incomingCall, setIncomingCall] = useState(null);
  const [inCallWith, setInCallWith] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");

  const callStateRef = useRef("idle");

  // Keep callStateRef in sync with state transitions without re-triggering effect
  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  const socketRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const iceCandidatesBuffer = useRef([]);

  // Cleanup function
  const endCall = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.getSenders().forEach(sender => pcRef.current.removeTrack(sender));
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    
    remoteStreamRef.current = null;
    iceCandidatesBuffer.current = [];
    setInCallWith(null);
    setIncomingCall(null);
    setCallState("idle");
    setConnectionStatus("disconnected");
    setIsMuted(false);
    setVideoOff(false);
  }, []);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_BACKEND_URL || backendUrl, {
      withCredentials: true,
      auth: { token: localStorage.getItem("token") || "" },
      transports: ['websocket'], // Force websocket for lower latency
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setMySocketId(socket.id);
      setConnectionStatus("connected");
    });

    socket.on("your-socket-id", ({ socketId }) => setMySocketId(socketId));

    socket.on("call-made", async ({ from, offer }) => {
      if (callStateRef.current !== "idle") {
        socket.emit("hang-up", { to: from }); // Busy
        return;
      }
      setIncomingCall({ from, offer });
      setCallState("incoming");
    });

    socket.on("answer-made", async ({ answer }) => {
      if (pcRef.current) {
        try {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
          // Process buffered candidates
          while (iceCandidatesBuffer.current.length > 0) {
            const candidate = iceCandidatesBuffer.current.shift();
            await pcRef.current.addIceCandidate(candidate);
          }
        } catch (err) {
          console.error("Error setting remote description:", err);
        }
      }
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      try {
        const iceCandidate = new RTCIceCandidate(candidate);
        if (pcRef.current && pcRef.current.remoteDescription) {
          await pcRef.current.addIceCandidate(iceCandidate);
        } else {
          iceCandidatesBuffer.current.push(iceCandidate);
        }
      } catch (err) {
        console.error("Error adding ice candidate:", err);
      }
    });

    socket.on("call-ended", () => {
      toast.info("Call ended by friend");
      endCall();
    });

    return () => {
      socket.disconnect();
      endCall();
    };
  }, [backendUrl, endCall]);

  const initLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      return stream;
    } catch (err) {
      toast.error("Could not access camera or microphone");
      throw err;
    }
  };

  const createPeer = (remoteSocketId) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit("ice-candidate", { to: remoteSocketId, candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      if (!remoteStreamRef.current) {
        remoteStreamRef.current = new MediaStream();
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStreamRef.current;
      }
      remoteStreamRef.current.addTrack(event.track);
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        endCall();
      }
    };

    pcRef.current = pc;
    return pc;
  };

  const startCall = async () => {
    if (!remoteId) return toast.warning("Enter a Contact ID to call");
    if (remoteId === mySocketId) return toast.warning("You cannot call yourself");

    try {
      setCallState("calling");
      const stream = await initLocalStream();
      const pc = createPeer(remoteId);
      
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      await pc.setLocalDescription(offer);
      
      socketRef.current.emit("call-user", { to: remoteId, offer });
      setInCallWith(remoteId);
    } catch (err) {
      console.error(err);
      endCall();
    }
  };

  const acceptCall = async () => {
    if (!incomingCall) return;
    try {
      setCallState("in-call");
      const stream = await initLocalStream();
      const pc = createPeer(incomingCall.from);
      
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
      
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      
      socketRef.current.emit("make-answer", { to: incomingCall.from, answer });
      setInCallWith(incomingCall.from);
      
      // Process any buffered candidates
      while (iceCandidatesBuffer.current.length > 0) {
        const candidate = iceCandidatesBuffer.current.shift();
        await pc.addIceCandidate(candidate);
      }
    } catch (err) {
      console.error(err);
      endCall();
    }
  };

  const declineCall = () => {
    if (incomingCall && socketRef.current) {
      socketRef.current.emit("hang-up", { to: incomingCall.from });
    }
    endCall();
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const enabled = !isMuted;
      localStreamRef.current.getAudioTracks().forEach(t => t.enabled = enabled);
      setIsMuted(!enabled);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const enabled = !videoOff;
      localStreamRef.current.getVideoTracks().forEach(t => t.enabled = enabled);
      setVideoOff(!enabled);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8 font-['Outfit']">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-4">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/30">
              <Video className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                LiveSync Connect
              </h1>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                End-to-end encrypted
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-md"
          >
            <div className="px-4 py-2">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Your Contact ID</p>
              <p className="text-sm font-mono text-indigo-300 font-bold">{mySocketId || "Connecting..."}</p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(mySocketId);
                toast.success("ID Copied to clipboard");
              }}
              className="p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
            >
              <Copy className="w-5 h-5" />
            </button>
          </motion.div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Video Grid */}
          <div className="lg:col-span-8 space-y-6">
            <div className="relative aspect-[3/4] md:aspect-video w-full bg-black/40 rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl backdrop-blur-sm group">
              <AnimatePresence>
                {!remoteStreamRef.current && callState !== 'in-call' && (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center text-gray-500"
                  >
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                      <UserCheck className="w-10 h-10 opacity-20" />
                    </div>
                    <p className="text-sm tracking-widest uppercase">Waiting for connection</p>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <video 
                ref={remoteVideoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
              
              {/* Local Picture-in-Picture */}
              <motion.div 
                drag
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                className="absolute bottom-6 right-6 w-32 md:w-56 aspect-video bg-black rounded-2xl border-2 border-white/20 overflow-hidden shadow-2xl cursor-move z-10"
              >
                <video 
                  ref={localVideoRef} 
                  autoPlay 
                  muted 
                  playsInline 
                  className="w-full h-full object-cover"
                />
                {videoOff && (
                  <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                    <VideoOff className="w-8 h-8 text-gray-600" />
                  </div>
                )}
              </motion.div>

              {/* Call Controls Overlay */}
              {(callState === 'in-call' || callState === 'calling') && (
                <motion.div 
                  initial={{ y: 100 }}
                  animate={{ y: 0 }}
                  className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-4 bg-black/60 backdrop-blur-xl rounded-3xl border border-white/10"
                >
                  <button 
                    onClick={toggleMute}
                    className={`p-4 rounded-2xl transition-all ${isMuted ? 'bg-red-500/80' : 'bg-white/10 hover:bg-white/20'}`}
                  >
                    {isMuted ? <MicOff /> : <Mic />}
                  </button>
                  <button 
                    onClick={toggleVideo}
                    className={`p-4 rounded-2xl transition-all ${videoOff ? 'bg-red-500/80' : 'bg-white/10 hover:bg-white/20'}`}
                  >
                    {videoOff ? <VideoOff /> : <Video />}
                  </button>
                  <div className="w-px h-8 bg-white/10 mx-2" />
                  <button 
                    onClick={endCall}
                    className="p-4 bg-red-600 rounded-2xl hover:bg-red-700 hover:scale-105 active:scale-95 transition-all"
                  >
                    <PhoneOff />
                  </button>
                </motion.div>
              )}
            </div>
          </div>

          {/* Sidebar / Interaction Area */}
          <div className="lg:col-span-4 space-y-6">
            <section className="bg-white/5 rounded-[2rem] border border-white/10 p-8 backdrop-blur-md">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Phone className="w-5 h-5 text-indigo-400" />
                Start a Session
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-gray-500 ml-1 mb-2 block">Friend's Contact ID</label>
                  <input
                    value={remoteId}
                    onChange={(e) => setRemoteId(e.target.value)}
                    placeholder="Paste ID here..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm font-mono text-indigo-200"
                  />
                </div>
                
                <button
                  disabled={callState !== 'idle' || !remoteId}
                  onClick={startCall}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                >
                  <Phone className="w-5 h-5" />
                  {callState === 'calling' ? 'Connecting...' : 'Initiate Call'}
                </button>
              </div>
            </section>

            {/* Incoming Call Toast */}
            <AnimatePresence>
              {callState === 'incoming' && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-indigo-600 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 blur-3xl" />
                  <div className="relative z-10">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-indigo-200 mb-2">Incoming Transmission</p>
                    <h4 className="text-lg font-bold mb-6 truncate">{incomingCall.from}</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={acceptCall}
                        className="bg-white text-indigo-600 font-bold py-3 rounded-xl hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <Phone className="w-4 h-4" /> Accept
                      </button>
                      <button
                        onClick={declineCall}
                        className="bg-black/20 hover:bg-black/30 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        <PhoneOff className="w-4 h-4" /> Decline
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10">
              <p className="text-xs text-gray-500 leading-relaxed">
                <ShieldCheck className="w-4 h-4 inline mr-2 text-indigo-400" />
                This connection is peer-to-peer. LiveSync does not record or store your audio/video data.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
