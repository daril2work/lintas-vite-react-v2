import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';
import { APP_CONFIG as FALLBACK_CONFIG } from '../constants/config';
import { toast } from 'sonner';

interface ConfigContextType {
    config: typeof FALLBACK_CONFIG;
    isLoading: boolean;
    refreshConfig: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [config, setConfig] = useState<typeof FALLBACK_CONFIG>(FALLBACK_CONFIG);
    const [isLoading, setIsLoading] = useState(true);

    const fetchConfig = async () => {
        try {
            const dbConfig = await api.getAppConfigs();
            if (Object.keys(dbConfig).length > 0) {
                setConfig(prev => ({
                    ...prev,
                    HOSPITAL_NAME: dbConfig.HOSPITAL_NAME || prev.HOSPITAL_NAME,
                    APP_VERSION: dbConfig.APP_VERSION || prev.APP_VERSION,
                    SYSTEM_STATUS: dbConfig.SYSTEM_STATUS || prev.SYSTEM_STATUS,
                }));
            }
        } catch (error) {
            console.error('Error fetching app config:', error);
            // Fallback is already set in state
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    const refreshConfig = async () => {
        setIsLoading(true);
        await fetchConfig();
        toast.info('Konfigurasi diperbarui');
    };

    return (
        <ConfigContext.Provider value={{ config, isLoading, refreshConfig }}>
            {children}
        </ConfigContext.Provider>
    );
};

export const useAppConfig = () => {
    const context = useContext(ConfigContext);
    if (context === undefined) {
        throw new Error('useAppConfig must be used within a ConfigProvider');
    }
    return context;
};
