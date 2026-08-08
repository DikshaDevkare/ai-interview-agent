function toTopic(mission) {
  return { day: mission.day, title: mission.title, attempts: mission.attempts }
}

function curriculumTopic(day) {
  return {
    day: day.day,
    title: day.title,
    type: day.type,
    tools: day.tools,
    objectives: day.objectives,
  }
}

export function createTopicPlan(candidate, curriculum) {
  const missions = candidate.missions
  const curriculumByDay = new Map(curriculum.days.map((day) => [day.day, day]))

  const completedStrong = missions
    .filter((mission) => mission.passed === true && mission.attempts === 1)
    .map(toTopic)
  const failedAttempts = missions
    .filter((mission) => mission.passed === false)
    .map(toTopic)
  const skippedTopics = missions
    .filter((mission) => mission.skipped === true)
    .map(toTopic)
  // A completed mission needing multiple attempts is a useful depth probe, not a failure.
  const deeperQuestioning = missions
    .filter((mission) => mission.passed === true && mission.attempts > 1)
    .map(toTopic)

  return {
    candidate: {
      id: candidate.member.id,
      name: candidate.member.name,
      status: candidate.member.status,
    },
    completedStrong,
    failedAttempts,
    skippedTopics,
    deeperQuestioning,
    // Curriculum content is joined by day, keeping the supplied curriculum authoritative.
    availableCurriculumTopics: missions
      .map((mission) => curriculumByDay.get(mission.day))
      .filter(Boolean)
      .map(curriculumTopic),
  }
}
