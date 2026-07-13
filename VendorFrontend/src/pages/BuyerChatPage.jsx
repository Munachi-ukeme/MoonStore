import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { IoSend } from "react-icons/io5";
import { GrAttachment } from "react-icons/gr";
import { getConversationMessages, sendBuyerMessage, reportConversation, sendImageMessage } from "../api/api";
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
  const [imagePreview, setImagePreview] = useState(null);
const [pendingImage, setPendingImage] = useState(null);
  const [reportSent, setReportSent] = useState(false);
  const [error, setError] = useState("");
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [imageError, setImageError] = useState("");
const fileInputRef = useRef(null);
  const bottomRef = useRef(null);
  const location = useLocation();
const sessionId = location.state?.sessionId || getOrCreateSessionId();

  const navigate = useNavigate();

  
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

const handleSendImage = async (role = "buyer") => {
  // 1. Guard against empty execution
  if (!pendingImage) return;

  // 2. Network Guard: Check browser connection before hitting the server
  if (!navigator.onLine) {
    setImageError("No internet connection. Please check your network and try again.");
    return;
  }

  // 3. Preserve the data locally in case of failure or fallback needs
  const rawImageBase64 = pendingImage;
  const wrapped = `[img]${rawImageBase64}[/img]`;

  setSending(true);
  setImageError(""); // Clear previous errors to reset UI state

  try {
    // 4. Hit API with dynamic role (handles both BuyerChatPage and SellerChatThreadPage)
    const data = await sendImageMessage(conversationId, sessionId, wrapped, "buyer");

    // 5. Strict Error Evaluation (Catches explicit errors, validation failures, or server-side blocking)
    if (data?.error || data?.message?.blocked || typeof data?.message === "string") {
      setImageError(data?.error || data?.message?.blocked || data?.message || "Image could not be sent.");
      setSending(false); // Stop loader instantly
      return;            
    }

    // 6. Deep Structural Fallback (Guarantees your .map loop won't crash if database returns bad structure)
    let safeMessage;
    if (data && data.message && typeof data.message === "object") {
      safeMessage = data.message;
    } else {
      safeMessage = {
        _id: data?._id || `temp-img-${Date.now()}`,
        sender: role,
        content: wrapped,
        createdAt: new Date().toISOString()
      };
    }

    // 7. Content Fallback Assignment
    if (!safeMessage.content) {
      safeMessage.content = wrapped;
    }

    // 8. Success Operations: Update message stream and clear local staging states
    setMessages((prev) => [...prev, safeMessage]);
    setImagePreview(null);
    setPendingImage(null);

  } catch (err) {
    console.error("Critical Image Upload or Network Error:", err);

    // 9. Intelligent Network Error Trap
    const isNetworkError = 
      err instanceof TypeError || 
      (err?.message && err.message.toLowerCase().includes("fetch")) || 
      !navigator.onLine;

    if (isNetworkError) {
      setImageError("Network connection failed. Please check your internet and try again.");
    } else {
      setImageError(typeof err === "string" ? err : "Failed to send image. Please try again.");
    }
    
  } finally {
    // 10. Guaranteed Shutdown: Turn off loader regardless of success, server failure, or network crash
    setSending(false);
  }
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

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let { width, height } = img;
                const MAX_DIM = 800;
                if (width > MAX_DIM || height > MAX_DIM) {
                    if (width > height) {
                        height = Math.round((height * MAX_DIM) / width);
                        width = MAX_DIM;
                    } else {
                        width = Math.round((width * MAX_DIM) / height);
                        height = MAX_DIM;
                    }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);
                const base64 = canvas.toDataURL("image/jpeg", 0.7);
                const sizeInBytes = Math.round((base64.length * 3) / 4);
                if (sizeInBytes > 300 * 1024) {
                    reject("Image is too large. Please use a smaller image.");
                } else {
                    resolve(base64);
                }
            };
            img.onerror = () => reject("Failed to load image.");
        };
        reader.onerror = () => reject("Failed to read file.");
    });
};

const handleImagePick = () => {
    setImageError("");
    fileInputRef.current.click();
};

const handleImageChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    setImageError("Only image files are allowed.");
    return;
  }
  setImageError("");
  try {
    const base64 = await compressImage(file);
    setImagePreview(base64);
    setPendingImage(base64);
  } catch (err) {
    setImageError(typeof err === "string" ? err : "Failed to load image.");
  }
  e.target.value = "";
};


const renderMessageContent = (content, msgId) => {
  const parts = content.split(/(\[img\].*?\[\/img\]|\\n|\n)/g);
  
  return parts
    .filter(part => part !== "") // 1. Remove empty strings completely
    .map((part, index) => {
      const imgMatch = part.match(/\[img\](.*?)\[\/img\]/);
      
      // Generate a stable key combining message ID and index
      const itemKey = `${msgId}-part-${index}`; 

       

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
      
      // 2. Wrap text safely inside spans
      return <span key={itemKey}>{part}</span>;
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
          {renderMessageContent(msg.content, msg._id)}
        </div>
      );
    }

    if (msg.sender === "buyer") {
      return (
        <div key={msg._id} className={`${styles.bubble} ${styles.buyerBubble}`}>
          <div>{renderMessageContent(msg.content, msg._id)}</div>
          <span className={styles.time}>
            {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
      );
    }

    return (
      <div key={msg._id} className={`${styles.bubble} ${styles.sellerBubble}`}>
        <div>{renderMessageContent(msg.content, msg._id)}</div>
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

      <div className={styles.header}>
  <button className={styles.backBtnAlt} onClick={() => navigate(`/${slug}/orders`)}>
    ←
  </button>
  <span className={styles.storeName}>{slug}</span>
  {isPaid ? <span className={styles.paidBadge}>✓ Paid</span> : null}
  <div className={styles.headerActions}>
    {isPaid ? (
      <a
        href={`https://wa.me/2348152905325?text=${encodeURIComponent("Feedback on my MoonStore order: ")}`}
        target="_blank"
        rel="noreferrer"
        className={styles.feedbackBtn}
      >
        💬 Feedback
      </a>
    ) : null}
    <button className={styles.reportBtn} onClick={() => setShowReportModal(true)}>
      Report
    </button>
  </div>
</div>

      <div className={styles.messages}>
        {messages?.map((msg) => renderMessage(msg))}
        <div ref={bottomRef} />
      </div>

     
    <div className={styles.inputBar}>
  {imageError ? <p className={styles.imageError}>{imageError}</p> : null}

  {imagePreview ? (
    <div className={styles.imagePreviewBox}>
      <img src={imagePreview} alt="preview" className={styles.previewThumb} />
      <span className={styles.previewLabel}>Ready to send</span>
      <button className={styles.cancelPreviewBtn} onClick={() => {
        setImagePreview(null);
        setPendingImage(null);
      }}>✕</button>
    </div>
  ) : null}

  <div className={styles.inputRow}>
    <input
      type="file"
      accept="image/*"
      ref={fileInputRef}
      onChange={handleImageChange}
      className={styles.hiddenFileInput}
    />
    <div className={styles.inputWrapper}>
      <button
        className={styles.imageBtn}
        onClick={handleImagePick}
        disabled={sending}
        title="Send image"
      >
        <GrAttachment size={18} color="#888" />
      </button>
      <textarea
        className={styles.input}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        rows={1}
      />
    </div>
    <button className={styles.sendBtn} onClick={imagePreview ? handleSendImage : handleSend} disabled={sending}>
      <IoSend size={18} color="#fff" />
    </button>
  </div>
</div>    

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