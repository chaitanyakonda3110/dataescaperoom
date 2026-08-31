import { useState } from 'react';
import { registerTeam } from '../firebase/firestore';
import { useToast } from '../context/ToastContext';

const EMPTY_FORM = { teamName: '', member1: '', member2: '', member3: '' };

export default function TeamRegistration({ onRegistered }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validate() {
    if (!form.teamName.trim()) return 'Team name is required.';
    if (!form.member1.trim() || !form.member2.trim() || !form.member3.trim()) {
      return 'All three member names are required.';
    }
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const error = validate();
    if (error) {
      showToast(error, 'error');
      return;
    }

    setSubmitting(true);
    try {
      const teamId = await registerTeam(form);
      showToast('Team registered successfully!', 'success');
      onRegistered({ teamId, teamName: form.teamName.trim() });
      setForm(EMPTY_FORM);
    } catch (err) {
      showToast(err.message || 'Registration failed. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="glass-card registration-card" onSubmit={handleSubmit}>
      <h2 className="registration-card__title">DATA ESCAPE ROOM</h2>
      <h3 className="registration-card__subtitle">REGISTER YOUR TEAM</h3>

      <label className="field-label" htmlFor="teamName">
        TEAM NAME
      </label>
      <input
        id="teamName"
        className="text-input"
        value={form.teamName}
        onChange={(e) => update('teamName', e.target.value)}
        placeholder="Enter team name"
        maxLength={40}
      />

      <label className="field-label" htmlFor="member1">
        MEMBER 1
      </label>
      <input
        id="member1"
        className="text-input"
        value={form.member1}
        onChange={(e) => update('member1', e.target.value)}
        placeholder="Full name"
        maxLength={40}
      />

      <label className="field-label" htmlFor="member2">
        MEMBER 2
      </label>
      <input
        id="member2"
        className="text-input"
        value={form.member2}
        onChange={(e) => update('member2', e.target.value)}
        placeholder="Full name"
        maxLength={40}
      />

      <label className="field-label" htmlFor="member3">
        MEMBER 3
      </label>
      <input
        id="member3"
        className="text-input"
        value={form.member3}
        onChange={(e) => update('member3', e.target.value)}
        placeholder="Full name"
        maxLength={40}
      />

      <button type="submit" className="btn btn--primary btn--full" disabled={submitting}>
        {submitting ? 'REGISTERING...' : 'REGISTER TEAM'}
      </button>
    </form>
  );
}
