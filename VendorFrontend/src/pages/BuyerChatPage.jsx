import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { getConversationMessages, sendBuyerMessage, reportConversation } from "../api/api";
import { getOrCreateSessionId } from "../utils/session";
import styles from "./BuyerChatPage.module.css";

const BuyerChatPage = () => {
  const { slug, conversationId } = useParams();
  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSending, setReportSending] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [error, setError] = useState("");
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const bottomRef = useRef(null);
  const sessionId = getOrCreateSessionId();

  
    const fetchMessages = useCallback(async () => {
      setError("");
      setLoading(true);
      const data = await getConversationMessages(conversationId, sessionId);
      if (data.error) {
        setError("Could not load conversation.");
      } else {
        setMessages(data.messages);
        setConversation(data.conversation);
      }
      setLoading(false);
  }, [conversationId]);

  useEffect(() => {
  fetchMessages();
}, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    setSending(true);
    const data = await sendBuyerMessage(conversationId, sessionId, input.trim());
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

  const handleReport = async () => {
    if (!reportReason.trim()) return;
    setReportSending(true);
    const data = await reportConversation(conversationId, sessionId, reportReason.trim());
    if (!data.error) {
      setReportSent(true);
      setShowReportModal(false);
    }
    setReportSending(false);
  };

  const renderMessageContent = (content) => {
    const parts = content.split(/(\[img\].*?\[\/img\])/g);
    return parts.map((part, index) => {
        const imgMatch = part.match(/\[img\](.*?)\[\/img\]/);
        if (imgMatch) {
            const url = imgMatch[1];
            return (
                <img
                    key={index}
                    src={url}
                    alt="product"
                    className={styles.thumbnailImg}
                    onClick={() => setFullscreenImage(url)}
                />
            );
        }
        return <span key={index}>{part}</span>;
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
            <span>💳 Your payment link is ready</span>
            {url ? (
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className={styles.payNowBtn}
              >
                Tap to Pay
              </a>
            ) : null}
          </div>
        );
      }
      return (
        <div key={msg._id} className={styles.systemMessage}>
          {renderMessageContent(msg.content)}
        </div>
      );
    }

    if (msg.sender === "buyer") {
      return (
        <div key={msg._id} className={`${styles.bubble} ${styles.buyerBubble}`}>
          <div>{renderMessageContent(msg.content)}</div>
          <span className={styles.time}>
            {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      );
    }

    return (
      <div key={msg._id} className={`${styles.bubble} ${styles.sellerBubble}`}>
        <div>{renderMessageContent(msg.content)}</div>
        <span className={styles.time}>
          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    );
  };

  if (loading) return <div className={styles.loading}>Loading chat...</div>;
  if (error) {
  return (
    <div className={styles.errorRow}>
      <p>{error}</p>
      <button className={styles.retryBtn} onClick={fetchMessages}>
        Try Again
      </button>
    </div>
  );
}

  const isPaid = conversation?.status === "paid";

  return (
    <div className={styles.page}>

      <div className={styles.securityBanner}>
        ⚠️ Only pay through the official payment link in this chat. Never send money to a personal account.
      </div>

      <div className={styles.header}>
        <span className={styles.storeName}>{slug}</span>
        {isPaid ? <span className={styles.paidBadge}>✓ Paid</span> : null}
        <button className={styles.reportBtn} onClick={() => setShowReportModal(true)}>
          Report
        </button>
      </div>

      <div className={styles.messages}>
        {messages?.map((msg) => renderMessage(msg))}
        <div ref={bottomRef} />
      </div>

      {!isPaid ? (
        <div className={styles.inputBar}>
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
      ) : (
        <div className={styles.paidBar}>
          This order has been confirmed as paid.
        </div>
      )}

      {showReportModal ? (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Report Seller</h3>
            <p>Describe the issue below. Our team will review this conversation.</p>
            <textarea
              className={styles.reportInput}
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Describe what happened..."
              rows={4}
            />
            <div className={styles.modalActions}>
              <button
                className={styles.cancelBtn}
                onClick={() => setShowReportModal(false)}
              >
                Cancel
              </button>
              <button
                className={styles.submitBtn}
                onClick={handleReport}
                disabled={reportSending || !reportReason.trim()}
              >
                {reportSending ? "Sending..." : "Submit Report"}
              </button>
            </div>
            {reportSent ? <p className={styles.reportSuccess}>Report submitted.</p> : null}
          </div>
        </div>
      ) : null}

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

export default BuyerChatPage;