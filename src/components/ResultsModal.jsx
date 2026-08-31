import { useEffect, useMemo, useState } from 'react';
import { rankTeams } from '../utils/leaderboard';

const PODIUM_ORDER = [1, 0, 2]; // display order: 2nd, 1st, 3rd
const PODIUM_LABELS = ['1ST', '2ND', '3RD'];
const PODIUM_MEDALS = ['🥇', '🥈', '🥉'];

const CONFETTI_COLORS = ['#8B5CF6', '#EC4899', '#F472B6', '#FBBF24', '#34D399', '#F8FAFC'];
const CONFETTI_COUNT = 50;

function ConfettiBurst() {
  const pieces = useMemo(
    () =>
      Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        delay: Math.random() * 2,
        duration: 2.5 + Math.random() * 2,
        rotate: Math.random() * 360,
        width: 5 + Math.random() * 6,
        height: 8 + Math.random() * 8,
      })),
    []
  );

  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti__piece"
          style={{
            left: `${p.left}%`,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            width: `${p.width}px`,
            height: `${p.height}px`,
            '--rotate-from': `${p.rotate}deg`,
          }}
        />
      ))}
    </div>
  );
}

export default function ResultsModal({ open, initialPhase, teams, onClose }) {
  const [phase, setPhase] = useState(initialPhase);

  useEffect(() => {
    if (open) setPhase(initialPhase);
  }, [open, initialPhase]);

  if (!open) return null;

  const ranked = rankTeams(teams);
  const top3 = [ranked[0], ranked[1], ranked[2]];
  const rest = ranked.slice(3);

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-card results-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-card__close" onClick={onClose}>
          ×
        </button>

        {phase === 'podium' && <ConfettiBurst />}

        <div className="results-modal__scroll">
          {phase === 'announce' ? (
            <div className="results-modal__announce">
              <h2 className="results-modal__announce-title">TIME'S UP</h2>
              <p className="modal-card__desc">The event timer has run out. Ready to reveal the standings?</p>
              <button type="button" className="btn btn--primary btn--full" onClick={() => setPhase('podium')}>
                TIME'S UP — VIEW RESULTS
              </button>
            </div>
          ) : (
            <>
              <h3 className="modal-card__title results-modal__celebrate-title">
                🎉 FINAL RESULTS 🎉
              </h3>

              <div className="podium">
                {PODIUM_ORDER.map((rankIndex) => {
                  const team = top3[rankIndex];
                  return (
                    <div key={rankIndex} className={`podium__place podium__place--${rankIndex + 1}`}>
                      <div className="podium__team-name">{team ? team.teamName : '—'}</div>
                      <div className="podium__block">
                        <span className="podium__medal">{PODIUM_MEDALS[rankIndex]}</span>
                        <span className="podium__label">{PODIUM_LABELS[rankIndex]}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {rest.length > 0 && (
                <ol className="results-modal__rest" start={4}>
                  {rest.map((team, i) => (
                    <li key={team.teamId}>
                      <span className="results-modal__rest-rank">{i + 4}.</span> {team.teamName}
                    </li>
                  ))}
                </ol>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
