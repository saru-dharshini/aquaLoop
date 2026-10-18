/**
 * Mission model — AquaLoop Phase 3B
 *
 * Defines Learning, Action, and Civic missions.
 * Security Note:
 * - quizQuestions.correctOptionIndex is protected with select: false so it is never exposed in client queries.
 */

import mongoose from 'mongoose'

const quizQuestionSchema = new mongoose.Schema(
  {
    questionId: {
      type: String,
      required: true,
    },
    prompt: {
      type: String,
      required: true,
    },
    options: {
      type: [String],
      required: true,
    },
    // Protected field — NEVER returned to client
    correctOptionIndex: {
      type: Number,
      required: true,
      select: false,
    },
  },
  { _id: false },
)

const missionSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: [true, 'Mission slug is required'],
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Mission title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Mission description is required'],
    },
    category: {
      type: String,
      enum: ['learning', 'action', 'civic'],
      required: true,
      index: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true,
    },
    baseXP: {
      type: Number,
      required: true,
      min: 0,
    },
    bonusXP: {
      type: Number,
      default: 0,
      min: 0,
    },
    estimatedLitresSavedPerDay: {
      type: Number,
      default: 0,
    },
    verificationType: {
      type: String,
      enum: ['quiz', 'photo_proof', 'self_report', 'civic_report'],
      required: true,
    },
    quizQuestions: {
      type: [quizQuestionSchema],
      default: undefined,
    },
    prerequisites: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
)

const Mission = mongoose.model('Mission', missionSchema)
export default Mission
