/**
 * Dashboard — AquaLoop Phase 3B
 *
 * Full live gamification dashboard:
 * - Real user XP, tier level, IST streak, and streak freezes
 * - Claim daily bonus (10-25 XP within 300 XP daily cap)
 * - Action logging modal (POST /api/v1/actions)
 * - Server-validated learning quizzes (POST /api/v1/missions/:slug/quiz)
 * - Verified vs self-reported water savings metrics
 * - Badge achievements showcase (GET /api/v1/game/badges)
 */
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  LayoutDashboard,
  Droplets,
  Trophy,
  AlertTriangle,
  BookOpen,
  Zap,
  Plus,
  Shield,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
} from 'lucide-react'
import Sidebar from '../components/layout/Sidebar.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import XPBar from '../components/ui/XPBar.jsx'
import Avatar from '../components/ui/Avatar.jsx'
import Badge from '../components/ui/Badge.jsx'
import Button from '../components/ui/Button.jsx'
import Modal from '../components/ui/Modal.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../components/ui/Toast.jsx'
import api from '../services/api.js'

const SIDEBAR_LINKS = [
  { to: '/dashboard',   label: 'Overview',    icon: LayoutDashboard },
  { to: '/report',      label: 'Report Issue', icon: AlertTriangle   },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy          },
  { to: '/awareness',   label: 'Awareness',   icon: BookOpen        },
  { to: '/impact',      label: 'Impact Map',  icon: Droplets        },
]

const SAMPLE_ACTIONS = [
  { id: 1, missionSlug: 'act-fix-dripping-tap', description: 'Repaired kitchen faucet washer', date: '2026-10-14', claimedLitres: 60, xp: 50, verificationStatus: 'verified' },
  { id: 2, missionSlug: 'act-rainwater-barrel-setup', description: '100L rainwater barrel installation', date: '2026-10-13', claimedLitres: 100, xp: 80, verificationStatus: 'pending_verification' },
  { id: 3, missionSlug: 'act-bucket-bath', description: 'Switched shower to bucket bath', date: '2026-10-12', claimedLitres: 45, xp: 25, verificationStatus: 'self_reported' },
]

const SAMPLE_USER = {
  username: 'Demo Citizen',
  level: 2,
  xp: 720,
  streak: 4,
  streakFreezes: 1,
  totalWaterSavedLitres: 320,
  verifiedWaterSavedLitres: 160,
  actionsLogged: 5,
  role: 'citizen',
}

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { user, refreshUser } = useAuth()
  const { addToast } = useToast()

  // Live state
  const [activeTab, setActiveTab] = useState('actions') // 'actions' | 'missions' | 'badges'
  const [actions, setActions] = useState([])
  const [missions, setMissions] = useState([])
  const [badges, setBadges] = useState([])
  const [userBadgeIds, setUserBadgeIds] = useState(new Set())
  const [loadingBonus, setLoadingBonus] = useState(false)

  // Log action modal state
  const [actionModalOpen, setActionModalOpen] = useState(false)
  const [actionForm, setActionForm] = useState({
    missionSlug: 'act-bucket-bath',
    description: '',
    claimedLitres: 45,
    proofImageUrl: '',
  })
  const [actionSubmitting, setActionSubmitting] = useState(false)

  // Quiz modal state
  const [quizModalOpen, setQuizModalOpen] = useState(false)
  const [activeQuizMission, setActiveQuizMission] = useState(null)
  const [quizAnswers, setQuizAnswers] = useState({})
  const [quizSubmitting, setQuizSubmitting] = useState(false)
  const [quizResult, setQuizResult] = useState(null)

  const currentUser = user || SAMPLE_USER

  // Fetch actions
  const fetchActions = useCallback(async () => {
    if (!user) return
    try {
      const res = await api.get('/actions/my')
      setActions(res.data.actions || [])
    } catch {
      // Gracefully fall back
    }
  }, [user])

  // Fetch missions
  const fetchMissions = useCallback(async () => {
    try {
      const res = await api.get('/missions')
      setMissions(res.data.missions || [])
    } catch {
      // Gracefully fall back
    }
  }, [])

  // Fetch badges
  const fetchBadges = useCallback(async () => {
    try {
      const [allRes, myRes] = await Promise.all([
        api.get('/game/badges'),
        user ? api.get('/game/badges/my') : Promise.resolve({ data: { badges: [] } }),
      ])
      setBadges(allRes.data.badges || [])
      const earnedSlugs = new Set((myRes.data.badges || []).map((b) => b.badgeSlug))
      setUserBadgeIds(earnedSlugs)
    } catch {
      // Gracefully fall back
    }
  }, [user])

  useEffect(() => {
    fetchMissions()
    fetchBadges()
    if (user) {
      fetchActions()
    }
  }, [user, fetchMissions, fetchBadges, fetchActions])

  // Handle Daily Bonus
  async function handleClaimDailyBonus() {
    if (!user) {
      addToast({ message: 'Please sign in to claim daily bonus XP', type: 'info' })
      return
    }

    setLoadingBonus(true)
    try {
      const res = await api.post('/game/daily-bonus')
      addToast({
        message: `+${res.data.awardedXP} XP claimed! Daily streak: ${res.data.streak} days.`,
        type: 'success',
      })
      await refreshUser()
    } catch (err) {
      addToast({
        message: err.userMessage || 'Daily bonus already claimed today or daily cap reached.',
        type: 'warning',
      })
    } finally {
      setLoadingBonus(false)
    }
  }

  // Handle Log Action Submission
  async function handleActionSubmit(e) {
    e.preventDefault()
    if (!user) {
      addToast({ message: 'Please sign in to log water-saving actions', type: 'info' })
      return
    }

    setActionSubmitting(true)
    try {
      const res = await api.post('/actions', {
        missionSlug: actionForm.missionSlug,
        description: actionForm.description,
        claimedLitres: Number(actionForm.claimedLitres) || 0,
        proofImageUrl: actionForm.proofImageUrl || undefined,
      })

      addToast({
        message: `+${res.data.awardedXP} XP awarded! Action recorded.`,
        type: 'success',
      })

      if (res.data.newBadges?.length > 0) {
        addToast({
          message: `Achievement Unlocked: ${res.data.newBadges.map((b) => b.name).join(', ')}!`,
          type: 'success',
        })
      }

      setActionModalOpen(false)
      setActionForm({
        missionSlug: 'act-bucket-bath',
        description: '',
        claimedLitres: 45,
        proofImageUrl: '',
      })
      await Promise.all([refreshUser(), fetchActions(), fetchBadges(), fetchMissions()])
    } catch (err) {
      addToast({
        message: err.userMessage || 'Could not log action. Check daily limits.',
        type: 'error',
      })
    } finally {
      setActionSubmitting(false)
    }
  }

  // Open Quiz
  function handleStartQuiz(mission) {
    if (!user) {
      addToast({ message: 'Please sign in to complete learning quizzes', type: 'info' })
      return
    }
    setActiveQuizMission(mission)
    setQuizAnswers({})
    setQuizResult(null)
    setQuizModalOpen(true)
  }

  // Submit Quiz
  async function handleQuizSubmit() {
    if (!activeQuizMission) return

    // Ensure all questions answered
    const totalQuestions = activeQuizMission.quizQuestions?.length || 0
    const answeredCount = Object.keys(quizAnswers).length
    if (answeredCount < totalQuestions) {
      addToast({
        message: `Please answer all ${totalQuestions} questions before submitting`,
        type: 'warning',
      })
      return
    }

    setQuizSubmitting(true)
    try {
      const payloadAnswers = Object.entries(quizAnswers).map(([questionId, selectedIndex]) => ({
        questionId,
        selectedIndex: Number(selectedIndex),
      }))

      const res = await api.post(`/missions/${activeQuizMission.slug}/quiz`, {
        answers: payloadAnswers,
      })

      setQuizResult(res.data)
      if (res.data.passed) {
        addToast({
          message: `Quiz Passed! +${res.data.awardedXP} XP awarded.`,
          type: 'success',
        })
      } else {
        addToast({
          message: `Scored ${res.data.scorePercent}%. 80% needed to pass. 1-hour cooldown active.`,
          type: 'warning',
        })
      }

      await Promise.all([refreshUser(), fetchMissions(), fetchBadges()])
    } catch (err) {
      addToast({
        message: err.userMessage || 'Quiz submission failed.',
        type: 'error',
      })
    } finally {
      setQuizSubmitting(false)
    }
  }

  // Action missions list for dropdown
  const actionMissions = missions.filter((m) => m.category === 'action' || m.category === 'civic')
  const learningMissions = missions.filter((m) => m.category === 'learning')

  return (
    <div style={{ display: 'flex', minHeight: '100%' }}>
      <Sidebar
        links={SIDEBAR_LINKS}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
        title="Navigation"
      />

      <div
        className="page-enter"
        style={{
          flex: 1,
          overflowX: 'hidden',
          padding: 'var(--space-8) var(--space-6)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-8)',
        }}
      >
        {/* Guest preview notice */}
        {!user && (
          <div
            role="note"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--space-3)',
              padding: 'var(--space-3) var(--space-4)',
              background: '#fff8e1',
              border: '1px dashed #ffca28',
              borderRadius: 'var(--radius-md)',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <span aria-hidden="true" style={{ fontSize: '1.2rem' }}>💡</span>
              <p style={{ fontSize: 'var(--text-sm)', color: '#8d6e00', margin: 0 }}>
                <strong>Demo Preview:</strong> You are viewing sample conservation data. Sign in or register to log live actions, complete water literacy quizzes, and earn real XP!
              </p>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Link to="/login">
                <Button size="sm" variant="outline">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button size="sm" variant="primary">Register</Button>
              </Link>
            </div>
          </div>
        )}

        {/* Profile + Gamification Header */}
        <div className="card" style={{ padding: 'var(--space-6)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--space-6)',
              flexWrap: 'wrap',
            }}
          >
            {/* User details */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
              <Avatar name={currentUser.username} size="lg" ring />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)' }}>
                  <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', margin: 0 }}>
                    {currentUser.username}
                  </h2>
                  <Badge variant={currentUser.role === 'admin' ? 'navy' : 'primary'}>
                    {currentUser.role === 'admin' ? 'Admin' : 'Citizen'}
                  </Badge>
                  {currentUser.streak > 0 && (
                    <Badge variant="gold" icon={Zap}>
                      {currentUser.streak}d streak
                    </Badge>
                  )}
                  {currentUser.streakFreezes > 0 && (
                    <Badge variant="neutral" icon={Shield}>
                      {currentUser.streakFreezes}/2 Freezes
                    </Badge>
                  )}
                </div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: 0 }}>
                  {currentUser.city ? `City: ${currentUser.city} · ` : ''} IST Day Active
                </p>
              </div>
            </div>

            {/* Daily bonus & log action CTA */}
            <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
              <Button
                variant="outline"
                size="md"
                icon={Sparkles}
                onClick={handleClaimDailyBonus}
                loading={loadingBonus}
                title="Claim your daily streak XP roll (10-25 XP)"
              >
                Claim Daily Bonus
              </Button>

              <Button
                variant="primary"
                size="md"
                icon={Plus}
                onClick={() => setActionModalOpen(true)}
              >
                Log Action
              </Button>
            </div>
          </div>

          {/* XP Bar */}
          <div style={{ marginTop: 'var(--space-6)' }}>
            <XPBar xp={currentUser.xp || 0} level={currentUser.level || 1} />
          </div>
        </div>

        {/* Real Stats Row with Strict Honesty */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          <StatCard
            icon={Droplets}
            iconBg="var(--color-primary-50)"
            iconColor="var(--color-primary-600)"
            value={`${currentUser.totalWaterSavedLitres || 0} L`}
            label="Water Saved (Self-reported)"
            honesty="self-reported"
          />

          <StatCard
            icon={CheckCircle2}
            iconBg="var(--color-success-bg)"
            iconColor="var(--color-success)"
            value={`${currentUser.verifiedWaterSavedLitres || 0} L`}
            label="Water Saved (Verified)"
            honesty="verified"
          />

          <StatCard
            icon={Zap}
            iconBg="#fff8e1"
            iconColor="var(--color-gold-600)"
            value={`${currentUser.xp || 0} XP`}
            label="Total XP Earned"
            honesty="verified"
          />

          <StatCard
            icon={Trophy}
            iconBg="var(--color-info-bg)"
            iconColor="var(--color-info)"
            value={`${currentUser.actionsLogged || (user ? actions.length : SAMPLE_ACTIONS.length)}`}
            label="Actions Logged"
            honesty={user ? 'verified' : 'sample'}
          />
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-2)',
            borderBottom: '2px solid var(--surface-border)',
            paddingBottom: 'var(--space-1)',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('actions')}
            style={{
              padding: 'var(--space-2) var(--space-4)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'actions' ? '2px solid var(--color-primary-600)' : '2px solid transparent',
              marginBottom: -6,
              color: activeTab === 'actions' ? 'var(--color-primary-600)' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: 'var(--text-sm)',
              cursor: 'pointer',
            }}
          >
            My Actions ({user ? actions.length : SAMPLE_ACTIONS.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('missions')}
            style={{
              padding: 'var(--space-2) var(--space-4)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'missions' ? '2px solid var(--color-primary-600)' : '2px solid transparent',
              marginBottom: -6,
              color: activeTab === 'missions' ? 'var(--color-primary-600)' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: 'var(--text-sm)',
              cursor: 'pointer',
            }}
          >
            Missions & Quizzes ({missions.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('badges')}
            style={{
              padding: 'var(--space-2) var(--space-4)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'badges' ? '2px solid var(--color-primary-600)' : '2px solid transparent',
              marginBottom: -6,
              color: activeTab === 'badges' ? 'var(--color-primary-600)' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: 'var(--text-sm)',
              cursor: 'pointer',
            }}
          >
            Achievements & Badges ({badges.length})
          </button>
        </div>

        {/* TAB 1: ACTIONS */}
        {activeTab === 'actions' && (
          <section aria-labelledby="recent-actions-heading">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 'var(--space-4)',
              }}
            >
              <h3
                id="recent-actions-heading"
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'var(--text-lg)',
                  margin: 0,
                  color: 'var(--text-primary)',
                }}
              >
                Conservation Actions Ledger
                {!user && (
                  <Badge variant="sample" style={{ marginLeft: 'var(--space-2)' }}>
                    Sample data
                  </Badge>
                )}
              </h3>

              <Button
                size="sm"
                variant="outline"
                icon={Plus}
                onClick={() => setActionModalOpen(true)}
              >
                + Log New Action
              </Button>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }} aria-label="Recent conservation actions">
                <thead>
                  <tr style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--surface-border)' }}>
                    {['Action / Mission', 'Date', 'Water Saved', 'Status', 'XP Earned'].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: 'var(--space-3) var(--space-4)',
                          textAlign: 'left',
                          fontSize: 'var(--text-xs)',
                          fontWeight: 600,
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: 'var(--tracking-wide)',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(user ? actions : SAMPLE_ACTIONS).length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <p style={{ margin: 0, fontSize: 'var(--text-sm)' }}>
                          No conservation actions logged yet.
                        </p>
                        <Button
                          size="sm"
                          variant="primary"
                          icon={Plus}
                          style={{ marginTop: 'var(--space-3)' }}
                          onClick={() => setActionModalOpen(true)}
                        >
                          Log your first action
                        </Button>
                      </td>
                    </tr>
                  ) : (
                    (user ? actions : SAMPLE_ACTIONS).map((a, i, arr) => {
                      const isVerified = a.verificationStatus === 'verified'
                      const isPending = a.verificationStatus === 'pending_verification'
                      const isRejected = a.verificationStatus === 'rejected'
                      const statusVariant = isVerified ? 'success' : isPending ? 'warning' : isRejected ? 'danger' : 'self-reported'
                      const statusLabel = isVerified ? 'Verified' : isPending ? 'Pending review' : isRejected ? 'Rejected' : 'Self-reported'

                      return (
                        <tr
                          key={a._id || a.id}
                          style={{
                            borderBottom: i < arr.length - 1 ? '1px solid var(--surface-border)' : 'none',
                          }}
                        >
                          <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                            <div>{a.description || a.missionSlug || a.category}</div>
                            {a.missionSlug && (
                              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                                {a.missionSlug}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                            {a.dateIST || a.date || (a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '—')}
                          </td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)' }}>
                            <strong>{a.claimedLitres || a.waterSavedLitres || 0} L</strong>
                            {isVerified && a.verifiedLitres != null && (
                              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-success)', display: 'block' }}>
                                ({a.verifiedLitres} L confirmed)
                              </span>
                            )}
                          </td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                            <Badge variant={statusVariant}>{statusLabel}</Badge>
                          </td>
                          <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                            <Badge variant="gold">+{a.xp || a.awardedXP || a.xpAwarded || 0} XP</Badge>
                            {a.bonusXPAwarded > 0 && (
                              <Badge variant="success" style={{ marginLeft: 4 }}>
                                +{a.bonusXPAwarded} bonus
                              </Badge>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* TAB 2: MISSIONS & QUIZZES */}
        {activeTab === 'missions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
            {/* Learning Quizzes */}
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                <BookOpen size={20} style={{ color: 'var(--color-primary-600)' }} />
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-lg)', margin: 0 }}>
                  Water Literacy Quizzes
                </h3>
                <Badge variant="primary">Server-Validated</Badge>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
                {learningMissions.map((m) => {
                  const isCompleted = m.userStatus?.isCompleted
                  const isCooldown = m.userStatus?.isCooldownActive

                  return (
                    <div key={m.slug} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 'var(--space-5)' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                          <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                            {m.title}
                          </span>
                          <Badge variant="gold">+{m.baseXP} XP</Badge>
                        </div>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)', marginBottom: 'var(--space-4)' }}>
                          {m.description}
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)', borderTop: '1px solid var(--surface-border)', paddingTop: 'var(--space-3)' }}>
                        <div>
                          {isCompleted ? (
                            <Badge variant="success" icon={CheckCircle2}>
                              Passed ({m.userStatus?.scorePercent}%)
                            </Badge>
                          ) : isCooldown ? (
                            <Badge variant="warning" icon={Clock}>
                              Cooldown active
                            </Badge>
                          ) : (
                            <Badge variant="neutral">{m.difficulty}</Badge>
                          )}
                        </div>

                        <Button
                          size="sm"
                          variant={isCompleted ? 'outline' : 'primary'}
                          disabled={isCooldown}
                          onClick={() => handleStartQuiz(m)}
                        >
                          {isCompleted ? 'Retake Quiz' : 'Start Quiz'}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Action Missions */}
            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
                <Droplets size={20} style={{ color: 'var(--color-primary-600)' }} />
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-lg)', margin: 0 }}>
                  Home & Community Action Missions
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
                {actionMissions.map((m) => (
                  <div key={m.slug} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 'var(--space-5)' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                        <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                          {m.title}
                        </span>
                        <Badge variant="gold">+{m.baseXP} XP</Badge>
                      </div>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)', marginBottom: 'var(--space-3)' }}>
                        {m.description}
                      </p>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-primary-700)', fontWeight: 500, margin: 0 }}>
                        💧 Est. savings: ~{m.estimatedLitresSavedPerDay} L / day
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-2)', borderTop: '1px solid var(--surface-border)', paddingTop: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                      <Badge variant="self-reported">
                        {m.verificationType === 'photo_proof' ? 'Photo proof eligible' : 'Self-reported'}
                      </Badge>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => {
                          setActionForm({
                            missionSlug: m.slug,
                            description: m.title,
                            claimedLitres: m.estimatedLitresSavedPerDay || 30,
                            proofImageUrl: '',
                          })
                          setActionModalOpen(true)
                        }}
                      >
                        Log Action
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* TAB 3: ACHIEVEMENTS & BADGES */}
        {activeTab === 'badges' && (
          <section>
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-lg)', margin: 0 }}>
                Platform Badges & Milestones
              </h3>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)' }}>
                Earn badges by completing quizzes, sustaining daily streaks, and logging verified water savings.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-4)' }}>
              {badges.map((b) => {
                const isUnlocked = userBadgeIds.has(b.slug)
                const tierColor = b.tier === 'gold' ? '#f9a825' : b.tier === 'silver' ? '#78909c' : '#8d6e63'

                return (
                  <div
                    key={b.slug}
                    className="card"
                    style={{
                      padding: 'var(--space-5)',
                      opacity: isUnlocked ? 1 : 0.65,
                      border: isUnlocked ? `2px solid ${tierColor}` : '1px solid var(--surface-border)',
                      background: isUnlocked ? 'var(--surface-base)' : 'var(--surface-raised)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: isUnlocked ? `${tierColor}20` : 'var(--color-neutral-200)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isUnlocked ? tierColor : 'var(--color-neutral-500)',
                        }}
                      >
                        <Award size={20} />
                      </div>
                      <Badge variant={isUnlocked ? 'success' : 'neutral'}>
                        {isUnlocked ? 'Unlocked' : 'Locked'}
                      </Badge>
                    </div>

                    <h4 style={{ margin: 'var(--space-2) 0 0 0', fontSize: 'var(--text-base)', fontFamily: 'var(--font-heading)' }}>
                      {b.name}
                    </h4>
                    <span style={{ fontSize: 'var(--text-xs)', color: tierColor, fontWeight: 600, textTransform: 'uppercase' }}>
                      {b.tier} tier
                    </span>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)', lineHeight: 'var(--leading-relaxed)' }}>
                      {b.description}
                    </p>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* LOG ACTION MODAL */}
        <Modal
          isOpen={actionModalOpen}
          onClose={() => setActionModalOpen(false)}
          title="Log Water Conservation Action"
          size="md"
        >
          <form onSubmit={handleActionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="missionSlug">Action Mission</label>
              <select
                id="missionSlug"
                className="input"
                value={actionForm.missionSlug}
                onChange={(e) => {
                  const m = missions.find((x) => x.slug === e.target.value)
                  setActionForm((prev) => ({
                    ...prev,
                    missionSlug: e.target.value,
                    claimedLitres: m?.estimatedLitresSavedPerDay || prev.claimedLitres,
                  }))
                }}
              >
                {actionMissions.map((m) => (
                  <option key={m.slug} value={m.slug}>
                    {m.title} (+{m.baseXP} XP{m.bonusXP ? ` +${m.bonusXP} bonus` : ''})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="description">Notes / Description (Optional)</label>
              <input
                id="description"
                type="text"
                className="input"
                placeholder="e.g. Replaced leaking rubber washer in bathroom faucet"
                value={actionForm.description}
                onChange={(e) => setActionForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="claimedLitres">Claimed Water Saved (Litres)</label>
              <input
                id="claimedLitres"
                type="number"
                min="1"
                max="5000"
                className="input"
                value={actionForm.claimedLitres}
                onChange={(e) => setActionForm((p) => ({ ...p, claimedLitres: e.target.value }))}
              />
              <span className="form-hint">
                Self-reported until verified by an administrator.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="proofImageUrl">Photo Proof URL (Optional)</label>
              <input
                id="proofImageUrl"
                type="url"
                className="input"
                placeholder="https://example.com/proof-photo.jpg"
                value={actionForm.proofImageUrl}
                onChange={(e) => setActionForm((p) => ({ ...p, proofImageUrl: e.target.value }))}
              />
              <span className="form-hint">
                Submitting photo proof qualifies this action for admin review, verified status, and bonus XP!
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
              <Button type="button" variant="outline" onClick={() => setActionModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={actionSubmitting}>
                Submit Action
              </Button>
            </div>
          </form>
        </Modal>

        {/* QUIZ MODAL */}
        <Modal
          isOpen={quizModalOpen}
          onClose={() => setQuizModalOpen(false)}
          title={activeQuizMission?.title || 'Literacy Quiz'}
          size="lg"
        >
          {activeQuizMission && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: 0 }}>
                {activeQuizMission.description}
              </p>

              {quizResult ? (
                <div
                  style={{
                    padding: 'var(--space-6)',
                    background: quizResult.passed ? 'var(--color-success-bg)' : 'var(--color-warning-bg)',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${quizResult.passed ? 'var(--color-success)' : 'var(--color-warning)'}`,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ display: 'inline-flex', padding: 'var(--space-3)', borderRadius: '50%', background: '#fff', marginBottom: 'var(--space-3)' }}>
                    {quizResult.passed ? (
                      <CheckCircle2 size={36} style={{ color: 'var(--color-success)' }} />
                    ) : (
                      <XCircle size={36} style={{ color: 'var(--color-warning)' }} />
                    )}
                  </div>
                  <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', margin: '0 0 var(--space-2) 0' }}>
                    {quizResult.passed ? 'Quiz Passed!' : 'Did Not Pass'}
                  </h4>
                  <p style={{ fontSize: 'var(--text-sm)', margin: '0 0 var(--space-4) 0', color: 'var(--text-primary)' }}>
                    Score: <strong>{quizResult.scorePercent}%</strong> (80% required)
                    {quizResult.passed && ` · Awarded +${quizResult.awardedXP} XP!`}
                  </p>
                  {!quizResult.passed && (
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', margin: 0 }}>
                      An anti-guessing 1-hour cooldown is active before this quiz can be retried.
                    </p>
                  )}
                  <Button
                    style={{ marginTop: 'var(--space-4)' }}
                    variant="primary"
                    onClick={() => setQuizModalOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                  {activeQuizMission.quizQuestions?.map((q, qIndex) => (
                    <div
                      key={q.questionId}
                      style={{
                        padding: 'var(--space-4)',
                        background: 'var(--surface-raised)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--surface-border)',
                      }}
                    >
                      <p style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: 'var(--space-3)' }}>
                        {qIndex + 1}. {q.prompt}
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        {q.options.map((opt, optIndex) => (
                          <label
                            key={optIndex}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 'var(--space-3)',
                              padding: 'var(--space-2) var(--space-3)',
                              background: quizAnswers[q.questionId] === optIndex ? 'var(--color-primary-50)' : 'var(--surface-base)',
                              border: `1.5px solid ${quizAnswers[q.questionId] === optIndex ? 'var(--color-primary-600)' : 'var(--surface-border)'}`,
                              borderRadius: 'var(--radius-sm)',
                              cursor: 'pointer',
                              fontSize: 'var(--text-sm)',
                            }}
                          >
                            <input
                              type="radio"
                              name={q.questionId}
                              checked={quizAnswers[q.questionId] === optIndex}
                              onChange={() => setQuizAnswers((p) => ({ ...p, [q.questionId]: optIndex }))}
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
                    <Button variant="outline" onClick={() => setQuizModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button variant="primary" loading={quizSubmitting} onClick={handleQuizSubmit}>
                      Submit Answers
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </div>
  )
}
