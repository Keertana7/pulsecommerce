import "./Chat.css";
import { useState, useEffect } from "react";
import { db } from "../firebase/firebase";
import { useRef } from "react";
import { showCartReminder } from "../utils/notifications";
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
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [priceFilter, setPriceFilter] = useState("all");
  const [whatsappInput, setWhatsappInput] = useState("");
  const [instagramInput, setInstagramInput] = useState("");
  const [smsInput, setSmsInput] = useState("");
  const [platform, setPlatform] = useState("WhatsApp");
  const [aiProducts, setAiProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [added, setAdded] = useState(false);
  const [notifications, setNotifications] = useState([]);

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
  useEffect(() => {
    fetch("https://dummyjson.com/products")
      .then(res => res.json())
      .then(data => setProducts(data.products));
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
    // backend call
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
    
    const aiRes = await fetch("http://127.0.0.1:8001/generate-response", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: inputValue,
        user_id: "user_123"
      }),
    });

    const aiData = await aiRes.json();
    const data = await res.json();
    setAiProducts(aiData.products || []);

    await addDoc(collection(db, "messages"), {
      text: aiData.reply || "No response",
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
  const filteredProducts = products.filter((p) => {
  const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());

  const matchesPrice =
    priceFilter === "all" ||
    (priceFilter === "low" && p.price < 1000) ||
    (priceFilter === "medium" && p.price >= 1000 && p.price <= 5000) ||
    (priceFilter === "high" && p.price > 5000);

  return matchesSearch && matchesPrice;
});

  const addToCart = (product) => {
    setCart((prevCart) => [...prevCart, product]);

  trackEvent("add_to_cart", product.title || product.name);

  // 🔔 trigger reminder
  setTimeout(() => {
    showCartReminder();
  }, 10000); // demo delay
  const name = product.title || product.name || "Item";
  // 🔔 add notification
  setNotifications((prev) => [
    {
      id: Date.now(), 
      message: `${name} added to cart`,
      time: new Date().toLocaleTimeString()
    },
    ...prev
  ]);
  };
 
  const trackEvent = async (type, product) => {
  console.log("EVENT:", type, product);

  try {
    await addDoc(collection(db, "events"), {
      type: type,
      product: product,
      userId: "user_123",
      timestamp: serverTimestamp()
    });
    await fetch("http://127.0.0.1:8000/message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: type,
        user_id: "user_123",
        channel: "WhatsApp"
      }),
    });
  } catch (err) {
    console.error("Error storing event:", err);
  }
};
  return (
    <div className="dashboard">
    <div className="top-bar">
    
  <input
    placeholder="Search products..."
    value={search}
    onChange={(e) => {
      setSearch(e.target.value);
      setAiProducts([]); // 🔥 ADD THIS LINE
      trackEvent("search", e.target.value);
    }}
  />

  <select onChange={(e) => {
  setPriceFilter(e.target.value);
  setAiProducts([]); // 🔥 ADD THIS
}}>
    <option value="all">All Prices</option>
    <option value="low">Low</option>
    <option value="medium">Medium</option>
    <option value="high">High</option>
  </select>

  <div className="cart">
    🛒 {cart.length}
  </div>

</div>
  <div className="notifications-panel">
  <h3>Notifications</h3>

  {notifications.length === 0 ? (
    <p className="notification-empty">No recent notifications.</p>
  ) : (
    notifications.slice(0, 3).map((n) => (
      <div key={n.id} className="notification-item">
        <div className="notification-message">{n.message}</div>
        <div className="notification-time">{n.time}</div>
      </div>
    ))
  )}
</div>
  {aiProducts.length > 0 && (
  <h3>🔥 Recommended for you</h3>
)}

  {/* PRODUCTS SECTION */}
  <div className="products-section">

    <div className="product-grid">
      {(aiProducts.length > 0 ? aiProducts : filteredProducts).map((p) => (
        <div key={p.id} className="product-card">
          <img src={p.thumbnail || p.image || "https://via.placeholder.com/150"} />
          <h4>{p.title || p.name}</h4>
          <p>₹ {p.price || "N/A"}</p>

          <button onClick={() => {
            trackEvent("view", p.title || p.name);
            setSelectedProduct(p);
            }}>
            View
          </button>
          
          <button onClick={() => addToCart(p)}>
            Add to Cart
          </button>
        </div>
      ))}
    </div>
    {selectedProduct && (
  <div className="modal-overlay">
    <div className="modal-content">

      <button 
        className="close-btn"
        onClick={() => setSelectedProduct(null)}
      >
        ⬅ 
      </button>

      <img 
        src={selectedProduct.thumbnail || selectedProduct.image} 
        style={{ width: "100%", borderRadius: "10px" }}
      />

      <h2>{selectedProduct.title || selectedProduct.name}</h2>
      <p>₹ {selectedProduct.price}</p>

      <button 
        className="add-cart-btn"
        onClick={() => {
          addToCart(selectedProduct);
          setAdded(true);

          setTimeout(() => setAdded(false), 2000); // reset after 2 sec
          }}
      >
      {added ? "Added ✅" : "Add to Cart"}
      </button>

      <button className="buy-now-btn">
         Buy Now
      </button>

    </div>
  </div>
)}

  </div>


<div className="main-content">
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
</div>
  );
}