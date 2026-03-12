import { useState, useEffect, useCallback } from "react";
import { signInWithGoogle, logOut, saveUserData, loadUserData, onAuthChange, incrementStackerCount, getStackerCount } from "./firebase";

const DEFAULT_GOAL = 100_000_000;
const fmt    = (n) => parseInt(n).toLocaleString();
const fmtUsd = (n) => "$" + parseFloat(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const satsToUsd = (sats, price) => (price ? (sats / 1e8) * price : null);

// ── Theme palettes ──────────────────────────────────────────────────────────
const LIGHT = {
  bg: "#f0f2f5", card: "#ffffff", cardAlt: "#f8f9fb",
  gold: "#F7931A", goldDim: "#b86d10", goldLight: "#fff4e6", goldGlow: "rgba(247,147,26,0.15)",
  green: "#00c853", greenLight: "#e6f9ef",
  red: "#ff3b30", redLight: "#fff0ef",
  blue: "#0070f3", blueLight: "#e8f1ff",
  text: "#0d0d0d", sub: "#555e6b",
  muted: "#9ba0aa", muted2: "#c5cad3", border: "#e4e7ec", white: "#ffffff",
  navBg: "#ffffff", navBorder: "#e4e7ec",
  surface: "#ffffff", surface3: "#e4e7ec",
  inputBg: "#f8f9fb",
};
const DARK = {
  bg: "#07080a", card: "rgba(15,16,18,0.85)", cardAlt: "#1c1e22",
  gold: "#F7931A", goldDim: "#b86d10", goldLight: "rgba(247,147,26,0.12)", goldGlow: "rgba(247,147,26,0.15)",
  green: "#0dff87", greenLight: "rgba(13,255,135,0.1)",
  red: "#ff3355", redLight: "rgba(255,51,85,0.1)",
  blue: "#4da6ff", blueLight: "rgba(77,166,255,0.1)",
  text: "#edeae3", sub: "#9ba0aa",
  muted: "#636870", muted2: "#3a4050", border: "rgba(255,255,255,0.07)", white: "rgba(15,16,18,0.85)",
  navBg: "rgba(7,8,10,0.9)", navBorder: "rgba(255,255,255,0.07)",
  surface: "rgba(15,16,18,0.7)", surface3: "#1c1e22",
  inputBg: "rgba(255,255,255,0.04)",
};

const shadow   = "0 2px 12px rgba(0,0,0,0.10)";
const shadowMd = "0 4px 32px rgba(0,0,0,0.18)";

const iBase = (C, dark) => ({
  background: dark ? "rgba(255,255,255,0.04)" : C.cardAlt,
  border: `1.5px solid ${C.border}`,
  borderRadius: 12, padding: "12px 15px", color: C.text,
  fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 400,
  outline: "none", width: "100%",
  transition: "border-color 0.2s, box-shadow 0.2s", boxSizing: "border-box",
});
const iStyle = (C, dark, name, focused) => ({
  ...iBase(C, dark),
  border: `1.5px solid ${focused === name ? C.gold : C.border}`,
  boxShadow: focused === name ? `0 0 0 3px ${C.goldLight}` : "none",
});

// ── Avatars ───────────────────────────────────────────────────────────────────
function AvatarBtcCoin() {
  return <svg viewBox="0 0 100 100"><defs><radialGradient id="av1" cx="40%" cy="35%"><stop offset="0%" stopColor="#ffd580"/><stop offset="100%" stopColor="#c8600a"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#av1)" stroke="#7a3a00" strokeWidth="1.5"/><text x="50" y="65" textAnchor="middle" fontSize="48" fontWeight="900" fontFamily="Arial" fill="#fff5e0">₿</text></svg>;
}
function AvatarLaserEyes() {
  return <svg viewBox="0 0 100 100"><defs><radialGradient id="av2" cx="50%" cy="50%"><stop offset="0%" stopColor="#1a1a2e"/><stop offset="100%" stopColor="#0a0a14"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#av2)" stroke="#F7931A" strokeWidth="1.5"/><text x="50" y="55" textAnchor="middle" fontSize="30" fontFamily="Arial">🧔</text><ellipse cx="38" cy="46" rx="6" ry="3" fill="#ff2200" opacity="0.9"/><ellipse cx="62" cy="46" rx="6" ry="3" fill="#ff2200" opacity="0.9"/><text x="50" y="80" textAnchor="middle" fontSize="10" fontWeight="700" fontFamily="Arial" fill="#F7931A">HODL</text></svg>;
}
function AvatarSatSymbol() {
  return <svg viewBox="0 0 100 100"><defs><linearGradient id="av3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#1a1200"/><stop offset="100%" stopColor="#0a0800"/></linearGradient></defs><circle cx="50" cy="50" r="48" fill="url(#av3)" stroke="#F7931A" strokeWidth="2"/><text x="50" y="62" textAnchor="middle" fontSize="52" fontWeight="900" fontFamily="Arial" fill="#F7931A">s</text></svg>;
}
function AvatarMoonRocket() {
  return <svg viewBox="0 0 100 100"><defs><radialGradient id="av4" cx="50%" cy="80%"><stop offset="0%" stopColor="#0a0a2a"/><stop offset="100%" stopColor="#000"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#av4)"/><text x="68" y="30" textAnchor="middle" fontSize="22" fontFamily="Arial">🌕</text><text x="38" y="72" textAnchor="middle" fontSize="26" fontFamily="Arial">🚀</text><text x="50" y="92" textAnchor="middle" fontSize="8" fontWeight="700" fontFamily="Arial" fill="#F7931A">TO THE MOON</text></svg>;
}
function AvatarHodl() {
  return <svg viewBox="0 0 100 100"><defs><radialGradient id="av5" cx="50%" cy="50%"><stop offset="0%" stopColor="#1a0d00"/><stop offset="100%" stopColor="#080400"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#av5)" stroke="#F7931A" strokeWidth="1"/><text x="50" y="60" textAnchor="middle" fontSize="40" fontFamily="Arial">💎</text><text x="50" y="85" textAnchor="middle" fontSize="11" fontWeight="900" fontFamily="Arial" fill="#F7931A">HODL</text></svg>;
}
function AvatarSatoshi() {
  return <svg viewBox="0 0 100 100"><defs><radialGradient id="av6" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a1a1a"/><stop offset="100%" stopColor="#050505"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#av6)" stroke="rgba(247,147,26,0.4)" strokeWidth="1.5"/><text x="50" y="55" textAnchor="middle" fontSize="38" fontFamily="Arial">🥷</text><text x="50" y="78" textAnchor="middle" fontSize="8" fontWeight="700" fontFamily="Arial" fill="#F7931A">SATOSHI</text></svg>;
}
function AvatarOrangePill() {
  return <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#0a0400"/><ellipse cx="50" cy="50" rx="22" ry="12" fill="#F7931A" transform="rotate(-35 50 50)"/><ellipse cx="50" cy="50" rx="11" ry="12" fill="#c8600a" transform="rotate(-35 50 50)"/><text x="50" y="82" textAnchor="middle" fontSize="8" fontWeight="700" fontFamily="Arial" fill="#F7931A">ORANGE PILL</text></svg>;
}
function AvatarBull() {
  return <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#0f0800" stroke="#F7931A" strokeWidth="1"/><text x="50" y="62" textAnchor="middle" fontSize="46" fontFamily="Arial">🐂</text><text x="50" y="85" textAnchor="middle" fontSize="8" fontWeight="700" fontFamily="Arial" fill="#F7931A">BTC BULL</text></svg>;
}
function AvatarStackBars() {
  return <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#050400" stroke="#F7931A" strokeWidth="1"/><rect x="20" y="70" width="60" height="8" rx="3" fill="#F7931A"/><rect x="24" y="60" width="52" height="8" rx="3" fill="#F7931A" opacity="0.85"/><rect x="28" y="50" width="44" height="8" rx="3" fill="#F7931A" opacity="0.7"/><rect x="32" y="40" width="36" height="8" rx="3" fill="#F7931A" opacity="0.55"/><rect x="36" y="30" width="28" height="8" rx="3" fill="#F7931A" opacity="0.4"/><text x="50" y="93" textAnchor="middle" fontSize="7" fontWeight="700" fontFamily="Arial" fill="#F7931A">STACK SATS</text></svg>;
}
function Avatar21M() {
  return <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#030303" stroke="#F7931A" strokeWidth="2"/><text x="50" y="46" textAnchor="middle" fontSize="28" fontWeight="900" fontFamily="Arial" fill="#F7931A">21</text><line x1="20" y1="52" x2="80" y2="52" stroke="#F7931A" strokeWidth="1" opacity="0.4"/><text x="50" y="66" textAnchor="middle" fontSize="10" fontWeight="700" fontFamily="Arial" fill="#F7931A">MILLION</text><text x="50" y="80" textAnchor="middle" fontSize="7.5" fontFamily="Arial" fill="#9ba0aa">FIXED FOREVER</text></svg>;
}

const AVATARS = [
  { id: "btc-coin",    label: "Bitcoin Coin", Component: AvatarBtcCoin },
  { id: "laser-eyes", label: "Laser Eyes",   Component: AvatarLaserEyes },
  { id: "sat-symbol", label: "Sat Symbol",   Component: AvatarSatSymbol },
  { id: "moon-rocket",label: "To The Moon",  Component: AvatarMoonRocket },
  { id: "hodl-hand",  label: "HODL Hand",    Component: AvatarHodl },
  { id: "satoshi",    label: "Satoshi",      Component: AvatarSatoshi },
  { id: "orange-pill",label: "Orange Pill",  Component: AvatarOrangePill },
  { id: "btc-bull",   label: "BTC Bull",     Component: AvatarBull },
  { id: "stack-bars", label: "Stack Bars",   Component: AvatarStackBars },
  { id: "21m",        label: "21 Million",   Component: Avatar21M },
];

const BADGES = [
  { threshold: 1e8,  emoji: "🏆", label: "WHOLE-COINER", color: "#00c853" },
  { threshold: 50e6, emoji: "🔥", label: "HALF-COINER",  color: "#F7931A" },
  { threshold: 21e6, emoji: "✨", label: "21M CLUB",      color: "#0070f3" },
  { threshold: 10e6, emoji: "⚡", label: "10M STACKER",  color: "#7c3aed" },
  { threshold: 1e6,  emoji: "🌱", label: "1M STARTER",   color: "#00c853" },
  { threshold: 1,    emoji: "🟠", label: "FIRST SAT",    color: "#F7931A" },
];
const getBadge = (sats) => BADGES.find(b => sats >= b.threshold) || null;

const STACK_CELEBRATIONS = [
  { msg: "⚡ Sats secured!",     sub: "Every sat is a brick in your financial fortress. Keep building." },
  { msg: "🔥 Stack growing!",    sub: "The orange coin doesn't care about bear markets. Neither should you." },
  { msg: "🟠 Orange-pilled!",    sub: "Another stack, another step away from fiat slavery. WAGMI." },
  { msg: "₿ Block confirmed!",   sub: "Somewhere, a miner just validated your commitment. Stay humble." },
  { msg: "💎 Diamond hands!",    sub: "You didn't spend it. You saved it. That's the Bitcoin way." },
  { msg: "🚀 To the moon!",      sub: "One small stack for you. One giant leap for your future self." },
  { msg: "🏆 Stack achieved!",   sub: "Satoshi would be proud. The journey of 1 BTC begins with one sat." },
  { msg: "🌱 Seeds planted!",    sub: "Today's sats are tomorrow's freedom. The best time to stack is always now." },
];

const MOTIVATIONS = [
  { quote: "Stay humble. Stack sats.", author: "Matt Odell" },
  { quote: "You don't buy Bitcoin. You save in Bitcoin.", author: "Michael Saylor" },
  { quote: "Bitcoin is the hardest money humanity has ever known.", author: "Saifedean Ammous" },
  { quote: "Bitcoin is the separation of money and state.", author: "Erik Voorhees" },
  { quote: "Not your keys, not your coins. Stack, secure, hold.", author: "Bitcoin Maxim" },
  { quote: "There will only ever be 21 million Bitcoin. There are 8 billion people. Do the math.", author: "Bitcoin Proverb" },
  { quote: "In a world of infinite money printing, be the fixed supply.", author: "Bitcoin Proverb" },
  { quote: "Every sat you stack is a vote against inflation.", author: "Satoshi's Vision" },
  { quote: "21 million. Not a single sat more. That's the deal.", author: "Satoshi's Promise" },
  { quote: "Fix the money. Fix the world.", author: "Bitcoin Maxim" },
  { quote: "The best time to stack sats was yesterday. The second best time is now.", author: "Bitcoin Community" },
  { quote: "Governments can print money. They cannot print Bitcoin.", author: "Bitcoin Proverb" },
  { quote: "Don't trust. Verify. Stack. Repeat.", author: "Bitcoin Maxim" },
  { quote: "Bitcoin doesn't need you to believe in it. It just keeps working.", author: "Anon" },
  { quote: "If you're not stacking, inflation is unstacking you.", author: "Bitcoin Proverb" },
  { quote: "100 million sats. One goal. No excuses.", author: "Stacker's Oath" },
  { quote: "The goal isn't to get rich. It's to stay free.", author: "Anon" },
  { quote: "Pain is temporary. Sats are forever.", author: "Hodler's Creed" },
  { quote: "You are early. Act like it.", author: "Bitcoin Community" },
  { quote: "Satoshi gave us the tool. The rest is up to us.", author: "Bitcoin Community" },
  { quote: "A small stack today is a life-changing stack tomorrow.", author: "Stacker's Oath" },
];

function getLocalDatetime() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}
function formatDatetime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, { month:"short", day:"numeric", year:"numeric", hour:"2-digit", minute:"2-digit" });
}

// ── UI primitives ─────────────────────────────────────────────────────────────
function Card({ children, style={}, C, dark }) {
  const base = dark
    ? { background:"rgba(15,16,18,0.75)", border:"1px solid rgba(255,255,255,0.07)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)" }
    : { background: C.card, border:`1px solid ${C.border}` };
  return <div style={{ borderRadius:20, boxShadow:shadow, overflow:"hidden", ...base, ...style }}>{children}</div>;
}

function SectionLabel({ children, color, C }) {
  const c = color || C.gold;
  return (
    <div style={{ fontSize:10, fontWeight:700, letterSpacing:2, color:c, textTransform:"uppercase", marginBottom:14, display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ width:3, height:14, background:c, borderRadius:2 }}/>
      {children}
    </div>
  );
}

function StatBox({ label, value, sub, valueColor, accent, C, dark }) {
  const vc = valueColor || C.text;
  const bg = dark ? "rgba(255,255,255,0.03)" : C.cardAlt;
  const bd = dark ? `1px solid ${accent ? accent+"30" : "rgba(255,255,255,0.07)"}` : `1px solid ${accent ? accent+"30" : C.border}`;
  return (
    <div style={{ background:bg, border:bd, borderRadius:16, padding:"18px 16px", position:"relative", overflow:"hidden" }}>
      {accent && <div style={{ position:"absolute", top:0, left:0, right:0, height:dark?1:3, background:dark?`linear-gradient(90deg,transparent,${accent},transparent)`:`${accent}`, borderRadius: dark?"none":"16px 16px 0 0", opacity:dark?0.7:1 }}/>}
      <div style={{ fontSize:9, color:C.muted, letterSpacing:1.8, marginBottom:8, fontWeight:600, textTransform:"uppercase" }}>{label}</div>
      <div style={{ fontSize:19, fontWeight:800, color:vc, letterSpacing:-0.5, lineHeight:1, marginBottom:5 }}>{value}</div>
      <div style={{ fontSize:10, color:C.sub }}>{sub||"—"}</div>
    </div>
  );
}

function ThemeToggle({ dark, onToggle, C }) {
  return (
    <button onClick={onToggle} title={dark?"Switch to light mode":"Switch to dark mode"}
      style={{ width:40, height:40, borderRadius:10, border:`1.5px solid ${C.border}`, background:dark?"rgba(255,255,255,0.05)":C.cardAlt, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, transition:"all 0.2s", flexShrink:0 }}>
      {dark ? "☀️" : "🌙"}
    </button>
  );
}

// ── Stack Celebration ─────────────────────────────────────────────────────────
function StackCelebration({ data, onDone, C, dark }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 30);
    const t2 = setTimeout(() => { setVisible(false); setTimeout(onDone, 400); }, 3800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  const bg = dark ? "rgba(15,16,18,0.95)" : C.card;
  return (
    <div style={{ position:"fixed", inset:0, display:"flex", alignItems:"center", justifyContent:"center", zIndex:1100, pointerEvents:"none" }}>
      <div style={{ background:bg, border:`2px solid ${C.gold}`, borderRadius:24, padding:"28px 32px", maxWidth:360, width:"90%", textAlign:"center", boxShadow:shadowMd, opacity:visible?1:0, transform:visible?"scale(1) translateY(0)":"scale(0.85) translateY(20px)", transition:"opacity 0.4s ease, transform 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>
        <div style={{ fontSize:36, marginBottom:12 }}>{data.msg.split(" ")[0]}</div>
        <div style={{ fontSize:18, fontWeight:800, color:C.gold, letterSpacing:-0.5, marginBottom:10 }}>{data.msg.split(" ").slice(1).join(" ")}</div>
        <div style={{ fontSize:11, color:C.sub, lineHeight:1.7 }}>{data.sub}</div>
      </div>
    </div>
  );
}

// ── Goal Complete Modal ───────────────────────────────────────────────────────
function GoalCompleteModal({ goal, onClose, C, dark }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.88)", backdropFilter:"blur(14px)", zIndex:1200, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:dark?"rgba(15,16,18,0.97)":C.card, borderRadius:28, padding:"40px 36px", width:"100%", maxWidth:460, textAlign:"center", boxShadow:shadowMd, border:`2px solid ${C.green}` }}>
        <div style={{ fontSize:56, marginBottom:16 }}>🏆</div>
        <div style={{ fontSize:24, fontWeight:900, color:C.green, letterSpacing:-1, marginBottom:8 }}>GOAL REACHED!</div>
        <div style={{ fontSize:13, color:C.sub, lineHeight:1.8, marginBottom:24 }}>You've hit <span style={{ color:C.gold, fontWeight:700 }}>{fmt(goal)} sats</span>.<br/>That's the Bitcoin way — one sat at a time. 🟠</div>
        <button onClick={onClose} style={{ width:"100%", padding:"14px", borderRadius:14, border:"none", background:C.green, color:dark?"#000":"#fff", fontFamily:"system-ui,sans-serif", fontSize:13, fontWeight:700, cursor:"pointer" }}>🚀 SET A NEW GOAL</button>
      </div>
    </div>
  );
}

// ── Motivation Banner ─────────────────────────────────────────────────────────
function MotivationBanner({ C, dark }) {
  const [idx, setIdx]     = useState(() => Math.floor(Math.random() * MOTIVATIONS.length));
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const iv = setInterval(() => { setVisible(false); setTimeout(() => { setIdx(i => (i+1)%MOTIVATIONS.length); setVisible(true); }, 500); }, 6000);
    return () => clearInterval(iv);
  }, []);
  const nav = d => { setVisible(false); setTimeout(() => { setIdx(i => (i+d+MOTIVATIONS.length)%MOTIVATIONS.length); setVisible(true); }, 300); };
  const { quote, author } = MOTIVATIONS[idx];
  return (
    <Card C={C} dark={dark} style={{ marginBottom:16, opacity:visible?1:0, transition:"opacity 0.5s ease", position:"relative", overflow:"hidden" }}>
      {dark && <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${C.gold}80,transparent)` }}/>}
      <div style={{ padding:"15px 20px", display:"flex", alignItems:"center", gap:14 }}>
        <div style={{ width:34, height:34, borderRadius:10, background:C.goldLight, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, flexShrink:0 }}>⚡</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:12, color:C.sub, lineHeight:1.65, fontStyle:"italic" }}>"{quote}"</div>
          <div style={{ fontSize:10, color:C.gold, marginTop:5, fontWeight:700, letterSpacing:0.5 }}>— {author}</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6, flexShrink:0 }}>
          <span style={{ fontSize:10, color:C.muted }}>{idx+1}/{MOTIVATIONS.length}</span>
          {[-1,1].map(d => (
            <button key={d} onClick={() => nav(d)} style={{ width:27, height:27, borderRadius:7, border:`1px solid ${C.border}`, background:dark?"rgba(255,255,255,0.03)":C.cardAlt, cursor:"pointer", fontSize:15, color:C.gold, display:"flex", alignItems:"center", justifyContent:"center", padding:0 }}>{d===-1?"‹":"›"}</button>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ── Stackers Banner ───────────────────────────────────────────────────────────
function StackersBanner({ count, C, dark }) {
  const useDots = count <= 20;
  const fillPct = count > 0 ? Math.max(2, (1/count)*100) : 100;
  return (
    <Card C={C} dark={dark} style={{ marginBottom:16, position:"relative", overflow:"hidden" }}>
      {dark && <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${C.blue}80,transparent)` }}/>}
      <div style={{ padding:"22px 24px" }}>
        <SectionLabel C={C} color={C.blue}>Global Stackers Community</SectionLabel>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
          <div>
            <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
              <div style={{ fontSize:44, fontWeight:900, color:C.text, letterSpacing:-2, lineHeight:1 }}>{count.toLocaleString()}</div>
              <div style={{ fontSize:12, color:C.sub }}>{count===1?"person is":"people are"} on the<br/><span style={{ color:C.blue, fontWeight:600 }}>Bitcoin journey</span> with you</div>
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:6, alignItems:"flex-end", minWidth:210 }}>
            {useDots ? (
              <>
                <div style={{ fontSize:9, color:C.muted, letterSpacing:1.5 }}>EACH DOT = 1 STACKER</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:5, maxWidth:210, justifyContent:"flex-end" }}>
                  {Array.from({ length:count }).map((_,i) => (
                    <div key={i} style={{ width:8, height:8, borderRadius:"50%", background:i===0?C.gold:C.blue, opacity:i===0?1:0.5, boxShadow:i===0?`0 0 6px ${C.gold}`:"none" }}/>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize:9, color:C.muted, letterSpacing:1.5 }}>YOUR SHARE</div>
                <div style={{ width:210, height:8, background:C.border, borderRadius:999, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${fillPct}%`, background:`linear-gradient(90deg,${C.goldDim},${C.gold})`, borderRadius:999 }}/>
                </div>
                <div style={{ fontSize:10, color:C.sub }}>You are <span style={{ color:C.gold, fontWeight:700 }}>1</span> of <span style={{ color:C.blue, fontWeight:700 }}>{count.toLocaleString()}</span></div>
              </>
            )}
            <div style={{ fontSize:9, color:C.muted }}><span style={{ color:C.gold }}>●</span> you &nbsp;<span style={{ color:C.blue }}>●</span> others</div>
          </div>
        </div>
        <div style={{ marginTop:14, padding:"10px 14px", background:C.blueLight, borderRadius:10 }}>
          <div style={{ fontSize:10, color:C.blue }}>🔒 <span style={{ color:C.text }}>Privacy guaranteed</span> — no names, no balances, no locations shared.</div>
        </div>
      </div>
    </Card>
  );
}

// ── Google Sign In ────────────────────────────────────────────────────────────
function GoogleSignIn({ C, dark }) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const handleSignIn = async () => {
    setLoading(true); setError(null);
    try { await signInWithGoogle(); }
    catch (e) { setError("Sign-in failed. Please try again."); setLoading(false); }
  };
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.92)", backdropFilter:"blur(14px)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:dark?"rgba(15,16,18,0.97)":C.card, borderRadius:28, padding:"44px 36px", width:"100%", maxWidth:420, textAlign:"center", boxShadow:shadowMd, border:`1px solid ${C.border}`, position:"relative", overflow:"hidden" }}>
        {dark && <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${C.gold}80,transparent)` }}/>}
        <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at top, rgba(247,147,26,0.06), transparent 60%)", pointerEvents:"none" }}/>
        <img src={LOGO_SRC} alt="Sat Stacker" style={{ width:72, height:72, borderRadius:20, objectFit:"cover", margin:"0 auto 20px", display:"block", boxShadow:`0 8px 32px ${C.goldGlow}` }}/>
        <div style={{ fontSize:22, fontWeight:900, letterSpacing:-0.8, color:C.text, marginBottom:8 }}>SAT STACKER</div>
        <div style={{ fontSize:12, color:C.muted, marginBottom:36, lineHeight:1.7 }}>Track your sats. Own your journey.<br/>Sign in to sync across all your devices.</div>
        {error && <div style={{ fontSize:11, color:C.red, marginBottom:16, padding:"8px 12px", background:C.redLight, borderRadius:8, border:`1px solid ${C.red}30` }}>{error}</div>}
        <button onClick={handleSignIn} disabled={loading}
          style={{ width:"100%", padding:"14px 20px", borderRadius:14, border:`1px solid ${C.border}`, background:loading?C.cardAlt:dark?"rgba(255,255,255,0.06)":C.cardAlt, color:C.text, fontFamily:"system-ui,sans-serif", fontSize:13, fontWeight:600, cursor:loading?"default":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:12, marginBottom:16, transition:"all 0.2s" }}>
          {loading ? (
            <><div style={{ width:18, height:18, border:`2px solid ${C.border}`, borderTopColor:C.gold, borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>Signing in…</>
          ) : (
            <><svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/><path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>Continue with Google</>
          )}
        </button>
        <div style={{ fontSize:10, color:C.muted, lineHeight:1.7 }}>Your stack data is private and secured.<br/><span style={{ color:C.sub }}>No financial advice. DYOR. 🟠</span></div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Profile Modal ─────────────────────────────────────────────────────────────
function ProfileModal({ onSave, existing, onClose, C, dark }) {
  const [username, setUsername] = useState(existing?.username||"");
  const [avatarId, setAvatarId] = useState(existing?.avatarId||AVATARS[0].id);
  const [focused, setFocused]   = useState(false);
  const isValid = username.trim().length >= 2;
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", backdropFilter:"blur(12px)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20, overflowY:"auto" }}>
      <div style={{ background:dark?"rgba(15,16,18,0.97)":C.card, borderRadius:24, padding:"32px", width:"100%", maxWidth:520, margin:"auto", boxShadow:shadowMd, border:`1px solid ${C.border}`, position:"relative" }}>
        {dark && <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${C.gold}80,transparent)`, borderRadius:"24px 24px 0 0" }}/>}
        <div style={{ fontSize:18, fontWeight:800, color:C.text, marginBottom:4 }}>{existing?"Edit Profile":"Set Up Your Stacker Profile"}</div>
        <div style={{ fontSize:11, color:C.muted, marginBottom:24 }}>{existing?"Update your username or avatar anytime.":"Choose a username and pick your Bitcoin avatar."}</div>
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:9, color:C.muted, letterSpacing:2, marginBottom:8, fontWeight:600 }}>USERNAME</div>
          <input value={username} onChange={e => setUsername(e.target.value.replace(/\s/g,""))} placeholder="e.g. satoshi_nakastack" maxLength={24}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            style={{ ...iBase(C,dark), border:`1.5px solid ${focused?C.gold:C.border}`, boxShadow:focused?`0 0 0 3px ${C.goldLight}`:"none" }}/>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
            <div style={{ fontSize:9, color:C.muted }}>No spaces · min 2 characters</div>
            <div style={{ fontSize:9, color:username.length>20?C.gold:C.muted }}>{username.length}/24</div>
          </div>
        </div>
        <div style={{ marginBottom:28 }}>
          <div style={{ fontSize:9, color:C.muted, letterSpacing:2, marginBottom:14, fontWeight:600 }}>CHOOSE YOUR AVATAR</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10 }}>
            {AVATARS.map(a => {
              const Av = a.Component;
              return (
                <div key={a.id} onClick={() => setAvatarId(a.id)} style={{ cursor:"pointer", borderRadius:14, padding:4, border:`2px solid ${avatarId===a.id?C.gold:C.border}`, background:avatarId===a.id?C.goldLight:dark?"rgba(255,255,255,0.02)":C.cardAlt, transition:"all 0.2s", position:"relative" }}>
                  <div style={{ width:"100%", aspectRatio:"1", borderRadius:10, overflow:"hidden" }}><Av/></div>
                  {avatarId===a.id && <div style={{ position:"absolute", top:4, right:4, width:14, height:14, borderRadius:"50%", background:C.gold, display:"flex", alignItems:"center", justifyContent:"center", fontSize:8, color:dark?"#000":"#fff", fontWeight:900 }}>✓</div>}
                  <div style={{ fontSize:7.5, color:avatarId===a.id?C.gold:C.muted, textAlign:"center", marginTop:5, fontWeight:avatarId===a.id?600:400 }}>{a.label}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          {existing && onClose && <button onClick={onClose} style={{ flex:1, padding:"13px", borderRadius:12, border:`1.5px solid ${C.border}`, background:"transparent", color:C.muted, fontFamily:"system-ui,sans-serif", fontSize:12, fontWeight:600, cursor:"pointer" }}>Cancel</button>}
          <button onClick={() => isValid && onSave({ username:username.trim(), avatarId })} disabled={!isValid}
            style={{ flex:2, padding:"13px", borderRadius:12, border:"none", background:isValid?C.gold:dark?"rgba(255,255,255,0.05)":C.border, color:isValid?(dark?"#000":"#fff"):C.muted, fontFamily:"system-ui,sans-serif", fontSize:12, fontWeight:700, cursor:isValid?"pointer":"not-allowed", letterSpacing:0.5, transition:"all 0.2s" }}>
            {existing?"Save Changes":"⚡ Start Stacking"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Goal Modal ────────────────────────────────────────────────────────────────
function GoalModal({ onSave, onClose, C, dark }) {
  const [mode, setMode]     = useState("preset");
  const [preset, setPreset] = useState(null);
  const [custom, setCustom] = useState("");
  const [unit, setUnit]     = useState("sats");
  const [focused, setFocused] = useState(false);
  const presets = [
    { label:"1M sats",   value:1_000_000,   desc:"≈ 0.01 BTC · Starter" },
    { label:"10M sats",  value:10_000_000,  desc:"≈ 0.1 BTC · Solid" },
    { label:"21M sats",  value:21_000_000,  desc:"≈ 0.21 BTC · The Magic Number" },
    { label:"50M sats",  value:50_000_000,  desc:"≈ 0.5 BTC · Half-coiner" },
    { label:"100M sats", value:100_000_000, desc:"= 1 BTC · Whole-coiner 🏆" },
  ];
  const handleSave = () => {
    const val = mode==="preset" ? preset : (unit==="sats" ? parseInt(custom) : Math.round(parseFloat(custom)*1e8));
    if (!val || val<=0) return;
    onSave(val);
  };
  const satsVal = custom && parseFloat(custom)>0 ? (unit==="sats" ? parseInt(custom) : Math.round(parseFloat(custom)*1e8)) : 0;
  const disabled = mode==="preset" ? !preset : !custom;
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", backdropFilter:"blur(8px)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:dark?"rgba(15,16,18,0.97)":C.card, borderRadius:24, padding:"32px", width:"100%", maxWidth:480, boxShadow:shadowMd, border:`1px solid ${C.border}`, position:"relative" }}>
        {dark && <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${C.gold}80,transparent)`, borderRadius:"24px 24px 0 0" }}/>}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
          <div>
            <div style={{ fontSize:18, fontWeight:800, color:C.text }}>Set Your Stack Goal</div>
            <div style={{ fontSize:11, color:C.muted, marginTop:4 }}>Choose a target that motivates you.</div>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, border:`1px solid ${C.border}`, background:dark?"rgba(255,255,255,0.05)":C.cardAlt, color:C.muted, cursor:"pointer", fontSize:14, fontFamily:"inherit" }}>✕</button>
        </div>
        <div style={{ display:"flex", gap:8, marginBottom:20, background:dark?"rgba(255,255,255,0.03)":C.cardAlt, borderRadius:12, padding:4 }}>
          {["preset","custom"].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{ flex:1, padding:"9px", borderRadius:10, border:"none", background:mode===m?(dark?C.cardAlt:C.white):"transparent", color:mode===m?C.gold:C.muted, fontFamily:"system-ui,sans-serif", fontSize:11, fontWeight:600, cursor:"pointer", transition:"all 0.2s" }}>
              {m==="preset"?"⚡ Presets":"✏️ Custom"}
            </button>
          ))}
        </div>
        {mode==="preset" ? (
          <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:24 }}>
            {presets.map(p => (
              <div key={p.value} onClick={() => setPreset(p.value)} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"13px 16px", borderRadius:12, border:`1.5px solid ${preset===p.value?C.gold:C.border}`, background:preset===p.value?C.goldLight:dark?"rgba(255,255,255,0.02)":C.cardAlt, cursor:"pointer", transition:"all 0.2s" }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:preset===p.value?C.gold:C.text }}>{p.label}</div>
                  <div style={{ fontSize:10, color:C.muted, marginTop:2 }}>{p.desc}</div>
                </div>
                <div style={{ width:18, height:18, borderRadius:"50%", border:`2px solid ${preset===p.value?C.gold:C.border}`, background:preset===p.value?C.gold:"transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {preset===p.value && <div style={{ width:7, height:7, borderRadius:"50%", background:dark?"#000":"#fff" }}/>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ marginBottom:24 }}>
            <div style={{ display:"flex", gap:6, marginBottom:12, background:dark?"rgba(255,255,255,0.03)":C.cardAlt, borderRadius:10, padding:4 }}>
              {["sats","btc"].map(u => (
                <button key={u} onClick={() => { setUnit(u); setCustom(""); }} style={{ flex:1, padding:"8px", borderRadius:8, border:"none", background:unit===u?(dark?C.cardAlt:C.white):"transparent", color:unit===u?C.gold:C.muted, fontFamily:"system-ui,sans-serif", fontSize:11, fontWeight:700, cursor:"pointer", transition:"all 0.2s" }}>
                  {u==="sats"?"⚡ Sats":"₿ BTC"}
                </button>
              ))}
            </div>
            <input type="number" placeholder={unit==="sats"?"e.g. 5000000":"e.g. 0.05"} value={custom} onChange={e => setCustom(e.target.value)}
              onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
              style={{ ...iBase(C,dark), border:`1.5px solid ${focused?C.gold:C.border}`, boxShadow:focused?`0 0 0 3px ${C.goldLight}`:"none" }}/>
            {satsVal>0 && <div style={{ marginTop:10, padding:"10px 14px", background:C.goldLight, borderRadius:10 }}><div style={{ fontSize:10, color:C.goldDim, fontWeight:600 }}>{unit==="sats"?`= ₿ ${(satsVal/1e8).toFixed(8).replace(/0+$/,"").replace(/\.$/,"")}`:`= ⚡ ${satsVal.toLocaleString()} sats`}</div></div>}
          </div>
        )}
        <button onClick={handleSave} disabled={disabled} style={{ width:"100%", padding:"13px", borderRadius:12, border:"none", background:disabled?(dark?"rgba(255,255,255,0.05)":C.border):C.gold, color:disabled?C.muted:(dark?"#000":"#fff"), fontFamily:"system-ui,sans-serif", fontSize:13, fontWeight:700, cursor:disabled?"not-allowed":"pointer", transition:"all 0.2s" }}>
          ⚡ Set My Goal
        </button>
      </div>
    </div>
  );
}

// ── Logo ──────────────────────────────────────────────────────────────────────
const LOGO_SRC = "data:image/png;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCADKAMoDASIAAhEBAxEB/8QAHQAAAQQDAQEAAAAAAAAAAAAABwIDBggABAUBCf/EAGAQAAECBQEEBQQIDBEKBwEAAAECAwAEBQYRIQcSMUEIE1FhcRQigZEVIzJCcqGxshYzQ0RSYrO0wcLS0xckJSY0NWNzgoSSk5Sio9HwRlNUVVZkZYXD4RgoNkVmg6Tx/8QAGwEAAgMBAQEAAAAAAAAAAAAAAAECBAUDBwb/xAAxEQACAgIBAgQFAwIHAAAAAAAAAQIDBBEFITESE0FRBiJxgfAjMmEUoSQzNFKRsdH/2gAMAwEAAhEDEQA/AKZRkZCkJUtYQhJUpRwABqTAAmO7bVoXHcbyW6RSpiYCjjf3cI/lHSCtss2QSbMii6NoTvkdN3sMSoG84+vjupTxUru0A98RwgtS1wzLjRkLakEUWnNN4IZKQ7ujiXHsDdHaE7qfHjAAIKR0d671PW3DWafScjIbUsFf8kkH1RIZHYLZwaCZq7n3XPfFplQHzDExorzdVnFS1vSNWuebScOJo8oXWkn7eYXhA8QTE6p1g7T32t5Fk0iQGM4qFc31nxDScA+mDYgPf+H2zlfS7lnPS0v83DyejzZ+7rcM+T2hKsfc4NBsPasjARb1lEY51WY/ujDZG1wDCaBZQ8KrMf3QtgBlro62opRxX5sgfaq/Nw8OjfbChlFYmz4735EGFNm7YUHKbfso9mam+YdRa22xA82gWUP+YPQACBvoy0Bac+ysz/LI/EhxHRdoy87lUfOP3U/kQYUUDbqkjdoVlaf746fww+1SdvbZGKJZGnbNO/3wwA2OinTljLdSe/pA/Ijck+iZKpcClPqeGOBmwPxIL6JXpBI1TRrH4f590/jQtI6RCNE0Sxxr/nHD+NAAIpnojMvABhZbx/vwP/Th5rog+1pBabUocSajgn+zgsl/pIIOUUWx88sKc/LhJnukyPc0eyE/zn5cAAge6HUyt0qQsNpz7kT4/Nw8nofuh1CtwbqRgj2RGvf9Kgr+yPSe/wBT2R/aflwn2R6UONKPYw/nfy4Bgqm+h886B1QDWP8AiCT/ANIRovdDqphJ6taSeX6eSfxBBhVUelGMH2Hsc+HWflwy7XelJKDrVWjZ8+kHO408pJx6XBAIrxcfROvGRStyVRMOJSM6IS4P6qiT6oFF0bKrvoLjiXqep/qxlYbSrfSO0oICgPRF3Gdv9zW44G9pmyyt0VkHC56Sy8yO/B5eCjBEota2dbWaIp6lz1OrTScFSD5r7B5ZScLbPfpCGfKdxC21lDiSlQOCCMEQmLs9ILo5Sz8u9V6OFrCQVF1KMvNjtUB9NT3jzh3xTy6bfqVuVNUhUWglWN5txJyh1J4KSeYhgcmMjIyADIOHR5siTblnr7uWWUunygHkzPBTyySEpT9soggH3oClchkU2TRHbiuaTpTYVuury4UjJCBqo+OAYtXXJZInZG1JNaGJKloKHDnCEO7oLyyexAG6D2IzzMAHHqtQcqT7tx3C4pqXRuy0vLyyM4+wlZZGeP8A3Uo54lbZ7sYcrMtL1baS0WJQkOylrsOlLTY96qZWMF1zu0A+KGejzabNwTjO0qpyxTTmFLl7VknU6IbBwqcWD79agSOzHcIPCnMqKicknJPbAkIyQbZp8i3IU2Wl5CUZGGpeWaShCB2ADQQ4pxROSrORrCBg6xmIAFZPLEOJGmeHoENp4nIhzwgAcSPD1QtJOeWvdCEcIWM9kAxzeJONPVHoUe0+uE4OR2w4BrrpCAzU/wD9hWvI/GY89eYUB2dmYipJ9mGtGa54n1woZJ5+sxgHfzhxOCMZiYCSCO0+kx5nx9ZhwDPCMOmIAGjntPrjMnEOKHfwhJTAA26lLzam3UpWhQIUlQBBgNbSNhVLnZ36Kdns2u0LrYytl+TUUNPK4lK0jQA88DHaDBnxrCFA8jiAAPbHtqk7cFSm7Cv6npo1705JLrJG63PNji81341KRkY1GmcD3pPbI5afpD1QkGW25dSis4T+xXVcFjsQo6KHAE73bBR6QOzpy66OxcNvKMld9FV5RSp1vRe8nXqyeaVcNeBPYTGzsouqV2n7OWajMyqEOvJXK1KSI0ZfT5rrZHHB4jPIiAD5iVGTmKfPPSU20pp9lZQtChgggxrwbulNYj1uXK/NJQVeTveTvL5rQRvMuHvKCAe9JgIwAHXonUQGuzNxPIBRJoWtG9w9rQpz5yEj0wQqxTpqo0xmhSi1eyVzVJmjocHuktrVvTDn8kEHuUY4fRYTmyaoe1h5Prelx8ileuCnsvlRObdLQl3QCKdTajUgnlvqCGgfUowMQfJSUlKVJS1JpzQZkpJlMtLNpGiEIAAHxQ8k8PDjiEu6vGPQTpnOkAh1JOYWeUMpOgh7iBpABnEw6gDdA5Q0IWN7GBrASQ8ngMQoHUDXMNowcRxrru+h2vLBdSmh16h7XLNgKdc8ByHedO+K9+TXRHxTejpXVO1+GC2SAboAUSMcc8ogV57TqdS1LkqKlNTnU5ClJVhpo96hxPcPiga3hf8AW7lKmd5VPpqtBKsqJUvuWrifAaeMdGytnVUq6W5moBdKkMDdBT7c4O5J9z4nXuj47M5vJzp+Tgx+5vUcZVjx8zKf2OZOXfcs7O+UzFemWnAcpQyrq20+CRx/hZiaWbtRmZdaJS409a1/pjYwofDSPlHqib0m1rbptPVIS9MYLbg3XC4kKU58InjENuvZeWwuctteU8TJuK4fAUeHgYoy4zmMD9eE/E/VHdZnH5X6Uo+H2YVafOytQlUTMlMNvsrGUrQoEH1RsjjjGIrfRavWLYqJRLKek3kn22VcB3VH7ZJ+UQWbQ2jUyrFErPhMhOq0CVHKFnuV+AxucZ8T05D8q/5J/wAmbmcRbSvHD5o/wTgHEeKOY8CgoBSTvDtEZkcjH1CkmtrsZHro9GoMZCSdeMe57YkAlQ4Q2od8OK4DlCVcoYHgHDxgHW0yLE6TlYoDO63SbwkRVJdA9yicaJDgHZvJ3ifRBwPAjGsB3pENmnXbs2udsAOStfEqpR5tvJ1HxH1wgI50xLYZqFPRMBvKp6nus6D37JDiD47qnI+fSkqSopIIIOCDH096SScWZTX8DebnlIz3Fh5Jj5n1XAqk2P3dfzjDAtF0X5ZpFkPpaR5zkk4tXj5RLwTtkzSm+kNIpOPNtWaI/pDcD7orNb9tBviVUt1WP/vloJtgN9T0lJdHDFpTBx/GW/7oT7iQY3cdadeUeZ7sxk0fbFJ74Sk90S0A8g6eMOJI3YZSfNHLEOpxCAXjnyhTZBIHKEkgiPWsggg+vwiFkvDBscVtpAq2n7TpiSqkxblsBImWPMmp5SchtXNCBwKhzJ0HYYHVvUKs3LU3DL78w8o5mJuYWSB8JR1J7hHIpyXJ6vzTSVhT0xOOneWdCorUckx3JCbqdDnQ7LPOSr5GRuq3kODt7FCPKM/kXkZer38u+38HoeNgwx8ZeV+5ruFm0LNpNulD6x5fUU/XLydE/ATwHjxiZsPlSjk/94HFsX9JzqkStYQmRmFaB0fSlnvz7k+OkTynL3pttCTvAq5ccdseicVZgvH8WProfFchDKV36x10BRycGNtlW6nGCSYG1GveszW0ly3nmJHyITTzW8lshzdQklOpOCdByjb+jCsHaULdTLyiaeJnqi5uHfKer3sZzxz3Qo8xRJffRB4Nqf22Sm6bYpVxy/Vz0uOtSDuPo0WjwP8AgQHrusurW7vOrxOyA+rpGFJ+EPwiCnfF7U+1ilh6XmX5txOW0JbIR6VnzflPdAkuS66rcUwDOOq6on2uWZB3QeWnFR/xpHynxVHB10j+o+2ja4V5W+/yeuzetS96tb6kNvLXO04e6bWcrbHak/gMHSmzbU9JNTjC0radQFpUk6EHWK31OSn5AS4qEqqXMykqbSvRWBjORy48IM+xl1TmzynbxJ3d9Iz2BagIj8IZ+Q7pY12+nuT57FpUFdV6kvPHMZwjF546x5k9sehny56o8oSeGIwkiE8BqYYGa84EXSqSfoRtZwHCk3PJgd2Urgt5weMCbpVj9ZNtk/7UyPx78IDodJMZsSnHOc1FPxtOx8zqv+2s3+/r+cY+lnSKcC7FpKSoazzR/sXI+alY/bec/f1/OMAFt+h631kg0gnRVIf+7y8E222uq6VCWwNBaD33ymBT0InFrK0rWVBNLfCQTw9vYgvUQ/8Amx00xabv3wiH6iQT5j6arTnmEJJzkwp84XxMJSCOcS0R2OBWsLQdQAOMNcTmFpzjUQNAmPHEKb1Vj/HCGwQQPwwpone5Rwv/AMuR0r/ciplrOZutsDH7NXoeY3lZjvSczLS9KfQGX1tsJDzslNIKT1eD56D73XAO7444iItbDgF3sg5/Zq+HHO8rhG+zNuy84wJqp05U6zoGph1SlKSr3SVr9zlQOMHQR41nVeK+X56v836HqMIp1R+h3EySJ55CJAbywG3HpV5YC20HGoPBacHlrw0gi3belYodzPUqUbkm5VtttTKnJRRzkD328ATnQAQM32mGDuvtrfRLJEw02T56m0nPVLGpwknO8OKdYnVp12o3BVJulVubZqEuunuvOsCWSGGlgJKdxR1OAfXFri8pwrlVCTTfYzOQx9yVkltI4EpVZqXuEXA26lqa33Hll2XIbQtSfcbu9kZBzG0uuzX0RqrSJ6VVPh/RTbYILm6U4AzwxjWGrDlW5i57eZmkofQ6+FnrMe2oLRwSOGAQR26Qc562rfeZW05SJDcI1PUpB8eHHvjtx/GZWXVKat1p/wBynmZdFFii4b2iDSF/NT7aqbdUjKTUg4oNOPpQQEKPDeQc6Z98IlFEtS37ceVMyEsXHXFEodeVvqQk+9SeQ/xmApNpYlmqjKtLU7LMPvMMkKB30AkDUanHDXjmDfTEzDVs0tuaKg+iWaDmeOd0Zjc+GsiebdOGSlJx9TO5SmOPBSqelL0IHtseBrdJ1H0lw+Ooic7EsK2eU85HunPuioG22hX6t0nJ4y7hx/CET/YxOy0nsxkpicmGpdpKncrcWEpHtiuZieB4Yc3a320dMyLfG169yenujxWnExAq5tVtmTUpuQccqjwzgSyfM9Kzp6sxBq5tQuWdbUmSbl6W2CfcDrXMeJ0+KNzL+I8LHfhctv8AgzKOIybltR0g55GY8UdI4dg+WmyqUuoTLszNOMBxxx05USrztfDOI7OsbVNnmwU/czpx8EnH2MOIE/Srx9A1t4/2qkPlXBVUTnMCfpVn9Y1taf5VSH/UjoRM28PB2zaajGMTbXxMuR84qwf1WnP39fzjH0J29Ok2Wx7YUETadQeHtbsfPKp59kprzs+3L19JgAtf0J1BBcP/AA18f2rMGKged0qivTBtJ374RAT6Gqg0w6oKzmSe9HtjMGu1FBzpMIWAM/Qk/wDfKYPUQT3tV5hAzwzCnVAL17o8PxRM5mb2mD8kLCtNIaUNdI9CtfdYgZJD6CMa8YUj3Qjn1GoyNNk1z1RmmpaWR7pbhAHhjme4Rw7MvGVuauzknISbiJSXYDqJh04W6c40TxCfGM/IzKluvfVlunGsep66FY7bcIvRo54Tzp9AUuNumrlpZhTLTkp1L561qZm2QUvggBSFKxlJTrp2nPZnm2msG8Wird/bBwYPDO8qOtLqQ1T233C3RVPp3iy4110vMnOMhGpB9B9EeYZy1fJfT/t/V/2/9XpuOv0ov89Dq06aYS3UEMTDbsvJvtGRfdzupUvRTWeJQRvDw1icbMZJ5quTLrSlmmopsyhhtRyZdZ3SppXbjkc6jURCkeUpl5aRW3ItPNy5nH3XZXLTKVHCUpaAxvYGpIzrHd2dT65S4JyXPVJWuQd6xtonqXQWypt1IOqTooFPfyiniaV6f57b+/f7lXOi3U9GpRp5+nqlZ6WdbZflWm3GnMZSz7WU4UknXOT6461Rvivzra5aeuJKmFNgLQyQ3vlXIEIzjt1jnbNHhM3dbaFJS6yp1sOhRChvhlWMcwMY9UWKy0pRQGWyjhgpHH+6NniuLvzK5uNrit9jHz8uuicU4beivsg8GJiWeRLsTKGHEqQyTlpzc13d7HI8Cc5MG+l1aTuG32apIk7qzuqQfdNrBwUmBTtMZp0teM6xS2UBoSyFzaGEp3Uv5JBx27uDgfhiTbGlPKo1ZcKlKZXUQG8jGVBCd449UWfhl2YefPFT2vcr8tGORjRu1o4O2oKFbpWv1s4NPhCJZs8o1Kr+xqXp9ZaSuVK3l7xONwhxWFA8iIiu2lSTWaWOGJZzh8IRE5q56iu1Ja2mV9RINBRdCVec8Soq1PJOvDnEMnMhicndKS3tFqrEsysKqMOmmNTIlJWfmJWRnPLJVpZQ1Mbu71gA7Pw8+MOS4M3NS8k3quYdQyPFRA/DG9s3tCdu2e6wdZL0hk4dmMfTCPqaO3vPLxiWymzWo0faPR5mUUueovlJcLhI35YpQSEr7RkDCvX35WNw1+TNWqPytl/I5Oiit0+LckgyMNoZYaZRhKG0BIHZgQokd0Nk5zy1jN7BwdY9cqj4YJI87k9ybFHh2wKulOjNl2sCcZuyQ+RyCmDntEC/pRjesy1RoD9Fcj8jkSBEb23qTMWclkK+u0/c3Y+f9UGKnNDH1ZfzjF8tpzqXraJ3slM2n5jsUMqf7ZTWp+nL+cYYFmOiJusU11WclUs8df31qDhs/WHekS2sZP605j76RAJ6L6+poBcGgLDif7RqDdspX1u3hhzjm1Zkf/qbgEFp3O/nujxKscY8dXgiEBRJznIiZzHFHODyPOIFd20mSkHXJCgNoqs+g7q3Crdl2D9sse6PcPWIXttmZ9m0JSSpz6mnqpUmZI4O6FJXnKSeQOBnugdUl6as2tMNViiy7brejKH05ZcweLTg03vHhHy3NcjkVzVVS6er9j6DjcKqUPMm+vojv0ez7ovGoJrFxzboZ9468ndSkdjTXLxPxwVLXodKt9IZkmcKXgPTDmrjnZk/g5RqW1d9JuJIal3TLzgGVSrxAWO9PJQ8I6cwsNZ7eBH98d+MwsZx8yL8Un6nDNybk/C1pIp7dknO2ftCqdPeQW35SeVMS6lp0W2VlSFDtBBHxxvsTrM4W3qIltuolWFJmHd5yWSTr1AOigMk6ed3c4sRfFu25elPEjcEqoqa+kTrOA/LHuOOHaDkd0V52hbJLqtEGoyqTXKKkb6J2VSSpsdq0DVPwhkeEY3J8JJTc/z7+59JxvNV2QUJdxr2aQxTRMsGaeEk6uTU+F7jyEklQKsg5SrztDwxE6t+ms2iHa7ck/KSs09Ty3Tqaw/1zznWAgOLPfk68Ne7ECyRrSZ2Rdk6y0uaamAN6bZUEzAwPNJPBYHYrXvgqVmpWhVFy1ZRWLg3G6c1LzLklJtrQ3uJ3Tvg5Ug49GuhjErxlX4unzen5/z6F3MslLWv2+ujkW3NzFLm5SoSDTK5unjfDeCpG8EFCyopGdNNOcd6q7QLzm0qQ/VmpBpTWVIlJco3c6DK1AlOe6NGgyMu7teYtSdmnp6n9eprLjm4txHUFxOdzHPBjeTI02Q6QbFClpZsSDT4CWF+enWW3uZOTnWIY2PlqOoz0m/Q43WUOXzR20jWtWgVi4UoMmwpqUVhSqg/vAJUc5IJ1dVqdeHhBOqNftywbflqWuY3ltoy3Lowp99Z1KyPe5J4nSIFtZ2jXBJXNULbo6WKe1KrCDMpG86vKUnTOiBr/wB4hVmWhc14zinabLuOtqX7dUJpRDeeeVHVZ7hn0RqUKOC3DHXim+7Kllf9RFTveoex1LluqauGpmoTwQ0gJ3GGEahpJPDPFRMTTZ/szm60puqXMh2Tp+d5uUOjswO1XNCe7ie7nKbL2fUC1XGppZ9laqnjNvp8xs9iE8E+Op74nrLpUePHjmNDA+HZWWf1GV1bKObzSjDycfoiP3xb9ZmaPKytszfkDMpqJWXPVb+PcgKHADs4GOLbl/1Cmvex11y7oU2d1U0EYUPho5jvTBCmp2Up0oZuemG5dlI1WtWPUOfhAvva5Ze45tqSp9MLqlH2p3qyX1/BA4Dx+KO3JuOHNTon83+0o4m714bI9PcKkpNy07LIm5V9t5lwZQtByDCyob2NdPlga7MpaqUS7pii1BpLCZuSM2lkObwCkqCc9x1OfRBIWMH443eOyp5NKnNaZn5VMarNRe0LCiBygZdJzW0bUH/y2R+RyCPvkpJzA16TBzaFqkf7WyPyORefQrIHl5u+VWxMJB+uE/Ndij1R3vZCYznPWq+Uxc+sOrdtqcCT54cRjx3XIpjUiDUZkgn6cv5TAhlh+jqtbdoLcPAIVj0uNwcdiay5tilHuRtac+KaagF7B1BOzt1XAgH7s3Bw2Bnf2lU9zttme++2oZEMLqsYhLZ8DHjo1jwdxiZEh22Y/qdavDBuSVHzo6LwlZ+Uckp+WampZzRbTqQpJ/u9EcbbWvFPtXT/ACklfx422XcLxnXlFOmqFk5KS2W7JyhXFxZF6/s/mZdQm7VmFOoSd4SEw5hbfe078gV64Zt+/wCrSDpptwS8xMFo7rnWDcmWvEHRYggyzucc/EwxelGp9dt6ZVMtJ8rlZdbkrMpGHG1JSVYzzScagxkZ3Eyo3fiy0/Y0cXkI26qvW9kfrV80tlj9Spd2cmCMhTqS22348yR2D1xq2BN38/V/Zz2SblqM4d+YTOI9ocQOPVo0KfhZA7SYj2yeRlrgrDr0+lLzMmw04GVDKVuLJAKu0DdzjhHM2m3ZVa/NzDKUPS1AZmFy7WEqDcytBwSpXA6jRPARk152TKrz8h/ZGg8SmM/KqX3JddNl7MNpNQmjadYlaRcaSSsMJwzMnmdw4Cx9sjXmcwErnoV37PKylFUlpinuklLM6wd5l4farGis80nXtEE3ZtT7RnktKCFO1tohSWppYSEke+aA0PywWUVJ2Yk3KdXqe1VZF0brjcw2FZHYQcg+n1xepxK+Rr8xJJnN51nHz8tvcSuuyutzNZ22USozvV+UTEyS4W07qSQypOcdukS55uZmulQRKSr0x1MyhTpbQVBtPkwG8rkBrxMTyjbO9mlJuWWuOmUyoSk5LL6xplDyy0leCM7pJ7eGcRMkTgQt9VMpzUop9W886EDfcOMZVjicaa5jtj8NKKSl6HPI5eEpOUEQSuWJadNu2p3ffVVbebm3w5KU1GTkBKR5yR5yzkcB5o55jevd64qxTGXbGqkomjNIAEpTx1byiOQVw0+w830xvXdIWyqSVOXKG0vqTutPJP6YUR9jz/BAvp03P0qqretxU066cqDCW99TzY19tQnT08op5mTVjX+Ul+71XclRXO+vzJPt6Mltp7QlKIlK+yvfQdxb6UYUkjktHd2iO9X9oMrJNqao7XlLo08odylpHgOKj6oid6LkK1bNPvWUa8mmilvrf3RtStxSFduDwVxxHe2RU6QnBNViaZS++xM9RLhYylrzQSoD7LXj3RzlZn+csWEvlfqNwxvLd8o9UN0e3bnu2aTUaxMPSsur3Lr489Q7G2+CR3n1GCZblApNvy5Zp0turVjrHlneccP2yvwDSHkvg8TqYcU7jEbuHxFWP80usvdmPkZ07ei6IjMy4n9GOTT20J37qIlLq8rI10iEPuH9GiRz/qF7j+/CJlrnGkd8TvL6kL10ie5HfA86R4CrUtRPbdsj8jkEA8M8IH3SI1tm0dM5u2T+Y7F0rIEBcDtu1EgnzXGjr4OxTuqboqc0ANOuX84xbqRJdtesAHGrX/ViodRz7ITOoPtqvlMCGH/YxlvZhNK4aJ+7Nwcuj1k3zSXNTm2aj9+NQCtkqsbKZo9gR92ag7dHbW6KEvttmpffjUSEF9zRRBMeJI4c4x/3emIQDjSGcyDbc1Bui24+vCUMXFKKWonASDvDJPLWHQpSVlOCnGcjnEprlLp9eoszSKtLJmZGZRuutk4yOIIPEEHBBgXVCiXnYaT5KiYu+2mxoR+2MkjkMfVUgf4EU/MdFjk10ZdUVfWop9UTVl8aYMbE3Nj2Inh/urvzDEWti4aRcMmZmjz7b6EfTG8brrR7FoOqfk746s8vFJns5/YrvzDHe+2NlEnH2ONFc4XRUvcgfR7mlLnqrgjRmV4+K47uyxxMxY/VPoQ60/OTZW2tIUhQLyuIMRTo5rzPVjIP0mWx61xI9kix9BErrj9MzP3ZcYPE1xsSjJdDb5KbgnKLFXBs2kJpSpy3nxT5gecJZxRLJP2ivdIPrENUG9a9bs6mj3bIPPBOgcWR1yU/aq9y6PTmJuysY45zGzOSlPq0iZGpyjU1LE5CFcUn7JJ4pPeIuZHEOt+bjPTKVPJKa8u9bR0aNWLfqskZuSqUsppAy5vqCFN/CB1ERa7doEvKJ8moCEvuKO6maWgkZ7G0DVZ+Lxge3LS1W9cSqUy4JrrQ2qUcdHnKStW6AvHMHPjBmtG1KVbgDyUibqZTuuTryQV94QOCE9w9OYyqcrkM6UqH8uu7L1lGLiJWrrvsiBUiy7huCZ9lbhfmKc05qS6QqadHYAdGx/jEEegUul0GUMpS5NDDZBK1DVazg6qUdVGOm6snOMRqOHVWM8D8kalPE040HLvL3KFmfZdNJdEBXykDYa1rndbHxTESvYjO71szpB4z6vmIiDKyNhZwNA2fviJFsNcUbWm/N+vlfMTFeH+uh9C1Yv8ACT+oV25okccZjcYdC8ZiMuzbctLrfmXm2WEDK3XV7qEjvJjhSd1Vu53DK2HI77AO67W51JRLN9obSdXD/jHONm/JhX07syKaJT69kSFKOs2yyxCc9Vb7hV3bzwx68RMHMBStdM8oj1l2vK223NTC5+ZqdVncGcn5hXnu4zhIHvUjkBHccVlWdMmOeNXKKcpep0vkm0l6Hij5sQHpBgqtyzwDr9F0n9zdidE6YzEH29DNv2dz/XbJ8B+5uxZOKAdb6t+3ayns6o/dIqRUUlNQmUnk6ofGYthaS0roFbycDDOfW5FUamoGpTRHAvLP9YwgDrsrVnZJOFP2nxPNQe+jeCa5bboxhVs1Qeqdaitux99Z2aVdpRJSHUBPd7c1FiujbMI8ss9Z4rpdakhrxWl+Xex/JUTDEGZ4ne0MMgk4hyYyFHOM6Q1EjmOIJxroYWheDkceR7IaBPYDCgcjnA0muo02uqIreWzug3FOey7anqLXUaoqsgerezr7tI0cHbnXviHVaoXbaVPm5W7qOuqSLjLjbNapbe8lWUkDrmuKD2nh4wXwojGPRC23lhRwd0ka88xTuxfEmoPRdpynFpy6lY9i9WqUhM1Fqj27PVqdmmWUMIZThpKkk5Ljh0SnURONlDUwzZ6JWZSlMxLzs0y8kHIStLysgHnrBoS8o4AwlIOcJGBnt0gaXTZ1w0esTtw2MpmdYnXTMVCgzS91Djp926w4T5izzSdCfVFTFxXhNPui1flRy049jqNac84jbYd3CCc4iLW5ddMrM2unYep1Yb0epk8jqphs9wPux3p9QiQJ7RrG3XdGxdDGlVOt9QfbS5tP6J9ARnJUmWzn9/gzmZJdOufOOkAXadvjaxbvH3Et93MG3zg8rXGFH5YxuPSWRYa2a90VnS63PdCXFgIUo6YST4jBjlVis0qh05VRrFQZk5UHdLjqtVHsSnio9wER1K7rvpgsyEvMWxbTwIXOzKf07OII1Dbf1JJHvjrjh2Rbyb4+Fwj1bKuPQ/Epy7IF4ma+zspEg9bM67JTjW/JT8qC4gp63eIdA1SePxR1tk9cq7FFmqPQrZnqtUHZouJVjq5dpO6kZccPDGOEHmmSktSaXK0yntlmWlmksspznCQMDJ5xtdeopIVkDsGnyRQhx1nmKxyL0+Qh5bhogNN2cu1Kaaqd/VQVl9B3m6axlEiwfg8XD3n44nrYbaaQyyhLTbeiEtp3UpHIADQR4Vk8fijzgY0q8eEOvqZ87pT+g71uuuY8Kjy4Q0ScZzpGA6cYsFdvqOLORjEQnbmoewlmD7K7pT7m7EyKu0jEQjbq6kU+yWlnUXCZkgfYsyr61H4oixxK/WutSrWuIJPndWzj+0irtQx5fMY4dar5TFmLUf6i0bgfVoncZBJ4+4dV+CKxTLocmHHADhSyr1mIkwqbEZ0zNErVEGOsXLrW32kgdYP6zYHpg1bDK81TqeiZWpKfodrrFScKuUlNJMpMq8E9Y0s/BisOzOuKoN2Ss1vJShawhRVwBz5pPcDiDhRZ6Ws/aAiZmJdUzQJ9lTM0xk4ekXwUrRpzAKh8JAhi9S4k+gszDrZGSlRHxxrk5xEd2d1J12QXa9RmxNVOjsN9TM/6yp6v2NOJ7d5I3F4zhaTniIkW7urKSNUnES2QYrPaIUOHDWEpORxj2GIVvaDIBhSTk4hskeiFJxnXSABzMOBQKePohoHTGnfiMOOAAhPqCOReVp2/d0mhiuyCXVtay802rcmJc9qHBqNdccIgk3KXpY5K5kTF4W+n68aT+qMqj7dH1UDtGumuIKSiRjSMC1pVvDKVciOMV50esejLNd+uk+qK3XvctBrF/wBEqlOqDTsmwiX61w5R1ZDxJCgcFJA4wRTd1ZuicdlNnlNE4ylZS5Wp0Kbk2Tz3BxdPcPjETSeta2J6acnZ22aPMTLhyp12VSVLParTX0x1mA20whllpDTTY3W20J3UJA5ADQCKFOFdGcm33L92ZTKEUl2Ixa9g06n1JNcrk49clfHCdnUjcZ7mWvctj4xE1UtSiSTrnUxqpWrU5PGFBwEcDGlXRGC6GZZdKfceyeJ1hR4DHKGQvvMe76Y7aOWxalFPpjzf5QkEHv8AGMAHCES2K39e6E7wHKEEY748OmuDgQER1PncDg8YDnSQrQRX0SjbgAodCfcXr9dT6gw0k94aDq/CCrWaxTbeoc5Xqu4puRkW+sc3RlSyThKEjmpRISBzJin21u5Z+drExJz43qrNTZn6uhJyG3ykIblgeYYa3UfDWuEyaNWozblN2UVGfbxmZddA3uGEoSgfG4r1RXaDDtrrKJC26baTK0qdQgGY3TwIJUr1uKV6EgwHoRIyDpsyrEvelvotubdQ3WJXWSdcUAFqOAWyToAvA1PBYHJRgFxt0mozdLn252TcLbqD6COYI5gwAXC2cV11uWkqPUKgaNVaQ6v2HqUwglMotWjspMp4mWcIwocUKG8OGh0t64ZesTS6VPSaqPcTDfWTFJdUFKKf87Lr4PsnktPDgoA6RVvZ5eFCvuSS3V5hMhWW0JR5WvULAGEpe5lIAwHRkgaLyAFQTWUVKQlJWkXHTU1amS5D0gS8UuSp49ZKTSDvI4A5SSD2Qb0LWw1KATkEYxxjwLTgYUNYg9HuOstoQiSr9PrjAORK3Gkys4kY0Am2UltzxW2D2mJDL3PO9Xme2f19KuP6nTknOtnwIcCvWkQ9kfCdjeT3RgUCOUcVV2yyfdWNfQ/5e2fkchtd5SKeNlXwPGno/Lg2g8LO8FAc8CFhYOIjDl9UxABNm3qPGRRp/XhtW0OkJ0NnXoPGRb/OQ9oNMluQdBgmPRk92kQ47RaMAP1n3l/QmvzkKRtFpJPm2beX9Ca/OQ9holxA7RGAE++HriJnaDTjwsu8yO6Sa/OQ43f9PI/9D3r/AENr85CGiUg4GpGfGM3ueREb+j2SPCx71P8AFG/zkNrvmVzkWPeY/irP5yHsTRJ8jON6M56GIsb7lcZNk3iP4s1+cjPo7leVm3h/R2vzkLYtEtbUOBIhYUMZyIiAvqV1/Wfdw8WGfzkYu/pVlJWbTuNIxqX1yrKfSpToxAGiX4J4g90a1bqFNoVLXV6zPNSEk2cFxfulKPBCU8VKPJIBJgXXHtulZBBT5fa1Cxn68NXnP4LUv7Wk/DXiAle+2Wcm53ymhmfcn9UIrVVUhc0gHQiWZSOqlgftAV/bQtklEm+2vaTNMzLT0215JUGTv0WhqIUqQJGBPTY4eUEZ6tn6nneOvEHUyal6RLKuqruq0UoySVKyt97XLgzxCTkg8168EqhpyXYpsq5W7scdCVkrTKKWfKJtZP1Q8UJJ4++P2o84QC7rjm7jnkTEw22y20ncZZbGEtp5ADkAAAB2CF3Glo0a3UpirVN6emVErcVoOSU8kjuA0jSjIyAZkZGRkAD0lNzMlMomZR9xl5BylaFYIgy7Ntu1Zt+TEhOOhUvvby21tB1hztKmzwJ+yQUk9sBSMgAuTRdtWz+pNJXUqMuVVjznKbOpxn96eAx4b5iRUzaLsrm3NxFarMt3LkUOfc1mKKQ4w4425vNuKQe1JwYNAX0mb22WMNBTt3T4xwBpi0k+sxpJ2ibKlKx9FVSRnmqnjHzooy8886QXXXFkcN5RMN5PaYWkBev9EXZduqxdk8nd4Zp418PPh9m9tnDrIdbumoKB5+xSj+NFDcntMPNTMw22EtzDqE9iVkCHpAXpXeGz9SfNuafVnn7Fn8uNR+7bGOiK/UdeZppH48UjM1NYH6Ze/lmPTOzn+lv/AM4YBFzZq4bQe0ars2ruMgfyoj09X7WL5Z9mlhRHv2N0fOiqnlk3gjyp/wDnDGspSiclRJ8YALQTk9QHP/e5UjvSNPjjjvOUR7e3axJDvUlIz8cV2ye0xmT2mAA8uStFezisU4fCCY5sxTKOokJrFOP8EQGMntMZk9sABVm6fRmPOerdKT2ZT/dGkpi3lEfq9Sx3hon5cQNoyAYT1ItGWZ65+5FPAfU5ZsIJ+cfijmzV70+noKbbpQZf4eVPnec9GufVjwiBRkAG1U6hOVKaMzPTC33TzVy8OyNWMjIAMjIyMgA//9k=";

// ── Main App ──────────────────────────────────────────────────────────────────
export default function SatTracker() {
  const [darkMode, setDarkMode] = useState(true);
  const C = darkMode ? DARK : LIGHT;

  const [profile, setProfile]                         = useState(null);
  const [googleUser, setGoogleUser]                   = useState(null);
  const [authStep, setAuthStep]                       = useState("idle");
  const [authLoading, setAuthLoading]                 = useState(true);
  const [showProfileModal, setShowProfileModal]       = useState(false);
  const [entries, setEntries]                         = useState([]);
  const [goal, setGoal]                               = useState(DEFAULT_GOAL);
  const [showGoalModal, setShowGoalModal]             = useState(false);
  const [goalCompleted, setGoalCompleted]             = useState(false);
  const [goalCompletedDismissed, setGoalCompletedDismissed] = useState(false);
  const [btcPrice, setBtcPrice]                       = useState(null);
  const [priceAge, setPriceAge]                       = useState(null);
  const [priceLoading, setPriceLoading]               = useState(true);
  const [form, setForm]                               = useState({ datetime:getLocalDatetime(), sats:"", notes:"", type:"add" });
  const [focused, setFocused]                         = useState(null);
  const [toast, setToast]                             = useState(null);
  const [expandedRow, setExpandedRow]                 = useState(null);
  const [celebration, setCelebration]                 = useState(null);
  const [fetchingPrice, setFetchingPrice]             = useState(false);
  const [stackerCount, setStackerCount]               = useState(1);

 // ── Auth state listener + stacker count ──────────────────────────────────
  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      if (user) {
        setGoogleUser(user);
        const data = await loadUserData(user.uid);
        // ── Restore user data ──
        if (data) {
          if (data.entries) setEntries(data.entries);
          if (data.goal)    setGoal(data.goal);
          if (data.goalCompletedDismissed) setGoalCompletedDismissed(true);
          if (data.profile && data.profile.username) {
            setProfile(data.profile);
            setAuthStep("idle");
          } else {
            setAuthStep("profile");
          }
        } else {
          setAuthStep("profile");
        }
        // ── Stacker count — increment only once per unique Google account ──
        try {
          const alreadyCounted = data && data._counted === true;
          if (!alreadyCounted) {
            await incrementStackerCount(user.uid);
            await saveUserData(user.uid, { _counted: true });
          }
          const currentCount = await getStackerCount();
          setStackerCount(currentCount);
        } catch (err) {
          console.error("STACKER COUNT ERROR:", err);
        }
      } else {
        setGoogleUser(null); setProfile(null); setEntries([]); setGoal(DEFAULT_GOAL);
        setAuthStep("google");
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // ── BTC price ─────────────────────────────────────────────────────────────
  const fetchPrice = useCallback(async () => {
    setPriceLoading(true);
    try {
      const res  = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_last_updated_at=true");
      const data = await res.json();
      if (data?.bitcoin?.usd) { setBtcPrice(data.bitcoin.usd); setPriceAge(new Date(data.bitcoin.last_updated_at*1000)); }
    } catch {} finally { setPriceLoading(false); }
  }, []);
  useEffect(() => { fetchPrice(); const t = setInterval(fetchPrice,90000); return () => clearInterval(t); }, [fetchPrice]);

  // ── Historical BTC price ───────────────────────────────────────────────────
  const fetchHistoricalPrice = async (datetimeStr) => {
    try {
      const d = new Date(datetimeStr);
      const now = new Date();
      if ((now-d) < 24*60*60*1000) return btcPrice;
      const day   = String(d.getDate()).padStart(2,"0");
      const month = String(d.getMonth()+1).padStart(2,"0");
      const year  = d.getFullYear();
      const res  = await fetch(`https://api.coingecko.com/api/v3/coins/bitcoin/history?date=${day}-${month}-${year}&localization=false`);
      const data = await res.json();
      return data?.market_data?.current_price?.usd || btcPrice || null;
    } catch { return btcPrice || null; }
  };

  // ── Persist helpers ────────────────────────────────────────────────────────
  const persist = async (next) => {
    setEntries(next);
    if (googleUser) await saveUserData(googleUser.uid, { entries: next });
  };
  const showToast = (msg, color=C.gold) => { setToast({ msg, color }); setTimeout(() => setToast(null), 3500); };

  const saveProfile = async (p) => {
    setProfile(p);
    if (googleUser) {
      await saveUserData(googleUser.uid, { profile: p });
    }
    setAuthStep("idle");
    setShowProfileModal(false);
    showToast("✅ Profile saved! Welcome to the stack!", C.green);
  };

  const saveGoal = async (val) => {
    setGoal(val); setGoalCompletedDismissed(false);
    if (googleUser) await saveUserData(googleUser.uid, { goal: val, goalCompletedDismissed: false });
    setShowGoalModal(false);
    showToast(`🎯 Goal set to ${fmt(val)} sats!`);
  };

  const addEntry = async () => {
    if (!form.datetime) return showToast("⚠ Pick a date & time", C.red);
    const sats = parseInt(form.sats);
    if (!sats || sats<=0) return showToast("⚠ Enter valid sats", C.red);
    const type = form.type || "add";
    if (type==="subtract") {
      const totalNow = entries.reduce((s,e) => e.type==="subtract"?s-e.sats:s+e.sats, 0);
      if (sats>totalNow) return showToast("⚠ Can't subtract more than you have", C.red);
    }
    setFetchingPrice(true);
    showToast("⏳ Fetching BTC price for that date…", C.muted);
    const historicalPrice = await fetchHistoricalPrice(form.datetime);
    setFetchingPrice(false);
    const entry = { id:Date.now().toString(), datetime:form.datetime, sats, notes:form.notes.trim(), priceAtAcq:historicalPrice||null, type };
    const next  = [entry, ...entries];
    await persist(next);
    setForm(f => ({ ...f, sats:"", notes:"", type:"add" }));
    if (type==="add") {
      setCelebration(STACK_CELEBRATIONS[Math.floor(Math.random()*STACK_CELEBRATIONS.length)]);
      const newTotal = next.reduce((s,e) => e.type==="subtract"?s-e.sats:s+e.sats, 0);
      if (newTotal>=goal && !goalCompletedDismissed) setGoalCompleted(true);
    } else { showToast(`↓ ${fmt(sats)} sats subtracted`, C.blue); }
  };

  const deleteEntry = async (id) => {
    const next = entries.filter(e => e.id!==id);
    await persist(next);
    showToast("🗑 Entry deleted", C.muted);
  };

  // ── Derived stats ──────────────────────────────────────────────────────────
  const totalSats = entries.reduce((s,e) => e.type==="subtract"?s-e.sats:s+e.sats, 0);
  const remaining = Math.max(0, goal-totalSats);
  const pct       = Math.min(100, (totalSats/goal)*100);
  const totalUsd  = satsToUsd(totalSats, btcPrice);
  const remainUsd = satsToUsd(remaining, btcPrice);
  const goalUsd   = satsToUsd(goal, btcPrice);
  const addEntries = entries.filter(e => e.type!=="subtract");
  const sorted_chron = [...entries].sort((a,b) => new Date(a.datetime)-new Date(b.datetime));
  let costBasisSats=0, costBasisUsd=0, unknownSats=0;
  for (const e of sorted_chron) {
    if (e.type==="subtract") {
      const totalHeld=costBasisSats+unknownSats; if (totalHeld<=0) continue;
      const kf=costBasisSats/totalHeld, rfk=e.sats*kf;
      if (costBasisSats>0) { costBasisUsd-=costBasisUsd*(rfk/costBasisSats); costBasisSats-=rfk; }
      unknownSats=Math.max(0,unknownSats-(e.sats*(1-kf)));
    } else { if (e.priceAtAcq) { costBasisUsd+=satsToUsd(e.sats,e.priceAtAcq); costBasisSats+=e.sats; } else unknownSats+=e.sats; }
  }
  const totalCostUsd = costBasisUsd;
  const avgBtcPrice  = costBasisSats>0 ? (costBasisUsd/costBasisSats)*1e8 : null;
  const pnl          = totalUsd && totalCostUsd ? totalUsd-totalCostUsd : null;
  const firstDate    = addEntries.length ? new Date(Math.min(...addEntries.map(e => new Date(e.datetime)))) : null;
  const daysStacking = firstDate ? Math.floor((new Date()-firstDate)/86400000) : 0;
  const sortedHistory = [...entries].sort((a,b) => new Date(b.datetime)-new Date(a.datetime));
  const goalLabel    = goal===100_000_000 ? "1 BTC" : `${(goal/1e8).toFixed(8).replace(/\.?0+$/,"")} BTC`;
  const badge        = getBadge(totalSats);
  const avatarObj    = profile ? AVATARS.find(a => a.id===profile.avatarId)||AVATARS[0] : null;
  const AvatarComp   = avatarObj?.Component;

  // ── Loading screen ─────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div style={{ background:darkMode?DARK.bg:LIGHT.bg, minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ textAlign:"center" }}>
          <img src={LOGO_SRC} alt="Sat Stacker" style={{ width:72, height:72, borderRadius:20, objectFit:"cover", marginBottom:16 }}/>
          <div style={{ fontSize:11, color:darkMode?DARK.muted:LIGHT.muted, letterSpacing:2 }}>LOADING SAT STACKER…</div>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ background:C.bg, minHeight:"100vh", color:C.text, fontFamily:"system-ui,sans-serif", transition:"background 0.3s, color 0.3s", position:"relative" }}>

      {darkMode && <>
        <div style={{ position:"fixed", inset:0, display:"flex", alignItems:"center", justifyContent:"center", pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
          <svg viewBox="0 0 100 100" style={{ width:"72vw", maxWidth:700, opacity:0.04 }}><circle cx="50" cy="50" r="50" fill="#F7931A"/><text x="50" y="72" textAnchor="middle" fontSize="62" fontWeight="900" fontFamily="Arial" fill="#F7931A">₿</text></svg>
        </div>
        <div style={{ position:"fixed", top:-200, left:"50%", transform:"translateX(-50%)", width:900, height:500, background:"radial-gradient(ellipse, rgba(247,147,26,0.08) 0%, transparent 70%)", pointerEvents:"none", zIndex:0 }}/>
      </>}

      {/* ─────────────────────────────────────────────────────────────────────
          SECTION 1 — App name + icon (header) with light/dark mode switch
      ───────────────────────────────────────────────────────────────────── */}
      <div style={{ background:darkMode?"rgba(7,8,10,0.92)":C.navBg, borderBottom:`1px solid ${C.navBorder}`, position:"sticky", top:0, zIndex:100, backdropFilter:darkMode?"blur(16px)":"none", boxShadow:darkMode?"none":"0 1px 8px rgba(0,0,0,0.07)", transition:"background 0.3s" }}>
        <div style={{ maxWidth:920, margin:"0 auto", padding:"0 20px", height:62, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          {/* Left: Logo + name */}
          <div style={{ display:"flex", alignItems:"center", gap:12 }}>
            <img src={LOGO_SRC} alt="Sat Stacker Logo" style={{ width:44, height:44, borderRadius:11, objectFit:"cover", flexShrink:0 }}/>
            <div>
              <div style={{ fontSize:16, fontWeight:900, letterSpacing:-0.5, color:C.text }}>SAT STACKER</div>
              <div style={{ fontSize:9, color:C.muted, letterSpacing:1.5, fontWeight:500 }}>BITCOIN SAVINGS TRACKER</div>
            </div>
          </div>
          {/* Right: theme toggle + sign out */}
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <ThemeToggle dark={darkMode} onToggle={() => setDarkMode(d => !d)} C={C}/>
            {googleUser && (
              <button onClick={() => logOut()}
                style={{ background:"transparent", border:`1px solid ${C.border}`, borderRadius:9, color:C.muted, padding:"7px 12px", fontFamily:"system-ui,sans-serif", fontSize:10, fontWeight:600, cursor:"pointer", transition:"all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.color=C.red; e.currentTarget.style.borderColor=C.red+"40"; }}
                onMouseLeave={e => { e.currentTarget.style.color=C.muted; e.currentTarget.style.borderColor=C.border; }}>
                Sign out
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ maxWidth:920, margin:"0 auto", padding:"24px 20px 80px", position:"relative", zIndex:1 }}>

        {/* ───────────────────────────────────────────────────────────────────
            SECTION 2 — BTC live price + profile/avatar
        ─────────────────────────────────────────────────────────────────── */}
        <Card C={C} dark={darkMode} style={{ marginBottom:16 }}>
          <div style={{ padding:"16px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:14 }}>
            {/* BTC price */}
            <div style={{ display:"flex", alignItems:"center", gap:14 }}>
              <div style={{ width:8, height:8, borderRadius:"50%", background:priceLoading?C.muted:C.green, boxShadow:priceLoading?"none":`0 0 8px ${C.green}`, flexShrink:0 }}/>
              <div>
                <div style={{ fontSize:9, color:C.muted, letterSpacing:2, fontWeight:600, marginBottom:3 }}>BTC / USD · COINGECKO</div>
                <div style={{ fontSize:26, fontWeight:900, color:C.gold, letterSpacing:-1, lineHeight:1 }}>{btcPrice?fmtUsd(btcPrice):"———"}</div>
                <div style={{ fontSize:10, color:C.muted, marginTop:4 }}>{priceAge?priceAge.toLocaleTimeString():"fetching…"} <span onClick={fetchPrice} style={{ color:C.gold, cursor:"pointer", marginLeft:4 }}>↻</span></div>
              </div>
            </div>
            {/* Profile chip */}
            {profile && AvatarComp && (
              <div onClick={() => setShowProfileModal(true)}
                style={{ display:"flex", alignItems:"center", gap:12, cursor:"pointer", background:darkMode?"rgba(255,255,255,0.04)":C.cardAlt, border:`1.5px solid ${C.border}`, borderRadius:14, padding:"10px 16px", transition:"border-color 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor=C.gold+"60"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor=C.border; }}>
                <div style={{ width:42, height:42, borderRadius:11, overflow:"hidden", border:`2px solid ${badge?badge.color+"60":C.gold+"40"}`, flexShrink:0 }}><AvatarComp/></div>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:C.text }}>@{profile.username}</div>
                  {googleUser && <div style={{ fontSize:10, color:C.muted, marginTop:1 }}>{googleUser.email}</div>}
                  {badge
                    ? <div style={{ display:"inline-flex", alignItems:"center", gap:4, marginTop:4, background:badge.color+"18", border:`1px solid ${badge.color}40`, borderRadius:20, padding:"2px 8px" }}><span style={{ fontSize:10 }}>{badge.emoji}</span><span style={{ fontSize:9, color:badge.color, fontWeight:700, letterSpacing:0.5 }}>{badge.label}</span></div>
                    : <div style={{ fontSize:9, color:C.muted, marginTop:3 }}>Stack to earn a badge 🟠</div>}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* ───────────────────────────────────────────────────────────────────
            SECTION 3 — Motivation quotes banner
        ─────────────────────────────────────────────────────────────────── */}
        <MotivationBanner C={C} dark={darkMode}/>

        {/* ───────────────────────────────────────────────────────────────────
            SECTION 4 — Progress toward goal
        ─────────────────────────────────────────────────────────────────── */}
        <Card C={C} dark={darkMode} style={{ marginBottom:16, position:"relative", overflow:"hidden" }}>
          {darkMode && <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${C.gold}60,transparent)` }}/>}
          {darkMode && <div style={{ position:"absolute", right:-16, bottom:-24, fontSize:160, color:"rgba(247,147,26,0.025)", lineHeight:1, pointerEvents:"none", userSelect:"none" }}>₿</div>}
          <div style={{ padding:"22px 24px 0" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18, flexWrap:"wrap", gap:10 }}>
              <SectionLabel C={C}>Stack Progress</SectionLabel>
              <button onClick={() => setShowGoalModal(true)} style={{ background:C.goldLight, border:`1px solid ${C.gold}40`, borderRadius:8, color:C.goldDim, padding:"6px 14px", fontFamily:"system-ui,sans-serif", fontSize:10, fontWeight:700, cursor:"pointer" }}>🎯 Change Goal</button>
            </div>
            <div style={{ marginBottom:18 }}>
              <div style={{ fontSize:36, fontWeight:900, color:C.gold, letterSpacing:-1.5, lineHeight:1 }}>{fmt(totalSats)} <span style={{ fontSize:15, color:C.muted, fontWeight:400 }}>sats</span></div>
              {totalUsd && <div style={{ fontSize:13, color:C.sub, marginTop:4 }}>≈ {fmtUsd(totalUsd)} USD</div>}
            </div>
            <div style={{ marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ fontSize:10, color:C.sub, fontWeight:600 }}>{pct.toFixed(4)}% of goal</span>
                <span style={{ fontSize:10, color:C.muted }}>Goal: {fmt(goal)} sats ({goalLabel}){goalUsd?` · ${fmtUsd(goalUsd)}`:""}</span>
              </div>
              <div style={{ height:6, background:darkMode?C.surface3:C.border, borderRadius:999, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${Math.max(pct,0.1)}%`, background:`linear-gradient(90deg,${C.goldDim},${C.gold})`, borderRadius:999, transition:"width 1s cubic-bezier(0.16,1,0.3,1)" }}/>
              </div>
              <div style={{ fontSize:10, color:C.muted, marginTop:6, textAlign:"right" }}>{fmt(remaining)} sats remaining{remainUsd?` · ${fmtUsd(remainUsd)}`:""}</div>
            </div>
          </div>
          {/* Stat strip — includes days stacking */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", borderTop:`1px solid ${C.border}`, marginTop:4 }}>
            {[
              { label:"Stacked",       value:`${fmt(totalSats)} sats`, sub:totalUsd?`≈ ${fmtUsd(totalUsd)}`:"—",              color:C.gold },
              { label:"Remaining",     value:`${fmt(remaining)} sats`, sub:remainUsd?`≈ ${fmtUsd(remainUsd)}`:"—",            color:C.sub },
              { label:"Progress",      value:`${pct.toFixed(2)}%`,     sub:`${entries.length} entries`,                        color:C.green },
              { label:"Days Stacking", value:`${daysStacking}`,        sub:daysStacking===1?"day on the journey":"days on the journey", color:C.blue },
            ].map((s,i) => (
              <div key={i} style={{ padding:"14px 12px", borderRight:i<3?`1px solid ${C.border}`:"none", textAlign:"center" }}>
                <div style={{ fontSize:9, color:C.muted, letterSpacing:1.5, marginBottom:5, fontWeight:600 }}>{s.label.toUpperCase()}</div>
                <div style={{ fontSize:14, fontWeight:800, color:s.color }}>{s.value}</div>
                <div style={{ fontSize:10, color:C.muted, marginTop:3 }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* ───────────────────────────────────────────────────────────────────
            SECTION 5 — Log entry form
        ─────────────────────────────────────────────────────────────────── */}
        <Card C={C} dark={darkMode} style={{ marginBottom:16 }}>
          <div style={{ padding:"22px 24px" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
              <SectionLabel C={C}>Log Entry</SectionLabel>
              <div style={{ display:"flex", gap:6 }}>
                {[{ val:"add", label:"⚡ Add Sats", col:C.gold },{ val:"subtract", label:"↓ Subtract", col:C.blue }].map(({ val, label, col }) => (
                  <button key={val} onClick={() => setForm(f => ({ ...f, type:val }))}
                    style={{ padding:"6px 14px", borderRadius:8, border:`1.5px solid ${form.type===val?col+"60":C.border}`, background:form.type===val?(darkMode?col+"18":col+"15"):"transparent", color:form.type===val?col:C.muted, fontFamily:"system-ui,sans-serif", fontSize:10, fontWeight:700, cursor:"pointer", transition:"all 0.2s" }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
              <div>
                <div style={{ fontSize:9, color:C.muted, letterSpacing:2, marginBottom:8, fontWeight:600 }}>DATE & TIME</div>
                <input type="datetime-local" value={form.datetime} onChange={e => setForm(f => ({ ...f, datetime:e.target.value }))} onFocus={() => setFocused("dt")} onBlur={() => setFocused(null)} style={iStyle(C,darkMode,"dt",focused)}/>
              </div>
              <div>
                <div style={{ fontSize:9, color:C.muted, letterSpacing:2, marginBottom:8, fontWeight:600 }}>SATS {form.type==="subtract"?"TO SUBTRACT":"ACQUIRED"}</div>
                <input type="number" placeholder="e.g. 50000" value={form.sats} onChange={e => setForm(f => ({ ...f, sats:e.target.value }))} onKeyDown={e => e.key==="Enter" && addEntry()} onFocus={() => setFocused("sats")} onBlur={() => setFocused(null)} style={iStyle(C,darkMode,"sats",focused)} min="1"/>
              </div>
            </div>
            <div style={{ marginBottom:16 }}>
              <div style={{ fontSize:9, color:C.muted, letterSpacing:2, marginBottom:8, fontWeight:600 }}>NOTES <span style={{ color:C.muted2, fontWeight:300 }}>(optional)</span></div>
              <input type="text" placeholder={form.type==="subtract"?"Why withdrawing?":"e.g. Bitnob DCA, Fiverr payment"} value={form.notes} onChange={e => setForm(f => ({ ...f, notes:e.target.value }))} onKeyDown={e => e.key==="Enter" && addEntry()} onFocus={() => setFocused("notes")} onBlur={() => setFocused(null)} style={iStyle(C,darkMode,"notes",focused)} maxLength={120}/>
            </div>
            <button onClick={addEntry} disabled={fetchingPrice}
              style={{ background:fetchingPrice?(darkMode?"rgba(255,255,255,0.05)":C.border):form.type==="subtract"?C.blue:C.gold, color:fetchingPrice?C.muted:(darkMode?"#000":"#fff"), border:"none", borderRadius:12, padding:"13px 28px", fontFamily:"system-ui,sans-serif", fontSize:13, fontWeight:700, cursor:fetchingPrice?"not-allowed":"pointer", width:"100%", transition:"all 0.2s", boxShadow:fetchingPrice?"none":shadowMd }}>
              {fetchingPrice?"⏳ Fetching historical price…":form.type==="subtract"?"↓ Log Subtraction":"⚡ Stack Sats"}
            </button>
          </div>
        </Card>

        {/* ───────────────────────────────────────────────────────────────────
            SECTION 6 — Portfolio overview stats
        ─────────────────────────────────────────────────────────────────── */}
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:9, color:C.muted, letterSpacing:2, fontWeight:600, marginBottom:10, paddingLeft:4 }}>PORTFOLIO OVERVIEW</div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
            <StatBox C={C} dark={darkMode} label="Current Worth" value={totalUsd?fmtUsd(totalUsd):"—"} sub={btcPrice?`@ ${fmtUsd(btcPrice)} BTC`:"awaiting price"} valueColor={C.green} accent={C.green}/>
            <StatBox C={C} dark={darkMode} label="Cost Basis" value={totalCostUsd>0?fmtUsd(totalCostUsd):"—"} sub={pnl!==null?`${pnl>=0?"+":""}${fmtUsd(pnl)} P&L`:"—"} valueColor={pnl!==null?(pnl>=0?C.green:C.red):C.text} accent={pnl!==null?(pnl>=0?C.green:C.red):undefined}/>
            <StatBox C={C} dark={darkMode} label="Weighted Avg Cost" value={avgBtcPrice?fmtUsd(avgBtcPrice):"—"} sub={avgBtcPrice&&btcPrice?`${btcPrice>=avgBtcPrice?"▲ +":"▼ -"}${fmtUsd(Math.abs(btcPrice-avgBtcPrice))} vs current`:"log a buy to track"} valueColor={C.blue} accent={C.blue}/>
          </div>
        </div>

        {/* ───────────────────────────────────────────────────────────────────
            SECTION 7 — Stacking history
        ─────────────────────────────────────────────────────────────────── */}
        <Card C={C} dark={darkMode} style={{ marginBottom:16, overflow:"hidden" }}>
          <div style={{ padding:"16px 22px", borderBottom:`1px solid ${C.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <SectionLabel C={C} style={{ marginBottom:0 }}>Stacking History</SectionLabel>
            <span style={{ fontSize:10, color:C.muted, background:darkMode?"rgba(255,255,255,0.04)":C.cardAlt, borderRadius:20, padding:"3px 10px", border:`1px solid ${C.border}` }}>{entries.length} {entries.length===1?"entry":"entries"}</span>
          </div>
          {entries.length===0 ? (
            <div style={{ textAlign:"center", padding:"60px 20px" }}>
              <div style={{ fontSize:48, marginBottom:14 }}>⚡</div>
              <div style={{ color:C.muted, fontSize:11, letterSpacing:2, fontWeight:600 }}>CLEAN SLATE. LOG YOUR FIRST ENTRY ABOVE.</div>
              <div style={{ color:C.muted2, fontSize:10, letterSpacing:1, marginTop:8 }}>EVERY SAT COUNTS. 🟠</div>
            </div>
          ) : (
            <>
              <div style={{ display:"grid", gridTemplateColumns:"28px 1fr 100px 90px 90px 32px", padding:"9px 20px", background:darkMode?"rgba(255,255,255,0.02)":C.cardAlt, borderBottom:`1px solid ${C.border}` }}>
                {["","DATE & TIME","SATS","VALUE NOW","BTC THEN",""].map((h,i) => (
                  <div key={i} style={{ fontSize:9, color:C.muted, letterSpacing:1.5, fontWeight:600 }}>{h}</div>
                ))}
              </div>
              <div style={{ maxHeight:340, overflowY:"auto" }}>
                {sortedHistory.map((e,idx) => {
                  const val   = satsToUsd(e.sats, btcPrice);
                  const isSub = e.type==="subtract";
                  const isExp = expandedRow===e.id;
                  return (
                    <div key={e.id} style={{ borderBottom:idx===sortedHistory.length-1?"none":`1px solid ${C.border}`, background:isExp?(darkMode?"rgba(255,255,255,0.02)":C.cardAlt):"transparent", transition:"background 0.15s" }}>
                      <div style={{ display:"grid", gridTemplateColumns:"28px 1fr 100px 90px 90px 32px", padding:"13px 20px", cursor:"pointer", alignItems:"center" }} onClick={() => setExpandedRow(isExp?null:e.id)}>
                        <div style={{ fontSize:14 }}>{isSub?"↓":"⚡"}</div>
                        <div style={{ fontSize:11, color:C.sub }}>{formatDatetime(e.datetime)}</div>
                        <div style={{ fontSize:12, color:isSub?C.blue:C.gold, fontWeight:700 }}>{isSub?"-":"+"}{fmt(e.sats)}</div>
                        <div style={{ fontSize:11, color:isSub?C.muted:C.green, fontWeight:600 }}>{val?(isSub?"-":"")+fmtUsd(val):"—"}</div>
                        <div style={{ fontSize:11, color:C.muted }}>{e.priceAtAcq?fmtUsd(e.priceAtAcq):"—"}</div>
                        <div onClick={ev => { ev.stopPropagation(); deleteEntry(e.id); }}
                          style={{ fontSize:13, color:C.muted2, cursor:"pointer", textAlign:"center", padding:4, borderRadius:6, transition:"color 0.15s" }}
                          onMouseEnter={ev => { ev.currentTarget.style.color=C.red; }}
                          onMouseLeave={ev => { ev.currentTarget.style.color=C.muted2; }}>✕</div>
                      </div>
                      {isExp && (
                        <div style={{ padding:"0 20px 12px 46px", fontSize:11, color:C.muted, display:"flex", flexDirection:"column", gap:4 }}>
                          {e.notes && e.notes.trim()!=="" && <span>📝 {e.notes}</span>}
                          {e.priceAtAcq && <span style={{ color:C.muted2 }}>₿ price then: {fmtUsd(e.priceAtAcq)}</span>}
                          {!e.notes && !e.priceAtAcq && <span style={{ color:C.muted2 }}>No notes recorded.</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Card>

        {/* ───────────────────────────────────────────────────────────────────
            SECTION 8 — Global stackers community count
        ─────────────────────────────────────────────────────────────────── */}
        <StackersBanner count={stackerCount} C={C} dark={darkMode}/>

        {/* ───────────────────────────────────────────────────────────────────
            SECTION 9 — Footer (support/donate)
        ─────────────────────────────────────────────────────────────────── */}
        <Card C={C} dark={darkMode} style={{ position:"relative", overflow:"hidden" }}>
          {darkMode && <div style={{ position:"absolute", top:0, left:0, right:0, height:1, background:`linear-gradient(90deg,transparent,${C.gold}50,transparent)` }}/>}
          <div style={{ padding:"24px 24px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:18 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:C.goldLight, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>⚡</div>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:C.text }}>Support the Builder</div>
                <div style={{ fontSize:10, color:C.sub, marginTop:2 }}>If you find this tool useful, consider sending a few sats to keep it running.</div>
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {[
                { label:"⚡ Lightning Address", value:"unusuallease430@walletofsatoshi.com", color:C.blue },
                { label:"₿ Bitcoin Address",   value:"bc1qp93gq8x95esd5j89c3gax3jq9dnzlvwzg464qx", color:C.gold },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background:darkMode?"rgba(255,255,255,0.03)":C.cardAlt, border:`1px solid ${C.border}`, borderRadius:12, padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, flexWrap:"wrap" }}>
                  <div>
                    <div style={{ fontSize:9, color, letterSpacing:2, fontWeight:700, marginBottom:5 }}>{label}</div>
                    <div style={{ fontSize:11, color:C.sub, wordBreak:"break-all" }}>{value}</div>
                  </div>
                  <button onClick={() => { navigator.clipboard.writeText(value); showToast("📋 Copied!", color); }}
                    style={{ background:color+"18", border:`1px solid ${color}40`, borderRadius:8, color, padding:"7px 14px", fontSize:10, fontWeight:700, cursor:"pointer", fontFamily:"system-ui,sans-serif", flexShrink:0 }}>Copy</button>
                </div>
              ))}
            </div>
            <div style={{ marginTop:20, textAlign:"center", fontSize:10, color:C.muted }}>Built with 🧡 for the Bitcoin community · Every sat counts</div>
          </div>
        </Card>

      </div>

      {/* ── Overlays ── */}
      {celebration && <StackCelebration data={celebration} onDone={() => setCelebration(null)} C={C} dark={darkMode}/>}
      {goalCompleted && !goalCompletedDismissed && (
        <GoalCompleteModal C={C} dark={darkMode} goal={goal} onClose={async () => {
          setGoalCompleted(false); setGoalCompletedDismissed(true);
          if (googleUser) await saveUserData(googleUser.uid, { goalCompletedDismissed: true });
          setShowGoalModal(true);
        }}/>
      )}
      {authStep==="google"  && <GoogleSignIn C={C} dark={darkMode}/>}
      {authStep==="profile" && <ProfileModal C={C} dark={darkMode} onSave={saveProfile}/>}
      {showProfileModal && profile && <ProfileModal C={C} dark={darkMode} onSave={saveProfile} existing={profile} onClose={() => setShowProfileModal(false)}/>}
      {showGoalModal && <GoalModal C={C} dark={darkMode} onSave={saveGoal} onClose={() => setShowGoalModal(false)}/>}

      {/* ── Toast ── */}
      {toast && (
        <div style={{ position:"fixed", bottom:28, left:"50%", transform:"translateX(-50%)", background:darkMode?"rgba(10,11,13,0.97)":C.text, border:`1px solid ${toast.color}40`, borderRadius:12, padding:"12px 22px", fontSize:12, color:darkMode?toast.color:"#fff", fontWeight:600, zIndex:2000, boxShadow:shadowMd, backdropFilter:"blur(12px)", whiteSpace:"nowrap" }}>
          <span style={{ color:toast.color }}>{toast.msg}</span>
        </div>
      )}

      <style>{`
        input[type="datetime-local"]::-webkit-calendar-picker-indicator { cursor:pointer; opacity:0.5; filter:${darkMode?"invert(1)":"none"}; }
        input[type="number"] { -moz-appearance:textfield; }
        input[type="number"]::-webkit-inner-spin-button, input[type="number"]::-webkit-outer-spin-button { -webkit-appearance:none; }
        * { box-sizing:border-box; }
        @keyframes spin { to { transform:rotate(360deg); } }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:${C.border}; border-radius:4px; }
      `}</style>
    </div>
  );
}
