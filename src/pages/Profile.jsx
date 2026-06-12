import { useEffect, useState } from 'react'
import { useLanguage } from '../lib/LanguageContext'
import LanguageToggle from '../components/LanguageToggle'
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
    deleteNote: 'Your data has been deleted. Email support@finku.eu to fully remove your account.',
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
    deleteNote: 'Данните ви са изтрити. Изпратете имейл на support@finku.eu за пълно премахване на акаунта.',
    back: '← Обратно към таблото',
    legal: 'Правни документи',
    privacyPolicy: 'Политика за поверителност',
    terms: 'Общи условия',
  },
}

export default function Profile({ session }) {
  const { language } = useLanguage()
  const lang = t[language]
  const pl = profileLabels[language] || profileLabels.en
  const navigate = useNavigate()
  const userId = session.user.id
  const email = session.user.email

  const isBg = language === 'bg'
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [pwResetSent, setPwResetSent] = useState(false)
  const [pwResetLoading, setPwResetLoading] = useState(false)
  const [currentLegalForm, setCurrentLegalForm] = useState(null)
  const [showLegalFormEdit, setShowLegalFormEdit] = useState(false)
  const [legalFormSaved, setLegalFormSaved] = useState(false)
  const [authorRate, setAuthorRate] = useState(false)
  const [authorRateSaving, setAuthorRateSaving] = useState(false)

  useEffect(() => { document.title = 'Profile · Finku' }, [])
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteSuccess, setDeleteSuccess] = useState(false)

  useEffect(() => {
    supabase.from('profiles').select('legal_form, author_rate').eq('id', userId).single()
      .then(({ data }) => {
        if (data?.legal_form) setCurrentLegalForm(data.legal_form)
        setAuthorRate(data?.author_rate ?? false)
      })
  }, [userId])

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

  async function handleChangePassword() {
    setPwResetLoading(true)
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://finku.eu/update-password',
    })
    setPwResetLoading(false)
    setPwResetSent(true)
  }

  async function handleLegalFormChange(value) {
    await supabase.from('profiles').update({ legal_form: value }).eq('id', userId)
    setCurrentLegalForm(value)
    setLegalFormSaved(true)
    setTimeout(() => { setShowLegalFormEdit(false); setLegalFormSaved(false) }, 1500)
  }

  async function handleAuthorRateToggle() {
    const next = !authorRate
    setAuthorRateSaving(true)
    await supabase.from('profiles').update({ author_rate: next }).eq('id', userId)
    setAuthorRate(next)
    setAuthorRateSaving(false)
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

        .lf-option {
          background: rgba(240,237,228,0.03);
          border: 1px solid rgba(240,237,228,0.08);
          border-radius: 12px;
          padding: 0.85rem 1.25rem;
          text-align: left;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s;
          font-family: 'DM Sans', sans-serif;
          width: 100%;
        }
        .lf-option:hover { border-color: rgba(240,237,228,0.2); background: rgba(240,237,228,0.05); }
        .lf-option.lf-active { border-color: #c8f03a; background: rgba(200,240,58,0.06); }
        .lf-option-label { font-weight: 500; font-size: 14px; color: #f0ede4; }
        .lf-option-sub { font-size: 12px; color: rgba(240,237,228,0.4); margin-top: 2px; }
        .lf-option-desc { font-size: 11px; color: rgba(240,237,228,0.28); margin-top: 4px; line-height: 1.45; }

        .author-toggle-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          cursor: pointer;
          padding: 2px 0;
        }
        .author-toggle-label {
          font-size: 14px;
          color: rgba(240,237,228,0.75);
          line-height: 1.5;
          flex: 1;
        }
        .toggle-switch {
          width: 40px;
          height: 22px;
          border-radius: 11px;
          border: none;
          cursor: pointer;
          flex-shrink: 0;
          position: relative;
          transition: background 0.2s;
        }
        .toggle-switch::after {
          content: '';
          position: absolute;
          top: 3px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: white;
          transition: left 0.2s;
        }
        .toggle-switch.on { background: #c8f03a; }
        .toggle-switch.off { background: rgba(240,237,228,0.15); }
        .toggle-switch.on::after { left: 21px; }
        .toggle-switch.off::after { left: 3px; }
      `}</style>

      <div className="profile-page">
        <nav className="profile-nav">
          <Link to="/dashboard" className="profile-nav-logo">Finku</Link>
          <LanguageToggle />
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
              <label className="label">{pl.emailLabel}</label>
              <div className="profile-readonly">{email}</div>
            </div>
          </div>

          {/* Change password */}
          <div className="profile-section">
            <div className="profile-section-title">Security</div>
            {pwResetSent ? (
              <p style={{ fontSize: 13, color: '#c8f03a', lineHeight: 1.6 }}>
                Password reset email sent. Check your inbox.
              </p>
            ) : (
              <button
                onClick={handleChangePassword}
                disabled={pwResetLoading}
                style={{
                  width: '100%', padding: '10px 16px', borderRadius: 10,
                  border: '1px solid rgba(240,237,228,0.12)',
                  background: 'none', color: 'rgba(240,237,228,0.7)',
                  fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500,
                  cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s',
                }}
                onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(240,237,228,0.25)'; e.currentTarget.style.color = '#f0ede4' }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(240,237,228,0.12)'; e.currentTarget.style.color = 'rgba(240,237,228,0.7)' }}
              >
                {pwResetLoading ? '…' : 'Change password'}
              </button>
            )}
          </div>

          {/* Legal form */}
          <div className="profile-section">
            <div className="profile-section-title">{isBg ? 'Правен статус' : 'Legal form'}</div>
            {showLegalFormEdit ? (
              <>
                {legalFormSaved ? (
                  <p style={{ fontSize: 13, color: '#c8f03a' }}>Updated ✓</p>
                ) : (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                      {[
                        {
                          value: 'svobodna_profesiya',
                          label: isBg ? 'Свободна професия' : 'Freelancer',
                          sub: isBg ? 'Фрийлансър, консултант, дизайнер, разработчик' : 'Freelancer, consultant, designer, developer',
                          desc: isBg ? 'Издаваш фактури директно на клиенти. Нямаш регистрирана фирма.' : 'You invoice clients directly. No registered company.',
                        },
                        {
                          value: 'ET',
                          label: isBg ? 'ЕТ (Едноличен търговец)' : 'Sole trader (ЕТ)',
                          sub: isBg ? 'Регистриран едноличен търговец' : 'Registered sole trader',
                          desc: isBg ? 'Имаш регистриран ЕТ с ЕИК номер от Търговския регистър.' : 'You have a registered business with an ЕИК number.',
                        },
                        {
                          value: 'just_tracking',
                          label: isBg ? 'Само проследяване' : 'Just tracking',
                          sub: isBg ? 'Искам само да проследявам приходи и разходи' : 'I just want to track income and expenses',
                          desc: isBg ? 'Не ми трябва данъчна прогноза — само проследяване на приходи и разходи.' : "I don't need tax estimates — just income and expense tracking.",
                        },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          className={`lf-option${currentLegalForm === opt.value ? ' lf-active' : ''}`}
                          onClick={() => handleLegalFormChange(opt.value)}
                        >
                          <div className="lf-option-label">{opt.label}</div>
                          <div className="lf-option-sub">{opt.sub}</div>
                          <div className="lf-option-desc">{opt.desc}</div>
                        </button>
                      ))}
                    </div>
                    <button className="delete-cancel-btn" onClick={() => setShowLegalFormEdit(false)}>
                      {lang.cancel}
                    </button>
                  </>
                )}
              </>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 14, color: 'rgba(240,237,228,0.65)' }}>
                    {currentLegalForm === 'svobodna_profesiya' && (isBg ? 'Свободна професия' : 'Freelancer')}
                    {currentLegalForm === 'ET' && (isBg ? 'ЕТ (Едноличен търговец)' : 'Sole trader (ЕТ)')}
                    {currentLegalForm === 'just_tracking' && (isBg ? 'Само проследяване' : 'Just tracking')}
                    {!currentLegalForm && <span style={{ color: 'rgba(240,237,228,0.3)' }}>{isBg ? 'Не е зададено' : 'Not set'}</span>}
                  </div>
                  {currentLegalForm && (
                    <div style={{ fontSize: 12, color: 'rgba(240,237,228,0.3)', marginTop: 4, lineHeight: 1.45 }}>
                      {currentLegalForm === 'svobodna_profesiya' && (isBg ? 'Издаваш фактури директно на клиенти. Нямаш регистрирана фирма.' : 'You invoice clients directly. No registered company.')}
                      {currentLegalForm === 'ET' && (isBg ? 'Имаш регистриран ЕТ с ЕИК номер от Търговския регистър.' : 'You have a registered business with an ЕИК number.')}
                      {currentLegalForm === 'just_tracking' && (isBg ? 'Не ми трябва данъчна прогноза — само проследяване на приходи и разходи.' : "I don't need tax estimates — just income and expense tracking.")}
                    </div>
                  )}
                </div>
                <button className="delete-cancel-btn" onClick={() => setShowLegalFormEdit(true)} style={{ flexShrink: 0, marginLeft: 12 }}>
                  {isBg ? 'Промени' : 'Change'}
                </button>
              </div>
            )}
          </div>

          {/* Tax calculation — author rate toggle (only for svobodna or unset) */}
          {(!currentLegalForm || currentLegalForm === 'svobodna_profesiya') && (
            <div className="profile-section">
              <div className="profile-section-title">{isBg ? 'Данъчно изчисление' : 'Tax calculation'}</div>
              <div className="author-toggle-row" onClick={authorRateSaving ? undefined : handleAuthorRateToggle}>
                <span className="author-toggle-label">
                  {isBg
                    ? 'Получавам авторски възнаграждения или съм адвокат (40% НПР)'
                    : 'I receive author royalties or practice law (40% НПР)'}
                </span>
                <button
                  className={`toggle-switch ${authorRate ? 'on' : 'off'}`}
                  onClick={e => { e.stopPropagation(); if (!authorRateSaving) handleAuthorRateToggle() }}
                  aria-label="Toggle author rate"
                />
              </div>
              <p style={{ fontSize: 12, color: 'rgba(240,237,228,0.3)', lineHeight: 1.6, marginTop: '0.75rem' }}>
                {isBg
                  ? 'Важи за адвокати, автори, музиканти, артисти и изпълнители. При съмнение, оставете изключено и се консултирайте със счетоводител.'
                  : 'This applies to lawyers, authors, musicians, artists and performers. If unsure, leave this off and consult an accountant.'}
              </p>
            </div>
          )}

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
