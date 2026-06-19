import { useState, useEffect, useRef,useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getSellerChatMessages,
  sendSellerMessage,
  generatePaymentLink,
} from "../api/api";
import styles from "./SellerChatThreadPage.module.css";

const SellerChatThreadPage = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [linkError, setLinkError] = useState("");
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

    const fetchThread = useCallback(async () => {
       setError("");
  setLoading(true);
      const data = await getSellerChatMessages(conversationId);
      if (data.error) {
        setError("Could not load conversation.");
      } else {
        setMessages(data.messages);
        setConversation(data.conversation);
      }
      setLoading(false);
  }, [conversationId]);

  useEffect(() => {
  fetchThread();
}, [fetchThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    setSending(true);
    const data = await sendSellerMessage(conversationId, input.trim());
    if (!data.error) {
      setMessages((prev) => [...prev, data.message]);
      setInput("");
    }
    setSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleGeneratePaymentLink = async () => {
    setGeneratingLink(true);
    setLinkError("");
    const data = await generatePaymentLink(conversationId);
    setGeneratingLink(false);
    if (data.error) {
      setLinkError(data.error);
      setTimeout(() => setLinkError(""), 3000);
      return;
    }
    // system message with the link already inserted by backend
    // just reload messages so it appears in the thread
    const updated = await getSellerChatMessages(conversationId);
    if (!updated.error) {
      setMessages(updated.messages);
    }
  };


  const renderMessageContent = (content, msgId) => {
    if (!content) {
    return <React.Fragment key={`${msgId}-empty`} />;
  }
  
    const parts = content.split(/(\[img\].*?\[\/img\]|\\n|\n)/g);
    return parts
        .filter(part => part !== "") // 1. Clean up empty nodes
        .map((part, index) => {
            const imgMatch = part.match(/\[img\](.*?)\[\/img\]/);
            const itemKey = `${msgId}-part-${index}`; // 2. Safe unique key

            if (imgMatch) {
                const url = imgMatch[1];
                return (
                    <img
                        key={itemKey}
                        src={url}
                        alt="product"
                        className={styles.thumbnailImg}
                        onClick={() => setFullscreenImage(url)}
                    />
                );
            }

            if (part === "\n" || part === "\\n") {
                return <br key={itemKey} />; // Renders an actual HTML line break
            }

            return <span key={itemKey}>{part}</span>; // 3. Wrapped securely
        });
};


const renderMessage = (msg) => {
  if (msg.sender === "system") {
    const isPaymentLink = msg.content.includes("https://");
    if (isPaymentLink) {
      const urlMatch = msg.content.match(/https:\/\/\S+/);
      const url = urlMatch ? urlMatch[0] : null;
      return (
        <div key={msg._id} className={styles.systemMessage}>
          <span>💳 Payment link ready for buyer</span>
          {url ? ( 
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className={styles.paymentLinkBtn}
            >
              Open Payment Page
            </a>
          ) : null}
        </div>
      );
    }
    return (
      <div key={msg._id} className={styles.systemMessage}>
        {/* Pass msg._id here */}
        {renderMessageContent(msg.content, msg._id)}
      </div>
    );
  }

  if (msg.sender === "seller") {
    return (
      <div key={msg._id} className={`${styles.bubble} ${styles.sellerBubble}`}>
        {/* Pass msg._id here */}
        <div>{renderMessageContent(msg.content, msg._id)}</div>
        <span className={styles.time}>
          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    );
  }

  return (
    <div key={msg._id} className={`${styles.bubble} ${styles.buyerBubble}`}>
      {/* Pass msg._id here */}
      <div>{renderMessageContent(msg.content, msg._id)}</div>
      <span className={styles.time}>
        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </span>
    </div>
  );
};



  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (error) {
  return (
    <div className={styles.error}>
      <p>{error}</p>
      <button className={styles.retryBtn} onClick={fetchThread}>
        Try Again
      </button>
    </div>
  );
}
  const isPaid = conversation.status === "paid";

  return (
    <div className={styles.page}>

      {isPaid && (
        <div className={styles.paidBanner}>
          ✓ This order has been marked as paid
        </div>
      )}

      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate("/dashboard/inbox")}>
          ←
        </button>
        <div className={styles.headerInfo}>
          <span className={styles.productName}>
            {conversation?.productIds?.[0]?.name || "Order"}
          </span>
          <span className={styles.statusLabel}>
            {isPaid ? "Paid" : "Active"}
          </span>
        </div>
      </div>

      <div className={styles.messages}>
        {messages?.map((msg) => renderMessage(msg))}
        <div ref={bottomRef} />
      </div>

      
        <div className={styles.bottomBar}>
          {!isPaid && (
            <>
          {linkError ? <p className={styles.linkError}>{linkError}</p> : null}

          <button
            className={styles.generateBtn}
            onClick={handleGeneratePaymentLink}
            disabled={generatingLink}
          >
            {generatingLink ? "Generating..." : "💳 Generate Payment Link"}
          </button>
          </>
          )}

          <div className={styles.inputRow}>
            <textarea
              className={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
            />
            <button className={styles.sendBtn} onClick={handleSend} disabled={sending}>
              {sending ? "..." : "Send"}
            </button>
          </div>

        </div>
   


      {isPaid && (
        <div className={styles.paidFooter}>
          This conversation will be automatically deleted in 7 days.
        </div>
      )}
      {fullscreenImage ? (
            <div
                className={styles.fullscreenOverlay}
                onClick={() => setFullscreenImage(null)}
            >
                <button
                    className={styles.fullscreenClose}
                    onClick={() => setFullscreenImage(null)}
                >
                    ✕
                </button>
                <img
                    src={fullscreenImage}
                    alt="product fullscreen"
                    className={styles.fullscreenImg}
                />
            </div>
        ) : null}
    </div>
  );
};

export default SellerChatThreadPage;