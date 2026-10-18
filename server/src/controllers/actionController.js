/**
 * Action Controller — AquaLoop Phase 3B
 */

import { logAction, verifyAction, getMyActions } from '../services/actionService.js'

export async function handleLogAction(req, res, next) {
  try {
    const userId = req.user._id
    const { missionSlug, description, claimedLitres, proofImageUrl } = req.body

    if (!missionSlug) {
      return res.status(400).json({ error: 'missionSlug is required' })
    }

    const result = await logAction({
      userId,
      missionSlug,
      description,
      claimedLitres,
      proofImageUrl,
    })

    res.status(201).json(result)
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message })
    }
    next(error)
  }
}

export async function handleVerifyAction(req, res, next) {
  try {
    const { id: actionId } = req.params
    const adminId = req.user._id
    const { approved, adminNotes, verifiedLitres } = req.body

    if (typeof approved !== 'boolean') {
      return res.status(400).json({ error: 'approved boolean field is required' })
    }

    const result = await verifyAction({
      actionId,
      adminId,
      approved,
      adminNotes,
      verifiedLitres,
    })

    res.json(result)
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message })
    }
    next(error)
  }
}

export async function handleGetMyActions(req, res, next) {
  try {
    const userId = req.user._id
    const actions = await getMyActions(userId)
    res.json({ actions })
  } catch (error) {
    next(error)
  }
}
