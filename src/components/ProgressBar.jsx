export default function ProgressBar({ solvedCount, total }) {
  const percent = Math.round((solvedCount / total) * 100);

  return (
    <div className="progress-block">
      <div className="progress-block__header">
        <span>PROGRESS</span>
        <span>{solvedCount} / {total} LOCKS UNLOCKED</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
