import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import {
    getDisputeDetailAdmin,
    sendAdminDisputeMessage,
    resolveDisputeAdmin,
    notifyDisputePartiesAdmin,
    BASE_URL,
} from "../api/api";
import styles from "./AdminDisputeDetailPage.module.css";

const CATEGORY_LABELS = {
    not_received: "Buyer says: not received",
    wrong_item: "Buyer says: wrong item",
    damaged: "Buyer says: damaged on arrival",
    not_as_described: "Buyer says: not as described",
    buyer_unreachable: "Seller says: buyer could not be reached",
    buyer_refused: "Seller says: buyer refused the parcel",
    wrong_address: "Seller says: wrong address or phone",
    other: "Other",
};

const ANSWER_LABELS = {
    yes: "Yes",
    no: "No",
    not_sure: "Not sure",
};

const formatDateTime = (value) => {
    if (!value) return "—";
    return new Date(value).toLocaleString("en-NG");
};

const AdminDisputeDetailPage = () => {
    const { conversationId } = useParams();
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [sendError, setSendError] = useState("");
    const [notifying, setNotifying] = useState(false);
    const [notifyError, setNotifyError] = useState("");

    const [resolving, setResolving] = useState(false);
    const [showSplitInput, setShowSplitInput] = useState(false);
    const [splitMode, setSplitMode] = useState("percent");
    const [splitPercent, setSplitPercent] = useState(50);
    const [splitAmount, setSplitAmount] = useState("");
    const [note, setNote] = useState("");
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
            setResolved(!!data.conversation?.dispute?.resolvedAt);
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

    const getTotalNaira = () => {
        return (conversation?.amount || 0) + (conversation?.shippingDetails?.deliveryFee || 0);
    };

    const handleSend = async () => {
        if (!input.trim()) return;
        setSending(true);
        setSendError("");
        const data = await sendAdminDisputeMessage(conversationId, input.trim());
        if (data.error) {
            setSendError(data.error);
        } else {
            setInput("");
        }
        setSending(false);
    };

    const handleNotifyParties = async () => {
        setNotifying(true);
        setNotifyError("");
        const data = await notifyDisputePartiesAdmin(conversationId);
        if (data.error) {
            setNotifyError(data.error);
        } else {
            loadDispute();
        }
        setNotifying(false);
    };

    const handleResolve = async (resolution) => {
        setResolveError("");

        let confirmText = "";
        let splitPercentValue;
        let splitAmountValue;
        const totalNaira = getTotalNaira();

        if (resolution === "seller") {
            confirmText = "release all funds to the seller";
        } else if (resolution === "buyer") {
            confirmText = "refund all funds to the buyer";
        } else if (splitMode === "amount") {
            const amountNumber = Number(splitAmount);

            if (!Number.isInteger(amountNumber) || amountNumber <= 0 || amountNumber >= totalNaira) {
                setResolveError(`Enter a whole number between 1 and ${totalNaira - 1}`);
                return;
            }

            splitAmountValue = amountNumber;
            confirmText = `give the seller ₦${amountNumber.toLocaleString("en-NG")} and refund the buyer ₦${(totalNaira - amountNumber).toLocaleString("en-NG")}`;
        } else {
            const percentNumber = Number(splitPercent);

            if (!percentNumber || percentNumber <= 0 || percentNumber >= 100) {
                setResolveError("Enter a percentage between 1 and 99");
                return;
            }

            splitPercentValue = percentNumber;
            confirmText = `give the seller ${percentNumber}% and the buyer ${100 - percentNumber}%`;
        }

        if (!window.confirm(`Are you sure you want to ${confirmText}? This cannot be undone.`)) return;

        setResolving(true);
        const data = await resolveDisputeAdmin(
            conversationId,
            resolution,
            splitPercentValue,
            splitAmountValue,
            note.trim()
        );
        setResolving(false);

        if (data.error) {
            setResolveError(data.error);
            return;
        }

        setResolved(true);
    };

    const senderLabel = (sender) => {
        if (sender === "admin") return "Support";
        if (sender === "buyer") return "Buyer";
        if (sender === "seller") return "Seller";
        return "System";
    };

    const renderMessageContent = (content) => {
        const parts = content.split(/(\[img\].*?\[\/img\])/);

        return parts
            .filter((part) => part !== "")
            .map((part, index) => {
                const imgMatch = part.match(/^\[img\](.*?)\[\/img\]$/);

                if (imgMatch) {
                    return <img key={index} src={imgMatch[1]} alt="evidence" className={styles.evidenceImg} />;
                }

                return <span key={index}>{part.replace(/\[\/?(verify|confirm)\]/g, "")}</span>;
            });
    };

    if (loading) return <p className={styles.stateText}>Loading dispute...</p>;
    if (error) return <p className={styles.errorText}>{error}</p>;
    if (!conversation) return null;

    const totalNaira = getTotalNaira();
    const deliveryFee = conversation.shippingDetails?.deliveryFee || 0;
    const answers = conversation.dispute?.answers;
    const hasAnswers = !!answers && (answers.riderCalled || answers.someoneElseReceived || answers.addressUsed);
    const riderPhone = conversation.shippingDetails?.riderPhone;
    const splitBuyerNaira = splitAmount ? totalNaira - Number(splitAmount) : totalNaira;

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
                    {sendError ? <p className={styles.errorText}>{sendError}</p> : null}
                </div>

                <div className={styles.detailsPanel}>
                    <h2 className={styles.panelTitle}>The Dispute</h2>
                    <p className={styles.detailValue}>
                        Raised by the {conversation.dispute?.raisedBy || "—"} on {formatDateTime(conversation.dispute?.raisedAt)}
                    </p>
                    <p className={styles.detailValue}>
                        {CATEGORY_LABELS[conversation.dispute?.category] || "No type chosen"}
                    </p>

                    {hasAnswers ? (
                        <div className={styles.answerBox}>
                            <p className={styles.detailLabel}>Buyer's answers</p>
                            <p className={styles.answerRow}>Did the delivery person call? {ANSWER_LABELS[answers.riderCalled] || "—"}</p>
                            <p className={styles.answerRow}>Did anyone else receive a parcel? {ANSWER_LABELS[answers.someoneElseReceived] || "—"}</p>
                            <p className={styles.answerRow}>Address expected: {answers.addressUsed || "—"}</p>
                        </div>
                    ) : null}

                    <h2 className={styles.panelTitle}>Order Snapshot</h2>
                    <p className={styles.detailLabel}>Seller</p>
                    <p className={styles.detailValue}>{conversation.sellerId?.businessName}</p>

                    <p className={styles.detailLabel}>Buyer</p>
                    <p className={styles.detailValue}>{conversation.buyerName} · {conversation.buyerEmail}</p>

                    <p className={styles.detailLabel}>Delivery</p>
                    <p className={styles.detailValue}>
                        {conversation.deliveryAddress}, {conversation.deliveryCity} · {conversation.deliveryPhone}
                    </p>

                    <p className={styles.detailLabel}>Delivery person</p>
                    <p className={styles.detailValue}>
                        {conversation.shippingDetails?.riderName || "No name"}
                        {riderPhone ? ` · +${riderPhone}` : " · no phone saved"}
                    </p>

                    <p className={styles.detailLabel}>Shipped</p>
                    <p className={styles.detailValue}>
                        {formatDateTime(conversation.shippedAt)} · delivery window {conversation.deliveryWindowDays || 0} day(s)
                    </p>

                    <p className={styles.detailLabel}>Parcel code</p>
                    <p className={styles.detailValue}>{conversation.deliveryPin || "—"}</p>

                    <p className={styles.detailLabel}>Money held</p>
                    <p className={styles.detailValue}>
                        Products ₦{conversation.amount?.toLocaleString()} + delivery ₦{deliveryFee.toLocaleString()} = ₦{totalNaira.toLocaleString()}
                    </p>

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
                            ⚠️ Buyer confirmed delivery with the parcel code on {formatDateTime(conversation.deliveredAt)}
                        </p>
                    ) : (
                        <p className={styles.detailValue}>The buyer has not confirmed delivery with the parcel code.</p>
                    )}

                    {!resolved ? (
                        <div className={styles.resolutionActions}>
                            <h3 className={styles.panelTitle}>Resolve Dispute</h3>

                            {!conversation.dispute?.responseDeadline ? (
                                <button className={styles.notifyBtn} onClick={handleNotifyParties} disabled={notifying}>
                                    {notifying ? "Notifying..." : "Ask Both Parties to Respond"}
                                </button>
                            ) : (
                                <p className={styles.deadlineText}>
                                    Both parties were asked to respond by {formatDateTime(conversation.dispute.responseDeadline)}
                                </p>
                            )}
                            {notifyError ? <p className={styles.errorText}>{notifyError}</p> : null}

                            <textarea
                                className={styles.noteInput}
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Note to both sides (optional). It is shown in the chat."
                                rows={3}
                                maxLength={500}
                            />

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
                                <div className={styles.splitBox}>
                                    <div className={styles.splitModeRow}>
                                        <button
                                            className={splitMode === "percent" ? styles.modeBtnActive : styles.modeBtn}
                                            onClick={() => setSplitMode("percent")}
                                        >
                                            By percent
                                        </button>
                                        <button
                                            className={splitMode === "amount" ? styles.modeBtnActive : styles.modeBtn}
                                            onClick={() => setSplitMode("amount")}
                                        >
                                            By amount (₦)
                                        </button>
                                    </div>

                                    {splitMode === "percent" ? (
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
                                        </div>
                                    ) : (
                                        <div className={styles.splitRow}>
                                            <label>Seller gets ₦</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max={totalNaira - 1}
                                                value={splitAmount}
                                                onChange={(e) => setSplitAmount(e.target.value)}
                                            />
                                            <span>· Buyer gets ₦{splitBuyerNaira.toLocaleString()}</span>
                                        </div>
                                    )}

                                    <p className={styles.hintText}>
                                        Failed delivery that was the buyer's fault: give the seller the delivery fee plus the courier's return fee; the buyer gets the rest.
                                    </p>

                                    <button
                                        className={styles.splitConfirmBtn}
                                        onClick={() => handleResolve("split")}
                                        disabled={resolving}
                                    >
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