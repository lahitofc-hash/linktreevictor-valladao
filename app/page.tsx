"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Papa from "papaparse";
import * as Icons from "lucide-react";

const URL_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSd9_3ncvWYiIQ95h5iT_nDFRHyvWciHcat4rg1H-9KaEUmPzhdVhQ2tEhKHEnFZDadlfWeMbFyO09_/pub?output=csv";

// ============================================================
// TIPOS
// ============================================================
interface Track {
  id: string;
  title: string;
  artist: string;
  genre: string;
  audioUrl: string;
  image: string;
}

interface Countdown {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  presaveLink: string;
  buttonText: string;
  active: boolean;
  image?: string;
   imageOpacity?: string; // ← NOVO
  backgroundColor?: string;
    videoUrl?: string; // ← NOVO

}

// ============================================================
// COMPONENTE DE COUNTDOWN INDIVIDUAL (CORRIGIDO - SEM LOOP)
// ============================================================
const CountdownCard = ({ 
  countdown, 
  themeColor, 
  highlightColor 
}: { 
  countdown: Countdown; 
  themeColor: string; 
  highlightColor: string;
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isExpired, setIsExpired] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const targetDateRef = useRef(new Date(countdown.targetDate));

    const toggleVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (isVideoPlaying) {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    } else {
      videoRef.current.play();
      setIsVideoPlaying(true);
    }
  };

  useEffect(() => {
    const targetDate = targetDateRef.current;
    
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance < 0) {
        setIsExpired(true);
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      };
    };

    // Verifica se já expirou na montagem
    const now = new Date().getTime();
    if (targetDate.getTime() - now < 0) {
      setIsExpired(true);
      setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      return;
    }

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft(newTimeLeft);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleButtonClick = () => {
    if (countdown.presaveLink) {
      window.open(countdown.presaveLink, "_blank");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="relative group"
    >
      <div 
        className="relative p-5 rounded-2xl transition-all duration-500 overflow-hidden"
        style={{
          background: countdown.backgroundColor 
            ? `linear-gradient(135deg, ${countdown.backgroundColor}20, ${themeColor}10)`
            : `linear-gradient(135deg, ${themeColor}10, ${highlightColor}05)`,
          backdropFilter: "blur(20px)",
          borderColor: isHovered ? `${themeColor}40` : `${themeColor}20`,
          borderWidth: "1px",
          borderStyle: "solid",
          boxShadow: isHovered 
            ? `0 20px 40px -12px ${themeColor}30, 0 0 0 1px ${themeColor}30 inset`
            : `0 10px 20px -10px rgba(0,0,0,0.3)`,
        }}
      >

        <div 
          className="absolute top-0 left-4 right-4 h-0.5 rounded-full transition-all duration-500"
          style={{ 
            backgroundColor: themeColor,
            opacity: isHovered ? 1 : 0.3
          }}
        />

{/* VÍDEO (opcional) */}
{countdown.videoUrl && (
  <div className="relative w-full rounded-xl overflow-hidden mb-4 group/video">
    <video 
      ref={videoRef}
      className="w-full rounded-xl"
      playsInline
      muted
      loop
      autoPlay
      preload="metadata"
      style={{ maxHeight: "200px", objectFit: "cover" }}
      onPlay={() => setIsVideoPlaying(true)}
      onPause={() => setIsVideoPlaying(false)}
    >
      <source src={countdown.videoUrl} type="video/mp4" />
    </video>
    
    {/* Overlay gradiente */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-xl pointer-events-none" />
    
    {/* Botões: Play/Pause + Mute */}
    <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover/video:opacity-100 transition-opacity duration-300">
      {/* Botão Mute/Unmute */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={(e) => {
          e.stopPropagation();
          if (!videoRef.current) return;
          videoRef.current.muted = !videoRef.current.muted;
        }}
        className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
      >
        <Icons.VolumeX size={14} className="text-white" />
      </motion.button>
    </div>

    {/* Botão Play/Pause central */}
    <div 
      className="absolute inset-0 flex items-center justify-center cursor-pointer opacity-0 group-hover/video:opacity-100 transition-opacity duration-300"
      onClick={toggleVideo}
    >
<motion.div 
  className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30"
  whileHover={{ scale: 1.1 }}
  whileTap={{ scale: 0.9 }}
>
  {isVideoPlaying ? (
    <Icons.Pause size={22} className="text-white" />
  ) : (
    <Icons.Play size={22} className="text-white ml-1" />
  )}
</motion.div>
    </div>
  </div>
)}

{/* IMAGEM (opcional) */}
{countdown.image && (
  <div 
    className="absolute top-3 right-3 transition-all duration-500 group-hover:scale-110"
    style={{ zIndex: 5 }}
  >
    <div 
      className="w-20 h-20 rounded-xl overflow-hidden border-2 shadow-xl transition-all duration-500"
      style={{ 
        borderColor: `${themeColor}40`, 
        boxShadow: `0 8px 25px -5px ${themeColor}30`,
        opacity: `${(parseInt(countdown.imageOpacity || "40")) / 100}`
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = "1";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = `${(parseInt(countdown.imageOpacity || "40")) / 100}`;
      }}
    >
      <img 
        src={countdown.image} 
        alt="" 
        className="w-full h-full object-cover" 
      />
    </div>
  </div>
)}

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
  style={{ backgroundColor: `${themeColor}30` }}>
  <Icons.Clock size={16} style={{ color: themeColor }} />
</div>
            <h3 className="text-lg font-bold text-white">{countdown.title}</h3>
          </div>

          {countdown.description && (
            <p className="text-white/60 text-sm mb-4 leading-relaxed">
              {countdown.description}
            </p>
          )}

          {!isExpired ? (
            <>
              <div className="flex gap-2 justify-center mb-4">
                <div className="text-center">
                  <div className="backdrop-blur-sm rounded-lg px-3 py-2 min-w-[65px]"
  style={{ backgroundColor: `${themeColor}15` }}>
                    <span className="text-2xl font-bold" style={{ color: themeColor }}>{String(timeLeft.days).padStart(2, '0')}</span>
                  </div>
                  <p className="text-[10px] text-white/50 mt-1 uppercase tracking-wider">Dias</p>
                </div>
                <div className="text-center">
                  <div className="backdrop-blur-sm rounded-lg px-3 py-2 min-w-[65px]"
  style={{ backgroundColor: `${themeColor}15` }}>
                    <span className="text-2xl font-bold" style={{ color: themeColor }}>{String(timeLeft.hours).padStart(2, '0')}</span>
                  </div>
                  <p className="text-[10px] text-white/50 mt-1 uppercase tracking-wider">Horas</p>
                </div>
                <div className="text-center">
                  <div className="backdrop-blur-sm rounded-lg px-3 py-2 min-w-[65px]"
  style={{ backgroundColor: `${themeColor}15` }}>
                    <span className="text-2xl font-bold" style={{ color: themeColor }}>{String(timeLeft.minutes).padStart(2, '0')}</span>
                  </div>
                  <p className="text-[10px] text-white/50 mt-1 uppercase tracking-wider">Min</p>
                </div>
                <div className="text-center">
                  <div className="backdrop-blur-sm rounded-lg px-3 py-2 min-w-[65px]"
  style={{ backgroundColor: `${themeColor}15` }}>
                    <span className="text-2xl font-bold" style={{ color: themeColor }}>{String(timeLeft.seconds).padStart(2, '0')}</span>
                  </div>
                  <p className="text-[10px] text-white/50 mt-1 uppercase tracking-wider">Seg</p>
                </div>
              </div>
              
              {/* BOTÃO PRÉ-SAVE APARECE SEMPRE (se tiver link) */}
              {countdown.presaveLink && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleButtonClick}
className="w-full py-3 rounded-xl text-white font-medium text-sm hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
style={{ 
  background: `linear-gradient(to right, ${themeColor}, ${highlightColor})`,
  boxShadow: `0 4px 15px -3px ${themeColor}40`
}}                >
                  <Icons.Headphones size={16} />
                  {countdown.buttonText || "PRÉ-SAVE JÁ"}
                </motion.button>
              )}
            </>
          ) : (
            countdown.presaveLink && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleButtonClick}
className="w-full py-3 rounded-xl text-white font-medium text-sm hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
style={{ 
  background: `linear-gradient(to right, ${highlightColor}, ${themeColor})`,
  boxShadow: `0 4px 15px -3px ${highlightColor}40`
}}              >
                <Icons.Headphones size={16} />
                {countdown.buttonText || "OUÇA AGORA"}
              </motion.button>
            )
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================
// MUSIC PLAYER
// ============================================================
const MusicPlayer = ({ track, onClose, onNext, onPrev, isPlaying, onTogglePlay, currentTime, duration, onSeek }: any) => {
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSeek = (e: React.MouseEvent) => {
    if (!progressBarRef.current || !duration) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const percent = Math.min(Math.max(0, (e.clientX - rect.left) / rect.width), 1);
    onSeek(percent * duration);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleSeek(e);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  if (!track) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-t border-cyan-500/20 shadow-[0_-20px_40px_-20px_rgba(0,0,0,0.8)]"
    >
      <div className="max-w-md mx-auto p-4">
        <div className="flex items-center gap-4">
          {track.image ? (
            <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 shadow-lg">
              <img src={track.image} alt={track.title} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center flex-shrink-0 shadow-lg">
              <Icons.Music size={24} className="text-white" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white/40 text-[10px] uppercase tracking-wider font-mono">Tocando agora</p>
            <p className="text-white font-medium truncate text-sm">{track.title}</p>
            <p className="text-white/40 text-xs truncate">{track.artist}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onPrev} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all">
              <Icons.SkipBack size={16} className="text-white/80" />
            </button>
            <button onClick={onTogglePlay} className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 flex items-center justify-center hover:scale-105 transition-all shadow-[0_0_15px_rgba(0,240,255,0.4)]">
              {isPlaying ? <Icons.Pause size={18} className="text-slate-950" /> : <Icons.Play size={18} className="text-slate-950 ml-0.5" />}
            </button>
            <button onClick={onNext} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all">
              <Icons.SkipForward size={16} className="text-white/80" />
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center ml-1 transition-all">
              <Icons.X size={16} className="text-red-400" />
            </button>
          </div>
        </div>
        <div className="mt-3">
          <div className="flex justify-between text-[10px] text-white/40 mb-1 font-mono">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <div
            ref={progressBarRef}
            className="w-full h-1.5 bg-white/10 rounded-full cursor-pointer group"
            onMouseDown={(e) => { setIsDragging(true); handleSeek(e); }}
            onMouseMove={handleMouseMove}
            onMouseUp={() => setIsDragging(false)}
          >
            <div className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full relative" style={{ width: `${(currentTime / duration) * 100 || 0}%` }}>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-cyan-400 rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-[0_0_10px_#00F0FF]" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================
// CATÁLOGO MODAL
// ============================================================
const CatalogModal = ({ isOpen, onClose, tracks, onPlayTrack, currentTrackId, isPlaying }: {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
  onPlayTrack: (index: number) => void;
  currentTrackId: string;
  isPlaying: boolean;
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("TODOS");

  const filters = useMemo(() => {
    const genres = new Set(tracks.map(t => t.genre).filter(Boolean));
    return ["TODOS", ...Array.from(genres)];
  }, [tracks]);

  const filteredTracks = useMemo(() => {
    return tracks.filter((track) => {
      if (activeFilter !== "TODOS" && track.genre !== activeFilter) return false;
      if (searchTerm.trim() !== "") {
        const term = searchTerm.toLowerCase();
        return track.title.toLowerCase().includes(term) ||
          track.artist.toLowerCase().includes(term) ||
          track.genre.toLowerCase().includes(term);
      }
      return true;
    });
  }, [tracks, activeFilter, searchTerm]);

// Botão "Voltar" do navegador
useEffect(() => {
  if (!isOpen) return;
  
  window.history.pushState({ modalOpen: true }, "");
  
  const handlePopState = () => {
    onClose();
  };
  
  window.addEventListener("popstate", handlePopState);
  return () => window.removeEventListener("popstate", handlePopState);
}, [isOpen, onClose]);



  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 bg-slate-950/95 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <div className="min-h-screen p-6 pb-32">
        <div className="max-w-4xl mx-auto" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-light tracking-wide text-white">Catálogo de Composições</h2>
              <p className="text-white/40 text-sm mt-1">Explore as faixas disponíveis</p>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all">
              <Icons.X size={20} className="text-white/60" />
            </button>
          </div>

          <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
            <div className="relative flex-1 max-w-md">
              <Icons.Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Pesquisar música, artista, gênero..."
                className="w-full bg-white/5 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:border-cyan-500/50 outline-none transition-all"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all whitespace-nowrap ${
                    activeFilter === filter 
                      ? "bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-lg" 
                      : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80"
                  }`}
                >
                  {filter === "TODOS" ? "TODOS" : filter.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {filteredTracks.length === 0 ? (
            <div className="text-center py-16">
              <Icons.Search size={48} className="text-white/20 mx-auto mb-4" />
              <p className="text-white/40">Nenhuma faixa encontrada</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTracks.map((track, idx) => {
                const isCurrent = currentTrackId === track.id;
                const originalIndex = tracks.findIndex(t => t.id === track.id);
                
                return (
                  <motion.div
                    key={track.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`bg-white/5 backdrop-blur-sm rounded-xl border overflow-hidden transition-all group cursor-pointer ${
                      isCurrent && isPlaying
                        ? "border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)]" 
                        : "border-white/10 hover:border-cyan-500/30 hover:bg-white/10"
                    }`}
                    onClick={() => onPlayTrack(originalIndex)}
                  >
                    <div className="flex">
                      {track.image ? (
                        <div className="w-20 h-20 flex-shrink-0 relative">
                          <img src={track.image} alt={track.title} className="w-full h-full object-cover" />
                          {isCurrent && isPlaying && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <div className="flex gap-1">
                                {[...Array(3)].map((_, i) => (
                                  <motion.div
                                    key={i}
                                    animate={{ height: [4, 16, 4] }}
                                    transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                                    className="w-1 bg-emerald-400 rounded-full"
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-20 h-20 flex-shrink-0 bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 flex items-center justify-center">
                          <Icons.Music size={24} className="text-white/40" />
                        </div>
                      )}
                      <div className="flex-1 p-4">
                        <h3 className="text-sm font-medium text-white line-clamp-1">{track.title}</h3>
                        <p className="text-white/40 text-xs mt-1">{track.artist}</p>
                        {track.genre && (
                          <span className="inline-block mt-2 px-2 py-0.5 bg-white/5 rounded text-[9px] text-white/40 font-mono">
                            {track.genre.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center pr-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                          isCurrent && isPlaying 
                            ? "bg-emerald-500/20 text-emerald-400" 
                            : "bg-white/5 text-white/40 group-hover:bg-cyan-500/20 group-hover:text-cyan-400"
                        }`}>
                          {isCurrent && isPlaying ? (
                            <Icons.Pause size={14} />
                          ) : (
                            <Icons.Play size={14} />
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================
// BACKGROUND - COM IMAGEM, GRADIENTE, ONDAS OU PARTÍCULAS
// ============================================================
const BackgroundEffect = ({ tipo, bgImage, themeColor, highlightColor }: { 
  // EFEITO: IMAGEM DE FUNDO (prioridade máxima)
    tipo: string; 
  bgImage?: string;
  themeColor: string;
  highlightColor: string;
}) => {
  if (bgImage && bgImage.trim() !== "") {
    return (
      <div className="fixed inset-0 -z-10">
        <img 
          src={bgImage} 
          alt="Background" 
          className="w-full h-full object-cover"
        />
        {/* Overlay escuro para contraste e legibilidade */}
        <div className="absolute inset-0 bg-black/60" />
      </div>
    );
  }

  // EFEITO: GRADIENTE
  if (tipo === "gradiente") {
    return (
      <div className="fixed inset-0 -z-10 bg-slate-950">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/60 via-purple-900/40 to-slate-950" />
        <div className="absolute top-0 left-0 right-0 h-[50%] bg-gradient-to-b from-cyan-500/30 via-cyan-500/10 to-transparent" />
        <motion.div 
          className="absolute top-10 right-10 w-96 h-96 bg-cyan-400/30 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-10 left-10 w-64 h-64 bg-purple-500/25 rounded-full blur-3xl"
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        <div className="absolute inset-0 bg-black/30" />
      </div>
    );
  }

  // EFEITO: ONDAS
  if (tipo === "ondas") {
    return <DynamicTerrainCanvas />;
  }

  // EFEITO: PARTÍCULAS
if (tipo === "particulas") {
  return <ParticlesBackground />;
}

 // EFEITO: ARTISTA (palco com holofotes)
if (tipo === "artista") {
  return <ArtistBackground themeColor={themeColor} highlightColor={highlightColor} />;
}

// EFEITO: CÉU ESTRELADO
if (tipo === "estrelado") {
  return <StarGalaxyBackgroundOptimized themeColor={themeColor} highlightColor={highlightColor} />;
}

  // EFEITO: PADRÃO
  return (
    <div className="fixed inset-0 -z-10 bg-slate-950">
      <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 via-transparent to-emerald-500/5" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
    </div>
  )
};


// ============================================================
// EFEITO DE ONDAS DINÂMICAS (ORIGINAL)
// ============================================================
const DynamicTerrainCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let frame = 0;
    const lines: any[] = [];
    const gap = 35;
    const rows = Math.ceil(height / gap) + 2;
    for (let i = 0; i < rows; i++) {
      lines.push({
        y: i * gap, baseY: i * gap, speed: 0.015 + Math.random() * 0.015,
        amplitude: 12 + Math.random() * 15, offset: Math.random() * Math.PI * 2,
      });
    }
    const animate = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
      ctx.fillRect(0, 0, width, height);
      ctx.lineWidth = 1.2;
      lines.forEach((line, i) => {
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, "rgba(2, 6, 23, 0)");
        gradient.addColorStop(0.5, `rgba(0, 240, 255, ${0.1 + (i / rows) * 0.3})`);
        gradient.addColorStop(1, "rgba(2, 6, 23, 0)");
        ctx.beginPath();
        ctx.strokeStyle = gradient;
        for (let x = 0; x <= width; x += 12) {
          const wave1 = Math.sin(x * 0.003 + frame * line.speed + line.offset) * line.amplitude;
          const wave2 = Math.cos(x * 0.008 - frame * 0.008) * (line.amplitude * 0.4);
          const y = line.baseY + wave1 + wave2;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });
      frame++;
      requestAnimationFrame(animate);
    };
    const rafId = requestAnimationFrame(animate);
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      lines.length = 0;
      const newRows = Math.ceil(height / gap) + 2;
      for (let i = 0; i < newRows; i++) {
        lines.push({
          y: i * gap, baseY: i * gap, speed: 0.015 + Math.random() * 0.015,
          amplitude: 12 + Math.random() * 15, offset: Math.random() * Math.PI * 2,
        });
      }
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(rafId);
    };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-0" />;
};

// ============================================================
// EFEITO DE PARTÍCULAS ORIGINAL
// ============================================================
const ParticlesBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    const particles: { x: number; y: number; radius: number; speedX: number; speedY: number }[] = [];
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5
      });
    }
    const animate = () => {
      ctx.fillStyle = "rgba(2, 6, 23, 0.1)";
      ctx.fillRect(0, 0, width, height);
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 240, 255, ${Math.random() * 0.5})`;
        ctx.fill();
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
      });
      requestAnimationFrame(animate);
    };
    const rafId = requestAnimationFrame(animate);
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(rafId);
    };
  }, []);
  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none z-0" />;
};

// ============================================================
// EFEITO ARTISTA - VERSÃO ORIGINAL (QUE FUNCIONAVA)
// ============================================================
const ArtistBackground = ({ themeColor, highlightColor }: { themeColor: string; highlightColor: string }) => {
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    let rafId: number;
    let targetX = 50, targetY = 50, currentX = 50, currentY = 50;
    const handleMouse = (e: MouseEvent) => {
      targetX = (e.clientX / window.innerWidth) * 100;
      targetY = (e.clientY / window.innerHeight) * 100;
    };
    const animate = () => {
      currentX += (targetX - currentX) * 0.04;
      currentY += (targetY - currentY) * 0.04;
      setMousePos({ x: currentX, y: currentY });
      rafId = requestAnimationFrame(animate);
    };
    window.addEventListener("mousemove", handleMouse);
    animate();
    return () => { window.removeEventListener("mousemove", handleMouse); cancelAnimationFrame(rafId); };
  }, []);

  return (
    <div className="fixed inset-0 -z-10 bg-slate-950 overflow-hidden">
      
      {/* Luz ambiente suave */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-black" />
      
      {/* Holofote principal - segue mouse suavemente */}
      <div 
        className="absolute transition-all duration-300 ease-out"
        style={{
          left: `${mousePos.x}%`,
          top: `${mousePos.y}%`,
          transform: "translate(-50%, -50%)",
          width: "600px",
          height: "600px",
          background: `radial-gradient(circle, ${themeColor}15 0%, ${themeColor}08 30%, transparent 70%)`,
        }}
      />
      

      {/* Luzes fixas suaves nos cantos */}
      <div className="absolute top-0 left-0 w-[40%] h-[40%]"
        style={{ background: `radial-gradient(circle at 30% 30%, ${themeColor}08, transparent 70%)` }} />
      <div className="absolute bottom-0 right-0 w-[40%] h-[40%]"
        style={{ background: `radial-gradient(circle at 70% 70%, ${highlightColor}06, transparent 70%)` }} />
    </div>
  );
};


// ============================================================


// ============================================================
// CÉU ESTRELADO - VERSÃO OTIMIZADA (PERFORMANCE)
// ============================================================
const StarGalaxyBackgroundOptimized = ({ themeColor, highlightColor }: { themeColor: string; highlightColor: string }) => {
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      setMousePos({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight });
    };
    window.addEventListener("mousemove", handleMouse);
    return () => window.removeEventListener("mousemove", handleMouse);
  }, []);

  const bigStars = isMobile ? 20 : 35;
  const midStars = isMobile ? 40 : 70;
  const smallStars = isMobile ? 60 : 100;
  const dustParticles = isMobile ? 15 : 30;
  const shootingStars = isMobile ? 1 : 3;

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950/60 to-purple-950/40">
      
      {/* NEBULOSA 1 - GRANDE E MAIS VISÍVEL */}
      <motion.div
        className="absolute top-0 left-[10%] w-[600px] h-[400px] rounded-full blur-3xl"
        style={{ background: `radial-gradient(ellipse, ${themeColor}25, ${highlightColor}15, transparent 70%)` }}
        animate={{ x: ["0%", "5%", "-5%", "0%"], y: ["0%", "-4%", "4%", "0%"], scale: [1, 1.1, 0.95, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* NEBULOSA 2 - COLORIDA */}
      <motion.div
        className="absolute bottom-[10%] right-[5%] w-[500px] h-[350px] rounded-full blur-3xl"
        style={{ background: `radial-gradient(ellipse, ${highlightColor}20, ${themeColor}10, transparent 75%)` }}
        animate={{ x: ["0%", "-6%", "4%", "0%"], y: ["0%", "5%", "-3%", "0%"], scale: [1, 0.9, 1.05, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      />

      {/* NEBULOSA 3 - PEQUENA E BRILHANTE */}
      <motion.div
        className="absolute top-[40%] left-[50%] w-[300px] h-[200px] rounded-full blur-2xl"
        style={{ background: `radial-gradient(ellipse, ${themeColor}30, transparent 80%)` }}
        animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.2, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      {/* VIA LÁCTEA MELHORADA */}
      <div 
        className="absolute inset-0 opacity-25"
        style={{
          background: `linear-gradient(135deg, transparent 25%, ${themeColor}12 40%, ${highlightColor}18 50%, ${themeColor}12 60%, transparent 75%)`,
          transform: `rotate(${15 + mousePos.x * 8}deg) scale(1.3)`,
          transition: "transform 0.5s ease-out",
        }}
      />

      {/* ESTRELAS GRANDES COM GLOW */}
      {[...Array(bigStars)].map((_, i) => {
        const size = 2 + Math.random() * 3;
        const colors = [themeColor, highlightColor, "#ffffff", "#f0e68c", "#87ceeb"];
        return (
          <motion.div
            key={`big-${i}`}
            className="absolute rounded-full"
            style={{
              width: size, height: size,
              backgroundColor: colors[i % colors.length],
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              boxShadow: `0 0 ${size * 3}px ${size * 1.5}px ${colors[i % colors.length]}40`,
            }}
            animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.3, 1] }}
            transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 4 }}
          />
        );
      })}

      {/* ESTRELAS MÉDIAS */}
      {[...Array(midStars)].map((_, i) => (
        <motion.div
          key={`mid-${i}`}
          className="absolute rounded-full"
          style={{
            width: 1.5, height: 1.5,
            backgroundColor: i % 4 === 0 ? themeColor : i % 4 === 1 ? highlightColor : "white",
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            boxShadow: "0 0 3px rgba(255,255,255,0.2)",
          }}
          animate={{ opacity: [0.2, 0.8, 0.2] }}
          transition={{ duration: 2 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 3 }}
        />
      ))}

      {/* ESTRELAS PEQUENAS (FIXAS) */}
      {[...Array(smallStars)].map((_, i) => (
        <div
          key={`small-${i}`}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 1.2,
            height: Math.random() * 1.2,
            backgroundColor: `rgba(255,255,255,${0.15 + Math.random() * 0.35})`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
        />
      ))}

      {/* ESTRELAS CADENTES - MAIS FREQUENTES */}
      {[...Array(shootingStars)].map((_, i) => (
        <motion.div
          key={`shooting-${i}`}
          className="absolute h-[2px] rounded-full"
          style={{
            width: 80 + Math.random() * 40,
            background: `linear-gradient(90deg, ${themeColor}, ${highlightColor}, transparent)`,
            left: `${Math.random() * 80}%`,
            top: `${Math.random() * 40}%`,
            opacity: 0,
            boxShadow: `0 0 6px ${themeColor}`,
          }}
          animate={{
            x: [-60, 200],
            y: [0, 80],
            opacity: [0, 0.9, 0],
          }}
          transition={{
            duration: 1 + Math.random() * 0.5,
            repeat: Infinity,
            repeatDelay: 8 + i * 6 + Math.random() * 10,
            delay: i * 7,
          }}
        />
      ))}

      {/* POEIRA CÓSMICA COLORIDA */}
      {[...Array(dustParticles)].map((_, i) => (
        <motion.div
          key={`dust-${i}`}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 2 + 0.5,
            height: Math.random() * 2 + 0.5,
            backgroundColor: i % 3 === 0 ? themeColor : i % 3 === 1 ? highlightColor : "#ffffff",
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            boxShadow: `0 0 4px ${i % 3 === 0 ? themeColor : highlightColor}`,
          }}
          animate={{
            x: [0, (Math.random() - 0.5) * 25, 0],
            y: [0, (Math.random() - 0.5) * 20, 0],
            opacity: [0.05, 0.25, 0.05],
          }}
          transition={{ duration: 8 + Math.random() * 8, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      {/* PARALLAX COM MOUSE */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ x: (mousePos.x - 0.5) * -15, y: (mousePos.y - 0.5) * -8 }}
        transition={{ type: "spring", stiffness: 30, damping: 15 }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-3xl"
          style={{ backgroundColor: `${themeColor}04` }} />
      </motion.div>

      {/* VIGNETTE */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.5) 100%)" }} />
    </div>
  );
};

// ============================================================
// LOADING
// ============================================================
const LoadingSpinner = () => (
  <div className="min-h-screen bg-slate-950 flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4 shadow-[0_0_15px_rgba(0,240,255,0.3)]" />
      <p className="text-white/40 text-sm tracking-wide">Carregando experiência...</p>
    </div>
  </div>
);

// ============================================================
// COMPONENTE DO CARD DE EMAIL (MESMO ESTILO DOS CARDS 3D)
// ============================================================
const EmailCard = ({ link, index, themeColor, highlightColor, fontFamily, fontSize, getIcon }: any) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const email = link.url.replace("mailto:", "");
    navigator.clipboard.writeText(email).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, type: "spring", stiffness: 80, damping: 12 }}
      whileHover={{ scale: 1.01, y: -2, zIndex: 10, transition: { type: "spring", stiffness: 300, damping: 20 } }}
      whileTap={{ scale: 0.98 }}
      className="relative group cursor-pointer"
      style={{ fontFamily, perspective: "1000px" }}
    >
      <div className="relative p-4 rounded-2xl transition-all duration-500 overflow-hidden"
        style={{
          background: "rgba(255, 255, 255, 0.02)",
          backdropFilter: "blur(20px)",
          borderColor: `${themeColor}20`,
          borderWidth: "1px",
          borderStyle: "solid",
              minHeight: "56px",  // ← ADICIONE ESTA LINHA
        }}
      >
        {/* Spotlight */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
          style={{ background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${themeColor}10, transparent 40%)` }} />
        
        {/* Barra lateral */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 group-hover:h-3/4 transition-all duration-500 rounded-r-full"
          style={{ backgroundColor: themeColor }} />

        {/* Conteúdo */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Ícone */}
            <motion.div whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.15 }} transition={{ duration: 0.5 }} className="relative">
              <div className="transition-all duration-300 group-hover:scale-110"
                style={{ color: themeColor, filter: `drop-shadow(0 0 8px ${themeColor}40)` }}>
                {getIcon(link.icon)}
              </div>
              <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full -z-10" style={{ backgroundColor: `${themeColor}20` }} />
            </motion.div>

            {/* Label */}
            <div>
<span className={`${fontSize} font-medium tracking-wide text-white/90 group-hover:text-white transition-colors duration-300`}>
  {link.label}
</span>
            </div>
          </div>

          {/* E-mail + Botão Copiar */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/30 font-mono group-hover:text-white/50 transition-colors duration-300">
              {link.url.replace("mailto:", "")}
            </span>
            <motion.div whileTap={{ scale: 0.8 }} onClick={handleCopy} className="cursor-pointer flex-shrink-0">
              {copied ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-1 bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full text-[10px] font-medium"
                >
                  <Icons.Check size={12} />
                  COPIADO
                </motion.div>
              ) : (
                <Icons.Copy 
                  size={16} 
                  className="text-white/20 group-hover:text-white/60 transition-colors" 
                />
              )}
            </motion.div>
          </div>
        </div>

        {/* Linha inferior */}
        <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/0 to-transparent group-hover:via-white/20 transition-all duration-300" />
      </div>
    </motion.div>
  );
};

const hexToPercent = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return `${Math.round(r * 100)}% ${Math.round(g * 100)}% ${Math.round(b * 100)}%`;
};


const useFavicon = (url: string) => {
  useEffect(() => {
    const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    (link as HTMLLinkElement).type = 'image/png';
    (link as HTMLLinkElement).rel = 'icon';
    (link as HTMLLinkElement).href = url;
    document.head.appendChild(link);
  }, [url]);
};

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================
export default function Home() {
  const [links, setLinks] = useState<any[]>([]);
  const [catalogTracks, setCatalogTracks] = useState<Track[]>([]);
  const [countdowns, setCountdowns] = useState<Countdown[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [logoTamanho, setLogoTamanho] = useState("h-20");
  const [showCatalog, setShowCatalog] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const fontMap: Record<string, string> = {
    padrao: "'Inter', system-ui, sans-serif",
    elegante: "'Playfair Display', Georgia, serif",
    moderna: "'Poppins', sans-serif",
    tecnica: "'DM Mono', monospace",
    fina: "'Montserrat', sans-serif",
    negrito: "'Bebas Neue', sans-serif",
    cursiva: "'Caveat', cursive",
    geometrica: "'Outfit', sans-serif",
    serifada: "'Merriweather', serif",
    clean: "'Manrope', sans-serif"
  };

  const getFontSize = (tamanho: string) => {
    const tamanhos: Record<string, string> = {
      xs: "text-xs", sm: "text-sm", base: "text-base",
      md: "text-md", lg: "text-lg", xl: "text-xl", "2xl": "text-2xl"
    };
    return tamanhos[tamanho] || "text-base";
  };

  const getLogoTamanho = (tipo: string) => {
    const tamanhos: Record<string, string> = {
      pequeno: "h-12", medio: "h-16", grande: "h-20",
      muito_grande: "h-24", maximo: "h-28", enorme: "h-32"
    };
    return tamanhos[tipo] || "h-20";
  };

const getIcon = (iconName: string, color?: string) => {
  const name = iconName?.charAt(0).toUpperCase() + iconName?.slice(1).toLowerCase();
  const Icon = (Icons as any)[name];
  return Icon ? <Icon size={16} style={{ color: color || undefined }} /> : <Icons.Rocket size={16} />;
};

  // Controles do Player
  const playTrack = useCallback((index: number) => {
    const track = catalogTracks[index];
    if (!track?.audioUrl) return;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    setCurrentTrack(track);
    setCurrentTrackIndex(index);
    setIsPlaying(true);
    setCurrentTime(0);
    setDuration(0);
  }, [catalogTracks]);

  const nextTrack = useCallback(() => {
    if (catalogTracks.length === 0) return;
    const nextIndex = (currentTrackIndex + 1) % catalogTracks.length;
    playTrack(nextIndex);
  }, [catalogTracks.length, currentTrackIndex, playTrack]);

  const prevTrack = useCallback(() => {
    if (catalogTracks.length === 0) return;
    const prevIndex = (currentTrackIndex - 1 + catalogTracks.length) % catalogTracks.length;
    playTrack(prevIndex);
  }, [catalogTracks.length, currentTrackIndex, playTrack]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const stopAndClosePlayer = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentTrack(null);
    setCurrentTrackIndex(-1);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const handleSeek = useCallback((time: number) => {
    if (audioRef.current && !isNaN(time)) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  // Efeito do áudio
  useEffect(() => {
    if (!currentTrack?.audioUrl) return;

    const audio = new Audio(currentTrack.audioUrl);
    audioRef.current = audio;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => nextTrack();

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);

    if (isPlaying) audio.play();

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [currentTrack, isPlaying, nextTrack]);

// Buscar dados
useEffect(() => {
  const fetchData = async () => {
    try {
      const response = await fetch(URL_CSV);
      const text = await response.text();
      const data = Papa.parse(text, { header: true, skipEmptyLines: true }).data;

      if (data && data.length > 0) {
        const primeiraLinha = data[0] as any;
        const tamanhoCelulaA4 = (data[3] as any)?.nome_artista || "grande";
        setLogoTamanho(getLogoTamanho(tamanhoCelulaA4));

        const linksList: any[] = [];
        const catalogList: Track[] = [];
        const countdownList: Countdown[] = [];
        const ordemList: string[] = [];
        const espacamentoList: string[] = [];

        data.forEach((row: any) => {
          // ORDEM DAS SEÇÕES
          if (row.ordem_secoes && row.ordem_secoes.trim() !== "") {
            ordemList.push(row.ordem_secoes.trim());
            espacamentoList.push(row.espacamento_secoes || "8");
          }

          // LINKS
          if (row.label && row.label.trim() !== "" && row.url && row.url.trim() !== "") {
            linksList.push({
              label: row.label,
              url: row.url === "#catalog" ? "#" : row.url,
              icon: row.icon || "ExternalLink",
              link_png_social: row.link_png_social || "",
              tipo_link: row.tipo_link || "link",
              highlight: row.highlight === "TRUE" || row.highlight === "true",
              is_new: row.is_new === "TRUE" || row.is_new === "true",
              cor_icone: row.cor_icone || "",
              cor_fundo: row.cor_fundo || "",
              cor_borda: row.cor_borda || "",
              cor_badge_novo: row.cor_badge_novo || "",
              tamanho_icone: row.tamanho_icone || "5",
              zoom_social: row.zoom_social || "1.4",
              font_family: row.font_family || "padrao",
              font_size: row.font_size || "base"
            });
          }

          // CATÁLOGO
          if (row.catalogo_title && row.catalogo_title.trim() !== "") {
            const trackId = row.catalogo_id && row.catalogo_id.trim() !== "" 
              ? `${row.catalogo_id}_${catalogList.length}`
              : `track_${catalogList.length}_${Date.now()}`;
            catalogList.push({
              id: trackId,
              title: row.catalogo_title,
              artist: row.catalogo_artist || "Artista",
              genre: row.catalogo_genre || "",
              audioUrl: row.catalogo_audioUrl || "",
              image: row.catalogo_imagem || ""
            });
          }

          // COUNTDOWNS
          if (row.countdown_title && row.countdown_title.trim() !== "") {
            const active = row.countdown_active === "TRUE" || row.countdown_active === "true";
            if (active) {
              countdownList.push({
                id: row.countdown_id || `countdown_${countdownList.length + 1}`,
                title: row.countdown_title,
                description: row.countdown_description || "",
                targetDate: row.countdown_target_date,
                presaveLink: row.countdown_presave_link || "",
                buttonText: row.countdown_button_text || "PRÉ-SAVE DISPONÍVEL",
                active: active,
                image: row.countdown_image || "",
                imageOpacity: row.countdown_image_opacity || "30",
                backgroundColor: row.countdown_bg_color || "",
                videoUrl: row.countdown_video_url || ""
              });
            }
          }
        });


          setConfig({
nome_artista: (primeiraLinha.nome_artista || "").trim(),
bio: (primeiraLinha.bio || "").trim(),
slogan: (primeiraLinha.slogan || "").trim(),         color: primeiraLinha.color || "#06b6d4",
          color_destaque: primeiraLinha.color_destaque || "#10b981",
          cor_nome: primeiraLinha.cor_nome || "#ffffff",
          cor_bio: primeiraLinha.cor_bio || "#ffffff",
          cor_slogan: primeiraLinha.cor_slogan || "#ffffff",
          titulo_countdown: (primeiraLinha.titulo_countdown || "").trim(),
          cor_titulo_countdown: primeiraLinha.cor_titulo_countdown || "#ffffff",
          icone_countdown: (primeiraLinha.icone_countdown || "").trim(),
          cor_icone_countdown: primeiraLinha.cor_icone_countdown || "#22d3ee",
          cor_badge_novo: primeiraLinha.cor_badge_novo || "#06b6d4",
          cor_icone_social: primeiraLinha.cor_icone_social || "#ffffff",
          cor_fundo_social: primeiraLinha.cor_fundo_social || "#0a0a0a",
          cor_borda_social: primeiraLinha.cor_borda_social || "#ffffff",
          favicon: primeiraLinha.favicon || "/favicon.png",
            titulo_aba: primeiraLinha.titulo_aba || "Linktree", // ← NOVO
          bg_image: primeiraLinha.bg_image || "",
          ordem_secoes: ordemList.join(',') || "countdown,social,links",
          espacamento_secoes: espacamentoList.join(',') || "8,8,8",
          avatar: primeiraLinha.avatar || "",
          avatar_position: primeiraLinha.avatar_position || "center",
          efeito_fundo: primeiraLinha.efeito_fundo || "padrao"
        });

        setLinks(linksList);
        setCatalogTracks(catalogList);
        setCountdowns(countdownList);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);


// Atualiza o título da aba
useEffect(() => {
  if (config?.titulo_aba) {
    document.title = config.titulo_aba;
  }
}, [config?.titulo_aba]);


  // Atualiza o favicon
useEffect(() => {
  if (config?.favicon) {
    const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    (link as HTMLLinkElement).type = 'image/png';
    (link as HTMLLinkElement).rel = 'icon';
    (link as HTMLLinkElement).href = config.favicon;
    document.head.appendChild(link);
  }
}, [config?.favicon]);


  if (loading) return <LoadingSpinner />;
  if (!config) return null;

  

  const themeColor = config.color || "#06b6d4";
  const highlightColor = config.color_destaque || "#10b981";
  const activeCountdowns = countdowns.filter(c => c.active);
  const socialLinks = links.filter(link => link.link_png_social);
const normalLinks = links.filter(link => !link.link_png_social);

  return (
    <div className="min-h-screen relative text-white">
<BackgroundEffect 
  tipo={config.efeito_fundo} 
  bgImage={config.bg_image} 
  themeColor={themeColor}
  highlightColor={highlightColor}
/>
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12 max-w-md mx-auto pb-40">
        {/* Avatar */}
        {config.avatar && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="mb-6">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 shadow-[0_0_30px_rgba(0,240,255,0.3)]" style={{ borderColor: themeColor }}>
              <img src={config.avatar} alt="Avatar" className="w-full h-full object-cover" />
            </div>
          </motion.div>
        )}

        {/* Nome/Logo */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="text-center mb-4">
          {config.nome_artista && (
            config.nome_artista.startsWith("http") ? (
              <img src={config.nome_artista} alt="Logo" className={`${logoTamanho} w-auto object-contain mx-auto drop-shadow-[0_0_20px_rgba(0,240,255,0.4)]`} />
            ) : (
              <h1 className="text-3xl font-bold tracking-tighter" style={{ color: config.cor_nome }}>
  {config.nome_artista}
</h1>
            )
          )}
        </motion.div>

        {/* Bio */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-center mb-10">
{config.bio && <p className="text-sm tracking-wide" style={{ color: config.cor_bio || themeColor }}>{config.bio}</p>}          {config.slogan && (
<p className="text-[10px] tracking-[0.2em] uppercase mt-1.5 font-semibold" style={{ color: config.cor_slogan || themeColor }}>{config.slogan}</p>          )}
        </motion.div>

{/* SEÇÕES NA ORDEM DA PLANILHA */}
{config.ordem_secoes && config.espacamento_secoes && (
  (() => {
    const secoes = config.ordem_secoes.split(',');
    const espacamentos = config.espacamento_secoes.split(',');
    
    // Usa um array para retornar os elementos
    const elementos = secoes.map((secao: string, i: number) => {
      const secaoTrim = secao.trim();
      const margem = `${(Number(espacamentos[i]) || 8) * 4}px`;

      // COUNTDOWNS
      if (secaoTrim === 'countdown') {
        if (activeCountdowns.length === 0) return null;
        return (
          <motion.div key="countdown" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} 
            className="w-full" style={{ marginBottom: margem }}>
            <div className="flex items-center justify-center gap-2 mb-4">
              {getIcon(config.icone_countdown || "Rocket", config.cor_icone_countdown || "#22d3ee")}
              <h2 className="text-sm font-medium uppercase tracking-wider" style={{ color: config.cor_titulo_countdown || "#ffffff" }}>
                {config.titulo_countdown || "Próximos Lançamentos"}
              </h2>
            </div>
            <div className="space-y-4">
              {activeCountdowns.map((cd) => (
                <CountdownCard key={cd.id} countdown={cd} themeColor={themeColor} highlightColor={highlightColor} />
              ))}
            </div>
          </motion.div>
        );
      }
      
      // REDES SOCIAIS
      if (secaoTrim === 'social') {
        if (socialLinks.length === 0) return null;
        return (
          <motion.div key="social" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} 
            className="w-full" style={{ marginBottom: margem }}>
            <div className="flex justify-center gap-4 flex-wrap py-2">
              {socialLinks.map((link, index) => (
                <motion.a key={`social-${index}`} href={link.url} target="_blank" rel="noopener noreferrer"
                  initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.08, type: "spring", stiffness: 200 }}
                  whileHover={{ y: -4, scale: parseFloat(link.zoom_social || "1.2"), zIndex: 50 }}
                  className="flex flex-col items-center gap-1.5 group relative" style={{ width: "70px", zIndex: 1 }}
                >
                  <div className="relative rounded-full backdrop-blur-sm border flex items-center justify-center transition-all duration-300"
                    style={{ 
                      width: `${link.tamanho_icone ? parseInt(link.tamanho_icone) + 28 : 48}px`,
                      height: `${link.tamanho_icone ? parseInt(link.tamanho_icone) + 28 : 48}px`,
                      backgroundColor: link.cor_fundo ? `${link.cor_fundo}15` : `${config.cor_fundo_social || "#0a0a0a"}15`,
                      borderColor: link.cor_borda ? `${link.cor_borda}40` : `${config.cor_borda_social || "#ffffff"}30`,
                    }}
                    onMouseEnter={(e) => {
                      const corHover = link.cor_icone || config.cor_icone_social || "#ffffff";
                      e.currentTarget.style.backgroundColor = `${corHover}25`;
                      e.currentTarget.style.borderColor = `${corHover}80`;
                      e.currentTarget.style.boxShadow = `0 0 25px ${corHover}50`;
                      e.currentTarget.style.transform = `scale(${link.zoom_social || "1.4"})`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = link.cor_fundo ? `${link.cor_fundo}15` : `${config.cor_fundo_social || "#0a0a0a"}15`;
                      e.currentTarget.style.borderColor = link.cor_borda ? `${link.cor_borda}40` : `${config.cor_borda_social || "#ffffff"}30`;
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.05, 0.2] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute inset-0 rounded-full"
                      style={{ backgroundColor: link.cor_icone ? `${link.cor_icone}20` : `${config.cor_icone_social || "#ffffff"}20` }} />
                    <div className="relative z-10 transition-all duration-300"
                      style={{ color: link.cor_icone ? `${link.cor_icone}70` : `${config.cor_icone_social || "#ffffff"}70` }}>
                      {link.link_png_social ? (
                        <img src={link.link_png_social} alt={link.label} className="object-contain"
                          style={{ width: `${link.tamanho_icone || 20}px`, height: `${link.tamanho_icone || 20}px` }} />
                      ) : getIcon(link.icon)}
                    </div>
                  </div>
                  {link.label && (
                    <span className="text-[9px] transition-colors font-medium tracking-wide"
                      style={{ color: link.cor_icone ? `${link.cor_icone}50` : `${config.cor_icone_social || "#ffffff"}50` }}>
                      {link.label}
                    </span>
                  )}
                </motion.a>
              ))}
            </div>
          </motion.div>
        );
      }
      
      // LINKS NORMAIS
      if (secaoTrim === 'links') {
        if (normalLinks.length === 0) return null;
        return (
          <div key="links" className="w-full space-y-3.5" style={{ marginBottom: margem }}>
            {normalLinks.map((link, index) => {
              const isHighlight = link.highlight === true;
              const isEmail = link.url?.startsWith("mailto:");
              const fontFamily = fontMap[link.font_family] || fontMap.padrao;
              const fontSize = getFontSize(link.font_size);
              const isCatalog = link.label === "Catálogo" || link.url === "#";
              const isNew = link.is_new === true;
              const isComingSoon = link.url === "#" && !isCatalog;

              if (isEmail) {
                return <EmailCard key={`email-${index}`} link={link} index={index} themeColor={themeColor} highlightColor={highlightColor} fontFamily={fontFamily} fontSize={fontSize} getIcon={getIcon} />;
              }

              return (
                <motion.div key={`link-${index}`} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08, type: "spring", stiffness: 80, damping: 12 }}
                  whileHover={{ scale: 1.02, y: -4 }} whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (isCatalog) setShowCatalog(true);
                    else if (link.url && !link.url.startsWith("mailto:") && !isComingSoon) window.open(link.url, "_blank");
                  }}
                  className="relative group cursor-pointer" style={{ fontFamily, perspective: "1000px" }}
                >
                  <div className="relative p-4 rounded-2xl transition-all duration-500 overflow-hidden"
                    style={{
                      background: isHighlight ? `linear-gradient(135deg, ${highlightColor}15, ${themeColor}10)` : "rgba(255, 255, 255, 0.02)",
                      backdropFilter: "blur(20px)",
                      borderColor: isHighlight ? `${highlightColor}30` : `${themeColor}20`,
                      borderWidth: "1px", borderStyle: "solid",
                      boxShadow: isHighlight ? `0 4px 20px -4px ${highlightColor}20, 0 0 0 1px ${highlightColor}20 inset` : `0 2px 10px -2px transparent`,
                    }}
                  >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
                      style={{ background: `radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${isHighlight ? highlightColor : themeColor}10, transparent 40%)` }} />
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 group-hover:h-3/4 transition-all duration-500 rounded-r-full"
                      style={{ backgroundColor: isHighlight ? highlightColor : themeColor }} />

                    {isNew && !isHighlight && (
                      <div className="absolute top-2 right-2 z-20">
                        <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: index * 0.08 + 0.3, type: "spring", stiffness: 300 }}
                          className="px-3 py-1 rounded-full text-[9px] font-bold text-white tracking-wider shadow-lg flex items-center gap-1"
                          style={{ 
                            background: link.cor_badge_novo ? `linear-gradient(to right, ${link.cor_badge_novo}, ${link.cor_badge_novo}cc)` : `linear-gradient(to right, ${config.cor_badge_novo || "#06b6d4"}, ${config.cor_badge_novo || "#10b981"})`,
                            boxShadow: link.cor_badge_novo ? `0 4px 15px -3px ${link.cor_badge_novo}40` : `0 4px 15px -3px ${config.cor_badge_novo || "#06b6d4"}40`
                          }}>
                          <Icons.Sparkles size={10} /> NOVO
                        </motion.div>
                      </div>
                    )}

                    {isComingSoon && (
                      <div className="absolute -top-2 -right-2 z-20">
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-[9px] font-bold text-white tracking-wider shadow-lg flex items-center gap-1">
                          <Icons.Clock size={10} /> EM BREVE
                        </motion.div>
                      </div>
                    )}

                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <motion.div whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.15 }} transition={{ duration: 0.5 }} className="relative">
                          <div className="transition-all duration-300 group-hover:scale-110"
                            style={{ color: isHighlight ? highlightColor : themeColor, filter: `drop-shadow(0 0 8px ${isHighlight ? highlightColor : themeColor}40)` }}>
                            {getIcon(link.icon)}
                          </div>
                          <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute inset-0 rounded-full -z-10" style={{ backgroundColor: `${isHighlight ? highlightColor : themeColor}20` }} />
                        </motion.div>
                        <span className={`${fontSize} font-medium tracking-wide text-white/90 group-hover:text-white transition-colors duration-300`}>
                          {link.label}
                        </span>
                      </div>
                      {!isCatalog && !isComingSoon && (
                        <motion.div initial={{ x: 0, opacity: 0.5 }} whileHover={{ x: 3, opacity: 1 }}>
                          <Icons.ArrowUpRight size={18} className="text-white/30 group-hover:text-white/80 transition-colors duration-300" />
                        </motion.div>
                      )}
                      {isCatalog && (
                        <motion.div animate={{ x: [0, 5, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
                          <Icons.Music4 size={18} className="text-white/30 group-hover:text-white/80 transition-colors" />
                        </motion.div>
                      )}
                      {isComingSoon && <Icons.Lock size={16} className="text-white/20" />}
                    </div>
                    <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/0 to-transparent group-hover:via-white/20 transition-all duration-300" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        );
      }
      
      return null;
    });

    return <div className="w-full flex flex-col" style={{ gap: "0px" }}>{elementos}</div>;
  })()
)}


        <footer className="mt-12 pt-8 text-center">
          <a
            href="https://www.instagram.com/le_aohit"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] tracking-[0.3em] uppercase text-white/20 font-light hover:text-cyan-400 transition-all duration-300"
          >
            POWERED BY L*A HIT
          </a>
        </footer>
      </div>

      {/* Player de Música */}
      <AnimatePresence>
        {currentTrack && (
          <MusicPlayer
            track={currentTrack}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            onClose={stopAndClosePlayer}
            onNext={nextTrack}
            onPrev={prevTrack}
            onTogglePlay={togglePlay}
            onSeek={handleSeek}
          />
        )}
      </AnimatePresence>

      {/* Catálogo Modal */}
      <AnimatePresence>
        {showCatalog && (
          <CatalogModal
            isOpen={showCatalog}
            onClose={() => setShowCatalog(false)}
            tracks={catalogTracks}
            onPlayTrack={playTrack}
            currentTrackId={currentTrack?.id || ""}
            isPlaying={isPlaying}
          />
        )}
      </AnimatePresence>
    </div>
  );
}