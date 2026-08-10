import { useState, useEffect, useRef, useCallback } from "react";
import { IoSend } from "react-icons/io5";
import { GrAttachment } from "react-icons/gr";
import { io } from "socket.io-client";
import { useParams, useNavigate } from "react-router-dom";
import {
    getSellerChatMessages,
    sendSellerMessage,
    generatePaymentLink,
    sendImageMessage,
    BASE_URL,
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

                const qualities = [0.7, 0.5, 0.3, 0.15];

                for (let i = 0; i < qualities.length; i++) {
                    const base64 = canvas.toDataURL("image/jpeg", qualities[i]);
                    const sizeInBytes = Math.round((base64.length * 3) / 4);

                    if (sizeInBytes <= MAX_IMAGE_BYTES) {
                        resolve(base64);
                        return;
                    }
                }

                reject("Image is too large even after compression. Please use a smaller photo.");
            };
            img.onerror = () => reject("Failed to load image.");
        };
        reader.onerror = () => reject("Failed to read file.");
    });
};


// Calculates the next working day after a paid date (skips Sat/Sun) —
// matches Paystack's automated payout schedule
const getExpectedPayoutDate = (paidAtString) => {
    const paidDate = new Date(paidAtString);
    const payoutDate = new Date(paidDate);
    payoutDate.setDate(payoutDate.getDate() + 1);

    // if the next day lands on Sat (6) or Sun (0), push forward to Monday
    while (payoutDate.getDay() === 0 || payoutDate.getDay() === 6) {
        payoutDate.setDate(payoutDate.getDate() + 1);
    }

    return payoutDate.toLocaleDateString("en-NG", {
        weekday: "long",
        day: "numeric",
        month: "short",
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
    const socketRef = useRef(null);

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
    const SOCKET_URL = BASE_URL.replace(/\/api$/, "");

    socketRef.current = io(SOCKET_URL, {
        transports: ["websocket"],
    });

    socketRef.current.emit("join_conversation", conversationId);

    socketRef.current.on("new_message", (incomingMessage) => {
        setMessages((prev) => {
            const alreadyExists = prev.some((m) => m._id === incomingMessage._id);
            if (alreadyExists) return prev;
            return [...prev, incomingMessage];
        });
    });

    return () => {
        socketRef.current.disconnect();
    };
}, [conversationId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendAll = async () => {
        const typedText = input.trim();
        if (!typedText && !pendingImage) return;

        if (!navigator.onLine) {
            setImageError("No internet connection. Please check your network and try again.");
            return;
        }

        setSending(true);
        setImageError("");
        setError("");

        try {
            // Combine image tag and typed text into single string if both exist
            let finalPayload = "";
            if (pendingImage) {
                finalPayload += `[img]${pendingImage}[/img]`;
            }
            if (typedText) {
                finalPayload += (finalPayload ? "\n" : "") + typedText;
            }

            let result;
            if (pendingImage) {
                result = await sendImageMessage(conversationId, null, finalPayload, "seller");
            } else {
                result = await sendSellerMessage(conversationId, finalPayload);
            }

            if (result?.status === 413) {
                setImageError("Image is too large. Please choose a smaller image.");
                setSending(false);
                return;
            }

            if (result?.error || result?.message?.blocked || typeof result?.message === "string") {
                setImageError(result?.error || result?.message || "Message could not be sent.");
                setSending(false);
                return;
            }

            const data = result;
            let safeMessage;
            if (data && data.message && typeof data.message === "object") {
                safeMessage = data.message;
            } else {
                safeMessage = {
                    _id: data?._id || `temp-${Date.now()}`,
                    sender: "seller",
                    content: finalPayload,
                    createdAt: new Date().toISOString(),
                };
            }

            if (!safeMessage.content) safeMessage.content = finalPayload;

            setMessages((prev) => [...prev, safeMessage]);
            
            // Clear inputs upon successful send
            setInput("");
            setImagePreview(null);
            setPendingImage(null);

        } catch (err) {
            console.error("Send error:", err);
            const isNetworkError =
                err instanceof TypeError ||
                (err?.message && err.message.toLowerCase().includes("fetch")) ||
                !navigator.onLine;

            if (isNetworkError) {
                setImageError("Network connection failed. Please check your internet and try again.");
            } else {
                setImageError(typeof err === "string" ? err : "Failed to send message. Please try again.");
            }
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendAll();
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

        let decodedContent = content;
        try {
            decodedContent = decodeURIComponent(content);
        } catch (e) {
            decodedContent = content;
        }

        const parts = decodedContent.split(/(\[img\].*?\[\/img\]|\\n|\n)/g);

        return (
            <div className={styles.messageContentWrapper}>
                {parts
                    .filter((part) => part !== "")
                    .map((part, index) => {
                        const imgMatch = part.match(/\[img\](.*?)\[\/img\]/);
                        const itemKey = `${msgId}-part-${index}`;

                        if (imgMatch) {
                            const url = imgMatch[1];
                            return (
                                <div key={itemKey} className={styles.imageWrapper}>
                                    <img
                                        src={url}
                                        alt="sent item"
                                        className={styles.thumbnailImg}
                                        onClick={() => setFullscreenImage(url)}
                                    />
                                </div>
                            );
                        }

                        if (part === "\n" || part === "\\n") return <br key={itemKey} />;

                        return <span key={itemKey} className={styles.textContent}>{part}</span>;
                    })}
            </div>
        );
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

        const isSeller = msg.sender === "seller";

        return (
            <div
                key={msg._id}
                className={`${styles.bubble} ${isSeller ? styles.sellerBubble : styles.buyerBubble}`}
            >
                {renderMessageContent(msg.content, msg._id)}
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

    const isPaid = conversation?.status === "paid";

    return (
        <div className={styles.page}>
            {isPaid ? (
                <div className={styles.paidBanner}>
                    ✓ This order has been marked as paid
                    {conversation?.paidAt ? (
                        <span className={styles.payoutNote}>
                            {" "}· Expected in your bank account by {getExpectedPayoutDate(conversation.paidAt)}
                        </span>
                    ) : null}
                </div>
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
                        <button
                            className={styles.cancelPreviewBtn}
                            onClick={() => {
                                setImagePreview(null);
                                setPendingImage(null);
                            }}
                        >
                            ✕
                        </button>
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
                            <GrAttachment size={18} color="#000000" />
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
                    <button className={styles.sendBtn} onClick={handleSendAll} disabled={sending}>
                        <IoSend size={18} color="#fff" />
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