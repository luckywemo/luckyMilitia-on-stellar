import { isConnected, requestAccess } from '@stellar/freighter-api';

export const connectFreighter = async (): Promise<string | null> => {
    try {
        const connectionResult = await isConnected();
        if (!connectionResult.isConnected) {
            alert('Please install the Freighter Wallet extension first!\nhttps://freighter.app');
            return null;
        }

        const accessResult = await requestAccess();
        if (accessResult.address) {
            console.log('[Stellar] Connected:', accessResult.address);
            return accessResult.address;
        }

        console.warn('[Stellar] requestAccess returned no address');
        return null;
    } catch (error) {
        console.error('[Stellar] Error connecting Freighter:', error);
        return null;
    }
};

export const checkConnection = async (): Promise<string | null> => {
    try {
        const connectionResult = await isConnected();
        if (connectionResult.isConnected) {
            const accessResult = await requestAccess();
            if (accessResult.address) {
                return accessResult.address;
            }
        }
    } catch (error) {
        console.error('[Stellar] Error checking connection:', error);
    }
    return null;
};
