import { useState, useEffect, useRef, useCallback } from "react";
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

        setSending(true);
        setImageError("");

        try {
            const base64 = await compressImage(file);
            const wrapped = `[img]${base64}[/img]`;
            const data = await sendImageMessage(conversationId, null, wrapped, "seller");
            if (data.error || data.message?.blocked) {
                setImageError(data.error || "Image could not be sent.");
            } else {
                setMessages((prev) => [...prev, data.message]);
            }
        } catch (err) {
            setImageError(typeof err === "string" ? err : "Failed to send image.");
        }

        setSending(false);
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

                <div className={styles.inputRow}>
                    <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        className={styles.hiddenFileInput}
                    />
                    <button
                        className={styles.imageBtn}
                        onClick={handleImagePick}
                        disabled={sending}
                        title="Send image"
                    >
                        📷
                    </button>
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