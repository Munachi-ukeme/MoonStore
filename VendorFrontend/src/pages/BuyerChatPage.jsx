import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { getConversationMessages, sendBuyerMessage, reportConversation, buyerClaimedPayment } from "../api/api";
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
  const [claimSending, setClaimSending] = useState(false);
  const [claimSent, setClaimSent] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  const sessionId = getOrCreateSessionId();

  useEffect(() => {
    const fetchMessages = async () => {
      const data = await getConversationMessages(conversationId, sessionId);
      if (data.error) {
        setError("Could not load conversation.");
      } else {
        setMessages(data.messages);
        setConversation(data.conversation);
        setClaimSent(data.conversation.buyerClaimedPayment);
      }
      setLoading(false);
    };
    fetchMessages();
  }, [conversationId]);

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

  const handleClaimPayment = async () => {
    setClaimSending(true);
    const data = await buyerClaimedPayment(conversationId);
    if (!data.error) {
      setClaimSent(true);
      setMessages((prev) => [
        ...prev,
        {
          _id: Date.now(),
          sender: "system",
          content: "Your payment claim has been sent. The seller will confirm shortly.",
          createdAt: new Date().toISOString(),
        },
      ]);
    }
    setClaimSending(false);
  };


   const renderMessage = (msg) => {
    if (msg.sender === "system") {
      return (
        <div key={msg._id} className={styles.systemMessage}>
          <span>{msg.content}</span>
        </div>
      );
    }
    if (msg.sender === "buyer") {
      return (
        <div key={msg._id} className={`${styles.bubble} ${styles.buyerBubble}`}>
          <p>{msg.content}</p>
          <span className={styles.time}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      );
    }
    return (
      <div key={msg._id} className={`${styles.bubble} ${styles.sellerBubble}`}>
        <p>{msg.content}</p>
        <span className={styles.time}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
      </div>
    );
  };


  if (loading) return <div className={styles.loading}>Loading chat...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  const isPaid = conversation?.status === "paid";
  const canClaimPayment = conversation?.accountDetailsSent && !claimSent && !isPaid;

  return (
    <div className={styles.page}>

      <div className={styles.header}>
        <span className={styles.storeName}>{slug}</span>
        {isPaid && <span className={styles.paidBadge}>✓ Paid</span>}
        <button className={styles.reportBtn} onClick={() => setShowReportModal(true)}>
          Report
        </button>
      </div>

      <div className={styles.messages}>
        {messages.map((msg) => renderMessage(msg))}
        <div ref={bottomRef} />
      </div>

      {canClaimPayment && (
        <div className={styles.claimBar}>
          <button
            className={styles.claimBtn}
            onClick={handleClaimPayment}
            disabled={claimSending}
          >
            {claimSending ? "Sending..." : "I Have Paid"}
          </button>
        </div>
      )}


      {claimSent && !isPaid && (
        <div className={styles.claimNotice}>
          Payment claim sent. Waiting for seller confirmation.
        </div>
      )}

       {!isPaid && (
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
      )}

       {isPaid && (
        <div className={styles.paidBar}>
          This order has been confirmed as paid.
        </div>
      )}

      {showReportModal && (
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
            {reportSent && <p className={styles.reportSuccess}>Report submitted.</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyerChatPage;

