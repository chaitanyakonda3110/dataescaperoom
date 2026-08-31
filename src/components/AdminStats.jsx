import { isTeamComplete } from '../utils/teamProgress';

export default function AdminStats({ teams, timerStatus }) {
  const total = teams.length;
  const completed = teams.filter(isTeamComplete).length;
  const active = total - completed;

  const stats = [
    { label: 'TOTAL TEAMS REGISTERED', value: total },
    { label: 'ACTIVE TEAMS', value: active },
    { label: 'COMPLETED TEAMS', value: completed },
    { label: 'TIMER STATE', value: (timerStatus ?? 'NOT_STARTED').replace('_', ' ') },
  ];

  return (
    <div className="admin-stats-grid">
      {stats.map((s) => (
        <div key={s.label} className="glass-card admin-stat-card">
          <div className="admin-stat-card__value">{s.value}</div>
          <div className="admin-stat-card__label">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
