import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getSellerChatMessages,
  sendSellerMessage,
  markAccountDetailsSent,
  markAsPaid,
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
  const [markingAccountSent, setMarkingAccountSent] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [confirmPaid, setConfirmPaid] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

   useEffect(() => {
    const fetchThread = async () => {
      const data = await getSellerChatMessages(conversationId);
      if (data.error) {
        setError("Could not load conversation.");
      } else {
        setMessages(data.messages);
        setConversation(data.conversation);
      }
      setLoading(false);
    };
    fetchThread();
  }, [conversationId]);

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

  const handleMarkAsPaid = async () => {
    setMarkingPaid(true);
    const data = await markAsPaid(conversationId);
    if (!data.error) {
      setConversation((prev) => ({ ...prev, status: "paid" }));
      setConfirmPaid(false);
      setMessages((prev) => [
        ...prev,
        {
          _id: Date.now(),
          sender: "system",
          content: "Order marked as paid. This conversation will be deleted in 7 days.",
          createdAt: new Date().toISOString(),
        },
      ]);
    }
    setMarkingPaid(false);
  };

  const renderMessage = (msg) => {
    if (msg.sender === "system") {
      return (
        <div key={msg._id} className={styles.systemMessage}>
          <span>{msg.content}</span>
        </div>
      );
    }
    if (msg.sender === "seller") {
      return (
        <div key={msg._id} className={`${styles.bubble} ${styles.sellerBubble}`}>
          <p>{msg.content}</p>
          <span className={styles.time}>
            {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      );
    }

     return (
      <div key={msg._id} className={`${styles.bubble} ${styles.buyerBubble}`}>
        <p>{msg.content}</p>
        <span className={styles.time}>
          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    );
  };

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  const isPaid = conversation?.status === "paid";
  const accountSent = conversation?.accountDetailsSent;
  const buyerClaimed = conversation?.buyerClaimedPayment;


  return (
    <div className={styles.page}>
      {isPaid && (
        <div className={styles.paidBanner}>
          ✓ This order has been marked as paid
        </div>
      )}

      {buyerClaimed && !isPaid && (
        <div className={styles.claimBanner}>
          💬 Buyer has claimed they made payment — please verify and confirm below
        </div>
      )}

      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate("/dashboard/inbox")}>
          ←
        </button>

        <div className={styles.headerInfo}>
          <span className={styles.productName}>
            {conversation?.productId?.name || "Order"}
          </span>
          <span className={styles.statusLabel}>
            {isPaid ? "Paid" : "Active"}
          </span>
        </div>
      </div>

      <div className={styles.messages}>
        {messages.map((msg) => renderMessage(msg))}
        <div ref={bottomRef} />
      </div>

      {!isPaid && accountSent && (
        <div className={styles.markPaidBar}>
          {confirmPaid ? (
            <div className={styles.confirmRow}>
              <span className={styles.confirmText}>Confirm payment received?</span>
              <button
                className={styles.confirmYes}
                onClick={handleMarkAsPaid}
                disabled={markingPaid}
              >
                {markingPaid ? "..." : "Yes, Paid"}
              </button>
              <button
                className={styles.confirmNo}
                onClick={() => setConfirmPaid(false)}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              className={styles.markPaidBtn}
              onClick={() => setConfirmPaid(true)}
            >
              Mark as Paid
            </button>
          )}
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
        <div className={styles.paidFooter}>
          This conversation will be automatically deleted in 7 days.
        </div>
      )}
    </div>
  );
};

export default SellerChatThreadPage;