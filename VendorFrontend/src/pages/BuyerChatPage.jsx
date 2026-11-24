import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { IoSend } from "react-icons/io5";
import { io } from "socket.io-client";
import { GrAttachment } from "react-icons/gr";
import { getConversationMessages, sendBuyerMessage, reportConversation, sendImageMessage, verifyBuyerIdentity, confirmDelivery, BASE_URL, raiseDisputeBuyer, cancelDisputeBuyer, refreshPaymentDetails, requestConfirmLink, continuePayment } from "../api/api";
import { getOrCreateSessionId } from "../utils/session";
import styles from "./BuyerChatPage.module.css";

const MAX_IMAGE_BYTES = 300 * 1024;

const ESCROWPAY_BUTTON_BASE = "https://docs.escrowpay.app/brand/checkout-button";

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
    const [showDisputeModal, setShowDisputeModal] = useState(false);
    const [disputeReason, setDisputeReason] = useState("");
    const [disputeSending, setDisputeSending] = useState(false);
    const [disputeSent, setDisputeSent] = useState(false);
    const [now, setNow] = useState(Date.now());
    const [refreshingPayment, setRefreshingPayment] = useState(false);
    const [paymentError, setPaymentError] = useState("");
    const [confirmSent, setConfirmSent] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);
   const [disputeCategory, setDisputeCategory] = useState("");
    const [disputeError, setDisputeError] = useState("");
    const [riderCalledAnswer, setRiderCalledAnswer] = useState("");
    const [someoneElseAnswer, setSomeoneElseAnswer] = useState("");
    const [addressAnswer, setAddressAnswer] = useState("");

    // ── identity verification state ──
    const [dobValue, setDobValue] = useState("");
    const [ninValue, setNinValue] = useState("");
    const [consentChecked, setConsentChecked] = useState(false);
    const [verifySubmitting, setVerifySubmitting] = useState(false);
    
    const [verifiedNow, setVerifiedNow] = useState(false);
    const [popupMessage, setPopupMessage] = useState("");

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

        const refreshConversation = useCallback(async () => {
        const data = await getConversationMessages(conversationId, sessionId);
        if (!data.error) {
            setMessages(data.messages);
            setConversation(data.conversation);
        }
    }, [conversationId, sessionId]);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

       useEffect(() => {
        const socket = io(SOCKET_URL, { transports: ["websocket"] });
        socketRef.current = socket;

        let connectedBefore = false;

        socket.on("connect", () => {
            socket.emit("join_conversation", { conversationId, sessionId });
            if (connectedBefore) refreshConversation();
            connectedBefore = true;
        });

        socket.on("new_message", (incomingMessage) => {
            setMessages((prev) => {
                const alreadyExists = prev.some((m) => m._id === incomingMessage._id);
                if (alreadyExists) return prev;
                return [...prev, incomingMessage];
            });

            if (incomingMessage.sender === "system") {
                refreshConversation();
            }
        });

        socket.on("conversation_paid", () => {
            refreshConversation();
        });

        return () => {
            socket.disconnect();
        };
    }, [conversationId, sessionId, refreshConversation]);


 useEffect(() => {
        const onFocus = () => {
            refreshConversation();
        };

        window.addEventListener("focus", onFocus);
        return () => window.removeEventListener("focus", onFocus);
    }, [refreshConversation]);


    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 15000);
        return () => clearInterval(timer);
    }, []);
    
    const addMessageOnce = (newMessage) => {
    setMessages((prev) => (prev.some((m) => m._id === newMessage._id) ? prev : [...prev, newMessage]));
};


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

            addMessageOnce(safeMessage);
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

            addMessageOnce(safeMessage);
            setInput("");

        } catch (err) {
            console.error("Chat send error:", err);
            setError("Failed to send message. Please try again.");
        }
    };

      const handleRaiseDispute = async () => {
        setDisputeError("");

        if (!disputeCategory) {
            setDisputeError("Please choose what went wrong.");
            return;
        }

        if (!disputeReason.trim()) {
            setDisputeError("Please describe the issue.");
            return;
        }

        let answers;

        if (disputeCategory === "not_received") {
            if (!riderCalledAnswer || !someoneElseAnswer || !addressAnswer.trim()) {
                setDisputeError("Please answer the three questions.");
                return;
            }

            answers = {
                riderCalled: riderCalledAnswer,
                someoneElseReceived: someoneElseAnswer,
                addressUsed: addressAnswer.trim(),
            };
        }

        setDisputeSending(true);
        const data = await raiseDisputeBuyer(conversationId, sessionId, disputeReason.trim(), disputeCategory, answers);
        setDisputeSending(false);

        if (data.error) {
            setDisputeError(data.error);
            return;
        }

        setDisputeSent(true);
        setShowDisputeModal(false);
        setDisputeCategory("");
        setDisputeReason("");
        setRiderCalledAnswer("");
        setSomeoneElseAnswer("");
        setAddressAnswer("");
        refreshConversation();
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

        setReportSending(false);
    };

    const handleCancelDispute = async () => {
    const data = await cancelDisputeBuyer(conversationId, sessionId);
    if (!data.error) refreshConversation();
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
    if (!/^\d{11}$/.test(ninValue.trim())) {
        setPopupMessage("Enter your 11-digit NIN.");
        return;
    }
    if (!dobValue) {
        setPopupMessage("Enter your date of birth.");
        return;
    }
    if (!consentChecked) {
        setPopupMessage("Tick the box to agree before you continue.");
        return;
    }

    setVerifySubmitting(true);

    try {
        const data = await verifyBuyerIdentity(conversationId, sessionId, {
            identifier: ninValue.trim(),
            dateOfBirth: dobValue,
            consent: true,
        });

        if (data?.error) {
            setPopupMessage(data.error);
            setVerifySubmitting(false);
            return;
        }

        setNinValue("");
        setVerifiedNow(true);
        setVerifySubmitting(false);
    } catch (err) {
        console.error("Verify error:", err);
        setPopupMessage("Something went wrong. Please try again.");
        setVerifySubmitting(false);
    }
};

    // ── delivery PIN confirm submit ──
    const handleConfirmDelivery = async () => {
        if (!pinInput.trim()) {
            setPinError("Enter the parcel code.");
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
            refreshConversation();
        } catch (err) {
            console.error("Confirm delivery error:", err);
            setPinError("Something went wrong. Please try again.");
            setPinSubmitting(false);
        }
    };

    
    const handleRefreshPayment = async () => {
        setRefreshingPayment(true);
        setPaymentError("");

        const data = await refreshPaymentDetails(conversationId, sessionId);

        if (data?.error) {
            setPaymentError(data.error);
        } else {
            await refreshConversation();
        }

        setRefreshingPayment(false);
    };

    
   const handleRequestConfirmLink = async () => {
    setConfirmLoading(true);

    const data = await requestConfirmLink(conversationId, sessionId);

    setConfirmLoading(false);

    if (data?.error) {
        setPopupMessage(data.error);
        return;
    }

    setConfirmSent(true);
    setPopupMessage("We sent a link to your email. Open the email, tap the link, then come back to this chat.");
};

const handleContinuePayment = async () => {
    setConfirmLoading(true);

    const data = await continuePayment(conversationId, sessionId);

    if (data?.error) {
        setPopupMessage(data.error);
        setConfirmLoading(false);
        return;
    }

    await refreshConversation();
    setConfirmLoading(false);
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

    const paymentMessages = messages.filter(
        (m) => m.sender === "system" && m.content.includes("💳 Payment Details")
    );
    const latestPaymentMsgId = paymentMessages.length > 0 ? paymentMessages[paymentMessages.length - 1]._id : null;
    const paymentExpiresMs = conversation?.paymentExpiresAt ? new Date(conversation.paymentExpiresAt).getTime() : null;
    const paymentExpired = paymentExpiresMs !== null && now > paymentExpiresMs;

    const handleCopyAccountNumber = (accountNumber) => {
        navigator.clipboard.writeText(accountNumber);
    };

    const renderConfirmCard = (msgId, introText) => {
    if (conversation?.escrowTransactionId) {
        return (
            <div key={msgId} className={styles.systemMessage}>
                <p className={styles.verifySuccess}>✅ Email confirmed</p>
            </div>
        );
    }

    if (conversation?.sessionTrusted) {
        return (
            <div key={msgId} className={styles.systemMessage}>
                <p>Your email is confirmed on this device.</p>
                <button
                    className={styles.copyAccountBtn}
                    onClick={handleContinuePayment}
                    disabled={confirmLoading}
                >
                    {confirmLoading ? "Getting payment details..." : "Continue to payment"}
                </button>
            </div>
        );
    }

    return (
        <div key={msgId} className={styles.systemMessage}>
            <p>{introText}</p>
            {confirmSent ? (
                <p className={styles.verifySuccess}>Link sent. Open it from your email, then come back here.</p>
            ) : (
                <button
                    className={styles.copyAccountBtn}
                    onClick={handleRequestConfirmLink}
                    disabled={confirmLoading}
                >
                    {confirmLoading ? "Sending..." : "Email me a link"}
                </button>
            )}
        </div>
    );
};


    const renderMessage = (msg) => {
        if (msg.sender === "system") {

const isConfirmPrompt = msg.content.includes("[confirm]");
if (isConfirmPrompt) {
    const textMatch = msg.content.match(/\[confirm\]([\s\S]*?)\[\/confirm\]/);
    return renderConfirmCard(msg._id, textMatch ? textMatch[1] : "");
}
            // ── identity verification prompt ──
            const isVerifyPrompt = msg.content.includes("[verify]");
            if (isVerifyPrompt) {
                const textMatch = msg.content.match(/\[verify\](.*?)\[\/verify\]/s);
                const promptText = textMatch ? textMatch[1] : "";

                if (verifiedNow || conversation?.escrowTransactionId) {
                    return (
                        <div key={msg._id} className={styles.systemMessage}>
                            <p>{promptText}</p>
                            <p className={styles.verifySuccess}>✅ Identity Verified.</p>
                        </div>
                    );
                }

                if (conversation?.buyerVerified) {
    return renderConfirmCard(
        msg._id,
        "Your identity is already verified from an earlier order. Confirm your email and we will take you to payment."
    );
}

                return (
                    <div key={msg._id} className={styles.systemMessage}>
                        <p>{promptText}</p>
                        <div className={styles.verifyForm}>
                            <input
                                type="text"
                                inputMode="numeric"
                                className={styles.verifyInput}
                                placeholder="Enter your 11-digit NIN"
                                value={ninValue}
                                onChange={(e) => setNinValue(e.target.value.replace(/\D/g, ""))}
                                maxLength={11}
                            />
                            <p className={styles.verifyLabel}>Date of birth (as on your NIN record)</p>
                            <input
                                type="date"
                                className={styles.verifyInput}
                                value={dobValue}
                                onChange={(e) => setDobValue(e.target.value)}
                                max={new Date().toISOString().split("T")[0]}
                            />
                            <label className={styles.verifyConsentRow}>
                                <input
                                    type="checkbox"
                                    checked={consentChecked}
                                    onChange={(e) => setConsentChecked(e.target.checked)}
                                />
                                <span>I agree that EscrowPay, a third party, verifies my identity, and that my payment is held by a licensed bank.</span>
                            </label>
                            
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

                       const isPaymentDetails = msg.content.includes("💳 Payment Details");
            if (isPaymentDetails) {
                if (conversation?.status === "paid") {
                    return (
                        <div key={msg._id} className={styles.systemMessage}>
                            <p className={styles.verifySuccess}>✅ Payment received</p>
                        </div>
                    );
                }

    const isLatestPayment = msg._id === latestPaymentMsgId;

               if (!isLatestPayment || paymentExpired) {
                    return (
                        <div key={msg._id} className={styles.systemMessage}>
                            <p className={styles.expiredText}>
                                ⏱ These payment details have expired. Do not transfer to this account.
                            </p>
                            {isLatestPayment ? (
                                <>
                                    {paymentError ? <p className={styles.verifyError}>{paymentError}</p> : null}
                                    <button
                                        className={styles.copyAccountBtn}
                                        onClick={handleRefreshPayment}
                                        disabled={refreshingPayment}
                                    >
                                        {refreshingPayment ? "Getting new details..." : "Get new payment details"}
                                    </button>
                                </>
                            ) : null}
                        </div>
                    );
                }

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
                        
                       {conversation?.checkoutHostedUrl ? (
    <div className={styles.escrowBlock}>
        <a
            className={styles.escrowButtonLink}
            href={conversation.checkoutHostedUrl}
            target="_blank"
            rel="noreferrer"
        >
            <img
                src={`${ESCROWPAY_BUTTON_BASE}/pay-with-escrowpay-lime@2x.png`}
                srcSet={`${ESCROWPAY_BUTTON_BASE}/pay-with-escrowpay-lime@1x.png 1x, ${ESCROWPAY_BUTTON_BASE}/pay-with-escrowpay-lime@2x.png 2x, ${ESCROWPAY_BUTTON_BASE}/pay-with-escrowpay-lime@3x.png 3x`}
                alt="Pay with EscrowPay"
                height="40"
            />
        </a>
        <p className={styles.fundsWording}>
            Your payment is held by Rubies Microfinance Bank, licensed by the Central Bank of Nigeria, and released to the seller once you confirm delivery.
        </p>
        <Link to="/refund-rules" className={styles.rulesLink}>
            How refunds and disputes work
        </Link>
    </div>
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

    const stage = conversation?.orderStage;
    const riderPhone = conversation?.shippingDetails?.riderPhone;
    const showRiderCard = (stage === "shipped" || stage === "delivered") && !!riderPhone;
    const canConfirmDelivery = stage === "shipped";
    const canRaiseDispute = stage === "shipped" || stage === "delivered";
    const canCancelDispute = stage === "disputed" && conversation?.dispute?.raisedBy === "buyer";
    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <button className={styles.backBtnAlt} onClick={() => navigate(`/${slug}/orders`)}>
                    ←
                </button>

                <span className={styles.storeName}>{slug}</span>
                {stageBadgeText() ? <span className={styles.paidBadge}>{stageBadgeText()}</span> : null}

                <div className={styles.headerActions}>
                    
                    {conversation?.orderStage === "released" || conversation?.orderStage === "delivered" ? (
                        <a
                            href={`https://wa.me/2349126664419?text=${encodeURIComponent("Feedback on my MoonStore order: ")}`}
                            target="_blank"
                            rel="noreferrer"
                            className={styles.feedbackBtn}
                        >
                            Feedback
                        </a>
                    ) : null}
                    <button className={styles.reportBtn} onClick={() => { setReportSent(false); setShowReportModal(true); }}>
                        Report
                    </button>
                </div>

         

{showDisputeModal ? (
    <div className={styles.modalOverlay}>
        <div className={styles.modal}>
            <h3>Raise a Dispute</h3>
            <p>Your payment stays on hold while we review.</p>

            <p className={styles.fieldLabel}>What went wrong?</p>
            <select
                className={styles.selectInput}
                value={disputeCategory}
                onChange={(e) => setDisputeCategory(e.target.value)}
            >
                <option value="">Choose one</option>
                <option value="not_received">I have not received my order</option>
                <option value="wrong_item">I received the wrong item</option>
                <option value="damaged">My item arrived damaged</option>
                <option value="not_as_described">The item is not as described</option>
                <option value="other">Something else</option>
            </select>

            {disputeCategory === "not_received" ? (
                <div className={styles.questionBox}>
                    <p className={styles.fieldLabel}>Did the delivery person call you?</p>
                    <select
                        className={styles.selectInput}
                        value={riderCalledAnswer}
                        onChange={(e) => setRiderCalledAnswer(e.target.value)}
                    >
                        <option value="">Choose one</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                        <option value="not_sure">Not sure</option>
                    </select>

                    <p className={styles.fieldLabel}>Did anyone else receive a parcel for you?</p>
                    <select
                        className={styles.selectInput}
                        value={someoneElseAnswer}
                        onChange={(e) => setSomeoneElseAnswer(e.target.value)}
                    >
                        <option value="">Choose one</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                        <option value="not_sure">Not sure</option>
                    </select>

                    <p className={styles.fieldLabel}>What address were you expecting it at?</p>
                    <input
                        type="text"
                        className={styles.reportPhoneInput}
                        value={addressAnswer}
                        maxLength={200}
                        onChange={(e) => setAddressAnswer(e.target.value)}
                        placeholder="Street, area, city"
                    />
                </div>
            ) : null}

            <textarea
                className={styles.reportInput}
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Describe the issue. You can send photos in the chat too."
                rows={4}
            />

            {disputeError ? <p className={styles.reportError}>{disputeError}</p> : null}

            <div className={styles.modalActions}>
                <button className={styles.cancelBtn} onClick={() => setShowDisputeModal(false)}>
                    Cancel
                </button>
                <button
                    className={styles.submitBtn}
                    onClick={handleRaiseDispute}
                    disabled={disputeSending}
                >
                    {disputeSending ? "Submitting..." : "Submit Dispute"}
                </button>
            </div>
            {disputeSent ? <p className={styles.reportSuccess}>Dispute submitted. Our team will review this order.</p> : null}
        </div>
    </div>
) : null}


        </div>

            <div className={styles.messages}>
                {messages?.map((msg) => renderMessage(msg))}

                {showRiderCard ? (
                    <div className={styles.systemMessage}>
                        <p className={styles.pinLabel}>Delivery person</p>
                        <p className={styles.riderName}>
                            {conversation.shippingDetails.riderName || "Your delivery person"}
                        </p>
                        <a className={styles.riderCall} href={`tel:+${riderPhone}`}>
                            Call +{riderPhone}
                        </a>
                    </div>
                ) : null}

                {conversation?.orderStage === "shipped" && conversation?.deliveryPin ? (
                    <div className={styles.systemMessage}>
                        <p className={styles.pinLabel}>Your parcel code</p>
                        <p className={styles.pinValue}>{conversation.deliveryPin}</p>
                        <p className={styles.pinHint}>
                            When your parcel arrives, check that this code is written on it. Tap Confirm Delivery only after you are holding your parcel.
                        </p>
                    </div>
                ) : null}

                <div ref={bottomRef} />
            </div>

                {canConfirmDelivery || canRaiseDispute || canCancelDispute ? (
                <div className={styles.actionBar}>
                    {canConfirmDelivery ? (
                        <button className={styles.confirmDeliveryBtn} onClick={() => setShowPinModal(true)}>
                            Confirm Delivery
                        </button>
                    ) : null}
                    {canRaiseDispute ? (
                        <button className={styles.disputeBtn} onClick={() => setShowDisputeModal(true)}>
                            Raise Dispute
                        </button>
                    ) : null}
                    {canCancelDispute ? (
                        <button className={styles.disputeBtn} onClick={handleCancelDispute}>
                            Cancel Dispute
                        </button>
                    ) : null}
                </div>
            ) : null}

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
                        <p>Enter the 4-digit parcel code from this chat to confirm you are holding your parcel.</p>
                        <input
                            type="text"
                            inputMode="numeric"
                            className={styles.reportPhoneInput}
                            placeholder="Enter code"
                            value={pinInput}
                            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
                            maxLength={4}
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

            {popupMessage ? (
    <div className={styles.modalOverlay}>
        <div className={styles.modal}>
            <p>{popupMessage}</p>
            <div className={styles.modalActions}>
                <button className={styles.submitBtn} onClick={() => setPopupMessage("")}>
                    OK
                </button>
            </div>
        </div>
    </div>
) : null}

        </div>
    );
};

export default BuyerChatPage;