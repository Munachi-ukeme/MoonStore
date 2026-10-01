import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { IoSend } from "react-icons/io5";
import { io } from "socket.io-client";
import { GrAttachment } from "react-icons/gr";
import { getConversationMessages, sendBuyerMessage, reportConversation, sendImageMessage, verifyBuyerIdentity, confirmDelivery, BASE_URL } from "../api/api";
import { getOrCreateSessionId } from "../utils/session";
import styles from "./BuyerChatPage.module.css";

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

const BuyerChatPage = () => {
    const { slug, conversationId } = useParams();
    const [messages, setMessages] = useState([]);
    const [conversation, setConversation] = useState(null);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [buyerPhone, setBuyerPhone] = useState("");
    const [reportReason, setReportReason] = useState("");
    const [reportSending, setReportSending] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [pendingImage, setPendingImage] = useState(null);
    const [reportSent, setReportSent] = useState(false);
    const [error, setError] = useState("");
    const [fullscreenImage, setFullscreenImage] = useState(null);
    const [imageError, setImageError] = useState("");

    // ── identity verification state ──
    const [ninType, setNinType] = useState("nin");
    const [ninValue, setNinValue] = useState("");
    const [consentChecked, setConsentChecked] = useState(false);
    const [verifySubmitting, setVerifySubmitting] = useState(false);
    const [verifyError, setVerifyError] = useState("");
    const [verifiedNow, setVerifiedNow] = useState(false);

    // ── delivery PIN confirmation state ──
    const [showPinModal, setShowPinModal] = useState(false);
    const [pinInput, setPinInput] = useState("");
    const [pinSubmitting, setPinSubmitting] = useState(false);
    const [pinError, setPinError] = useState("");

    const fileInputRef = useRef(null);
    const bottomRef = useRef(null);
    const socketRef = useRef(null);
    const location = useLocation();
    const sessionId = location.state?.sessionId || getOrCreateSessionId();
    const SOCKET_URL = BASE_URL.replace(/\/api$/, "");

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
    }, [conversationId, sessionId]);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    useEffect(() => {
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

    const handleSendImage = async () => {
        if (!pendingImage) return;

        if (!navigator.onLine) {
            setImageError("No internet connection. Please check your network and try again.");
            return;
        }

        const wrapped = `[img]${pendingImage}[/img]`;
        setImageError("");

        try {
            const result = await sendImageMessage(conversationId, sessionId, wrapped, "buyer");

            if (result?.status === 413) {
                setImageError("Image is too large. Please choose a smaller image.");
                return;
            }

            if (result?.error || result?.message?.blocked || typeof result?.message === "string") {
                setImageError(result?.error || result?.message || "Image could not be sent.");
                return;
            }

            const data = result;

            let safeMessage;
            if (data && data.message && typeof data.message === "object") {
                safeMessage = data.message;
            } else {
                safeMessage = {
                    _id: data?._id || `temp-img-${Date.now()}`,
                    sender: "buyer",
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
        }
    };

    const handleSend = async () => {
        if (!input.trim()) return;
        const typedText = input.trim();
        setError("");

        try {
            const data = await sendBuyerMessage(conversationId, sessionId, typedText);

            if (data?.error || typeof data?.message === "string") {
                setError(data.error || data.message);
                return;
            }

            let safeMessage;
            if (data && data.message && typeof data.message === "object") {
                safeMessage = data.message;
            } else {
                safeMessage = {
                    _id: `temp-${Date.now()}`,
                    sender: "buyer",
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
        }
    };

    const handleSendAll = async () => {
        if (!input.trim() && !pendingImage) return;
        setSending(true);

        try {
            if (pendingImage) {
                await handleSendImage();
            }
            if (input.trim()) {
                await handleSend();
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

    const handleReport = async () => {
        if (!reportReason.trim() || !buyerPhone.trim()) return;
        setReportSending(true);
        const data = await reportConversation(conversationId, sessionId, reportReason.trim(), buyerPhone.trim());
        if (!data.error) {
            setReportSent(true);
            setShowReportModal(false);
        }
        setBuyerPhone("");
        setReportReason("");
        setReportSent("");
        setReportSending(false);
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

    // ── identity verification submit ──
    const handleVerifySubmit = async () => {
        if (!ninValue.trim() || ninValue.trim().length < 10) {
            setVerifyError("Enter a valid NIN or BVN.");
            return;
        }
        if (!consentChecked) {
            setVerifyError("You must agree to continue.");
            return;
        }

        setVerifySubmitting(true);
        setVerifyError("");

        try {
            const data = await verifyBuyerIdentity(conversationId, sessionId, {
                type: ninType,
                identifier: ninValue.trim(),
                consent: true,
                buyerName: conversation?.buyerName || "",
                buyerEmail: conversation?.buyerEmail || "",
            });

            if (data?.error || data?.verified === false) {
                setVerifyError(data?.error || "Verification is under review. We'll notify you here once complete.");
                setVerifySubmitting(false);
                return;
            }

            setVerifiedNow(true);
            setVerifySubmitting(false);
        } catch (err) {
            console.error("Verify error:", err);
            setVerifyError("Something went wrong. Please try again.");
            setVerifySubmitting(false);
        }
    };

    // ── delivery PIN confirm submit ──
    const handleConfirmDelivery = async () => {
        if (!pinInput.trim()) {
            setPinError("Enter the PIN you received.");
            return;
        }

        setPinSubmitting(true);
        setPinError("");

        try {
            const data = await confirmDelivery(conversationId, sessionId, pinInput.trim());

            if (data?.error) {
                setPinError(data.error);
                setPinSubmitting(false);
                return;
            }

            setShowPinModal(false);
            setPinInput("");
            setPinSubmitting(false);
            fetchMessages();
        } catch (err) {
            console.error("Confirm delivery error:", err);
            setPinError("Something went wrong. Please try again.");
            setPinSubmitting(false);
        }
    };

    const renderMessageContent = (content, msgId) => {
        if (!content) return null;

        let decodedContent = content;
        try {
            decodedContent = decodeURIComponent(content);
        } catch (e) {
            decodedContent = content;
        }

        const parts = decodedContent.split(/(\[img\].*?\[\/img\]|\[product\].*?\[\/product\]|\\n|\n)/g);

        return (
            <div className={styles.messageContentWrapper}>
                {parts
                    .filter((part) => part !== "")
                    .map((part, index) => {
                        const imgMatch = part.match(/\[img\](.*?)\[\/img\]/);
                        const productMatch = part.match(/\[product\](.*?)\|(.*?)\[\/product\]/);
                        const itemKey = `${msgId}-part-${index}`;

                        if (imgMatch) {
                            const url = imgMatch[1];
                            return (
                                <div key={itemKey} className={styles.imageWrapper}>
                                    <img
                                        src={url}
                                        alt="attachment"
                                        className={styles.thumbnailImg}
                                        onClick={() => setFullscreenImage(url)}
                                    />
                                </div>
                            );
                        }

                        if (productMatch) {
                            const path = productMatch[1];
                            const name = productMatch[2];
                            return (
                                <Link key={itemKey} to={`/${path}`} className={styles.productLink}>
                                    {name}
                                </Link>
                            );
                        }

                        if (part === "\n" || part === "\\n") {
                            return <br key={itemKey} />;
                        }

                        return <span key={itemKey} className={styles.textContent}>{part}</span>;
                    })}
            </div>
        );
    };

    const handleCopyAccountNumber = (accountNumber) => {
        navigator.clipboard.writeText(accountNumber);
    };

    const renderMessage = (msg) => {
        if (msg.sender === "system") {

            // ── identity verification prompt ──
            const isVerifyPrompt = msg.content.includes("[verify]");
            if (isVerifyPrompt) {
                const textMatch = msg.content.match(/\[verify\](.*?)\[\/verify\]/s);
                const promptText = textMatch ? textMatch[1] : "";

                if (verifiedNow) {
                    return (
                        <div key={msg._id} className={styles.systemMessage}>
                            <p>{promptText}</p>
                            <p className={styles.verifySuccess}>✅ Verified — generating your payment details...</p>
                        </div>
                    );
                }

                return (
                    <div key={msg._id} className={styles.systemMessage}>
                        <p>{promptText}</p>
                        <div className={styles.verifyForm}>
                            <div className={styles.verifyTypeRow}>
                                <button
                                    type="button"
                                    className={ninType === "nin" ? `${styles.verifyTypeBtn} ${styles.activeType}` : styles.verifyTypeBtn}
                                    onClick={() => setNinType("nin")}
                                >
                                    NIN
                                </button>
                                <button
                                    type="button"
                                    className={ninType === "bvn" ? `${styles.verifyTypeBtn} ${styles.activeType}` : styles.verifyTypeBtn}
                                    onClick={() => setNinType("bvn")}
                                >
                                    BVN
                                </button>
                            </div>
                            <input
                                type="text"
                                className={styles.verifyInput}
                                placeholder={ninType === "nin" ? "Enter your NIN" : "Enter your BVN"}
                                value={ninValue}
                                onChange={(e) => setNinValue(e.target.value)}
                                maxLength={11}
                            />
                            <label className={styles.verifyConsentRow}>
                                <input
                                    type="checkbox"
                                    checked={consentChecked}
                                    onChange={(e) => setConsentChecked(e.target.checked)}
                                />
                                <span>I consent to identity verification for secure payment</span>
                            </label>
                            {verifyError ? <p className={styles.verifyError}>{verifyError}</p> : null}
                            <button
                                className={styles.verifySubmitBtn}
                                onClick={handleVerifySubmit}
                                disabled={verifySubmitting}
                            >
                                {verifySubmitting ? "Verifying..." : "Verify & Continue"}
                            </button>
                        </div>
                    </div>
                );
            }

            // ── payment instructions (bank transfer details) ──
            const isPaymentDetails = msg.content.includes("💳 Payment Details");
            if (isPaymentDetails) {
                const accountMatch = msg.content.match(/Account Number:\s*(\d+)/);
                const accountNumber = accountMatch ? accountMatch[1] : null;

                return (
                    <div key={msg._id} className={styles.systemMessage}>
                        {renderMessageContent(msg.content, msg._id)}
                        {accountNumber ? (
                            <button
                                className={styles.copyAccountBtn}
                                onClick={() => handleCopyAccountNumber(accountNumber)}
                            >
                                Copy Account Number
                            </button>
                        ) : null}
                    </div>
                );
            }

            // ── buyer-only delivery PIN ──
            const isPinMessage = msg.content.includes("[buyer-only-pin]");
            if (isPinMessage) {
                const pinMatch = msg.content.match(/\[buyer-only-pin\](.*?)\[\/buyer-only-pin\]/);
                const pin = pinMatch ? pinMatch[1] : "";

                return (
                    <div key={msg._id} className={styles.systemMessage}>
                        <p className={styles.pinLabel}>Your Delivery PIN</p>
                        <p className={styles.pinValue}>{pin}</p>
                        <p className={styles.pinHint}>Enter this PIN once you receive your item to confirm delivery.</p>
                    </div>
                );
            }

            return (
                <div key={msg._id} className={styles.systemMessage}>
                    {renderMessageContent(msg.content, msg._id)}
                </div>
            );
        }

        const isBuyer = msg.sender === "buyer";
        const bubbleStyle = isBuyer ? styles.buyerBubble : styles.sellerBubble;

        return (
            <div key={msg._id} className={`${styles.bubble} ${bubbleStyle}`}>
                {renderMessageContent(msg.content, msg._id)}
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

    const stageBadgeText = () => {
        const stage = conversation?.orderStage;
        if (stage === "payment_held") return "✓ Paid";
        if (stage === "shipped") return "📦 Shipped";
        if (stage === "delivered") return "✓ Delivered";
        if (stage === "released") return "✓ Completed";
        if (stage === "disputed") return "⚠️ Disputed";
        if (stage === "refunded") return "Refunded";
        return null;
    };

    const canConfirmDelivery = conversation?.orderStage === "shipped";

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <button className={styles.backBtnAlt} onClick={() => navigate(`/${slug}/orders`)}>
                    ←
                </button>
                <span className={styles.storeName}>{slug}</span>
                {stageBadgeText() ? <span className={styles.paidBadge}>{stageBadgeText()}</span> : null}
                <div className={styles.headerActions}>
                    {canConfirmDelivery ? (
                        <button className={styles.confirmDeliveryBtn} onClick={() => setShowPinModal(true)}>
                            Confirm Delivery
                        </button>
                    ) : null}
                    {conversation?.orderStage === "released" || conversation?.orderStage === "delivered" ? (
                        <a
                            href={`https://wa.me/2349132227203?text=${encodeURIComponent("Feedback on my MoonStore order: ")}`}
                            target="_blank"
                            rel="noreferrer"
                            className={styles.feedbackBtn}
                        >
                            Feedback
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
                            <GrAttachment size={18} color="#050303" />
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

            {showReportModal ? (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h3>Report Seller</h3>
                        <p>Describe the issue below. Our team will review this conversation.</p>
                        <input
                            type="tel"
                            className={styles.reportPhoneInput}
                            placeholder="Your WhatsApp / Phone number"
                            value={buyerPhone}
                            onChange={(e) => setBuyerPhone(e.target.value)}
                        />
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
                                disabled={reportSending || !reportReason.trim() || !buyerPhone.trim()}
                            >
                                {reportSending ? "Sending..." : "Submit Report"}
                            </button>
                        </div>
                        {reportSent ? <p className={styles.reportSuccess}>Report submitted.</p> : null}
                    </div>
                </div>
            ) : null}

            {showPinModal ? (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h3>Confirm Delivery</h3>
                        <p>Enter the PIN you received in this chat to confirm you got your item.</p>
                        <input
                            type="text"
                            className={styles.reportPhoneInput}
                            placeholder="Enter PIN"
                            value={pinInput}
                            onChange={(e) => setPinInput(e.target.value)}
                            maxLength={6}
                        />
                        {pinError ? <p className={styles.reportError}>{pinError}</p> : null}
                        <div className={styles.modalActions}>
                            <button
                                className={styles.cancelBtn}
                                onClick={() => {
                                    setShowPinModal(false);
                                    setPinInput("");
                                    setPinError("");
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className={styles.submitBtn}
                                onClick={handleConfirmDelivery}
                                disabled={pinSubmitting}
                            >
                                {pinSubmitting ? "Confirming..." : "Confirm"}
                            </button>
                        </div>
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