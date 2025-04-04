import { useEffect, useState, useCallback } from "react";
import api from "./api";
import debounce from "lodash/debounce"; // lodash debounce ekleyin (npm install lodash)

const useFetch = (url, options = { debounceTime: 300, autoFetch: true }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get(url);
            setData(res.data);
            setError(null);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [url]);

    const debouncedFetch = useCallback(debounce(fetchData, options.debounceTime), [fetchData, options.debounceTime]);

    useEffect(() => {
        if (options.autoFetch) {
            debouncedFetch();
        }
        return () => debouncedFetch.cancel(); // Cleanup
    }, [debouncedFetch, options.autoFetch]);

    const reFetch = async () => {
        setLoading(true);
        try {
            const res = await api.get(url);
            setData(res.data);
            setError(null);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    return { data, loading, error, reFetch, fetch: fetchData }; // Manuel fetch eklendi
};

export default useFetch;    
