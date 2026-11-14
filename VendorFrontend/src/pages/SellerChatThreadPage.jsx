import { useState, useEffect, useRef, useCallback } from "react";
import { IoSend } from "react-icons/io5";
import { GrAttachment } from "react-icons/gr";
import { io } from "socket.io-client";
import { useParams, useNavigate } from "react-router-dom";
import {
    getSellerChatMessages,
    sendSellerMessage,
    sendImageMessage,
    markOrderShipped,
    raiseDisputeSeller,
    cancelDisputeSeller,
    BASE_URL,
} from "../api/api";
import styles from "./SellerChatThreadPage.module.css";
import CancelOrderModal from "../sellerComponent/CancelOrderModal";

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
    const [fullscreenImage, setFullscreenImage] = useState(null);
    const [showDisputeModal, setShowDisputeModal] = useState(false);
const [disputeReason, setDisputeReason] = useState("");
const [disputeSending, setDisputeSending] = useState(false);
const [disputeSent, setDisputeSent] = useState(false);
    const [disputeCategory, setDisputeCategory] = useState("");
    const [disputeError, setDisputeError] = useState("");
    const [showShipConfirm, setShowShipConfirm] = useState(false);
    const [shipping, setShipping] = useState(false);
    const [shipError, setShipError] = useState("");
    const [riderName, setRiderName] = useState("");
    const [riderPhone, setRiderPhone] = useState("");
    const [error, setError] = useState("");
    const [imageError, setImageError] = useState("");
       const [showCancel, setShowCancel] = useState(false);
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

         const handleMarkShipped = async () => {
        if (!riderPhone.trim()) {
            setShipError("Enter the delivery person's phone number.");
            return;
        }

        setShipping(true);
        setShipError("");
        const data = await markOrderShipped(conversationId, riderName.trim(), riderPhone.trim());
        setShipping(false);

        if (data.error) {
            setShipError(data.error);
            return;
        }

        setShowShipConfirm(false);
        setRiderName("");
        setRiderPhone("");
        fetchThread();
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

        setDisputeSending(true);
        const data = await raiseDisputeSeller(conversationId, disputeReason.trim(), disputeCategory);
        setDisputeSending(false);

        if (data.error) {
            setDisputeError(data.error);
            return;
        }

        setDisputeSent(true);
        setShowDisputeModal(false);
        setDisputeCategory("");
        setDisputeReason("");
        fetchThread();
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

 const handleCancelDispute = async () => {
    const data = await cancelDisputeSeller(conversationId);
    if (!data.error) fetchThread();
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

        const stageBannerText = () => {
        const stage = conversation?.orderStage;

        if (stage === "payment_held") {
            if (conversation?.shipDeadlineAt) {
                return `✓ Payment received and held safely. Mark as shipped before ${new Date(conversation.shipDeadlineAt).toLocaleString("en-NG")} or the buyer is refunded.`;
            }
            return "✓ Payment received and held safely. Please ship the order.";
        }
        if (stage === "shipped") return "📦 Shipped. Waiting for the buyer to confirm delivery.";
        if (stage === "delivered") return "✓ Delivery confirmed. Payment is released to you after the 48-hour dispute window.";
        if (stage === "released") return "✓ Payment has been released to you.";
        if (stage === "disputed") return "⚠️ This order is under dispute. MoonStore support will review it.";
        if (stage === "refunded") return "This order was refunded to the buyer.";
        return null;
    };

    return (
        <div className={styles.page}>
        {stageBannerText() ? (
                <div className={styles.paidBanner}>{stageBannerText()}</div>
            ) : null}

            <div className={styles.header}>
                <button className={styles.backBtn} onClick={() => navigate("/dashboard/inbox")}>←</button>

                <div className={styles.headerInfo}>
                    <span className={styles.productName}>
                        {conversation?.productIds?.[0]?.name || "Order"}
                    </span>
                </div>

                {(isPaid && conversation?.orderStage === "shipped" || conversation?.orderStage === "delivered") ? (
    <button className={styles.disputeBtn} onClick={() => setShowDisputeModal(true)}>
        Dispute
    </button>
) : null}

{showDisputeModal ? (
    <div className={styles.modalOverlay}>
        <div className={styles.modal}>
            <h3>Raise a Dispute</h3>
            <p>Tell us what went wrong with this order. The payment will stay on hold while we review.</p>

            <p className={styles.fieldLabel}>What went wrong?</p>
            <select
                className={styles.selectInput}
                value={disputeCategory}
                onChange={(e) => setDisputeCategory(e.target.value)}
            >
                <option value="">Choose one</option>
                <option value="buyer_unreachable">The buyer could not be reached</option>
                <option value="buyer_refused">The buyer refused the parcel</option>
                <option value="wrong_address">The address or phone number was wrong</option>
                <option value="other">Something else</option>
            </select>

            <textarea
                className={styles.disputeTextarea}
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Describe the issue. You can send photos in the chat too."
                rows={4}
            />

            {disputeError ? <p className={styles.linkError}>{disputeError}</p> : null}

            <div className={styles.modalActions}>
                <button className={styles.cancelBtn} onClick={() => setShowDisputeModal(false)}>
                    Cancel
                </button>
                <button
                    className={styles.submitDisputeBtn}
                    onClick={handleRaiseDispute}
                    disabled={disputeSending}
                >
                    {disputeSending ? "Submitting..." : "Submit Dispute"}
                </button>
            </div>
            {disputeSent ? <p className={styles.disputeSuccess}>Dispute submitted. Our team will review this order.</p> : null}
        </div>
    </div>
) : null}

{conversation?.orderStage === "disputed" && conversation?.dispute?.raisedBy === "seller" ? (
    <button className={styles.cancelDisputeBtn} onClick={handleCancelDispute}>
        Cancel Dispute
    </button>
) : null}

            {showShipConfirm ? (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h3>Mark as Shipped?</h3>
                        <p>Only confirm if you have handed this order to a rider or courier, with the parcel code written on the parcel. The buyer will be told by SMS and email, and sees your delivery person's number. Marking an order shipped when it hasn't been is your responsibility.</p>
                        <input
                            className={styles.riderInput}
                            type="text"
                            placeholder="Delivery person's name (optional)"
                            value={riderName}
                            maxLength={60}
                            onChange={(e) => setRiderName(e.target.value)}
                        />
                        <input
                            className={styles.riderInput}
                            type="tel"
                            placeholder="Delivery person's phone number"
                            value={riderPhone}
                            maxLength={16}
                            onChange={(e) => setRiderPhone(e.target.value)}
                        />
                        {shipError ? <p className={styles.linkError}>{shipError}</p> : null}
                        <div className={styles.modalActions}>
                            <button className={styles.cancelBtn} onClick={() => setShowShipConfirm(false)}>
                                Cancel
                            </button>
                            <button
                                className={styles.confirmShipBtn}
                                onClick={handleMarkShipped}
                                disabled={shipping}
                            >
                                {shipping ? "Saving..." : "Yes, it's shipped"}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}


            {conversation?.deliveryPin && (conversation?.orderStage === "payment_held" || conversation?.orderStage === "shipped") ? (
                    <div className={styles.parcelCard}>
                        <p className={styles.parcelLabel}>Parcel code</p>
                        <p className={styles.parcelValue}>{conversation.deliveryPin}</p>
                        <p className={styles.parcelHint}>
                            Write this code on the parcel with the buyer's name and phone number. The buyer checks that it matches before taking the parcel. Send a photo of the packed parcel here to protect yourself if there is a dispute.
                        </p>
                    </div>
                ) : null}
           
            </div>



            <div className={styles.messages}>
                {messages?.map((msg) => renderMessage(msg))}
                <div ref={bottomRef} />
            </div>


            <div className={styles.bottomBar}>

                     {conversation?.orderStage === "payment_held" ? (
                       <>
                           <button
                               className={styles.generateBtn}
                               onClick={() => setShowShipConfirm(true)}
                           >
                               📦 Mark as Shipped
                           </button>
                           <button
                               className={styles.cancelOrderBtn}
                               onClick={() => setShowCancel(true)}
                           >
                               Cancel order
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

                {showCancel ? (
                   <CancelOrderModal
                       conversationId={conversationId}
                       onClose={() => setShowCancel(false)}
                       onDone={() => {
                           setShowCancel(false);
                           fetchThread();
                       }}
                   />
               ) : null}

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