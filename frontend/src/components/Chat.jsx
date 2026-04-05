import { useState, useEffect } from "react";
import { db } from "../firebase/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy
} from "firebase/firestore";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [platform, setPlatform] = useState("WhatsApp");

  useEffect(() => {
    const q = query(
      collection(db, "messages"),
      orderBy("createdAt")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => doc.data());
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, []);

  const sendMessage = async () => {
    if (!input) return;

    try {
      await addDoc(collection(db, "messages"), {
        text: input,
        sender: "user",
        platform: platform,
        createdAt: serverTimestamp()
      });

      await addDoc(collection(db, "messages"), {
        text: "Processing...",
        sender: "bot",
        platform: platform,
        createdAt: serverTimestamp()
      });

    } catch (error) {
      console.error("Error:", error);
    }

    setInput("");
  };

  return (
    <div style={{ maxWidth: "500px", margin: "auto" }}>
      <h2>Chat</h2>

      {/* ✅ Platform Switcher */}
      <select
        value={platform}
        onChange={(e) => setPlatform(e.target.value)}
      >
        <option>WhatsApp</option>
        <option>Instagram</option>
        <option>SMS</option>
      </select>

      <h3>Platform: {platform}</h3>

      <div style={{ marginTop: "20px" }}>
  {messages.map((msg, i) => (
    <div
      key={i}
      style={{
        display: "flex",
        justifyContent:
          msg.sender === "user" ? "flex-end" : "flex-start",
        marginBottom: "10px"
      }}
    >
      <div
        style={{
          padding: "10px 15px",
          borderRadius:
            msg.sender === "user"
            ? "15px 15px 0px 15px"
            : "15px 15px 15px 0px",
          maxWidth: "60%",
          backgroundColor:
            msg.sender === "user"
            ? msg.platform === "WhatsApp"
            ? "#25D366"
            : msg.platform === "Instagram"
            ? "#C13584"
            : "#888888"
            : "#2A2F32",
          color: "white"
        }}
      >
        <div style={{ fontSize: "12px", opacity: 0.7 }}>
  {msg.platform  || "Unknown"}
</div>
<div>{msg.text}</div>
      </div>
    </div>
  ))}
</div>

      {/* ✅ Input */}
      <div style={{ marginTop: "15px" }}>
  <input
    value={input}
    onChange={(e) => setInput(e.target.value)}
    placeholder="Type message..."
    style={{
      padding: "10px",
      width: "70%",
      borderRadius: "8px",
      border: "none"
    }}
  />
  <button
    onClick={sendMessage}
    style={{
      padding: "10px 15px",
      marginLeft: "10px",
      borderRadius: "8px",
      border: "none",
      backgroundColor: "#25D366",
      color: "white"
    }}
  >
    Send
  </button>
</div>
    </div>
  );
}