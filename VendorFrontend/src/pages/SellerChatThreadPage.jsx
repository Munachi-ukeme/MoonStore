import { useState, useEffect, useRef, useCallback } from "react";
import { IoSend } from "react-icons/io5";
import { GrAttachment } from "react-icons/gr";
import { useParams, useNavigate } from "react-router-dom";
import {
    getSellerChatMessages,
    sendSellerMessage,
    generatePaymentLink,
    sendImageMessage,
} from "../api/api";
import styles from "./SellerChatThreadPage.module.css";

const MAX_IMAGE_BYTES = 300 * 1024;

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
                if (sizeInBytes > MAX_IMAGE_BYTES) {
                    reject("Image is too large even after compression. Please use a smaller image.");
                } else {
                    resolve(base64);
                }
            };
            img.onerror = () => reject("Failed to load image.");
        };
        reader.onerror = () => reject("Failed to read file.");
    });
};

const SellerChatThreadPage = () => {
    const { conversationId } = useParams();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [conversation, setConversation] = useState(null);
    const [input, setInput] = useState("");
    const [imagePreview, setImagePreview] = useState(null);
const [pendingImage, setPendingImage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [generatingLink, setGeneratingLink] = useState(false);
    const [linkError, setLinkError] = useState("");
    const [fullscreenImage, setFullscreenImage] = useState(null);
    const [error, setError] = useState("");
    const [imageError, setImageError] = useState("");
    const bottomRef = useRef(null);
    const fileInputRef = useRef(null);

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

   
const handleSendImage = async () => {
  if (!pendingImage) return;

  if (!navigator.onLine) {
    setImageError("No internet connection. Please check your network and try again.");
    return;
  }

  const wrapped = `[img]${pendingImage}[/img]`;
  setSending(true);
  setImageError("");

  try {
    const data = await sendImageMessage(conversationId, null, wrapped, "seller");

    if (data?.error || data?.message?.blocked || typeof data?.message === "string") {
      setImageError(data?.error || data?.message || "Image could not be sent.");
      setSending(false);
      return;
    }

    let safeMessage;
    if (data && data.message && typeof data.message === "object") {
      safeMessage = data.message;
    } else {
      safeMessage = {
        _id: data?._id || `temp-img-${Date.now()}`,
        sender: "seller",
        content: wrapped,
        createdAt: new Date().toISOString()
      };
    }

    if (!safeMessage.content) safeMessage.content = wrapped;

    setMessages((prev) => [...prev, safeMessage]);
    setImagePreview(null);
    setPendingImage(null);

  } catch (err) {
    console.error("Image send error:", err);
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
    setSending(false);
  }
};

const handleSend = async () => {
    if (!input.trim()) return;
    const typedText = input.trim();
    setSending(true);

    try {
        const data = await sendSellerMessage(conversationId, typedText);

        if (data?.error || typeof data?.message === "string") {
            setError(data.error || data.message);
            setSending(false);
            return;
        }

        let safeMessage;
        if (data && data.message && typeof data.message === "object") {
            safeMessage = data.message;
        } else {
            safeMessage = {
                _id: `temp-${Date.now()}`,
                sender: "seller",
                content: typedText,
                createdAt: new Date().toISOString()
            };
        }

        if (!safeMessage.content) {
            safeMessage.content = typedText;
        }

        setMessages((prev) => [...prev, safeMessage]);
        setInput("");

    } catch (err) {
        console.error("Chat send error:", err);
        setError("Failed to send message. Please try again.");
    } finally {
        setSending(false);
    }
};

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
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
        const updated = await getSellerChatMessages(conversationId);
        if (!updated.error) {
            setMessages(updated.messages);
        }
    };

    const renderMessageContent = (content, msgId) => {
        if (!content) return <span key={`${msgId}-empty`} style={{ display: "none" }} />;
        const parts = content.split(/(\[img\].*?\[\/img\]|\\n|\n)/g);
        return parts
            .filter((part) => part !== "")
            .map((part, index) => {
                const imgMatch = part.match(/\[img\](.*?)\[\/img\]/);
                const itemKey = `${msgId}-part-${index}`;
                if (imgMatch) {
                    const url = imgMatch[1];
                    return (
                        <img
                            key={itemKey}
                            src={url}
                            alt="sent image"
                            className={styles.thumbnailImg}
                            onClick={() => setFullscreenImage(url)}
                        />
                    );
                }
                if (part === "\n" || part === "\\n") return <br key={itemKey} />;
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
                        <span>💳 Payment link ready for buyer</span>
                        {url ? (
                            <a href={url} target="_blank" rel="noreferrer" className={styles.paymentLinkBtn}>
                                Open Payment Page
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

        if (msg.sender === "seller") {
            return (
                <div key={msg._id} className={`${styles.bubble} ${styles.sellerBubble}`}>
                    <div>{renderMessageContent(msg.content, msg._id)}</div>
                    <span className={styles.time}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                </div>
            );
        }

        return (
            <div key={msg._id} className={`${styles.bubble} ${styles.buyerBubble}`}>
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
                <button className={styles.retryBtn} onClick={fetchThread}>Try Again</button>
            </div>
        );
    }

    const isPaid = conversation.status === "paid";

    return (
        <div className={styles.page}>
            {isPaid ? (
                <div className={styles.paidBanner}>✓ This order has been marked as paid</div>
            ) : null}

            <div className={styles.header}>
                <button className={styles.backBtn} onClick={() => navigate("/dashboard/inbox")}>←</button>
                <div className={styles.headerInfo}>
                    <span className={styles.productName}>
                        {conversation?.productIds?.[0]?.name || "Order"}
                    </span>
                    <span className={styles.statusLabel}>{isPaid ? "Paid" : "Active"}</span>
                </div>
            </div>

            <div className={styles.messages}>
                {messages?.map((msg) => renderMessage(msg))}
                <div ref={bottomRef} />
            </div>

      <div className={styles.bottomBar}>
  {!isPaid ? (
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
  ) : null}

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
        <IoSend size={18} color="#fff" />
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
      <GrAttachment size={18} color="#888" />
    </button>
  </div>
</div>      

            {fullscreenImage ? (
                <div className={styles.fullscreenOverlay} onClick={() => setFullscreenImage(null)}>
                    <button className={styles.fullscreenClose} onClick={() => setFullscreenImage(null)}>✕</button>
                    <img src={fullscreenImage} alt="fullscreen" className={styles.fullscreenImg} />
                </div>
            ) : null}
        </div>
    );
};

export default SellerChatThreadPage;