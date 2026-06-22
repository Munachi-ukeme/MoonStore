//this is the gate that secure the website routes and also decides whether to render the requested page or redirect to login page.

import { Navigate } from "react-router-dom"; // this redirects unauthrized users to the login page
import { useAuth} from "./context/AuthContext"; // this is a custom hook that allows us to access the auth context and check if the user is authenticated or not 

function ProtectedRoute({ children}) {

    const { isAuthenticated, loading} = useAuth(); //This is true if a seller is logged in, false if not

    if (loading) {
        return <div>Verifying session...</div>; 
    }


    if ( !isAuthenticated) {
        return <Navigate to="/" replace />; // if not authenticated, redirect to login page
    }

    // if seller is logged in, render whatever page was requested
    return children;
}

export default ProtectedRoute;
