import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { t } from '../i18n/translations'

const profileLabels = {
  en: {
    heading: 'Profile',
    firstName: 'First name',
    emailLabel: 'Email address',
    languageLabel: 'Language',
    saveChanges: 'Save changes',
    saved: 'Saved',
    deleteAccount: 'Delete account',
    deleteTitle: 'Delete your account?',
    deleteDesc: 'This will permanently delete all your data. This action cannot be undone.',
    deleteTypeTip: 'Type DELETE to confirm',
    deleteConfirmBtn: 'Confirm deletion',
    deleteNote: 'Your data has been deleted. Email privacy@finku.eu to fully remove your account.',
    back: '← Back to dashboard',
    legal: 'Legal',
    privacyPolicy: 'Privacy Policy',
    terms: 'Terms',
  },
  bg: {
    heading: 'Профил',
    firstName: 'Първо Ime',
    emailLabel: 'Имейл адрес',
    languageLabel: 'Език',
    saveChanges: 'Запази промените',
    saved: 'Запазено',
    deleteAccount: 'Изтрий акаунта',
    deleteTitle: 'Изтриване на акаунта?',
    deleteDesc: 'Това ще изтрие постоянно всичките ви данни. Тази операция не може да бъде отменена.',
    deleteTypeTip: 'Напишете DELETE за потвърждение',
    deleteConfirmBtn: 'Потвърди изтриването',
    deleteNote: 'Данните ви са изтрити. Изпратете имейл на privacy@finku.eu за пълно премахване на акаунта.',
    back: '← Обратно към таблото',
    legal: 'Правни документи',
    privacyPolicy: 'Политика за поверителност',
    terms: 'Общи условия',
  },
}

export default function Profile({ session, language, onLanguageChange }) {
  const lang = t[language]
  const pl = profileLabels[language] || profileLabels.en
  const navigate = useNavigate()
  const userId = session.user.id
  const email = session.user.email

  const [firstName, setFirstName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteSuccess, setDeleteSuccess] = useState(false)

  useEffect(() => {
    supabase.from('profiles').select('first_name').eq('id', userId).single()
      .then(({ data }) => { if (data?.first_name) setFirstName(data.first_name) })
  }, [userId])

  async function handleSaveName() {
    if (!firstName.trim()) return
    setSaving(true)
    await supabase.from('profiles').update({ first_name: firstName.trim() }).eq('id', userId)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function handleDeleteAccount() {
    if (deleteConfirmText !== 'DELETE') return
    setDeleting(true)
    await supabase.from('income').delete().eq('user_id', userId)
    await supabase.from('expenses').delete().eq('user_id', userId)
    await supabase.from('profiles').delete().eq('id', userId)
    setDeleteSuccess(true)
    setTimeout(async () => {
      await supabase.auth.signOut()
      navigate('/')
    }, 2500)
  }

  async function handleLanguageChange(l) {
    await supabase.from('profiles').update({ language: l }).eq('id', userId)
    onLanguageChange(l)
  }

  return (
    <>
      <style>{`
        .profile-page {
          min-height: 100vh;
          background: #0e0e0c;
          font-family: 'DM Sans', sans-serif;
        }

        .profile-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2rem;
          height: 60px;
          border-bottom: 0.5px solid rgba(240,237,228,0.08);
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 50;
          background: rgba(14,14,12,0.9);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        .profile-nav-logo {
          font-family: 'Instrument Serif', serif;
          font-size: 20px;
          color: #f0ede4;
          letter-spacing: -0.3px;
          text-decoration: none;
        }

        .profile-back-btn {
          background: none;
          border: none;
          color: rgba(240,237,228,0.5);
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          cursor: pointer;
          padding: 6px 12px;
          border-radius: 8px;
          transition: color 0.15s, background 0.15s;
        }
        .profile-back-btn:hover { color: #f0ede4; background: rgba(240,237,228,0.06); }

        .profile-content {
          max-width: 560px;
          margin: 0 auto;
          padding: 5rem 1.5rem 4rem;
        }

        .profile-heading {
          font-family: 'Instrument Serif', serif;
          font-size: 32px;
          color: #f0ede4;
          letter-spacing: -0.5px;
          margin-bottom: 2rem;
        }

        .profile-section {
          background: #161614;
          border: 1px solid rgba(240,237,228,0.08);
          border-radius: 14px;
          padding: 1.5rem;
          margin-bottom: 1rem;
        }

        .profile-section-title {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: rgba(240,237,228,0.3);
          margin-bottom: 1.25rem;
        }

        .profile-field {
          margin-bottom: 1rem;
        }
        .profile-field:last-child { margin-bottom: 0; }

        .profile-input-row {
          display: flex;
          gap: 10px;
          align-items: flex-end;
        }

        .profile-input-row .input-field {
          flex: 1;
        }

        .profile-readonly {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid rgba(240,237,228,0.06);
          border-radius: 10px;
          font-size: 14px;
          color: rgba(240,237,228,0.4);
          background: rgba(240,237,228,0.03);
          font-family: 'DM Sans', sans-serif;
        }

        .lang-toggle {
          display: flex;
          gap: 8px;
        }

        .lang-toggle-btn {
          flex: 1;
          padding: 10px;
          border-radius: 10px;
          border: 1px solid rgba(240,237,228,0.1);
          background: transparent;
          color: rgba(240,237,228,0.5);
          font-size: 14px;
          font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: all 0.15s;
        }
        .lang-toggle-btn:hover { border-color: rgba(240,237,228,0.2); color: #f0ede4; }
        .lang-toggle-btn.active {
          border-color: #c8f03a;
          background: rgba(200,240,58,0.08);
          color: #c8f03a;
        }

        .delete-btn {
          width: 100%;
          padding: 11px;
          border-radius: 10px;
          border: 1px solid rgba(224,112,112,0.25);
          background: transparent;
          color: #e07070;
          font-size: 14px;
          font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
        }
        .delete-btn:hover { background: rgba(224,112,112,0.08); border-color: rgba(224,112,112,0.4); }

        .delete-confirm {
          background: rgba(224,112,112,0.06);
          border: 1px solid rgba(224,112,112,0.2);
          border-radius: 12px;
          padding: 1.25rem;
        }

        .delete-confirm-title {
          font-size: 14px;
          font-weight: 500;
          color: #e07070;
          margin-bottom: 6px;
        }

        .delete-confirm-desc {
          font-size: 13px;
          color: rgba(240,237,228,0.5);
          line-height: 1.6;
          margin-bottom: 8px;
        }

        .delete-confirm-note {
          font-size: 12px;
          color: rgba(240,237,228,0.3);
          line-height: 1.6;
          margin-bottom: 1rem;
          padding: 10px 12px;
          background: rgba(240,237,228,0.04);
          border-radius: 8px;
        }

        .delete-cancel-btn {
          background: none;
          border: 1px solid rgba(240,237,228,0.12);
          color: rgba(240,237,228,0.6);
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          padding: 8px 16px;
          border-radius: 8px;
          transition: background 0.15s;
        }
        .delete-cancel-btn:hover { background: rgba(240,237,228,0.06); }

        .delete-input {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid rgba(224,112,112,0.2);
          border-radius: 10px;
          background: rgba(0,0,0,0.25);
          color: #f0ede4;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          margin-bottom: 10px;
          box-sizing: border-box;
          letter-spacing: 0.5px;
        }
        .delete-input::placeholder { color: rgba(240,237,228,0.25); letter-spacing: 0; }
        .delete-input:focus { outline: none; border-color: rgba(224,112,112,0.5); }

        .delete-confirm-btn {
          padding: 8px 16px;
          border-radius: 8px;
          border: none;
          background: #e07070;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
        }
        .delete-confirm-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .delete-confirm-btn:not(:disabled):hover { background: #c95555; }

        .profile-legal-links {
          display: flex;
          gap: 1.25rem;
          margin-top: 1.5rem;
        }

        .profile-legal-link {
          font-size: 13px;
          color: rgba(240,237,228,0.3);
          text-decoration: none;
          transition: color 0.15s;
        }
        .profile-legal-link:hover { color: rgba(240,237,228,0.6); }
      `}</style>

      <div className="profile-page">
        <nav className="profile-nav">
          <Link to="/dashboard" className="profile-nav-logo">Finku</Link>
          <button className="profile-back-btn" onClick={() => navigate('/dashboard')}>
            {pl.back}
          </button>
        </nav>

        <div className="profile-content">
          <h1 className="profile-heading">{pl.heading}</h1>

          {/* Personal info */}
          <div className="profile-section">
            <div className="profile-section-title">Account</div>

            <div className="profile-field">
              <label className="label">{pl.firstName}</label>
              <div className="profile-input-row">
                <input
                  className="input-field"
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="Nikola"
                  onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                />
                <button
                  className="btn-primary"
                  onClick={handleSaveName}
                  disabled={saving || !firstName.trim()}
                  style={{ flexShrink: 0, padding: '10px 16px' }}
                >
                  {saved ? pl.saved : saving ? '…' : pl.saveChanges}
                </button>
              </div>
            </div>

            <div className="profile-field">
              <label className="label">{pl.emailLabel}</label>
              <div className="profile-readonly">{email}</div>
            </div>
          </div>

          {/* Language */}
          <div className="profile-section">
            <div className="profile-section-title">{pl.languageLabel}</div>
            <div className="lang-toggle">
              <button
                className={`lang-toggle-btn${language === 'en' ? ' active' : ''}`}
                onClick={() => handleLanguageChange('en')}
              >
                English
              </button>
              <button
                className={`lang-toggle-btn${language === 'bg' ? ' active' : ''}`}
                onClick={() => handleLanguageChange('bg')}
              >
                Български
              </button>
            </div>
          </div>

          {/* Delete account */}
          <div className="profile-section">
            <div className="profile-section-title">Danger zone</div>
            {showDeleteConfirm ? (
              <div className="delete-confirm">
                {deleteSuccess ? (
                  <div className="delete-confirm-note" style={{ marginBottom: 0 }}>{pl.deleteNote}</div>
                ) : (
                  <>
                    <div className="delete-confirm-title">{pl.deleteTitle}</div>
                    <div className="delete-confirm-desc">{pl.deleteDesc}</div>
                    <input
                      className="delete-input"
                      type="text"
                      value={deleteConfirmText}
                      onChange={e => setDeleteConfirmText(e.target.value)}
                      placeholder={pl.deleteTypeTip}
                      autoComplete="off"
                      spellCheck={false}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="delete-cancel-btn"
                        onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText('') }}
                      >
                        {lang.cancel}
                      </button>
                      <button
                        className="delete-confirm-btn"
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirmText !== 'DELETE' || deleting}
                      >
                        {deleting ? '…' : pl.deleteConfirmBtn}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button className="delete-btn" onClick={() => setShowDeleteConfirm(true)}>
                {pl.deleteAccount}
              </button>
            )}
          </div>

          {/* Legal links */}
          <div className="profile-legal-links">
            <Link to="/privacy" className="profile-legal-link">{pl.privacyPolicy}</Link>
            <Link to="/terms" className="profile-legal-link">{pl.terms}</Link>
          </div>
        </div>
      </div>
    </>
  )
}
