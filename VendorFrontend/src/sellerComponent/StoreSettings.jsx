import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {updateStoreSettings, deleteSellerAccount} from "../api/api";

import styles from "./StoreSettings.module.css";


function StoreSettings() {
    const { seller, logout} = useAuth();
    const navigate = useNavigate();

    const [businessName, setBusinessName] = useState(seller?.businessName || "");

    const [tagline, setTagline] = useState(seller?.tagline || "");

    const [whatsappNumber, setWhatsappNumber] = useState(seller?.whatsappNumber || "");

    const [address, setAddress] = useState(seller?.address || "");

    const [primaryColor, setPrimaryColor] = useState(seller?.primaryColor || "");

    const [secondaryColor, setSecondaryColor] = useState(seller?.secondaryColor || "");

    const [logo, setLogo] = useState(null);

    const [banner, setBanner] = useState(null);

    const [loading, setLoading] = useState(false)

    const [error, setError] = useState(null)

    const [success, setSuccess] = useState(null);

    const [showDeleteWarning, setShowDeleteWarning] = useState(false);

    const [deleteLoading, setDeleteLoading] = useState(false);
}

const handleSave = async()=>{
    setError(null);
    setSuccess(null);
    setLoading(true);

    const formData = new formData();
    formData.append("businessName", businessName);
    formData.append("tagline", tagline);
    formData.append("whatsappNumber", whatsappNumber);
    formData.append("address", address);

    if (seller?.plan === "pro" || seller?.plan === "premium") {
        formData.append("primaryColor", primaryColor);
        formData.append("secondaryColor", secondaryColor);
    }

    if (logo) {
        formData.append("logo", logo);
    }

    if (banner && (seller?.plan === "pro" || seller?.plan === "premium")) {
        formData.append("bannerImage", banner);
    }

    const data = await updateStoreSettings(formData);
    setLoading(false);

    if (data.error) {
        setError(data.error);
        return;
    }

    setSuccess("Store settings updated successfully.");
};

const handleDeleteAccount = async ()=>{
    setDeleteLoading(true);
    const data = await deleteSellerAccount();
    setDeleteLoading(false);

    if (data.error) {
        setError(data.error)
        return;
    }

    logout();
    navigate("/login");
};

const handleHelpButton = () =>{
    const message = `Hi, I need help with my MoonStore store. %0ABusiness: ${seller?.businessName}%0APlan: ${seller?.plan}`;
    window.open(`https://wa.me/2348152905325?text=${message}`, "_blank");
};