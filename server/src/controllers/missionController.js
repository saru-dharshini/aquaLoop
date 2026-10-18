/**
 * Mission Controller — AquaLoop Phase 3B
 */

import { getMissions, getMissionBySlug, submitQuiz } from '../services/missionService.js'

export async function listMissions(req, res, next) {
  try {
    const userId = req.user?._id || null
    const missions = await getMissions(userId)
    res.json({ missions })
  } catch (error) {
    next(error)
  }
}

export async function getMission(req, res, next) {
  try {
    const { slug } = req.params
    const userId = req.user?._id || null
    const mission = await getMissionBySlug(slug, userId)
    res.json({ mission })
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message })
    }
    next(error)
  }
}

export async function handleQuizSubmission(req, res, next) {
  try {
    const { slug } = req.params
    const { answers } = req.body
    const userId = req.user._id

    if (!Array.isArray(answers)) {
      return res.status(400).json({ error: 'Answers must be an array of question selections.' })
    }

    const result = await submitQuiz({ userId, slug, answers })
    res.json(result)
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        error: error.message,
        retryAvailableAt: error.retryAvailableAt || null,
      })
    }
    next(error)
  }
}
