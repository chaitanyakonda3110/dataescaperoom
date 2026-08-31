import { EVENT_CONFIG } from '../config/eventConfig';
import { solvedCount } from '../utils/teamProgress';
import { rankTeams, lastSolvedAt } from '../utils/leaderboard';
import { formatDateTime } from '../utils/format';
import { downloadCsv } from '../utils/csv';

const MEDALS = ['🥇', '🥈', '🥉'];

function exportResultsCsv(rankedTeams) {
  const header = [
    'Rank',
    'Team ID',
    'Team Name',
    'Member 1',
    'Member 2',
    'Member 3',
    'Locks Solved',
    `Out Of`,
    'Reached At',
    'Status',
  ];
  const rows = rankedTeams.map((team, i) => {
    const reachedMs = lastSolvedAt(team);
    return [
      i + 1,
      team.teamId,
      team.teamName,
      team.member1,
      team.member2,
      team.member3,
      solvedCount(team),
      EVENT_CONFIG.totalLocks,
      reachedMs ? new Date(reachedMs).toISOString() : '',
      team.disqualified ? 'DISQUALIFIED' : 'ACTIVE',
    ];
  });
  downloadCsv(`data-escape-room-results-${Date.now()}.csv`, [header, ...rows]);
}

export default function AdminLeaderboard({ teams, onViewResults }) {
  if (teams.length === 0) {
    return (
      <div className="admin-panel">
        <h3 className="admin-panel__title">LEADERBOARD</h3>
        <div className="empty-state">No teams have registered yet.</div>
      </div>
    );
  }

  const ranked = rankTeams(teams);

  return (
    <div className="admin-panel">
      <div className="admin-panel__header">
        <div>
          <h3 className="admin-panel__title">LEADERBOARD</h3>
          <p className="admin-panel__subtitle">
            Ranked by Locks solved. Ties are broken by whichever team reached that count first —
            this is your fastest-response tiebreaker if the event ends with equal scores.
            Disqualified teams are always ranked last.
          </p>
        </div>
        <div className="admin-panel__header-actions">
          {onViewResults && (
            <button type="button" className="btn btn--ghost" onClick={onViewResults}>
              VIEW RESULTS
            </button>
          )}
          <button type="button" className="btn btn--ghost" onClick={() => exportResultsCsv(ranked)}>
            DOWNLOAD CSV
          </button>
        </div>
      </div>

      <div className="table-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              <th>RANK</th>
              <th>TEAM ID</th>
              <th>TEAM NAME</th>
              <th>LOCKS SOLVED</th>
              <th>REACHED AT</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((team, i) => {
              const solved = solvedCount(team);
              const reachedAt = lastSolvedAt(team);
              return (
                <tr
                  key={team.teamId}
                  className={`admin-table__row ${team.disqualified ? 'admin-table__row--disqualified' : ''}`}
                >
                  <td className="leaderboard__rank">
                    {MEDALS[i] ?? `#${i + 1}`}
                  </td>
                  <td className="mono">{team.teamId}</td>
                  <td>{team.teamName}</td>
                  <td className="mono">
                    {solved} / {EVENT_CONFIG.totalLocks}
                  </td>
                  <td>{formatDateTime(reachedAt)}</td>
                  <td>
                    <span
                      className={`status-pill ${
                        team.disqualified ? 'status-pill--disqualified' : 'status-pill--active'
                      }`}
                    >
                      {team.disqualified ? 'DISQUALIFIED' : 'ACTIVE'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
