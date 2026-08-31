import { formatDateTime, formatTime } from '../utils/format';
import { EVENT_CONFIG } from '../config/eventConfig';
import { solvedCount } from '../utils/teamProgress';
import { computeTeamRemainingSeconds } from '../utils/timerMath';

export default function AdminTeamTable({ teams, gameState, onSelectTeam }) {
  if (teams.length === 0) {
    return <div className="empty-state">No teams have registered yet.</div>;
  }

  const sorted = [...teams].sort((a, b) => solvedCount(b) - solvedCount(a));

  return (
    <div className="table-scroll">
      <table className="admin-table">
        <thead>
          <tr>
            <th>TEAM ID</th>
            <th>TEAM NAME</th>
            <th>MEMBER 1</th>
            <th>MEMBER 2</th>
            <th>MEMBER 3</th>
            <th>PROGRESS</th>
            <th>STATUS</th>
            <th>TIME</th>
            <th>REGISTERED AT</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((team) => {
            const solved = solvedCount(team);
            const completed = solved === EVENT_CONFIG.totalLocks;
            const teamRemaining = computeTeamRemainingSeconds(gameState, team);
            return (
              <tr
                key={team.teamId}
                onClick={() => onSelectTeam(team)}
                className={`admin-table__row ${team.disqualified ? 'admin-table__row--disqualified' : ''}`}
              >
                <td className="mono">{team.teamId}</td>
                <td>{team.teamName}</td>
                <td>{team.member1}</td>
                <td>{team.member2}</td>
                <td>{team.member3}</td>
                <td>
                  <div className="mini-progress">
                    <div className="mini-progress__track">
                      <div
                        className="mini-progress__fill"
                        style={{ width: `${(solved / EVENT_CONFIG.totalLocks) * 100}%` }}
                      />
                    </div>
                    <span>
                      {solved} / {EVENT_CONFIG.totalLocks}
                    </span>
                  </div>
                </td>
                <td>
                  <span
                    className={`status-pill ${
                      team.disqualified
                        ? 'status-pill--disqualified'
                        : completed
                        ? 'status-pill--complete'
                        : 'status-pill--active'
                    }`}
                  >
                    {team.disqualified ? 'DISQUALIFIED' : completed ? 'COMPLETED' : 'ACTIVE'}
                  </span>
                </td>
                <td className="mono">{formatTime(teamRemaining)}</td>
                <td>{formatDateTime(team.registeredAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
