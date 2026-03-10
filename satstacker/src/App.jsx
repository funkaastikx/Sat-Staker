import { useState, useEffect, useCallback } from "react";
import { signInWithGoogle, logOut, saveUserData, loadUserData, onAuthChange } from "./firebase";

const DEFAULT_GOAL = 100_000_000;
const fmt    = (n) => parseInt(n).toLocaleString();
const fmtUsd = (n) => "$" + parseFloat(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const satsToUsd = (sats, price) => (price ? (sats / 1e8) * price : null);

const C = {
  bg: "#07080a", surface: "rgba(15,16,18,0.85)", surface3: "#1c1e22",
  gold: "#F7931A", goldDim: "#b86d10", goldGlow: "rgba(247,147,26,0.15)",
  green: "#0dff87", red: "#ff3355", text: "#edeae3",
  muted: "#9ba0aa", muted2: "#636870", blue: "#4da6ff",
};

const card = {
  background: "rgba(15,16,18,0.7)",
  border: "1px solid rgba(255,255,255,0.07)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
};

const iBase = {
  background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "11px 14px",
  color: C.text, fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 400,
  outline: "none", width: "100%", transition: "border-color 0.2s, box-shadow 0.2s", boxSizing: "border-box",
};
const iStyle = (name, focused) => ({
  ...iBase,
  border: `1px solid ${focused === name ? C.gold : "rgba(255,255,255,0.07)"}`,
  boxShadow: focused === name ? "0 0 0 3px rgba(247,147,26,0.10)" : "none",
});

// ── Avatars ───────────────────────────────────────────────────────────────────
function AvatarBtcCoin() {
  return <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="av1" cx="40%" cy="35%"><stop offset="0%" stopColor="#ffd580"/><stop offset="100%" stopColor="#c8600a"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#av1)" stroke="#7a3a00" strokeWidth="1.5"/><text x="50" y="65" textAnchor="middle" fontSize="48" fontWeight="900" fontFamily="Arial" fill="#fff5e0">₿</text></svg>;
}
function AvatarLaserEyes() {
  return <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="av2" cx="50%" cy="50%"><stop offset="0%" stopColor="#1a1a2e"/><stop offset="100%" stopColor="#0a0a14"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#av2)" stroke="#F7931A" strokeWidth="1.5"/><text x="50" y="55" textAnchor="middle" fontSize="30" fontFamily="Arial">🧔</text><ellipse cx="38" cy="46" rx="6" ry="3" fill="#ff2200" opacity="0.9"/><ellipse cx="62" cy="46" rx="6" ry="3" fill="#ff2200" opacity="0.9"/><text x="50" y="80" textAnchor="middle" fontSize="10" fontWeight="700" fontFamily="Arial" fill="#F7931A">HODL</text></svg>;
}
function AvatarSatSymbol() {
  return <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="av3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#1a1200"/><stop offset="100%" stopColor="#0a0800"/></linearGradient></defs><circle cx="50" cy="50" r="48" fill="url(#av3)" stroke="#F7931A" strokeWidth="2"/><text x="50" y="62" textAnchor="middle" fontSize="52" fontWeight="900" fontFamily="Arial" fill="#F7931A">s</text></svg>;
}
function AvatarMoonRocket() {
  return <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="av4" cx="50%" cy="80%"><stop offset="0%" stopColor="#0a0a2a"/><stop offset="100%" stopColor="#000"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#av4)"/><text x="68" y="30" textAnchor="middle" fontSize="22" fontFamily="Arial">🌕</text><text x="38" y="72" textAnchor="middle" fontSize="26" fontFamily="Arial">🚀</text><text x="50" y="92" textAnchor="middle" fontSize="8" fontWeight="700" fontFamily="Arial" fill="#F7931A">TO THE MOON</text></svg>;
}
function AvatarHodl() {
  return <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="av5" cx="50%" cy="50%"><stop offset="0%" stopColor="#1a0d00"/><stop offset="100%" stopColor="#080400"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#av5)" stroke="#F7931A" strokeWidth="1"/><text x="50" y="60" textAnchor="middle" fontSize="40" fontFamily="Arial">💎</text><text x="50" y="85" textAnchor="middle" fontSize="11" fontWeight="900" fontFamily="Arial" fill="#F7931A">HODL</text></svg>;
}
function AvatarSatoshi() {
  return <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="av6" cx="50%" cy="40%"><stop offset="0%" stopColor="#1a1a1a"/><stop offset="100%" stopColor="#050505"/></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#av6)" stroke="rgba(247,147,26,0.4)" strokeWidth="1.5"/><text x="50" y="55" textAnchor="middle" fontSize="38" fontFamily="Arial">🥷</text><text x="50" y="78" textAnchor="middle" fontSize="8" fontWeight="700" fontFamily="Arial" fill="#F7931A">SATOSHI</text></svg>;
}
function AvatarOrangePill() {
  return <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="48" fill="#0a0400"/><ellipse cx="50" cy="50" rx="22" ry="12" fill="#F7931A" transform="rotate(-35 50 50)"/><ellipse cx="50" cy="50" rx="11" ry="12" fill="#c8600a" transform="rotate(-35 50 50)"/><text x="50" y="82" textAnchor="middle" fontSize="8" fontWeight="700" fontFamily="Arial" fill="#F7931A">ORANGE PILL</text></svg>;
}
function AvatarBull() {
  return <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="48" fill="#0f0800" stroke="#F7931A" strokeWidth="1"/><text x="50" y="62" textAnchor="middle" fontSize="46" fontFamily="Arial">🐂</text><text x="50" y="85" textAnchor="middle" fontSize="8" fontWeight="700" fontFamily="Arial" fill="#F7931A">BTC BULL</text></svg>;
}
function AvatarStackBars() {
  return <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="48" fill="#050400" stroke="#F7931A" strokeWidth="1"/><rect x="20" y="70" width="60" height="8" rx="3" fill="#F7931A"/><rect x="24" y="60" width="52" height="8" rx="3" fill="#F7931A" opacity="0.85"/><rect x="28" y="50" width="44" height="8" rx="3" fill="#F7931A" opacity="0.7"/><rect x="32" y="40" width="36" height="8" rx="3" fill="#F7931A" opacity="0.55"/><rect x="36" y="30" width="28" height="8" rx="3" fill="#F7931A" opacity="0.4"/><text x="50" y="93" textAnchor="middle" fontSize="7" fontWeight="700" fontFamily="Arial" fill="#F7931A">STACK SATS</text></svg>;
}
function Avatar21M() {
  return <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="48" fill="#030303" stroke="#F7931A" strokeWidth="2"/><text x="50" y="46" textAnchor="middle" fontSize="28" fontWeight="900" fontFamily="Arial" fill="#F7931A">21</text><line x1="20" y1="52" x2="80" y2="52" stroke="#F7931A" strokeWidth="1" opacity="0.4"/><text x="50" y="66" textAnchor="middle" fontSize="10" fontWeight="700" fontFamily="Arial" fill="#F7931A">MILLION</text><text x="50" y="80" textAnchor="middle" fontSize="7.5" fontFamily="Arial" fill="#9ba0aa">FIXED FOREVER</text></svg>;
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
  { threshold: 1e8,  emoji: "🏆", label: "WHOLE-COINER", color: "#0dff87" },
  { threshold: 50e6, emoji: "🔥", label: "HALF-COINER",  color: "#F7931A" },
  { threshold: 21e6, emoji: "✨", label: "21M CLUB",      color: "#4da6ff" },
  { threshold: 10e6, emoji: "⚡", label: "10M STACKER",  color: "#a78bfa" },
  { threshold: 1e6,  emoji: "🌱", label: "1M STARTER",   color: "#34d399" },
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
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function Tag({ children, color }) {
  return <span style={{ fontSize: 9, letterSpacing: 2, color, background: color + "14", border: `1px solid ${color}40`, borderRadius: 6, padding: "3px 8px", fontWeight: 600 }}>{children}</span>;
}

function StatBox({ label, value, sub, valueColor, accent }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${accent ? accent + "30" : "rgba(255,255,255,0.07)"}`, borderRadius: 16, padding: "18px 20px", position: "relative", overflow: "hidden" }}>
      {accent && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${accent}, transparent)`, opacity: 0.7 }} />}
      <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, marginBottom: 10, textTransform: "uppercase", fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 800, color: valueColor || C.text, letterSpacing: -0.5, lineHeight: 1, marginBottom: 6 }}>{value}</div>
      <div style={{ fontSize: 10, color: C.muted, fontWeight: 300 }}>{sub || "—"}</div>
    </div>
  );
}

function StackCelebration({ data, onDone }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 30);
    const t2 = setTimeout(() => { setVisible(false); setTimeout(onDone, 400); }, 3800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, pointerEvents: "none" }}>
      <div style={{ ...card, borderRadius: 24, padding: "28px 32px", maxWidth: 360, width: "90%", textAlign: "center", position: "relative", overflow: "hidden", border: "1px solid rgba(247,147,26,0.4)", boxShadow: "0 0 60px rgba(247,147,26,0.2)", opacity: visible ? 1 : 0, transform: visible ? "scale(1) translateY(0)" : "scale(0.85) translateY(20px)", transition: "opacity 0.4s ease, transform 0.4s cubic-bezier(0.34,1.56,0.64,1)" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)` }} />
        <div style={{ fontSize: 36, marginBottom: 12 }}>{data.msg.split(" ")[0]}</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.gold, letterSpacing: -0.5, marginBottom: 10 }}>{data.msg.split(" ").slice(1).join(" ")}</div>
        <div style={{ fontSize: 11, color: C.muted, fontWeight: 300, lineHeight: 1.7 }}>{data.sub}</div>
      </div>
    </div>
  );
}

function GoalCompleteModal({ goal, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", backdropFilter: "blur(14px)", zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ ...card, borderRadius: 28, padding: "40px 36px", width: "100%", maxWidth: 460, textAlign: "center", position: "relative", overflow: "hidden", border: "1px solid rgba(13,255,135,0.3)" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, transparent, #0dff87, transparent)" }} />
        <div style={{ fontSize: 56, marginBottom: 16 }}>🏆</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: C.green, letterSpacing: -1, marginBottom: 8 }}>GOAL REACHED!</div>
        <div style={{ fontSize: 13, color: C.text, fontWeight: 300, lineHeight: 1.8, marginBottom: 24 }}>
          You've hit <span style={{ color: C.gold, fontWeight: 700 }}>{fmt(goal)} sats</span>.<br />
          That's the Bitcoin way — one sat at a time. 🟠
        </div>
        <button onClick={onClose} style={{ width: "100%", padding: "13px", borderRadius: 12, border: "none", background: C.green, color: "#000", fontFamily: "system-ui, sans-serif", fontSize: 12, fontWeight: 700, cursor: "pointer", letterSpacing: 1 }}>
          🚀 SET A NEW GOAL
        </button>
      </div>
    </div>
  );
}

function MotivationBanner() {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * MOTIVATIONS.length));
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const iv = setInterval(() => {
      setVisible(false);
      setTimeout(() => { setIdx(i => (i + 1) % MOTIVATIONS.length); setVisible(true); }, 600);
    }, 6000);
    return () => clearInterval(iv);
  }, []);
  const nav = (d) => {
    setVisible(false);
    setTimeout(() => { setIdx(i => (i + d + MOTIVATIONS.length) % MOTIVATIONS.length); setVisible(true); }, 300);
  };
  const { quote, author } = MOTIVATIONS[idx];
  return (
    <div style={{ ...card, borderRadius: 20, padding: "16px 24px", marginBottom: 24, position: "relative", overflow: "hidden", opacity: visible ? 1 : 0, transition: "opacity 0.6s ease" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${C.gold}80, transparent)` }} />
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ fontSize: 18, flexShrink: 0 }}>⚡</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: C.text, lineHeight: 1.7, fontStyle: "italic", fontWeight: 300 }}>"{quote}"</div>
          <div style={{ fontSize: 10, color: C.gold, marginTop: 6, letterSpacing: 1, fontWeight: 600 }}>— {author}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 10, color: C.muted }}>{idx + 1}/{MOTIVATIONS.length}</span>
          {[-1, 1].map(d => (
            <div key={d} onClick={() => nav(d)} style={{ width: 24, height: 24, borderRadius: 6, border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.gold, fontSize: 16, background: "rgba(255,255,255,0.03)" }}>
              {d === -1 ? "‹" : "›"}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StackersBanner({ count }) {
  const useDots = count <= 20;
  const fillPct = count > 0 ? Math.max(2, (1 / count) * 100) : 100;
  return (
    <div style={{ ...card, borderRadius: 20, padding: "24px 28px", marginBottom: 16, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${C.blue}80, transparent)` }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ fontSize: 9, color: C.blue, letterSpacing: 2.5, marginBottom: 10, display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
            <div style={{ width: 2, height: 12, background: C.blue, borderRadius: 1 }} /> GLOBAL STACKERS
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <div style={{ fontSize: 48, fontWeight: 800, color: C.text, letterSpacing: -2, lineHeight: 1 }}>{count.toLocaleString()}</div>
            <div style={{ fontSize: 12, color: C.muted, fontWeight: 300 }}>{count === 1 ? "person is" : "people are"} on the<br /><span style={{ color: C.blue, fontWeight: 600 }}>Bitcoin journey</span> with you</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end", minWidth: 220 }}>
          {useDots ? (
            <>
              <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1.5, marginBottom: 4 }}>EACH DOT = 1 STACKER</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, maxWidth: 220, justifyContent: "flex-end" }}>
                {Array.from({ length: count }).map((_, i) => (
                  <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i === 0 ? C.gold : C.blue, opacity: i === 0 ? 1 : 0.55, boxShadow: i === 0 ? `0 0 6px ${C.gold}` : "none" }} />
                ))}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1.5, marginBottom: 4 }}>YOUR SHARE OF STACKERS</div>
              <div style={{ width: 220, height: 10, background: C.surface3, borderRadius: 999, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div style={{ height: "100%", width: `${fillPct}%`, background: `linear-gradient(90deg, ${C.goldDim}, ${C.gold})`, borderRadius: 999 }} />
              </div>
              <div style={{ fontSize: 10, color: C.muted }}>You are <span style={{ color: C.gold }}>1</span> of <span style={{ color: C.blue }}>{count.toLocaleString()}</span> stackers</div>
            </>
          )}
          <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}><span style={{ color: C.gold }}>●</span> you &nbsp;<span style={{ color: C.blue, opacity: 0.7 }}>●</span> others</div>
        </div>
      </div>
      <div style={{ marginTop: 18, padding: "12px 16px", background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ fontSize: 10, color: C.muted }}>🔒 <span style={{ color: C.text }}>Privacy guaranteed</span> — no names, no balances, no locations shared. Just the count.</div>
      </div>
    </div>
  );
}

function GoogleSignIn() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (e) {
      setError("Sign-in failed. Please try again.");
      setLoading(false);
    }
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", backdropFilter: "blur(14px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ ...card, borderRadius: 28, padding: "44px 36px", width: "100%", maxWidth: 420, position: "relative", textAlign: "center" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${C.gold}80, transparent)`, borderRadius: "28px 28px 0 0" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at top, rgba(247,147,26,0.06), transparent 60%)", pointerEvents: "none", borderRadius: 28 }} />
        <div style={{ width: 64, height: 64, borderRadius: 20, background: `linear-gradient(145deg, ${C.goldDim}, ${C.gold})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto 20px", boxShadow: `0 8px 32px ${C.goldGlow}` }}>₿</div>
        <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.8, color: C.text, marginBottom: 8 }}>SAT STACKER</div>
        <div style={{ fontSize: 12, color: C.muted, fontWeight: 300, marginBottom: 36, lineHeight: 1.6 }}>
          Track your sats. Own your journey.<br />Sign in to sync across all your devices.
        </div>
        {error && <div style={{ fontSize: 11, color: C.red, marginBottom: 16, padding: "8px 12px", background: "rgba(255,51,85,0.08)", borderRadius: 8, border: "1px solid rgba(255,51,85,0.2)" }}>{error}</div>}
        <button onClick={handleSignIn} disabled={loading}
          style={{ width: "100%", padding: "14px 20px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)", background: loading ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.06)", color: C.text, fontFamily: "system-ui, sans-serif", fontSize: 13, fontWeight: 600, cursor: loading ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 16, transition: "all 0.2s" }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "rgba(255,255,255,0.10)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = loading ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.06)"; }}>
          {loading ? (
            <><div style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.15)", borderTopColor: C.gold, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />Signing in…</>
          ) : (
            <><svg width="18" height="18" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/><path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/><path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/></svg>Continue with Google</>
          )}
        </button>
        <div style={{ fontSize: 10, color: C.muted2, fontWeight: 300, lineHeight: 1.7 }}>
          Your stack data is private and secured.<br />
          <span style={{ color: C.muted }}>No financial advice. DYOR. 🟠</span>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ProfileModal({ onSave, existing, onClose }) {
  const [username, setUsername] = useState(existing?.username || "");
  const [avatarId, setAvatarId] = useState(existing?.avatarId || AVATARS[0].id);
  const [focused, setFocused]   = useState(false);
  const isValid = username.trim().length >= 2;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, overflowY: "auto" }}>
      <div style={{ ...card, borderRadius: 24, padding: "32px", width: "100%", maxWidth: 520, position: "relative", margin: "auto" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${C.gold}80, transparent)`, borderRadius: "24px 24px 0 0" }} />
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: -0.5 }}>{existing ? "Edit Profile" : "Set Up Your Stacker Profile"}</div>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 300, marginTop: 5 }}>{existing ? "Update your username or avatar anytime." : "Choose a username and pick your Bitcoin avatar."}</div>
        </div>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, marginBottom: 7, fontWeight: 500 }}>USERNAME</div>
          <input value={username} onChange={e => setUsername(e.target.value.replace(/\s/g, ""))} placeholder="e.g. satoshi_nakastack" maxLength={24}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            style={{ ...iBase, border: `1px solid ${focused ? C.gold : "rgba(255,255,255,0.07)"}`, boxShadow: focused ? "0 0 0 3px rgba(247,147,26,0.10)" : "none" }} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <div style={{ fontSize: 9, color: C.muted2 }}>No spaces · min 2 characters</div>
            <div style={{ fontSize: 9, color: username.length > 20 ? C.gold : C.muted2 }}>{username.length}/24</div>
          </div>
        </div>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, marginBottom: 14, fontWeight: 500 }}>CHOOSE YOUR AVATAR</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
            {AVATARS.map(a => {
              const Av = a.Component;
              return (
                <div key={a.id} onClick={() => setAvatarId(a.id)} style={{ cursor: "pointer", borderRadius: 14, padding: 4, border: `2px solid ${avatarId === a.id ? C.gold : "rgba(255,255,255,0.07)"}`, background: avatarId === a.id ? "rgba(247,147,26,0.1)" : "rgba(255,255,255,0.02)", transition: "all 0.2s", position: "relative" }}>
                  <div style={{ width: "100%", aspectRatio: "1", borderRadius: 10, overflow: "hidden" }}><Av /></div>
                  {avatarId === a.id && <div style={{ position: "absolute", top: 4, right: 4, width: 14, height: 14, borderRadius: "50%", background: C.gold, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#000", fontWeight: 900 }}>✓</div>}
                  <div style={{ fontSize: 7.5, color: avatarId === a.id ? C.gold : C.muted, textAlign: "center", marginTop: 5, fontWeight: avatarId === a.id ? 600 : 400 }}>{a.label}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {existing && onClose && (
            <button onClick={onClose} style={{ flex: 1, padding: "13px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)", background: "transparent", color: C.muted, fontFamily: "system-ui, sans-serif", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>CANCEL</button>
          )}
          <button onClick={() => isValid && onSave({ username: username.trim(), avatarId })} disabled={!isValid}
            style={{ flex: 2, padding: "13px", borderRadius: 12, border: "none", background: isValid ? C.gold : "rgba(255,255,255,0.05)", color: isValid ? "#000" : C.muted, fontFamily: "system-ui, sans-serif", fontSize: 12, fontWeight: 700, cursor: isValid ? "pointer" : "not-allowed", letterSpacing: 1, transition: "all 0.2s" }}>
            {existing ? "SAVE CHANGES" : "⚡ START STACKING"}
          </button>
        </div>
      </div>
    </div>
  );
}

function GoalModal({ onSave, onClose }) {
  const [mode, setMode]     = useState("preset");
  const [preset, setPreset] = useState(null);
  const [custom, setCustom] = useState("");
  const [unit, setUnit]     = useState("sats");
  const [focused, setFocused] = useState(false);
  const presets = [
    { label: "1M sats",   value: 1_000_000,   desc: "≈ 0.01 BTC · Starter" },
    { label: "10M sats",  value: 10_000_000,  desc: "≈ 0.1 BTC · Solid" },
    { label: "21M sats",  value: 21_000_000,  desc: "≈ 0.21 BTC · The Magic Number" },
    { label: "50M sats",  value: 50_000_000,  desc: "≈ 0.5 BTC · Half-coiner" },
    { label: "100M sats", value: 100_000_000, desc: "= 1 BTC · Whole-coiner 🏆" },
  ];
  const handleSave = () => {
    const val = mode === "preset" ? preset : (unit === "sats" ? parseInt(custom) : Math.round(parseFloat(custom) * 1e8));
    if (!val || val <= 0) return;
    onSave(val);
  };
  const satsVal = custom && parseFloat(custom) > 0 ? (unit === "sats" ? parseInt(custom) : Math.round(parseFloat(custom) * 1e8)) : 0;
  const disabled = mode === "preset" ? !preset : !custom;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ ...card, borderRadius: 24, padding: "32px", width: "100%", maxWidth: 480, position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${C.gold}80, transparent)`, borderRadius: "24px 24px 0 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: -0.5 }}>Set Your Stack Goal</div>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 300, marginTop: 4 }}>Choose a target that motivates you.</div>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, color: C.muted, width: 32, height: 32, cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}>✕</button>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {["preset", "custom"].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: "9px", borderRadius: 10, border: `1px solid ${mode === m ? C.gold + "60" : "rgba(255,255,255,0.07)"}`, background: mode === m ? "rgba(247,147,26,0.15)" : "rgba(255,255,255,0.03)", color: mode === m ? C.gold : C.muted, fontFamily: "system-ui, sans-serif", fontSize: 11, fontWeight: 600, cursor: "pointer", letterSpacing: 1, textTransform: "uppercase", transition: "all 0.2s" }}>
              {m === "preset" ? "⚡ Presets" : "✏️ Custom"}
            </button>
          ))}
        </div>
        {mode === "preset" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
            {presets.map(p => (
              <div key={p.value} onClick={() => setPreset(p.value)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", borderRadius: 12, border: `1px solid ${preset === p.value ? C.gold + "50" : "rgba(255,255,255,0.07)"}`, background: preset === p.value ? "rgba(247,147,26,0.1)" : "rgba(255,255,255,0.02)", cursor: "pointer", transition: "all 0.2s" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: preset === p.value ? C.gold : C.text }}>{p.label}</div>
                  <div style={{ fontSize: 10, color: C.muted, fontWeight: 300, marginTop: 2 }}>{p.desc}</div>
                </div>
                <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${preset === p.value ? C.gold : "rgba(255,255,255,0.15)"}`, background: preset === p.value ? C.gold : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
                  {preset === p.value && <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#000" }} />}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              {["sats", "btc"].map(u => (
                <button key={u} onClick={() => { setUnit(u); setCustom(""); }} style={{ flex: 1, padding: "7px", borderRadius: 8, border: `1px solid ${unit === u ? C.gold + "60" : "rgba(255,255,255,0.07)"}`, background: unit === u ? "rgba(247,147,26,0.15)" : "rgba(255,255,255,0.02)", color: unit === u ? C.gold : C.muted, fontFamily: "system-ui, sans-serif", fontSize: 10, fontWeight: 700, cursor: "pointer", letterSpacing: 1.5, textTransform: "uppercase", transition: "all 0.2s" }}>
                  {u === "sats" ? "⚡ Sats" : "₿ BTC"}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, marginBottom: 8, fontWeight: 500 }}>{unit === "sats" ? "ENTER AMOUNT IN SATS" : "ENTER AMOUNT IN BTC"}</div>
            <input type="number" placeholder={unit === "sats" ? "e.g. 5000000" : "e.g. 0.05"} value={custom} onChange={e => setCustom(e.target.value)}
              onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
              style={{ ...iBase, border: `1px solid ${focused ? C.gold : "rgba(255,255,255,0.07)"}`, boxShadow: focused ? "0 0 0 3px rgba(247,147,26,0.10)" : "none" }} />
            {satsVal > 0 && (
              <div style={{ marginTop: 10, padding: "10px 14px", background: "rgba(247,147,26,0.06)", border: "1px solid rgba(247,147,26,0.15)", borderRadius: 10 }}>
                <div style={{ fontSize: 10, color: C.muted }}>
                  {unit === "sats"
                    ? <span>= <span style={{ color: C.gold, fontWeight: 700 }}>₿ {(satsVal / 1e8).toFixed(8).replace(/0+$/, "").replace(/\.$/, "")}</span></span>
                    : <span>= <span style={{ color: C.gold, fontWeight: 700 }}>⚡ {satsVal.toLocaleString()} sats</span></span>}
                </div>
              </div>
            )}
          </div>
        )}
        <button onClick={handleSave} disabled={disabled} style={{ width: "100%", padding: "13px", borderRadius: 12, border: "none", background: disabled ? "rgba(255,255,255,0.05)" : C.gold, color: disabled ? C.muted : "#000", fontFamily: "system-ui, sans-serif", fontSize: 12, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", letterSpacing: 1, transition: "all 0.2s" }}>
          ⚡ SET MY GOAL
        </button>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function SatTracker() {
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
  const [form, setForm]                               = useState({ datetime: getLocalDatetime(), sats: "", notes: "", type: "add" });
  const [focused, setFocused]                         = useState(null);
  const [toast, setToast]                             = useState(null);
  const [expandedRow, setExpandedRow]                 = useState(null);
  const [celebration, setCelebration]                 = useState(null);
  const [fetchingPrice, setFetchingPrice]             = useState(false);
  const [stackerCount, setStackerCount]               = useState(1);

  // ── Auth state listener — runs once on mount ───────────────────────────────
  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      if (user) {
        setGoogleUser(user);
        const data = await loadUserData(user.uid);
        if (data) {
          if (data.entries) setEntries(data.entries);
          if (data.goal)    setGoal(data.goal);
          if (data.profile) {
            setProfile(data.profile);
            setAuthStep("idle");
          } else {
            setAuthStep("profile");
          }
          if (data.goalCompletedDismissed) setGoalCompletedDismissed(true);
        } else {
          setAuthStep("profile");
        }
      } else {
        setGoogleUser(null);
        setProfile(null);
        setEntries([]);
        setGoal(DEFAULT_GOAL);
        setAuthStep("google");
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // ── Global stacker count ───────────────────────────────────────────────────
  useEffect(() => {
    if (!googleUser) return;
    (async () => {
      try {
        await saveUserData(googleUser.uid, { _active: true });
        // We use Firestore user count as a proxy — each signed-in user has a doc
        setStackerCount(prev => Math.max(prev, 1));
      } catch {}
    })();
  }, [googleUser]);

  // ── BTC price ─────────────────────────────────────────────────────────────
  const fetchPrice = useCallback(async () => {
    setPriceLoading(true);
    try {
      const res  = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_last_updated_at=true");
      const data = await res.json();
      if (data?.bitcoin?.usd) {
        setBtcPrice(data.bitcoin.usd);
        setPriceAge(new Date(data.bitcoin.last_updated_at * 1000));
      }
    } catch {} finally { setPriceLoading(false); }
  }, []);

  useEffect(() => {
    fetchPrice();
    const t = setInterval(fetchPrice, 90000);
    return () => clearInterval(t);
  }, [fetchPrice]);

  // ── Historical BTC price ───────────────────────────────────────────────────
  const fetchHistoricalPrice = async (datetimeStr) => {
    try {
      const d   = new Date(datetimeStr);
      const now = new Date();
      if ((now - d) < 24 * 60 * 60 * 1000) return btcPrice;
      const day   = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
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

  const showToast = (msg, color = C.gold) => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3500);
  };

  const saveProfile = async (p) => {
    setProfile(p);
    if (googleUser) await saveUserData(googleUser.uid, { profile: p });
    setAuthStep("idle");
    setShowProfileModal(false);
    showToast("✅ Profile saved! Welcome to the stack!", C.green);
  };

  const saveGoal = async (val) => {
    setGoal(val);
    setGoalCompletedDismissed(false);
    if (googleUser) await saveUserData(googleUser.uid, { goal: val, goalCompletedDismissed: false });
    setShowGoalModal(false);
    showToast(`🎯 Goal set to ${fmt(val)} sats!`);
  };

  const addEntry = async () => {
    if (!form.datetime) return showToast("⚠ Pick a date & time", C.red);
    const sats = parseInt(form.sats);
    if (!sats || sats <= 0) return showToast("⚠ Enter valid sats", C.red);
    const type = form.type || "add";
    if (type === "subtract") {
      const totalNow = entries.reduce((s, e) => e.type === "subtract" ? s - e.sats : s + e.sats, 0);
      if (sats > totalNow) return showToast("⚠ Can't subtract more than you have", C.red);
    }
    setFetchingPrice(true);
    showToast("⏳ Fetching BTC price for that date…", C.muted);
    const historicalPrice = await fetchHistoricalPrice(form.datetime);
    setFetchingPrice(false);
    const entry = {
      id: Date.now().toString(),
      datetime: form.datetime,
      sats,
      notes: form.notes.trim(),
      priceAtAcq: historicalPrice || null,
      type,
    };
    const next = [entry, ...entries];
    await persist(next);
    setForm(f => ({ ...f, sats: "", notes: "", type: "add" }));
    if (type === "add") {
      setCelebration(STACK_CELEBRATIONS[Math.floor(Math.random() * STACK_CELEBRATIONS.length)]);
      const newTotal = next.reduce((s, e) => e.type === "subtract" ? s - e.sats : s + e.sats, 0);
      if (newTotal >= goal && !goalCompletedDismissed) setGoalCompleted(true);
    } else {
      showToast(`↓ ${fmt(sats)} sats subtracted`, C.blue);
    }
  };

  const deleteEntry = async (id) => {
    const next = entries.filter(e => e.id !== id);
    await persist(next);
    showToast("🗑 Entry deleted", C.muted);
  };

  // ── Derived stats ──────────────────────────────────────────────────────────
  const totalSats = entries.reduce((s, e) => e.type === "subtract" ? s - e.sats : s + e.sats, 0);
  const remaining = Math.max(0, goal - totalSats);
  const pct       = Math.min(100, (totalSats / goal) * 100);
  const totalUsd  = satsToUsd(totalSats, btcPrice);
  const remainUsd = satsToUsd(remaining, btcPrice);
  const goalUsd   = satsToUsd(goal, btcPrice);

  const addEntries   = entries.filter(e => e.type !== "subtract");
  const sorted_chron = [...entries].sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
  let costBasisSats = 0, costBasisUsd = 0, unknownSats = 0;
  for (const e of sorted_chron) {
    if (e.type === "subtract") {
      const totalHeld = costBasisSats + unknownSats;
      if (totalHeld <= 0) continue;
      const knownFraction   = costBasisSats / totalHeld;
      const removeFromKnown = e.sats * knownFraction;
      if (costBasisSats > 0) {
        costBasisUsd  -= costBasisUsd * (removeFromKnown / costBasisSats);
        costBasisSats -= removeFromKnown;
      }
      unknownSats = Math.max(0, unknownSats - (e.sats * (1 - knownFraction)));
    } else {
      if (e.priceAtAcq) { costBasisUsd += satsToUsd(e.sats, e.priceAtAcq); costBasisSats += e.sats; }
      else unknownSats += e.sats;
    }
  }
  const totalCostUsd = costBasisUsd;
  const avgBtcPrice  = costBasisSats > 0 ? (costBasisUsd / costBasisSats) * 1e8 : null;
  const pnl          = totalUsd && totalCostUsd ? totalUsd - totalCostUsd : null;

  const firstDate    = addEntries.length ? new Date(Math.min(...addEntries.map(e => new Date(e.datetime)))) : null;
  const daysStacking = firstDate ? Math.floor((new Date() - firstDate) / 86400000) : 0;
  const sortedHistory = [...entries].sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
  const goalLabel    = goal === 100_000_000 ? "1 BTC" : `${(goal / 1e8).toFixed(8).replace(/\.?0+$/, "")} BTC`;
  const badge        = getBadge(totalSats);
  const avatarObj    = profile ? AVATARS.find(a => a.id === profile.avatarId) || AVATARS[0] : null;
  const AvatarComp   = avatarObj?.Component;

  if (authLoading) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>₿</div>
          <div style={{ fontSize: 11, color: C.muted, letterSpacing: 2 }}>LOADING SAT STACKER…</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "system-ui, sans-serif", position: "relative" }}>
      {/* Background glow */}
      <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <svg viewBox="0 0 100 100" style={{ width: "72vw", maxWidth: 700, opacity: 0.05 }} xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="50" fill="#F7931A"/>
          <text x="50" y="72" textAnchor="middle" fontSize="62" fontWeight="900" fontFamily="Arial" fill="#F7931A">₿</text>
        </svg>
      </div>
      <div style={{ position: "fixed", top: -200, left: "50%", transform: "translateX(-50%)", width: 900, height: 500, background: "radial-gradient(ellipse, rgba(247,147,26,0.10) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 20px 80px", position: "relative", zIndex: 1 }}>
        <MotivationBanner />

        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: `linear-gradient(145deg, ${C.goldDim}, ${C.gold})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, boxShadow: `0 8px 32px ${C.goldGlow}` }}>₿</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -1 }}>SAT STACKER</div>
              <div style={{ display: "flex", gap: 8, marginTop: 5 }}>
                <Tag color={C.gold}>LIVE PRICE</Tag>
                <Tag color={C.green}>BITCOIN TRACKER</Tag>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            {/* BTC Price */}
            <div style={{ background: C.surface, border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "12px 18px", textAlign: "right", backdropFilter: "blur(12px)" }}>
              <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, marginBottom: 4, fontWeight: 500 }}>BTC / USD · COINGECKO</div>
              <div style={{ fontSize: 22, color: priceLoading ? C.muted : C.gold, fontWeight: 800, letterSpacing: -1 }}>{btcPrice ? fmtUsd(btcPrice) : "———"}</div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 4, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8 }}>
                <span>{priceAge ? priceAge.toLocaleTimeString() : "fetching…"}</span>
                <span onClick={fetchPrice} style={{ color: C.gold, cursor: "pointer", fontSize: 14 }}>↻</span>
              </div>
            </div>
            {/* Profile */}
            {profile && AvatarComp ? (
              <div onClick={() => setShowProfileModal(true)} style={{ background: C.surface, border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, backdropFilter: "blur(12px)", cursor: "pointer", transition: "border-color 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold + "50"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, overflow: "hidden", border: `2px solid ${badge ? badge.color + "50" : C.gold + "30"}`, flexShrink: 0 }}><AvatarComp /></div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>@{profile.username}</div>
                  {googleUser && <div style={{ fontSize: 9, color: C.muted2, marginTop: 1 }}>{googleUser.email}</div>}
                  {badge
                    ? <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}><span style={{ fontSize: 10 }}>{badge.emoji}</span><span style={{ fontSize: 9, color: badge.color, fontWeight: 700, letterSpacing: 1 }}>{badge.label}</span></div>
                    : <div style={{ fontSize: 9, color: C.muted2, marginTop: 3 }}>Stack to earn a badge</div>}
                </div>
              </div>
            ) : null}
            {/* Sign out */}
            {googleUser && (
              <button onClick={() => logOut()} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, color: C.muted, padding: "8px 14px", fontFamily: "system-ui, sans-serif", fontSize: 10, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={e => { e.currentTarget.style.color = C.red; e.currentTarget.style.borderColor = C.red + "40"; }}
                onMouseLeave={e => { e.currentTarget.style.color = C.muted; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}>
                SIGN OUT
              </button>
            )}
          </div>
        </div>

        <StackersBanner count={stackerCount} />

        {/* PROGRESS */}
        <div style={{ ...card, borderRadius: 20, padding: "28px 28px 26px", marginBottom: 16, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${C.gold}60, transparent)` }} />
          <div style={{ position: "absolute", right: -16, bottom: -24, fontSize: 160, color: "rgba(247,147,26,0.025)", lineHeight: 1, pointerEvents: "none", userSelect: "none" }}>₿</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, fontWeight: 500 }}>YOUR GOAL</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.gold }}>{fmt(goal)} sats <span style={{ color: C.muted, fontWeight: 300, fontSize: 11 }}>({goalLabel})</span></div>
              {goalUsd && <div style={{ fontSize: 11, color: C.muted, fontWeight: 300 }}>≈ {fmtUsd(goalUsd)}</div>}
            </div>
            <button onClick={() => setShowGoalModal(true)} style={{ background: C.gold + "20", border: `1px solid ${C.gold}40`, borderRadius: 8, color: C.gold, padding: "6px 14px", fontFamily: "system-ui, sans-serif", fontSize: 10, fontWeight: 600, cursor: "pointer" }}>
              🎯 CHANGE GOAL
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 28 }}>
            <StatBox label="Total Stacked" value={`${fmt(totalSats)} sats`} sub={totalUsd ? `≈ ${fmtUsd(totalUsd)}` : "—"} valueColor={C.gold} accent={C.gold} />
            <StatBox label="Remaining" value={`${fmt(remaining)} sats`} sub={remainUsd ? `≈ ${fmtUsd(remainUsd)}` : "—"} />
            <StatBox label="Progress" value={`${pct.toFixed(4)}%`} sub={daysStacking > 0 ? `${daysStacking} days stacking` : `${entries.length} entries`} valueColor={C.green} accent={C.green} />
          </div>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1.5, display: "flex", justifyContent: "space-between", marginBottom: 8, fontWeight: 500 }}>
            <span>{fmt(totalSats)} SATS</span>
            <span>TARGET: {fmt(goal)} SATS</span>
          </div>
          <div style={{ height: 5, background: C.surface3, borderRadius: 999, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.max(pct, 0.05)}%`, background: `linear-gradient(90deg, ${C.goldDim}, ${C.gold})`, borderRadius: 999, transition: "width 1s cubic-bezier(0.16,1,0.3,1)" }} />
          </div>
          <div style={{ fontSize: 9, color: C.muted, marginTop: 6, textAlign: "right", fontWeight: 300 }}>{fmt(remaining)} sats to go</div>
        </div>

        {/* LOG ENTRY */}
        <div style={{ ...card, borderRadius: 20, padding: "24px 28px", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ fontSize: 9, color: C.gold, letterSpacing: 2.5, display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
              <div style={{ width: 2, height: 12, background: C.gold, borderRadius: 1 }} /> LOG ENTRY
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {[{ val: "add", label: "⚡ Add", col: C.gold }, { val: "subtract", label: "↓ Subtract", col: C.blue }].map(({ val, label, col }) => (
                <button key={val} onClick={() => setForm(f => ({ ...f, type: val }))}
                  style={{ padding: "5px 14px", borderRadius: 8, border: `1px solid ${form.type === val ? col + "60" : "rgba(255,255,255,0.07)"}`, background: form.type === val ? col + "18" : "rgba(255,255,255,0.02)", color: form.type === val ? col : C.muted, fontFamily: "system-ui, sans-serif", fontSize: 10, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, marginBottom: 8, fontWeight: 500 }}>DATE & TIME</div>
              <input type="datetime-local" value={form.datetime} onChange={e => setForm(f => ({ ...f, datetime: e.target.value }))} onFocus={() => setFocused("dt")} onBlur={() => setFocused(null)} style={iStyle("dt", focused)} />
            </div>
            <div>
              <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, marginBottom: 8, fontWeight: 500 }}>SATS {form.type === "subtract" ? "TO SUBTRACT" : "ACQUIRED"}</div>
              <input type="number" placeholder="e.g. 50000" value={form.sats} onChange={e => setForm(f => ({ ...f, sats: e.target.value }))} onKeyDown={e => e.key === "Enter" && addEntry()} onFocus={() => setFocused("sats")} onBlur={() => setFocused(null)} style={iStyle("sats", focused)} min="1" />
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, marginBottom: 8, fontWeight: 500 }}>NOTES <span style={{ color: C.muted2, fontWeight: 300 }}>(optional)</span></div>
            <input type="text" placeholder={form.type === "subtract" ? "Why withdrawing?" : "e.g. Bitnob DCA, Fiverr payment"} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} onKeyDown={e => e.key === "Enter" && addEntry()} onFocus={() => setFocused("notes")} onBlur={() => setFocused(null)} style={iStyle("notes", focused)} maxLength={120} />
          </div>
          <button onClick={addEntry} disabled={fetchingPrice}
            style={{ background: fetchingPrice ? "rgba(255,255,255,0.05)" : form.type === "subtract" ? C.blue : C.gold, color: fetchingPrice ? C.muted : "#000", border: "none", borderRadius: 10, padding: "13px 28px", fontFamily: "system-ui, sans-serif", fontSize: 12, fontWeight: 700, cursor: fetchingPrice ? "not-allowed" : "pointer", letterSpacing: 1, width: "100%", transition: "all 0.2s" }}>
            {fetchingPrice ? "⏳ Fetching historical price…" : form.type === "subtract" ? "↓ LOG SUBTRACTION" : "⚡ STACK SATS"}
          </button>
        </div>

        {/* PORTFOLIO */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: 2, fontWeight: 500, marginBottom: 10 }}>PORTFOLIO OVERVIEW</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
            <StatBox label="Current Worth" value={totalUsd ? fmtUsd(totalUsd) : "—"} sub={btcPrice ? `@ ${fmtUsd(btcPrice)} BTC` : "awaiting price"} valueColor={C.green} accent={C.green} />
            <StatBox label="Cost Basis" value={totalCostUsd > 0 ? fmtUsd(totalCostUsd) : "—"} sub={pnl !== null ? `${pnl >= 0 ? "+" : ""}${fmtUsd(pnl)} P&L` : "—"} valueColor={pnl !== null ? (pnl >= 0 ? C.green : C.red) : C.text} accent={pnl !== null ? (pnl >= 0 ? C.green : C.red) : undefined} />
            <StatBox label="Weighted Avg Cost" value={avgBtcPrice ? fmtUsd(avgBtcPrice) : "—"} sub={avgBtcPrice && btcPrice ? `${btcPrice >= avgBtcPrice ? "▲ +" : "▼ -"}${fmtUsd(Math.abs(btcPrice - avgBtcPrice))} vs current` : "log a buy with price to track"} valueColor={C.blue} accent={C.blue} />
          </div>
        </div>

        {/* HISTORY */}
        <div style={{ ...card, borderRadius: 20, overflow: "hidden" }}>
          <div style={{ padding: "18px 28px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 9, color: C.gold, letterSpacing: 2.5, display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
              <div style={{ width: 2, height: 12, background: C.gold, borderRadius: 1 }} /> STACKING HISTORY
            </div>
            <span style={{ fontSize: 10, color: C.muted }}>{entries.length} {entries.length === 1 ? "entry" : "entries"}</span>
          </div>
          {entries.length === 0 ? (
            <div style={{ textAlign: "center", padding: "70px 20px" }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>⚡</div>
              <div style={{ color: C.muted, fontSize: 11, letterSpacing: 2, fontWeight: 500 }}>CLEAN SLATE. LOG YOUR FIRST ENTRY ABOVE.</div>
              <div style={{ color: C.muted2, fontSize: 10, letterSpacing: 1, marginTop: 8, fontWeight: 300 }}>EVERY SAT COUNTS. 🟠</div>
            </div>
          ) : (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 100px 90px 90px 32px", padding: "10px 20px", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                {["", "DATE & TIME", "SATS", "VALUE NOW", "BTC THEN", ""].map((h, i) => (
                  <div key={i} style={{ fontSize: 9, color: C.muted, letterSpacing: 1.5, fontWeight: 500 }}>{h}</div>
                ))}
              </div>
              <div style={{ maxHeight: 330, overflowY: "auto" }}>
                {sortedHistory.map((e, idx) => {
                  const val   = satsToUsd(e.sats, btcPrice);
                  const isSub = e.type === "subtract";
                  const isExp = expandedRow === e.id;
                  return (
                    <div key={e.id} style={{ borderBottom: idx === sortedHistory.length - 1 ? "none" : "1px solid rgba(255,255,255,0.04)", background: isExp ? "rgba(255,255,255,0.02)" : "transparent", transition: "background 0.2s" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 100px 90px 90px 32px", padding: "12px 20px", cursor: "pointer", alignItems: "center" }} onClick={() => setExpandedRow(isExp ? null : e.id)}>
                        <div style={{ fontSize: 13 }}>{isSub ? "↓" : "⚡"}</div>
                        <div style={{ fontSize: 11, color: C.muted, fontWeight: 300 }}>{formatDatetime(e.datetime)}</div>
                        <div style={{ fontSize: 12, color: isSub ? C.blue : C.gold, fontWeight: 700 }}>{isSub ? "-" : "+"}{fmt(e.sats)}</div>
                        <div style={{ fontSize: 11, color: isSub ? C.muted : C.green, fontWeight: 500 }}>{val ? (isSub ? "-" : "") + fmtUsd(val) : "—"}</div>
                        <div style={{ fontSize: 11, color: C.muted, fontWeight: 300 }}>{e.priceAtAcq ? fmtUsd(e.priceAtAcq) : "—"}</div>
                        <div onClick={ev => { ev.stopPropagation(); deleteEntry(e.id); }}
                          style={{ fontSize: 13, color: C.muted2, cursor: "pointer", textAlign: "center", padding: 4, borderRadius: 6, transition: "color 0.15s" }}
                          onMouseEnter={ev => { ev.currentTarget.style.color = C.red; }}
                          onMouseLeave={ev => { ev.currentTarget.style.color = C.muted2; }}>✕</div>
                      </div>
                      {isExp && (
                        <div style={{ padding: "0 20px 12px 48px", fontSize: 11, color: C.muted, fontStyle: "italic", fontWeight: 300, display: "flex", flexDirection: "column", gap: 4 }}>
                          {e.notes && e.notes.trim() !== "" && (
                            <span>📝 {e.notes}</span>
                          )}
                          {e.priceAtAcq && (
                            <span style={{ color: C.muted2, fontStyle: "normal" }}>₿ price then: {fmtUsd(e.priceAtAcq)}</span>
                          )}
                          {!e.notes && !e.priceAtAcq && (
                            <span style={{ color: C.muted2 }}>No notes recorded.</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div style={{ marginTop: 48, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 32, paddingBottom: 16 }}>
          <div style={{ ...card, borderRadius: 20, padding: "28px 32px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${C.gold}50, transparent)` }} />
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(145deg, ${C.goldDim}, ${C.gold})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>⚡</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Support the Builder</div>
                <div style={{ fontSize: 10, color: C.muted, fontWeight: 300, marginTop: 2 }}>If you find this tool useful, consider sending a few sats to keep it running.</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "⚡ Lightning Address", value: "unusuallease430@walletofsatoshi.com", color: C.blue },
                { label: "₿ Bitcoin Address",   value: "bc1qp93gq8x95esd5j89c3gax3jq9dnzlvwzg464qx", color: C.gold },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontSize: 9, color, letterSpacing: 2, fontWeight: 600, marginBottom: 5 }}>{label}</div>
                    <div style={{ fontSize: 11, color: C.text, wordBreak: "break-all" }}>{value}</div>
                  </div>
                  <button onClick={() => { navigator.clipboard.writeText(value); showToast("📋 Copied!", color); }}
                    style={{ background: color + "20", border: `1px solid ${color}40`, borderRadius: 8, color, padding: "6px 14px", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "system-ui, sans-serif", flexShrink: 0 }}>
                    COPY
                  </button>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 20, textAlign: "center", fontSize: 10, color: C.muted2, fontWeight: 300 }}>Built with 🧡 for the Bitcoin community · Every sat counts</div>
          </div>
        </div>
      </div>

      {celebration && <StackCelebration data={celebration} onDone={() => setCelebration(null)} />}
      {goalCompleted && !goalCompletedDismissed && (
        <GoalCompleteModal goal={goal} onClose={async () => {
          setGoalCompleted(false);
          setGoalCompletedDismissed(true);
          if (googleUser) await saveUserData(googleUser.uid, { goalCompletedDismissed: true });
          setShowGoalModal(true);
        }} />
      )}
      {authStep === "google"   && <GoogleSignIn />}
      {authStep === "profile"  && <ProfileModal onSave={saveProfile} />}
      {showProfileModal && profile && <ProfileModal onSave={saveProfile} existing={profile} onClose={() => setShowProfileModal(false)} />}
      {showGoalModal && <GoalModal onSave={saveGoal} onClose={() => setShowGoalModal(false)} />}

      {toast && (
        <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: "rgba(10,11,13,0.95)", border: `1px solid ${toast.color}40`, borderRadius: 12, padding: "12px 22px", fontSize: 12, color: toast.color, fontWeight: 600, zIndex: 2000, boxShadow: "0 8px 32px rgba(0,0,0,0.4)", backdropFilter: "blur(12px)", whiteSpace: "nowrap", letterSpacing: 0.3 }}>
          {toast.msg}
        </div>
      )}

      <style>{`
        input[type="datetime-local"]::-webkit-calendar-picker-indicator { filter: invert(0.5); cursor: pointer; }
        input[type="number"] { -moz-appearance: textfield; }
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; }
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}