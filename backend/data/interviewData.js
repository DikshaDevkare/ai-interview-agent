import { readFileSync } from 'node:fs'

const curriculumUrl = new URL('../../data/curriculum.json', import.meta.url)
const candidatesUrl = new URL('../../data/candidates.json', import.meta.url)

function readJson(url, label) {
  try {
    return JSON.parse(readFileSync(url, 'utf8'))
  } catch (error) {
    throw new Error(`Unable to load ${label}: ${error.message}`)
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(`Invalid interview data: ${message}`)
}

function validateCurriculum(curriculum) {
  assert(curriculum && typeof curriculum === 'object', 'curriculum must be an object')
  assert(Array.isArray(curriculum.modules), 'curriculum.modules must be an array')
  assert(Array.isArray(curriculum.days), 'curriculum.days must be an array')

  curriculum.modules.forEach((module, index) => {
    assert(Number.isInteger(module.n), `modules[${index}].n must be an integer`)
    assert(typeof module.title === 'string', `modules[${index}].title must be a string`)
    assert(Array.isArray(module.days), `modules[${index}].days must be an array`)
  })

  curriculum.days.forEach((day, index) => {
    assert(Number.isInteger(day.day), `days[${index}].day must be an integer`)
    assert(typeof day.title === 'string', `days[${index}].title must be a string`)
    assert(typeof day.type === 'string', `days[${index}].type must be a string`)
    assert(Array.isArray(day.tools), `days[${index}].tools must be an array`)
    assert(Array.isArray(day.objectives), `days[${index}].objectives must be an array`)
  })
}

function validateCandidates(data) {
  assert(data && typeof data === 'object', 'candidates data must be an object')
  assert(Array.isArray(data.candidates), 'candidates.candidates must be an array')

  data.candidates.forEach((candidate, candidateIndex) => {
    assert(candidate.member && typeof candidate.member === 'object', `candidates[${candidateIndex}].member is required`)
    assert(typeof candidate.member.id === 'string', `candidates[${candidateIndex}].member.id must be a string`)
    assert(Array.isArray(candidate.missions), `candidates[${candidateIndex}].missions must be an array`)

    candidate.missions.forEach((mission, missionIndex) => {
      const path = `candidates[${candidateIndex}].missions[${missionIndex}]`
      assert(Number.isInteger(mission.day), `${path}.day must be an integer`)
      assert(typeof mission.title === 'string', `${path}.title must be a string`)
      assert(mission.skipped === true || typeof mission.passed === 'boolean', `${path} needs passed or skipped status`)
      if (mission.attempts !== undefined) {
        assert(Number.isInteger(mission.attempts) && mission.attempts > 0, `${path}.attempts must be a positive integer`)
      }
    })
  })
}

const curriculum = readJson(curriculumUrl, 'curriculum.json')
const candidatesData = readJson(candidatesUrl, 'candidates.json')

// Validate once on startup so later route handlers receive trustworthy source data.
validateCurriculum(curriculum)
validateCandidates(candidatesData)

export function findCandidateById(candidateId) {
  return candidatesData.candidates.find((candidate) => candidate.member.id === candidateId)
}

export function getCurriculum() {
  return curriculum
}
