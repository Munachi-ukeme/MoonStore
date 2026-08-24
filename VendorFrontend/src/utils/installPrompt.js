// Small shared "memory box" for the PWA install prompt.
// The browser only fires beforeinstallprompt once, early — this file lets
// App.jsx catch it the moment the app loads, and lets InstallAppButton.jsx
// check for it later, even if it wasn't mounted when the event fired.

let savedPrompt = null;

export const saveInstallPrompt = (event) => {
    savedPrompt = event;
};

export const getInstallPrompt = () => {
    return savedPrompt;
};

export const clearInstallPrompt = () => {
    savedPrompt = null;
};