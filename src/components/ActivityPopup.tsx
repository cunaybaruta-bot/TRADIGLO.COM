'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';

interface ActivityNotification {
  id: number;
  type: 'profit' | 'withdrawal';
  name: string;
  account: string;
  amount: number;
  asset: string;
  timeAgo: string;
}

const firstNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'R', 'S', 'T', 'W', 'Y', 'Z'];
const lastNames = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'r', 's', 't', 'u'];
const assets = ['BTC/USD', 'ETH/USD', 'XAU/USD', 'EUR/USD', 'GBP/USD', 'NAS100', 'SPX500', 'OIL/USD', 'LTC/USD', 'SOL/USD'];

// Asset icon mapping
const assetIcons: Record<string, { symbol: string; color: string; bg: string }> = {
  'BTC/USD': { symbol: '₿', color: '#F7931A', bg: 'rgba(247,147,26,0.15)' },
  'ETH/USD': { symbol: 'Ξ', color: '#627EEA', bg: 'rgba(98,126,234,0.15)' },
  'XAU/USD': { symbol: 'Au', color: '#FFD700', bg: 'rgba(255,215,0,0.15)' },
  'EUR/USD': { symbol: '€', color: '#4A90D9', bg: 'rgba(74,144,217,0.15)' },
  'GBP/USD': { symbol: '£', color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)' },
  'NAS100': { symbol: 'N', color: '#06B6D4', bg: 'rgba(6,182,212,0.15)' },
  'SPX500': { symbol: 'S', color: '#10B981', bg: 'rgba(16,185,129,0.15)' },
  'OIL/USD': { symbol: '⛽', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)' },
  'LTC/USD': { symbol: 'Ł', color: '#A0A0A0', bg: 'rgba(160,160,160,0.15)' },
  'SOL/USD': { symbol: '◎', color: '#9945FF', bg: 'rgba(153,69,255,0.15)' },
};

function generateName(): string {
  const first = firstNames[Math.floor(Math.random() * firstNames.length)];
  const last = lastNames[Math.floor(Math.random() * lastNames.length)];
  const mid = Math.floor(Math.random() * 4) + 2;
  return `${first}${'*'.repeat(mid)}${last}`;
}

function generateAccount(): string {
  const prefix = Math.floor(Math.random() * 9) + 1;
  const suffix = Math.floor(Math.random() * 90000) + 10000;
  return `${prefix}${'*'.repeat(4)}${suffix}`;
}

function generateAmount(type: 'profit' | 'withdrawal'): number {
  if (type === 'profit') {
    // Profit: max ~$50,000 — well below leaderboard top profit (~$200k)
    const tier = Math.random();
    if (tier < 0.40) {
      // $500 – $3,000
      return Math.floor(Math.random() * 2500 * 100 + 500 * 100) / 100;
    } else if (tier < 0.70) {
      // $3,000 – $12,000
      return Math.floor(Math.random() * 9000 * 100 + 3000 * 100) / 100;
    } else if (tier < 0.90) {
      // $12,000 – $28,000
      return Math.floor(Math.random() * 16000 * 100 + 12000 * 100) / 100;
    } else {
      // $28,000 – $50,000
      return Math.floor(Math.random() * 22000 * 100 + 28000 * 100) / 100;
    }
  } else {
    // Withdrawal: max ~$25,000 — well below leaderboard top withdrawal (~$85k)
    const tier = Math.random();
    if (tier < 0.40) {
      // $200 – $2,000
      return Math.floor(Math.random() * 1800 * 100 + 200 * 100) / 100;
    } else if (tier < 0.70) {
      // $2,000 – $8,000
      return Math.floor(Math.random() * 6000 * 100 + 2000 * 100) / 100;
    } else if (tier < 0.90) {
      // $8,000 – $18,000
      return Math.floor(Math.random() * 10000 * 100 + 8000 * 100) / 100;
    } else {
      // $18,000 – $25,000
      return Math.floor(Math.random() * 7000 * 100 + 18000 * 100) / 100;
    }
  }
}

function formatAmount(amount: number): string {
  if (amount >= 1000) {
    return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return amount.toFixed(2);
}

let notifCounter = 0;

function generateNotification(): ActivityNotification {
  notifCounter += 1;
  const type = Math.random() < 0.55 ? 'profit' : 'withdrawal';
  const timeOptions = ['just now', '1 min ago', '2 min ago', '3 min ago'];
  return {
    id: notifCounter,
    type,
    name: generateName(),
    account: generateAccount(),
    amount: generateAmount(type),
    asset: assets[Math.floor(Math.random() * assets.length)],
    timeAgo: timeOptions[Math.floor(Math.random() * timeOptions.length)],
  };
}

export default function ActivityPopup() {
  const pathname = usePathname();
  const [current, setCurrent] = useState<ActivityNotification | null>(null);
  const [animState, setAnimState] = useState<'hidden' | 'entering' | 'visible' | 'leaving'>('hidden');
  const [dismissed, setDismissed] = useState(false);
  const isHovered = useRef(false);
  const rotationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prefersReducedMotion = useRef(false);

  // Only show on home page
  const isHomePage = pathname === '/';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      prefersReducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (sessionStorage.getItem('activity_popup_dismissed') === '1') {
        setDismissed(true);
      }
    }
  }, []);

  const clearTimers = useCallback(() => {
    if (rotationTimer.current) clearTimeout(rotationTimer.current);
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);

  const showNotification = useCallback((notif: ActivityNotification) => {
    setCurrent(notif);
    setAnimState('entering');

    const enterDuration = prefersReducedMotion.current ? 0 : 400;
    setTimeout(() => setAnimState('visible'), enterDuration);

    hideTimer.current = setTimeout(() => {
      if (!isHovered.current) {
        setAnimState('leaving');
        const leaveDuration = prefersReducedMotion.current ? 0 : 300;
        setTimeout(() => {
          setAnimState('hidden');
          setCurrent(null);
        }, leaveDuration);
      }
    }, 6000);
  }, []);

  const scheduleNext = useCallback(() => {
    rotationTimer.current = setTimeout(() => {
      if (!isHovered.current) {
        const notif = generateNotification();
        showNotification(notif);
        scheduleNext();
      } else {
        rotationTimer.current = setTimeout(scheduleNext, 1000);
      }
    }, 12000);
  }, [showNotification]);

  useEffect(() => {
    if (!isHomePage || dismissed) return;

    const initialDelay = setTimeout(() => {
      const notif = generateNotification();
      showNotification(notif);
      scheduleNext();
    }, 8000);

    return () => {
      clearTimeout(initialDelay);
      clearTimers();
    };
  }, [isHomePage, dismissed, showNotification, scheduleNext, clearTimers]);

  const handleClose = useCallback(() => {
    clearTimers();
    setAnimState('leaving');
    const leaveDuration = prefersReducedMotion.current ? 0 : 300;
    setTimeout(() => {
      setAnimState('hidden');
      setCurrent(null);
      setDismissed(true);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('activity_popup_dismissed', '1');
      }
    }, leaveDuration);
  }, [clearTimers]);

  const handleMouseEnter = useCallback(() => {
    isHovered.current = true;
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    isHovered.current = false;
    hideTimer.current = setTimeout(() => {
      setAnimState('leaving');
      const leaveDuration = prefersReducedMotion.current ? 0 : 300;
      setTimeout(() => {
        setAnimState('hidden');
        setCurrent(null);
      }, leaveDuration);
    }, 2000);
  }, []);

  if (!isHomePage || dismissed || animState === 'hidden' || !current) return null;

  const isEntering = animState === 'entering';
  const isLeaving = animState === 'leaving';
  const reduceMotion = prefersReducedMotion.current;

  const translateX = reduceMotion ? 'translateX(0)' : (isEntering || isLeaving) ? 'translateX(-120%)' : 'translateX(0)';
  const opacity = reduceMotion ? 1 : (isEntering || isLeaving) ? 0 : 1;
  const scale = reduceMotion ? 1 : (isEntering || isLeaving) ? 0.95 : 1;
  const transition = reduceMotion
    ? 'none'
    : isLeaving
    ? 'transform 300ms cubic-bezier(0.4, 0, 1, 1), opacity 300ms ease-in, scale 300ms ease-in'
    : 'transform 400ms cubic-bezier(0.16, 1, 0.3, 1), opacity 400ms ease-out, scale 400ms ease-out';

  const assetIcon = assetIcons[current.asset] ?? { symbol: current.asset.slice(0, 2), color: '#94A3B8', bg: 'rgba(148,163,184,0.15)' };
  const isProfit = current.type === 'profit';

  return (
    <>
      <style>{`
        @keyframes shimmer-line {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        .activity-popup-shimmer {
          animation: shimmer-line 2.5s ease-in-out infinite;
        }
        .activity-live-dot {
          animation: pulse-dot 1.5s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .activity-popup-inner {
            transition: none !important;
            transform: none !important;
          }
          .activity-popup-shimmer { animation: none !important; }
          .activity-live-dot { animation: none !important; }
        }
      `}</style>

      <div
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: 'fixed',
          bottom: '16px',
          left: '16px',
          zIndex: 50,
          maxWidth: '240px',
          width: 'calc(100vw - 32px)',
          pointerEvents: 'none',
        }}
      >
        <div
          className="activity-popup-inner"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            pointerEvents: 'auto',
            transform: `${translateX} scale(${scale})`,
            opacity: opacity,
            transition: transition,
            background: 'linear-gradient(135deg, rgba(15, 15, 25, 0.96) 0%, rgba(20, 20, 35, 0.96) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: `1px solid ${isProfit ? 'rgba(74, 222, 128, 0.2)' : 'rgba(96, 165, 250, 0.2)'}`,
            borderRadius: '12px',
            padding: '9px 10px',
            boxShadow: `0 6px 24px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06), 0 3px 12px ${isProfit ? 'rgba(74,222,128,0.08)' : 'rgba(96,165,250,0.08)'}`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Shimmer sweep */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
              overflow: 'hidden',
              borderRadius: '12px',
            }}
          >
            <div
              className="activity-popup-shimmer"
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                width: '30%',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)',
                transform: 'translateX(-100%)',
              }}
            />
          </div>

          {/* Top accent line */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '10px',
              right: '10px',
              height: '1px',
              background: isProfit
                ? 'linear-gradient(90deg, transparent, rgba(74,222,128,0.6), transparent)'
                : 'linear-gradient(90deg, transparent, rgba(96,165,250,0.6), transparent)',
              borderRadius: '1px',
            }}
          />

          {/* Main content row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
            {/* Asset icon badge */}
            <div
              style={{
                flexShrink: 0,
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: assetIcon.bg,
                border: `1px solid ${assetIcon.color}30`,
                fontSize: '12px',
                fontWeight: 700,
                color: assetIcon.color,
                letterSpacing: '-0.5px',
                position: 'relative',
              }}
            >
              {assetIcon.symbol}
              {/* Type badge overlay */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '-3px',
                  right: '-3px',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: isProfit ? '#16a34a' : '#1d4ed8',
                  border: '1.5px solid rgba(15,15,25,0.96)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isProfit ? (
                  <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                ) : (
                  <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="#93c5fd" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14m-7-7l7 7 7-7" />
                  </svg>
                )}
              </div>
            </div>

            {/* Text content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Header row: name + live dot */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '11px', letterSpacing: '0.1px' }}>
                    {current.name}
                  </span>
                  <span
                    style={{
                      color: 'rgba(148,163,184,0.6)',
                      fontSize: '9px',
                      fontFamily: 'monospace',
                      letterSpacing: '0.5px',
                    }}
                  >
                    #{current.account}
                  </span>
                </div>
                {/* Live indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
                  <div
                    className="activity-live-dot"
                    style={{
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      background: isProfit ? '#4ade80' : '#60a5fa',
                    }}
                  />
                  <span style={{ color: isProfit ? '#4ade80' : '#60a5fa', fontSize: '8px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    {isProfit ? 'Profit' : 'Withdraw'}
                  </span>
                </div>
              </div>

              {/* Asset label */}
              <div style={{ marginBottom: '3px' }}>
                <span style={{ color: 'rgba(148,163,184,0.7)', fontSize: '9px' }}>
                  {isProfit ? 'Profit from' : 'Withdrawal from'}{' '}
                </span>
                <span
                  style={{
                    color: assetIcon.color,
                    fontSize: '9px',
                    fontWeight: 600,
                    background: assetIcon.bg,
                    padding: '1px 4px',
                    borderRadius: '3px',
                    border: `1px solid ${assetIcon.color}25`,
                  }}
                >
                  {current.asset}
                </span>
              </div>

              {/* Amount + time row */}
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span
                  style={{
                    color: isProfit ? '#4ade80' : '#60a5fa',
                    fontWeight: 800,
                    fontSize: '13px',
                    letterSpacing: '-0.5px',
                    lineHeight: 1,
                    textShadow: isProfit ? '0 0 10px rgba(74,222,128,0.4)' : '0 0 10px rgba(96,165,250,0.4)',
                  }}
                >
                  {isProfit ? '+' : ''} ${formatAmount(current.amount)}
                </span>
                <span style={{ color: 'rgba(148,163,184,0.45)', fontSize: '8px', letterSpacing: '0.3px' }}>
                  {current.timeAgo}
                </span>
              </div>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            aria-label="Tutup notifikasi"
            style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              width: '16px',
              height: '16px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '50%',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255,255,255,0.35)',
              flexShrink: 0,
              transition: 'background 200ms, color 200ms',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)';
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.7)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)';
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.35)';
            }}
          >
            <svg width="6" height="6" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M1 1l8 8M9 1L1 9" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
