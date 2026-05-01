import { isConnected, requestAccess, signTransaction } from '@stellar/freighter-api';
import { Client, networks, PlayerStats } from 'soroban_militia_client';

const RPC_URL = import.meta.env.VITE_STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = import.meta.env.VITE_STELLAR_PASSPHRASE || networks.testnet.networkPassphrase;
const CONTRACT_ID = import.meta.env.VITE_CONTRACT_ID || networks.testnet.contractId;

export function useBlockchainStats() {
  
  // Initialize the strongly typed auto-generated client
  const client = new Client({
    networkPassphrase: NETWORK_PASSPHRASE,
    contractId: CONTRACT_ID,
    rpcUrl: RPC_URL,
    allowHttp: RPC_URL.includes('localhost')
  });

  const getFreighterSigner = () => {
    return async (xdr: string, opts: any) => {
      const signed = await signTransaction(xdr, {
        network: 'TESTNET',
        networkPassphrase: opts.networkPassphrase
      });
      if (!signed) throw new Error("Transaction signing rejected or failed.");
      return signed;
    };
  };

  const getAddress = async () => {
    const connection = await isConnected();
    if (!connection.isConnected) throw new Error('Freighter not connected');

    const { address } = await requestAccess();
    if (!address) throw new Error('No address found');
    return address;
  };

  return {
    recordKill: async (playerAddress: string) => {
      try {
        console.log(`[Bindings] Recording kill for ${playerAddress}...`);
        const tx = await client.record_kill({ player: playerAddress }, { fee: 10000 });
        const result = await tx.signAndSend({ signTransaction: getFreighterSigner() });
        return result.hash;
      } catch (error) {
        console.error(`[Bindings] Error in record_kill:`, error);
        throw error;
      }
    },

    recordWin: async (playerAddress: string) => {
      try {
        console.log(`[Bindings] Recording win for ${playerAddress}...`);
        const tx = await client.record_win({ player: playerAddress }, { fee: 10000 });
        const result = await tx.signAndSend({ signTransaction: getFreighterSigner() });
        return result.hash;
      } catch (error) {
        console.error(`[Bindings] Error in record_win:`, error);
        throw error;
      }
    },

    setUsername: async (username: string) => {
      try {
        const address = await getAddress();
        
        // 1. Update Local Cache Immediately
        localStorage.setItem('lm_username', username);
        const cacheKey = `lm_stats_${address}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
             const stats = JSON.parse(cached);
             stats.username = username;
             localStorage.setItem(cacheKey, JSON.stringify(stats));
          } catch(e) {}
        } else {
          // Initialize a basic stats object if none exists
          localStorage.setItem(cacheKey, JSON.stringify({
            username: username,
            kills: 0,
            wins: 0,
            gamesPlayed: 0
          }));
        }

        console.log(`[Bindings] Setting username '${username}' for ${address}...`);
        const tx = await client.set_username({ player: address, username }, { fee: 10000 });
        const result = await tx.signAndSend({ publicKey: address, signTransaction: getFreighterSigner() });
        return result.hash;
      } catch (error) {
        console.error(`[Bindings] Error in setUsername:`, error);
        throw error;
      }
    },

    getStats: async (playerAddress: string): Promise<PlayerStats | null> => {
      try {
        if (!CONTRACT_ID) return null;
        
        // 1. Check Cache First
        const cacheKey = `lm_stats_${playerAddress}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            // Return cached data immediately to avoid blocking UI
            console.log(`[Bindings] Returning cached stats for ${playerAddress}`);
            // Still fetch fresh data in the background to update cache
            client.get_stats({ player: playerAddress }).then(({ result }) => {
              localStorage.setItem(cacheKey, JSON.stringify(result));
            }).catch(() => {});
            
            return parsed;
          } catch (e) {}
        }

        console.log(`[Bindings] Fetching fresh stats for ${playerAddress}...`);
        const { result } = await client.get_stats({ player: playerAddress });
        
        // 3. Update Cache & Hydrate with local name if chain is behind
        const localName = localStorage.getItem('lm_username');
        if (result && result.username === 'OPERATOR' && localName) {
            console.log(`[Bindings] Chain says OPERATOR but local cache has ${localName}. Hydrating.`);
            result.username = localName;
        }

        localStorage.setItem(cacheKey, JSON.stringify(result));
        
        return result; 
      } catch (e) {
        console.error('[Bindings] Error fetching stats:', e);
      }
      return null;
    },

    syncStats: async (kills: number, wins: number, mode?: string) => {
      try {
        const address = await getAddress();
        if (address) {
          // Off-chain API sync for quick leaderboard updates
          const username = localStorage.getItem('lm_username') || 'ROOKIE';
          try {
            await fetch('/api/sync-stats', {
              method: 'POST',
              body: JSON.stringify({ address, kills, wins, username, mode }),
              headers: { 'Content-Type': 'application/json' }
            });
          } catch (e) {
            console.error('[Sync] Failed to hit API:', e);
          }

          // On-chain Win Record (Requires User Signature)
          if (wins > 0) {
             const tx = await client.record_win({ player: address }, { fee: 10000 });
             return await tx.signAndSend({ signTransaction: getFreighterSigner() });
          }
        }
      } catch (e) {
         console.warn('[Sync] On-chain sync bypassed or failed', e);
      }
    }
  };
}

