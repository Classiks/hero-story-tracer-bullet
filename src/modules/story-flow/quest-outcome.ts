export const QUEST_OUTCOME_STATUSES = ['completed', 'unresolved', 'rejected'] as const

export type QuestOutcomeStatus = (typeof QUEST_OUTCOME_STATUSES)[number]

export type QuestFeedback = {
  note?: string
}

export type QuestOutcome = {
  status: QuestOutcomeStatus
  feedback: QuestFeedback
}

export function isQuestOutcomeStatus(value: unknown): value is QuestOutcomeStatus {
  return typeof value === 'string' && QUEST_OUTCOME_STATUSES.includes(value as QuestOutcomeStatus)
}

export function questOutcomeSucceeded(status: QuestOutcomeStatus) {
  return status === 'completed'
}
