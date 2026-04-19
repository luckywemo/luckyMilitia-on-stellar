import React, { useState, useEffect, useRef } from 'react';
import Lobby from './components/Lobby';
import GameContainer from './components/GameContainer';
import CreativeSuite from './components/CreativeSuite';
import VibeAssistant from './components/VibeAssistant';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { connectFreighter, checkConnection } from './utils/stellarAdapter';

export type AppState = 'boot' | 'wallet-auth' | 'onboarding' | 'lobby' | 'playing' | 'labs';

export type GameMode = 'bot' | 'multiplayer' | 'mission';
export type CharacterClass = 'STRIKER' | 'GHOST' | 'TITAN';
export type MPMatchMode = 'TDM' | 'FFA' | 'HARDPOINT' | '1V1';
export type MPMap = 'URBAN_RUINS' | 'THE_PIT' | 'OUTPOST_X';

export interface MPConfig {
  mode: MPMatchMode;
  map: MPMap;
  alphaBots: number;
  bravoBots: number;
  scoreLimit: number;
  mapSeed: string;
}

export type MissionType = 'ELIMINATION' | 'SURVIVAL' | 'EXTRACTION';

export interface MissionConfig {
  id: number;
  name: string;
  objective: string;
  type: MissionType;
  targetValue: number; // Kills / Seconds / Items
  difficulty: number;
  coords: { x: number; y: number };
}

const MISSIONS: MissionConfig[] = [
  // SECTOR 1: THE OUTSKIRTS
  { id: 1, name: "ALPHA_PROTOCOL", objective: "Clear local sector of rogue drones.", type: 'ELIMINATION', targetValue: 5, difficulty: 1, coords: { x: 15, y: 25 } },
  { id: 2, name: "NEON_SCARE", objective: "Eliminate reinforced security units.", type: 'ELIMINATION', targetValue: 10, difficulty: 2, coords: { x: 25, y: 40 } },
  { id: 3, name: "PERIMETER_DEFENSE", objective: "Survive the hostile wave.", type: 'SURVIVAL', targetValue: 60, difficulty: 2, coords: { x: 35, y: 20 } },
  { id: 4, name: "SUPPLY_RUN", objective: "Secure Data Drives from the area.", type: 'EXTRACTION', targetValue: 3, difficulty: 2, coords: { x: 20, y: 60 } },

  // SECTOR 2: URBAN DECAY
  { id: 5, name: "STREET_SWEEPER", objective: "Neutralize significant resistance.", type: 'ELIMINATION', targetValue: 25, difficulty: 3, coords: { x: 50, y: 45 } },
  { id: 6, name: "BLACKOUT", objective: "Survive in low-vis conditions.", type: 'SURVIVAL', targetValue: 120, difficulty: 3, coords: { x: 60, y: 30 } },
  { id: 7, name: "DATA_HEIST", objective: "Extract intel under heavy fire.", type: 'EXTRACTION', targetValue: 5, difficulty: 4, coords: { x: 65, y: 65 } },
  { id: 8, name: "ELITE_HUNT", objective: "Eliminate High-Value Targets.", type: 'ELIMINATION', targetValue: 3, difficulty: 4, coords: { x: 55, y: 80 } }, // Note: Logic will treat as general kills for now unless we add elite logic

  // SECTOR 3: THE CORE
  { id: 9, name: "VOID_STRIKE", objective: "Survive the Void incursion.", type: 'SURVIVAL', targetValue: 180, difficulty: 5, coords: { x: 80, y: 35 } },
  { id: 10, name: "OMNI_CORE", objective: "Total system purge initiated.", type: 'ELIMINATION', targetValue: 50, difficulty: 5, coords: { x: 90, y: 50 } },
  { id: 11, name: "SYSTEM_CRASH", objective: "Recover Core fragments.", type: 'EXTRACTION', targetValue: 10, difficulty: 6, coords: { x: 85, y: 75 } },
  { id: 12, name: "FINAL_JUDGEMENT", objective: "Defeat the Overlord forces.", type: 'ELIMINATION', targetValue: 100, difficulty: 7, coords: { x: 95, y: 90 } },
];

const BootSequence: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [glitch, setGlitch] = useState(false);

  const bootLogs = [
    "> INITIALIZING STELLAR_LINK_V5...",
    "> SYNCING SOROBAN SMART CONTRACT OVERLAYS...",
    "> LOADING ASSET_HUMAN_MODELS_01...",
    "> CALIBRATING HUD_VISOR_OVERLAY...",
    "> VERIFYING RUST_ENCRYPTION_KEYS...",
    "> UPLINK SUCCESSFUL. WELCOME OPERATOR."
  ];

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      if (current < bootLogs.length) {
        setLogs(prev => [...prev, bootLogs[current]]);
        current++;
        if (Math.random() > 0.8) {
          setGlitch(true);
          setTimeout(() => setGlitch(false), 50);
        }
      } else {
        clearInterval(interval);
        setTimeout(onComplete, 1200);
      }
    }, 120);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className={`flex-1 flex flex-col items-center justify-center bg-[#050505] p-3 sm:p-6 lg:p-10 font-mono relative overflow-hidden transition-all duration-75 ${glitch ? 'invert scale-[1.01] brightness-150' : ''}`}>
      <div className="absolute inset-0 z-0">
        <img src="/og-image.png" alt="" className="w-full h-full object-cover opacity-40" />
      </div>
      <div className="w-full max-w-2xl space-y-3 sm:space-y-6 lg:space-y-10 relative z-10 bg-black/40 p-4 sm:p-8 rounded-2xl backdrop-blur-md border border-white/5">
        <div className="flex items-center gap-3 sm:gap-5 lg:gap-8 mb-4 sm:mb-8 lg:mb-16 animate-in fade-in slide-in-from-top-10 duration-700">
          <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 bg-orange-600 rounded-lg flex items-center justify-center animate-bounce shadow-[0_0_50px_rgba(249,115,22,0.6)] border-2 border-white/20 overflow-hidden">
            <img src="/og-image.png" alt="Lucky Militia" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="text-orange-500 text-xs sm:text-base lg:text-lg font-black tracking-[0.3em] sm:tracking-[0.5em] lg:tracking-[0.8em] uppercase mb-1 drop-shadow-lg">LUCKY_MILITIA</div>
            <div className="text-stone-500 text-[8px] sm:text-[9px] lg:text-[10px] font-bold tracking-[0.2em] sm:tracking-[0.3em] lg:tracking-[0.4em] uppercase opacity-70">Stellar_Bridge_Terminal_v3.0</div>
          </div>
        </div>

        <div className="space-y-2 sm:space-y-3 lg:space-y-4 bg-black/60 p-3 sm:p-6 lg:p-10 border border-stone-800 rounded-xl lg:rounded-2xl min-h-[140px] sm:min-h-[220px] lg:min-h-[340px] flex flex-col justify-end backdrop-blur-xl shadow-2xl relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500/50 to-transparent"></div>
          {logs.map((log, i) => (
            <div key={i} className="text-stone-300 text-[9px] sm:text-[10px] lg:text-[11px] font-bold tracking-wider lg:tracking-widest border-l-2 border-orange-600 pl-2 sm:pl-3 lg:pl-5 animate-in slide-in-from-left-4 duration-200">
              <span className="text-orange-500/40 mr-2 sm:mr-3 lg:mr-4 font-black">[{new Date().toLocaleTimeString('en-GB')}]</span>
              {log}
            </div>
          ))}
          {logs.length < bootLogs.length && (
            <div className="w-2 h-3 sm:h-4 bg-orange-500 animate-pulse ml-1 shadow-[0_0_10px_#f97316]"></div>
          )}
        </div>

        <div className="pt-3 sm:pt-6 lg:pt-10">
          <div className="flex justify-between text-[8px] sm:text-[9px] lg:text-[10px] font-black text-stone-600 uppercase tracking-wider lg:tracking-widest mb-2 lg:mb-3">
            <span>Core_Stability</span>
            <span>{Math.floor((logs.length / bootLogs.length) * 100)}%</span>
          </div>
          <div className="w-full h-1 sm:h-1.5 bg-stone-900 overflow-hidden rounded-full border border-stone-800 p-px">
            <div className="h-full bg-orange-600 transition-all duration-300 shadow-[0_0_15px_rgba(249,115,22,0.5)]" style={{ width: `${(logs.length / bootLogs.length) * 100}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};


const queryClient = new QueryClient();

const WalletAuthScreen: React.FC<{ onComplete: (addr: string) => void; onSkip: () => void }> = ({ onComplete, onSkip }) => {
  const [glitch, setGlitch] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const glitchInterval = setInterval(() => {
      if (Math.random() > 0.85) {
        setGlitch(true);
        setTimeout(() => setGlitch(false), 50);
      }
    }, 2000);
    return () => clearInterval(glitchInterval);
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);
    try {
      const pubKey = await connectFreighter();
      if (pubKey) {
        setTimeout(() => onComplete(pubKey), 800);
      } else {
        setError('Connection failed. Is Freighter installed?');
        setConnecting(false);
      }
    } catch (e: any) {
      setError(e.message || 'Unknown error');
      setConnecting(false);
    }
  };

  return (
    <div className={`flex-1 flex flex-col items-center justify-center bg-[#050505] p-3 sm:p-6 lg:p-10 font-mono relative overflow-hidden transition-all duration-75 ${glitch ? 'invert scale-[1.01] brightness-150' : ''}`}>
      <div className="absolute inset-0 z-0">
        <img src="/og-image.png" alt="" className="w-full h-full object-cover opacity-30" />
      </div>
      <div className="w-full max-w-2xl space-y-6 sm:space-y-8 lg:space-y-12 relative z-10">
        <div className="flex flex-col items-center gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12 lg:mb-16 animate-in fade-in slide-in-from-top-10 duration-700">
          <div className="w-24 h-24 sm:w-32 sm:h-32 lg:w-48 lg:h-48 bg-orange-600 rounded-lg flex items-center justify-center animate-pulse shadow-[0_0_50px_rgba(249,115,22,0.6)] border-2 border-white/10 overflow-hidden">
            <img src="/og-image.png" alt="Lucky Militia" className="w-full h-full object-cover" />
          </div>
          <div className="text-center">
            <div className="text-orange-500 text-xl sm:text-3xl lg:text-4xl font-black tracking-[0.3em] sm:tracking-[0.5em] lg:tracking-[0.8em] uppercase mb-2 drop-shadow-lg">LUCKY_MILITIA</div>
            <div className="text-stone-500 text-xs sm:text-sm lg:text-base font-bold tracking-[0.2em] sm:tracking-[0.3em] lg:tracking-[0.4em] uppercase opacity-70">Stellar_Soroban_Terminal</div>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6 lg:space-y-8 bg-black/60 p-6 sm:p-8 lg:p-12 border border-stone-800 rounded-xl lg:rounded-2xl backdrop-blur-xl shadow-2xl relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500/50 to-transparent"></div>

          <div className="text-center space-y-3 sm:space-y-4">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black font-stencil text-white uppercase italic tracking-widest">AUTHENTICATION REQUIRED</h2>
            <p className="text-xs sm:text-sm lg:text-base text-stone-400 font-bold leading-relaxed max-w-md mx-auto">
              Connect your Freighter wallet to access the Soroban tactical command nexus.
            </p>
          </div>

          <div className="flex flex-col items-center gap-4 sm:gap-6 py-4 sm:py-6">
            {!connecting ? (
                <button onClick={handleConnect} className="bg-orange-600 hover:bg-orange-700 text-white font-black py-4 sm:py-5 lg:py-6 px-8 sm:px-10 lg:px-12 rounded-lg shadow-[0_0_30px_rgba(249,115,22,0.5)] border-2 border-white/20 transition-all uppercase tracking-widest text-sm sm:text-base lg:text-lg hover:scale-105 active:scale-95">
                  Connect Freighter
                </button>
            ) : (
              <div className="flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 px-6 py-3 rounded-lg">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></div>
                  <span className="text-green-500 font-black text-sm sm:text-base uppercase tracking-widest">AUTHENTICATING...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="text-center space-y-2 animate-in fade-in duration-300">
                <p className="text-red-500 text-[10px] sm:text-xs font-black uppercase tracking-wider">{error}</p>
                <a href="https://freighter.app" target="_blank" rel="noopener noreferrer" className="text-orange-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider hover:underline">
                  Download Freighter Wallet
                </a>
              </div>
            )}

            <button onClick={onSkip} className="text-stone-600 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest hover:text-stone-400 transition-colors mt-2">
              Continue as Guest
            </button>
          </div>

          <div className="border-t border-stone-800/40 pt-4 sm:pt-6">
            <div className="flex items-center justify-center gap-2 text-stone-600">
              <div className="w-2 h-2 bg-orange-500/40 rounded-full animate-pulse"></div>
              <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest">Secure_Soroban_Connection</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AccountSetupScreen: React.FC<{ address: string; onComplete: (name: string, charClass: CharacterClass) => void }> = ({ address, onComplete }) => {
  const [username, setUsername] = useState('');
  const [charClass, setCharClass] = useState<CharacterClass>('STRIKER');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setUsername: setOnChainUsername } = useBlockchainStats();

  const [error, setError] = useState<string | null>(null);

  const handleInitialize = async () => {
    if (username.length < 3 || username.length > 16) return;
    setIsSubmitting(true);
    setError(null);
    try {
      // Fire-and-forget: try to record on-chain but don't block the user
      const timeout = new Promise<void>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000));
      await Promise.race([setOnChainUsername(username), timeout]);
    } catch (e: any) {
      console.warn('[Setup] On-chain registration skipped:', e?.message || e);
      setError('On-chain sync pending — proceeding offline.');
    } finally {
      // Always advance to lobby regardless of chain success
      onComplete(username, charClass);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-[#050505] p-3 sm:p-6 lg:p-10 font-mono relative overflow-hidden">
      <div className="w-full max-w-2xl space-y-8 relative z-10 bg-black/60 p-8 rounded-2xl border border-white/5 backdrop-blur-xl shadow-2xl">
        <div className="text-center space-y-2">
          <h2 className="text-2xl lg:text-3xl font-black font-stencil text-white uppercase italic tracking-widest">INITIALIZE_OPERATOR</h2>
          <p className="text-[10px] lg:text-xs text-stone-500 font-bold uppercase tracking-widest">Sector_Access_Protocol_v1.0</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-orange-500 uppercase tracking-widest px-1">Codename_Selection</label>
            <input 
              value={username}
              onChange={e => setUsername(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
              placeholder="ENTER_CODENAME"
              maxLength={16}
              className="w-full bg-black/80 border border-stone-800 p-4 text-xl font-black text-white rounded outline-none focus:border-orange-500 transition-all placeholder:text-stone-800"
            />
            <div className="text-[8px] text-stone-600 font-bold uppercase flex justify-between px-1">
              <span>3-16 Characters // Alphanumeric</span>
              <span>{username.length}/16</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-orange-500 uppercase tracking-widest px-1">Unit_Specialization</label>
            <div className="grid grid-cols-3 gap-3">
              {(['STRIKER', 'GHOST', 'TITAN'] as CharacterClass[]).map(c => (
                <button 
                  key={c}
                  onClick={() => setCharClass(c)}
                  className={`py-3 border rounded-lg transition-all flex flex-col items-center gap-1 ${charClass === c ? 'bg-orange-600 border-orange-400 text-white' : 'bg-stone-900/50 border-stone-800 text-stone-600'}`}
                >
                  <span className="text-lg">{c === 'STRIKER' ? '⚔️' : c === 'GHOST' ? '🕶️' : '🛡️'}</span>
                  <span className="text-[8px] font-black">{c}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <button 
          disabled={username.length < 3 || isSubmitting}
          onClick={handleInitialize}
          className="w-full py-5 bg-white disabled:bg-stone-900 disabled:text-stone-700 text-stone-950 font-black text-base uppercase tracking-widest rounded-xl transition-all hover:bg-orange-600 hover:text-white active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.1)] flex items-center justify-center gap-4"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-stone-800 border-t-white rounded-full animate-spin"></div>
              <span>CONFIGURING_UPLINK...</span>
            </>
          ) : 'INITIALIZE_COMMAND_LINK'}
        </button>

        {error && (
          <p className="text-orange-400 text-[9px] font-bold uppercase tracking-wider text-center animate-in fade-in duration-300">{error}</p>
        )}

        <div className="pt-4 border-t border-white/5 text-center">
          <p className="text-[8px] text-stone-600 font-bold uppercase italic">
            "Your identity will be permanently recorded on the Stellar Ledger."
          </p>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {

  return (
      <QueryClientProvider client={queryClient}>
          <AppContent />
      </QueryClientProvider>
  );
};

import { useBlockchainStats } from './utils/blockchain';

const AppContent: React.FC = () => {
  const [view, setView] = useState<AppState>('boot');
  const [address, setAddress] = useState<string | null>(null);
  const { getStats } = useBlockchainStats();


  // Use Basename/ENS equivalent or generate random operator ID
  const [fallbackId] = useState('OPERATOR_' + Math.floor(Math.random() * 9999));

  const bgMusicRef = useRef<HTMLAudioElement | null>(null);

  // Settings State
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [difficultyModifier, setDifficultyModifier] = useState(1);
  const [virtualControlsEnabled, setVirtualControlsEnabled] = useState(false);
  const [playerName, setPlayerName] = useState(fallbackId);
  
  // Set player name if we get an address
  useEffect(() => {
    if (address) {
        setPlayerName(`XLM_${address.slice(0,4)}...${address.slice(-4)}`);
    }
  }, [address]);

  const [characterClass, setCharacterClass] = useState<CharacterClass>('STRIKER');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>('mission');
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [activeLevelId, setActiveLevelId] = useState(1);
  const [squad, setSquad] = useState<{ name: string, team: 'alpha' | 'bravo' }[]>([]);
  const [mpConfig, setMpConfig] = useState<MPConfig | null>(null);

  // Handle Background Music
  useEffect(() => {
    if (!bgMusicRef.current) {
      bgMusicRef.current = new Audio('/assets/audio/bg-music.wav');
      bgMusicRef.current.loop = true;
      bgMusicRef.current.volume = 0.05; // Lowered from 0.15
    }

    const isPlaying = view === 'playing';

    if (audioEnabled && view !== 'boot' && !isPlaying) {
      bgMusicRef.current.play().catch(err => {
        console.warn('[Audio] Autoplay blocked or failed:', err);
      });
    } else {
      bgMusicRef.current.pause();
    }

    return () => {
      if (view === 'boot') bgMusicRef.current?.pause();
    };
  }, [audioEnabled, view]);

  // Global Interaction Handler to resume audio context
  useEffect(() => {
    const resumeAudio = () => {
      if (bgMusicRef.current && audioEnabled && view !== 'boot') {
        bgMusicRef.current.play().catch(() => { });
        window.removeEventListener('click', resumeAudio);
        window.removeEventListener('touchstart', resumeAudio);
      }
    };
    window.addEventListener('click', resumeAudio);
    window.addEventListener('touchstart', resumeAudio);
    return () => {
      window.removeEventListener('click', resumeAudio);
      window.removeEventListener('touchstart', resumeAudio);
    };
  }, [audioEnabled, view]);


  const startCombat = (room: string | null, host: boolean, mode: GameMode, levelId?: number, squadMembers?: { name: string, team: 'alpha' | 'bravo' }[], mpSettings?: MPConfig) => {
    setRoomId(room);
    setIsHost(host);
    setGameMode(mode);
    if (squadMembers) setSquad(squadMembers);
    if (levelId) setActiveLevelId(levelId || 1);
    if (mpSettings) setMpConfig(mpSettings);
    setView('playing');
  };

  const onMissionComplete = () => {
    if (activeLevelId === unlockedLevel) {
      setUnlockedLevel(prev => Math.min(prev + 1, MISSIONS.length));
    }
  };

  const nextLevel = () => {
    const nextId = activeLevelId + 1;
    if (nextId <= MISSIONS.length) {
      setActiveLevelId(nextId);
      setView('lobby');
      setTimeout(() => setView('playing'), 50);
    } else {
      setView('lobby');
    }
  };

  return (
    <div className={`min-h-screen bg-[#050505] text-stone-100 font-mono selection:bg-orange-500/30 overflow-hidden flex flex-col relative`}>
      <VibeAssistant />
      {/* WalletConnect Farcaster component removed */}

      <main className="relative flex-1 flex flex-col">
        {view === 'boot' && (
          <BootSequence
            onComplete={async () => {
                const existingPubKey = await checkConnection();
                if (existingPubKey) {
                    setAddress(existingPubKey);
                    const stats = await getStats(existingPubKey);
                    if (stats && stats.username && stats.username !== 'OPERATOR') {
                        setPlayerName(stats.username);
                        setView('lobby');
                    } else {
                        setView('onboarding');
                    }
                } else {
                    setView('wallet-auth');
                }
            }}
          />
        )}
        {view === 'wallet-auth' && <WalletAuthScreen onComplete={async (addr) => {
            setAddress(addr);
            const stats = await getStats(addr);
            if (stats && stats.username && stats.username !== 'OPERATOR') {
                setPlayerName(stats.username);
                setView('lobby');
            } else {
                setView('onboarding');
            }
        }} onSkip={() => setView('lobby')} />}

        {view === 'onboarding' && address && (
          <AccountSetupScreen 
            address={address} 
            onComplete={(name, cls) => {
              setPlayerName(name);
              setCharacterClass(cls);
              setView('lobby');
            }} 
          />
        )}


        {view === 'lobby' && (
          <Lobby
            playerName={playerName}
            setPlayerName={setPlayerName}
            activeAddress={address || undefined}
            characterClass={characterClass}
            setCharacterClass={setCharacterClass}
            avatar={avatar}
            unlockedLevel={unlockedLevel}
            missions={MISSIONS}
            onStart={startCombat}
            onLabs={() => setView('labs')}
            isVerified={!!address}
            settings={{
              audioEnabled,
              setAudioEnabled,
              difficultyModifier,
              setDifficultyModifier,
              virtualControlsEnabled,
              setVirtualControlsEnabled
            }}
          />
        )}

        {view === 'playing' && (
          <GameContainer
            playerName={playerName}
            characterClass={characterClass}
            avatar={avatar}
            roomId={roomId}
            isHost={isHost}
            gameMode={gameMode}
            mission={gameMode === 'mission' ? MISSIONS.find(m => m.id === activeLevelId) : undefined}
            mpConfig={mpConfig || undefined}
            squad={squad}
            activeAddress={address || undefined}
            audioEnabled={audioEnabled}
            difficultyModifier={difficultyModifier}
            virtualControlsEnabled={virtualControlsEnabled}
            onExit={() => setView('lobby')}
            onMissionComplete={onMissionComplete}
            onNextLevel={nextLevel}
          />
        )}

        {view === 'labs' && (
          <CreativeSuite
            onBack={() => setView('lobby')}
            setAvatar={setAvatar}
          />
        )}
      </main>
    </div>
  );
};

export default App;
