// session.js manages the buyer's anonymous identity in the browser.
// localStorage persists data even after the browser is closed.
// sessionStorage clears when the tab is closed — used for popup dismissal per session.

export const getOrCreateSessionId = () => {
    let sessionId = localStorage.getItem("moonstore_session_id");
    if (!sessionId) {
        // generate a random unique ID combining random string + timestamp
        sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
        localStorage.setItem("moonstore_session_id", sessionId);
    }
    return sessionId;
};

export const getSavedEmail = () => {
    return localStorage.getItem("moonstore_buyer_email") || null;
};

export const saveBuyerEmailLocally = (email) => {
    localStorage.setItem("moonstore_buyer_email", email.toLowerCase().trim());
};


export const markPopupDismissed = () => {
    // sessionStorage so dismissal resets when buyer closes the tab
    sessionStorage.setItem("moonstore_popup_dismissed", "true");
};

export const wasPopupDismissed = () => {
    return sessionStorage.getItem("moonstore_popup_dismissed") === "true";
};