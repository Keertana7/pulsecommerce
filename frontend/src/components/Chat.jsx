import "./Chat.css";
import { useState, useEffect } from "react";
import { db } from "../firebase/firebase";
import { useRef } from "react";

import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy
} from "firebase/firestore";

export default function Chat() {
  const bottomRef = useRef();
  const [messages, setMessages] = useState([]);
  const [whatsappInput, setWhatsappInput] = useState("");
  const [instagramInput, setInstagramInput] = useState("");
  const [smsInput, setSmsInput] = useState("");
  const [platform, setPlatform] = useState("WhatsApp");
  useEffect(() => {
  bottomRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages]);
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

  const sendMessage = async (platform, inputValue, setInputFn) => {
  if (!inputValue) return;

  try {
    await addDoc(collection(db, "messages"), {
      text: inputValue,
      sender: "user",
      platform: platform,
      createdAt: serverTimestamp()
    });

    const res = await fetch("http://127.0.0.1:8000/message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: inputValue,
        user_id: "user_123",
        channel: platform
      }),
    });

    const data = await res.json();

    await addDoc(collection(db, "messages"), {
      text: data.reply || "No response",
      sender: "bot",
      platform: platform,
      createdAt: serverTimestamp()
    });

  } catch (error) {
    console.error(error);

    await addDoc(collection(db, "messages"), {
      text: "Error 😓",
      sender: "bot",
      platform: platform,
      createdAt: serverTimestamp()
    });
  }

  setInputFn(""); // clear input
};

 

  return (
    <div className="dashboard">

  {/* LEFT: PHONES */}
  <div className="phones">

    {/* WHATSAPP */}
    <div className="phone whatsapp">
  <div className="phone-header">WhatsApp</div>

  <div className="chat-box">
    {messages
      .filter((m) => m.platform === "WhatsApp")
      .map((msg, i) => (
        <div key={i} className={`msg ${msg.sender}`}>
          {msg.text}
        </div>
      ))}
    <div ref={bottomRef}></div>
  </div>

  <div className="phone-input">
    <input
      value={whatsappInput}
      onChange={(e) => setWhatsappInput(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          sendMessage("WhatsApp", whatsappInput, setWhatsappInput);
        }
      }}
      placeholder="Type..."
    />
    <button onClick={() =>
      sendMessage("WhatsApp", whatsappInput, setWhatsappInput)
    }>
      Send
    </button>
  </div>
</div>


    {/* INSTAGRAM */}
    <div className="phone instagram">
  <div className="phone-header">Instagram</div>

  <div className="chat-box">
    {messages
      .filter((m) => m.platform === "Instagram")
      .map((msg, i) => (
        <div key={i} className={`msg ${msg.sender}`}>
          {msg.text}
        </div>
      ))}
    <div ref={bottomRef}></div>
  </div>

  <div className="phone-input">
    <input
      value={instagramInput}
      onChange={(e) => setInstagramInput(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          sendMessage("Instagram", instagramInput, setInstagramInput);
        }
      }}
      placeholder="Type..."
    />
    <button onClick={() =>
      sendMessage("Instagram", instagramInput, setInstagramInput)
    }>
      Send
    </button>
  </div>
</div>



    {/* SMS */}
    <div className="phone sms">
  <div className="phone-header">SMS</div>

  <div className="chat-box">
    {messages
      .filter((m) => m.platform === "SMS")
      .map((msg, i) => (
        <div key={i} className={`msg ${msg.sender}`}>
          {msg.text}
        </div>
      ))}
    <div ref={bottomRef}></div>
  </div>

  <div className="phone-input">
    <input
      value={smsInput}
      onChange={(e) => setSmsInput(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          sendMessage("SMS", smsInput, setSmsInput);
        }
      }}
      placeholder="Type..."
    />
    <button onClick={() =>
      sendMessage("SMS", smsInput, setSmsInput)
    }>
      Send
    </button>
  </div>
</div>

  </div>

  {/* RIGHT SIDE PANEL */}
  <div className="side-panel">

    <h2>PulseCommerce</h2>

    <div className="card">
      <b>Unified Inbox</b><br/>
      WhatsApp • Instagram • SMS
    </div>

    <div className="card">
      <b>Flow Builder</b><br/>
      Cart Abandoned → WhatsApp Nudge
    </div>

    <div className="card">
      <b>Consent</b><br/>
      ☑ Transactional<br/>
      ☐ Marketing
    </div>

    <div className="card">
      <b>Impact</b><br/>
      Cart Recovery ↑ 100%<br/>
      ROI: 8.5x
    </div>


  </div>

</div>
  );
}