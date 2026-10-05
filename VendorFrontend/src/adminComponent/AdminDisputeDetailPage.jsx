import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { getDisputeDetailAdmin, sendAdminDisputeMessage, resolveDisputeAdmin, BASE_URL } from "../api/api";
import styles from "./AdminDisputeDetailPage.module.css";

const AdminDisputeDetailPage = () => {
    const { conversationId } = useParams();
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [notifying, setNotifying] = useState(false);


    const [resolving, setResolving] = useState(false);
    const [splitPercent, setSplitPercent] = useState(50);
    const [showSplitInput, setShowSplitInput] = useState(false);
    const [resolveError, setResolveError] = useState("");
    const [resolved, setResolved] = useState(false);

    const socketRef = useRef(null);
    const bottomRef = useRef(null);
    const SOCKET_URL = BASE_URL.replace(/\/api$/, "");

    const loadDispute = useCallback(async () => {
        setError("");
        const data = await getDisputeDetailAdmin(conversationId);
        if (data.error) {
            setError(data.error);
        } else {
            setConversation(data.conversation);
            setMessages(data.messages);
        }
        setLoading(false);
    }, [conversationId]);

    useEffect(() => {
        loadDispute();
    }, [loadDispute]);

    useEffect(() => {
        socketRef.current = io(SOCKET_URL, { transports: ["websocket"] });
        socketRef.current.emit("join_conversation", conversationId);

        socketRef.current.on("new_message", (incomingMessage) => {
            setMessages((prev) => {
                const exists = prev.some((m) => m._id === incomingMessage._id);
                if (exists) return prev;
                return [...prev, incomingMessage];
            });
        });

        return () => socketRef.current.disconnect();
    }, [conversationId, SOCKET_URL]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;
        setSending(true);
        const data = await sendAdminDisputeMessage(conversationId, input.trim());
        if (!data.error) {
            setInput("");
        }
        setSending(false);
    };

    const handleNotifyParties = async () => {
    setNotifying(true);
    const data = await notifyDisputePartiesAdmin(conversationId);
    if (!data.error) {
        loadDispute();
    }
    setNotifying(false);
};

    const handleResolve = async (resolution) => {
        setResolveError("");

        if (resolution === "split") {
            const data = await resolveDisputeAdmin(conversationId, "split", splitPercent);
            if (data.error) {
                setResolveError(data.error);
                return;
            }
            setResolved(true);
            return;
        }

        const confirmText = resolution === "seller" ? "release all funds to the seller" : "refund all funds to the buyer";
        if (!window.confirm(`Are you sure you want to ${confirmText}? This cannot be undone.`)) return;

        setResolving(true);
        const data = await resolveDisputeAdmin(conversationId, resolution);
        if (data.error) {
            setResolveError(data.error);
            setResolving(false);
            return;
        }
        setResolved(true);
        setResolving(false);
    };

    const senderLabel = (sender) => {
        if (sender === "admin") return "Support";
        if (sender === "buyer") return "Buyer";
        if (sender === "seller") return "Seller";
        return "System";
    };

    const renderMessageContent = (content) => {
        const imgMatch = content.match(/\[img\](.*?)\[\/img\]/);
        if (imgMatch) {
            return <img src={imgMatch[1]} alt="evidence" className={styles.evidenceImg} />;
        }
        return <span>{content}</span>;
    };

    if (loading) return <p className={styles.stateText}>Loading dispute...</p>;
    if (error) return <p className={styles.errorText}>{error}</p>;
    if (!conversation) return null;

    return (
        <div className={styles.page}>
            <div className={styles.layout}>

                <div className={styles.chatPanel}>
                    <h2 className={styles.panelTitle}>Dispute Chat</h2>
                    <p className={styles.disputeReason}>Reason: {conversation.dispute?.reason}</p>

                    <div className={styles.messages}>
                        {messages.map((msg) => (
                            <div key={msg._id} className={`${styles.bubble} ${styles[msg.sender]}`}>
                                <p className={styles.senderLabel}>{senderLabel(msg.sender)}</p>
                                {renderMessageContent(msg.content)}
                            </div>
                        ))}
                        <div ref={bottomRef} />
                    </div>

                    {!resolved ? (
                        <div className={styles.inputRow}>
                            <textarea
                                className={styles.input}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Message as Support..."
                                rows={2}
                            />
                            <button className={styles.sendBtn} onClick={handleSend} disabled={sending}>
                                Send
                            </button>
                        </div>
                    ) : (
                        <p className={styles.resolvedText}>✅ This dispute has been resolved.</p>
                    )}
                </div>

                <div className={styles.detailsPanel}>
                    <h2 className={styles.panelTitle}>Order Snapshot</h2>
                    <p className={styles.detailLabel}>Seller</p>
                    <p className={styles.detailValue}>{conversation.sellerId?.businessName}</p>

                    <p className={styles.detailLabel}>Buyer</p>
                    <p className={styles.detailValue}>{conversation.buyerName} · {conversation.buyerEmail}</p>

                    <p className={styles.detailLabel}>Delivery</p>
                    <p className={styles.detailValue}>
                        {conversation.deliveryAddress}, {conversation.deliveryCity} · {conversation.deliveryPhone}
                    </p>

                    <p className={styles.detailLabel}>Amount</p>
                    <p className={styles.detailValue}>₦{conversation.amount?.toLocaleString()}</p>

                    <p className={styles.detailLabel}>Products Ordered (as seen at order time)</p>
                    {conversation.orderedProductSnapshot?.map((item, i) => (
                        <div key={i} className={styles.snapshotItem}>
                            {item.image ? <img src={item.image} alt={item.name} className={styles.snapshotImg} /> : null}
                            <div>
                                <p className={styles.snapshotName}>{item.name} x{item.quantity}</p>
                                <p className={styles.snapshotMeta}>
                                    ₦{item.price?.toLocaleString()}
                                    {item.colors?.length > 0 ? ` · ${item.colors.join(", ")}` : ""}
                                    {item.sizes?.length > 0 ? ` · Size: ${item.sizes.join(", ")}` : ""}
                                </p>
                            </div>
                        </div>
                    ))}

                    {conversation.deliveredAt ? (
                        <p className={styles.contradictionNote}>
                            ⚠️ Buyer confirmed delivery with PIN on {new Date(conversation.deliveredAt).toLocaleString("en-NG")}
                        </p>
                    ) : (
                        <p className={styles.detailValue}>Buyer never confirmed delivery with PIN.</p>
                    )}

                    {!resolved ? (
                        <div className={styles.resolutionActions}>
                            <h3 className={styles.panelTitle}>Resolve Dispute</h3>

                            {!conversation.dispute?.responseDeadline ? (
    <button className={styles.notifyBtn} onClick={handleNotifyParties} disabled={notifying}>
        {notifying ? "Notifying..." : "Notify Both Parties (24h to respond)"}
    </button>
) : (
    <p className={styles.deadlineText}>
        Response deadline: {new Date(conversation.dispute.responseDeadline).toLocaleString("en-NG")}
    </p>
)}
                            {resolveError ? <p className={styles.errorText}>{resolveError}</p> : null}

                            <button
                                className={styles.releaseBtn}
                                onClick={() => handleResolve("seller")}
                                disabled={resolving}
                            >
                                Release Full Amount to Seller
                            </button>
                            <button
                                className={styles.refundBtn}
                                onClick={() => handleResolve("buyer")}
                                disabled={resolving}
                            >
                                Refund Full Amount to Buyer
                            </button>

                            {!showSplitInput ? (
                                <button className={styles.splitToggleBtn} onClick={() => setShowSplitInput(true)}>
                                    Split Between Both
                                </button>
                            ) : (
                                <div className={styles.splitRow}>
                                    <label>Seller gets:</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="99"
                                        value={splitPercent}
                                        onChange={(e) => setSplitPercent(e.target.value)}
                                    />
                                    <span>% · Buyer gets {100 - splitPercent}%</span>
                                    <button className={styles.splitConfirmBtn} onClick={() => handleResolve("split")}>
                                        Confirm Split
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default AdminDisputeDetailPage;