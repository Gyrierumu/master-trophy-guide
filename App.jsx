import React, { useState, useEffect, useCallback, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, doc, setDoc, onSnapshot, updateDoc, 
  collection, query, where, getDoc, deleteDoc 
} from 'firebase/firestore';
import { 
  getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken 
} from 'firebase/auth';
import { 
  Trophy, Timer, User, Play, RefreshCw, Zap, 
  CheckCircle2, XCircle, Users, Copy, LogIn, Plus
} from 'lucide-react';

// --- Configuração Firebase ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'math-clash-online';

const App = () => {
  const [user, setUser] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [roomData, setRoomData] = useState(null);
  const [gameState, setGameState] = useState('lobby'); // 'lobby', 'playing', 'results'
  const [currentProblem, setCurrentProblem] = useState({ question: '', answer: 0 });
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [timer, setTimer] = useState(0);
  const [isHost, setIsHost] = useState(false);

  // --- Autenticação ---
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  // --- Lógica da Sala ---
  useEffect(() => {
    if (!user || !roomCode) return;

    const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomCode);
    const unsubscribe = onSnapshot(roomRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setRoomData(data);
        
        // Sincronizar estado global
        if (data.status === 'playing') setGameState('playing');
        if (data.status === 'results') setGameState('results');
        if (data.status === 'lobby') setGameState('lobby');
        
        // Sincronizar Timer
        setTimer(data.timeLeft || 0);
      } else if (isHost) {
        // Se a sala sumir e eu for o host, algo correu mal
      }
    }, (err) => console.error("Erro na sala:", err));

    return () => unsubscribe();
  }, [user, roomCode, isHost]);

  // --- Lógica do Cronómetro (Apenas Host controla) ---
  useEffect(() => {
    let interval;
    if (isHost && roomData?.status === 'playing' && roomData?.timeLeft > 0) {
      interval = setInterval(async () => {
        const newTime = roomData.timeLeft - 1;
        const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomCode);
        await updateDoc(roomRef, { 
          timeLeft: newTime,
          status: newTime <= 0 ? 'results' : 'playing'
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isHost, roomData, roomCode]);

  // --- Funções de Acção ---
  const createRoom = async () => {
    if (!user) return;
    const newCode = Math.random().toString(36).substring(2, 7).toUpperCase();
    const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', newCode);
    
    const initialData = {
      code: newCode,
      hostId: user.uid,
      players: {
        [user.uid]: { name: "Jogador 1", score: 0, photo: null }
      },
      status: 'lobby',
      timeLeft: 60,
      difficulty: 'normal',
      lastProblem: generateMathProblem('normal')
    };

    await setDoc(roomRef, initialData);
    setRoomCode(newCode);
    setIsHost(true);
    setCurrentProblem(initialData.lastProblem);
  };

  const joinRoom = async (codeToJoin) => {
    if (!user || !codeToJoin) return;
    const cleanCode = codeToJoin.toUpperCase();
    const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', cleanCode);
    const snap = await getDoc(roomRef);

    if (snap.exists()) {
      const data = snap.data();
      await updateDoc(roomRef, {
        [`players.${user.uid}`]: { name: "Jogador 2", score: 0 }
      });
      setRoomCode(cleanCode);
      setIsHost(false);
      setCurrentProblem(data.lastProblem);
    } else {
      alert("Sala não encontrada!");
    }
  };

  function generateMathProblem(difficulty) {
    const max = difficulty === 'hard' ? 50 : (difficulty === 'normal' ? 20 : 10);
    const ops = ['+', '-', '*'];
    const op = ops[Math.floor(Math.random() * (difficulty === 'easy' ? 2 : 3))];
    let n1 = Math.floor(Math.random() * max) + 1;
    let n2 = Math.floor(Math.random() * max) + 1;
    if (op === '-') if (n1 < n2) [n1, n2] = [n2, n1];
    if (op === '*') { n1 = Math.min(n1, 12); n2 = Math.min(n2, 10); }
    
    return {
      question: `${n1} ${op === '*' ? '×' : op} ${n2}`,
      answer: op === '+' ? n1 + n2 : op === '-' ? n1 - n2 : n1 * n2
    };
  }

  const startMatch = async () => {
    if (!isHost) return;
    const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomCode);
    const firstProblem = generateMathProblem(roomData.difficulty);
    
    // Resetar scores e iniciar
    const resetPlayers = { ...roomData.players };
    Object.keys(resetPlayers).forEach(id => resetPlayers[id].score = 0);

    await updateDoc(roomRef, {
      status: 'playing',
      timeLeft: 60,
      players: resetPlayers,
      lastProblem: firstProblem
    });
  };

  const submitAnswer = async (e) => {
    e.preventDefault();
    const val = parseInt(userInput);
    if (val === roomData.lastProblem.answer) {
      setFeedback('correct');
      const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomCode);
      
      // Atualizar pontuação e gerar próximo problema (quem acertar primeiro muda o problema para ambos)
      const nextProb = generateMathProblem(roomData.difficulty);
      await updateDoc(roomRef, {
        [`players.${user.uid}.score`]: (roomData.players[user.uid]?.score || 0) + 1,
        lastProblem: nextProb
      });

      setTimeout(() => {
        setFeedback(null);
        setUserInput('');
      }, 200);
    } else {
      setFeedback('wrong');
      setTimeout(() => setFeedback(null), 500);
      setUserInput('');
    }
  };

  // Sincronizar o problema local com o da sala
  useEffect(() => {
    if (roomData?.lastProblem) {
      setCurrentProblem(roomData.lastProblem);
      setUserInput('');
    }
  }, [roomData?.lastProblem]);

  if (!user) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">A carregar duelo...</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans p-4 flex flex-col items-center justify-center">
      <div className="max-w-md w-full bg-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-slate-700">
        
        {/* HEADER */}
        <div className="bg-indigo-600 p-6 text-center">
          <h1 className="text-3xl font-black italic flex items-center justify-center gap-2">
            <Zap className="fill-yellow-400 text-yellow-400" /> MATH CLASH ONLINE
          </h1>
          {roomCode && (
            <div className="mt-2 inline-flex items-center gap-2 bg-indigo-800/50 px-3 py-1 rounded-full text-xs font-mono">
              SALA: {roomCode}
              <button onClick={() => {
                const el = document.createElement('textarea');
                el.value = roomCode;
                document.body.appendChild(el);
                el.select();
                document.execCommand('copy');
                document.body.removeChild(el);
              }} className="hover:text-yellow-400"><Copy size={12}/></button>
            </div>
          )}
        </div>

        <div className="p-8">
          {/* LOBBY / ENTRADA */}
          {gameState === 'lobby' && !roomCode && (
            <div className="space-y-6 animate-in fade-in zoom-in">
              <div className="grid grid-cols-2 gap-4">
                <button onClick={createRoom} className="flex flex-col items-center gap-3 p-6 bg-slate-700 rounded-2xl border-2 border-transparent hover:border-indigo-500 transition-all">
                  <Plus size={32} className="text-indigo-400" />
                  <span className="font-bold text-sm">Criar Sala</span>
                </button>
                <div className="flex flex-col items-center gap-3 p-6 bg-slate-700 rounded-2xl">
                  <LogIn size={32} className="text-emerald-400" />
                  <input 
                    className="w-full bg-slate-800 border-b border-slate-500 text-center text-xs p-1 outline-none focus:border-emerald-400 uppercase"
                    placeholder="CÓDIGO"
                    value={roomCode}
                    onChange={(e) => joinRoom(e.target.value)}
                  />
                  <span className="font-bold text-xs">Entrar</span>
                </div>
              </div>
              <div className="text-center text-slate-500 text-xs">Partilha o código com o teu amigo para jogarem simultaneamente.</div>
            </div>
          )}

          {/* ESPERA NO LOBBY */}
          {gameState === 'lobby' && roomCode && (
            <div className="space-y-6 text-center">
              <div className="flex justify-center gap-4">
                {Object.entries(roomData?.players || {}).map(([id, p], idx) => (
                  <div key={id} className="flex flex-col items-center animate-bounce" style={{ animationDelay: `${idx * 0.2}s` }}>
                    <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center mb-2 shadow-lg">
                      <User size={24} />
                    </div>
                    <span className="text-xs font-bold">{p.name}</span>
                  </div>
                ))}
                {Object.keys(roomData?.players || {}).length < 2 && (
                  <div className="flex flex-col items-center opacity-50">
                    <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center mb-2 border-2 border-dashed border-slate-500">
                      <Users size={20} />
                    </div>
                    <span className="text-xs">Aguardando...</span>
                  </div>
                )}
              </div>

              {isHost && Object.keys(roomData?.players || {}).length >= 2 && (
                <button onClick={startMatch} className="w-full bg-emerald-500 hover:bg-emerald-400 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all">
                  <Play size={20} fill="currentColor" /> INICIAR DUELO
                </button>
              )}
              {!isHost && <p className="text-indigo-400 animate-pulse text-sm">O Host vai iniciar a partida em breve...</p>}
            </div>
          )}

          {/* JOGO EM CURSO */}
          {gameState === 'playing' && roomData && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <div className={`text-2xl font-black ${timer < 10 ? 'text-red-500 animate-pulse' : 'text-yellow-400'}`}>
                  {timer}s
                </div>
                <div className="flex gap-4">
                  {Object.entries(roomData.players).map(([id, p]) => (
                    <div key={id} className={`text-right ${id === user.uid ? 'text-indigo-400' : 'text-slate-400'}`}>
                      <div className="text-[10px] font-bold uppercase">{id === user.uid ? 'TU' : 'RIVAL'}</div>
                      <div className="text-xl font-black">{p.score}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Barra de Progresso Comparativa */}
              <div className="h-2 w-full bg-slate-700 rounded-full flex overflow-hidden">
                {Object.entries(roomData.players).map(([id, p]) => (
                  <div 
                    key={id} 
                    className={`transition-all duration-500 ${id === user.uid ? 'bg-indigo-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.max(5, (p.score / (roomData.players[user.uid].score + 1 + (Object.values(roomData.players).find(pl => pl !== p)?.score || 0))) * 100)}%` }}
                  />
                ))}
              </div>

              <div className="text-center py-6">
                <div className="text-5xl font-black mb-2">{roomData.lastProblem.question}</div>
                <div className="text-slate-500 text-sm italic">Resolve rápido!</div>
              </div>

              <form onSubmit={submitAnswer} className="relative">
                <input
                  autoFocus
                  type="number"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  className={`w-full bg-slate-900 border-2 rounded-2xl py-5 px-6 text-center text-3xl font-bold outline-none transition-all ${
                    feedback === 'correct' ? 'border-green-500 bg-green-500/10' : 
                    feedback === 'wrong' ? 'border-red-500 bg-red-500/10' : 'border-slate-600 focus:border-indigo-500'
                  }`}
                  placeholder="?"
                />
              </form>
            </div>
          )}

          {/* RESULTADOS */}
          {gameState === 'results' && roomData && (
            <div className="space-y-6 text-center animate-in zoom-in">
              <Trophy size={64} className="mx-auto text-yellow-400" />
              <h2 className="text-3xl font-black italic">FIM DE JOGO!</h2>
              
              <div className="space-y-3">
                {Object.entries(roomData.players)
                  .sort((a, b) => b[1].score - a[1].score)
                  .map(([id, p], idx) => (
                    <div key={id} className={`flex items-center justify-between p-4 rounded-2xl border-2 ${idx === 0 ? 'bg-indigo-500/20 border-indigo-500' : 'bg-slate-700/50 border-slate-600'}`}>
                      <div className="flex items-center gap-3 text-left">
                        <span className="font-black text-2xl">{idx + 1}º</span>
                        <span className="font-bold">{id === user.uid ? 'TU (Jogador)' : 'RIVAL'}</span>
                      </div>
                      <span className="text-2xl font-black">{p.score} pts</span>
                    </div>
                  ))}
              </div>

              {isHost ? (
                <button onClick={startMatch} className="w-full bg-white text-slate-900 py-4 rounded-2xl font-bold hover:bg-slate-200 flex items-center justify-center gap-2">
                  <RefreshCw size={20} /> REVANCHE
                </button>
              ) : (
                <p className="text-slate-400 text-sm italic">Aguarda que o Host inicie a revanche...</p>
              )}
              
              <button onClick={() => window.location.reload()} className="text-slate-500 text-xs hover:underline uppercase tracking-widest">Sair da Sala</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;