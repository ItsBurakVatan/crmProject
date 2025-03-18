import { createContext, useReducer, useEffect } from "react";

const INITIAL_STATE = {
    user: (() => {
        const storedUser = localStorage.getItem("user");
        try {
            return storedUser ? JSON.parse(storedUser) : null;
        } catch (e) {
            console.error("Invalid JSON in localStorage 'user':", e);
            return null;
        }
    })(),
    loading: false,
    error: null,
};

export const AuthContext = createContext(INITIAL_STATE);

const AuthReducer = (state, action) => {
    switch (action.type) {
        case "LOGIN_START":
            return { user: null, loading: true, error: null };
        case "LOGIN_SUCCESS":
            return { user: action.payload, loading: false, error: null };
        case "LOGIN_FAILURE":
            return { user: null, loading: false, error: action.payload };
        case "LOGOUT":
            return { user: null, loading: false, error: null };
        default:
            return state;
    }
};

export const AuthContextProvider = ({ children }) => {
    const [state, dispatch] = useReducer(AuthReducer, INITIAL_STATE);

    useEffect(() => {
        localStorage.setItem("user", JSON.stringify(state.user));
    }, [state.user]);

    console.log("AuthContext User:", state.user);

    return (
        <AuthContext.Provider
            value={{
                user: state.user,
                loading: state.loading,
                error: state.error,
                dispatch,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;