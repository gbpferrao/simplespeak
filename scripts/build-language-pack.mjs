import fs from 'node:fs/promises'
import path from 'node:path'

const projectRoot = process.cwd()
const dataRoot = path.join(projectRoot, 'src', 'features', 'language-packs', 'data')
const packRoot = path.join(dataRoot, 'packs', 'ptbr-en')
const sourceRoot = path.join(packRoot, 'source')
const generatedImagesRoot = path.join(projectRoot, 'public', 'simplespeak-images')
const manifestPath = path.join(packRoot, 'pack.json')
const heuristicPath = path.join(packRoot, 'heuristic.json')
const outputPath = path.join(packRoot, 'simplespeak-v1.json')
const packId = path.basename(packRoot)

const defaults = {
  cardSize: 148,
  cardGap: 44,
  sceneGap: 240,
  sceneColumns: 3,
  scenePadding: 72,
  sceneHeaderHeight: 104,
  maxColumns: 10,
  organicJitter: 42,
  organicClusterJitter: 70,
  organicClusterSize: 6,
  organicGap: 16,
  organicSeed: 17,
  organicIterations: 360,
  organicMacroCompression: 0.4,
}

const readJson = async (filePath) => JSON.parse(await fs.readFile(filePath, 'utf8'))

const unique = (values) => [...new Set(values)]

const listJsonFiles = async (directory) => {
  const entries = await fs.readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map((entry) => {
    const entryPath = path.join(directory, entry.name)
    return entry.isDirectory() ? listJsonFiles(entryPath) : entry.name.endsWith('.json') ? [entryPath] : []
  }))
  return nested.flat().sort()
}

const defaultPartOfSpeechFromFolder = (folder) => {
  if (folder === 'function') return null
  return folder.endsWith('s') ? folder.slice(0, -1) : folder
}

const slugify = (value) => value
  .normalize('NFD')
  .replace(/\p{Diacritic}/gu, '')
  .toLocaleLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '')

const sourceCardId = (card, partOfSpeech) => {
  if (card.id) return card.id
  const sense = card.sense ?? card.senseKey ?? 'primary'
  const suffix = sense === 'primary' ? '' : '-' + slugify(sense)
  return partOfSpeech + '-' + slugify(card.target) + suffix
}

const toCompactCard = (card, sceneId, x, y, generatedImageIds) => {
  const output = {
    id: card.id,
    target: card.target,
    origin: card.origin,
    partOfSpeech: card.partOfSpeech,
    sceneId,
    x,
    y,
  }

  if (generatedImageIds.has(card.id)) output.imagePath = '/simplespeak-images/' + card.id + '.png'

  const sense = card.sense ?? card.senseKey
  if (sense && sense !== 'primary') output.sense = sense

  const answers = card.answers ?? card.acceptedAnswers
  if (answers?.length) {
    const normalizedAnswers = unique([card.target, ...answers].map((answer) => answer.trim().toLocaleLowerCase()))
    if (normalizedAnswers.length > 1) {
      output.answers = normalizedAnswers.filter((answer) => answer !== card.target.toLocaleLowerCase())
    }
  }

  const example = card.example ?? {
    target: card.exampleTarget,
    origin: card.exampleOrigin,
  }
  if (example.target || example.origin) output.example = example

  const note = card.note ?? card.noteSeed
  if (note) output.note = note

  const imagePrompt = card.imagePrompt ?? card.imagePromptSeed
  if (imagePrompt) output.imagePrompt = imagePrompt

  return output
}

const validateLayout = (layout) => {
  const merged = { ...defaults, ...layout }
  for (const [key, value] of Object.entries(merged)) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error('Heuristic layout.' + key + ' must be a positive number.')
    }
  }
  if (merged.organicGap >= merged.cardGap) {
    throw new Error('Heuristic layout.organicGap must be smaller than the regular card gap.')
  }
  if (!Number.isInteger(merged.organicClusterSize) || merged.organicClusterSize < 1) {
    throw new Error('Heuristic layout.organicClusterSize must be a positive integer.')
  }
  if (!Number.isInteger(merged.organicIterations) || merged.organicIterations < 1) {
    throw new Error('Heuristic layout.organicIterations must be a positive integer.')
  }
  if (merged.organicMacroCompression <= 0 || merged.organicMacroCompression > 1) {
    throw new Error('Heuristic layout.organicMacroCompression must be greater than 0 and at most 1.')
  }
  return merged
}

const hashSeed = (value) => {
  let hash = 2166136261
  for (const character of value) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

const seededRandom = (seed) => {
  let value = seed >>> 0
  return () => {
    value += 0x6D2B79F5
    let result = value
    result = Math.imul(result ^ result >>> 15, result | 1)
    result ^= result + Math.imul(result ^ result >>> 7, result | 61)
    return ((result ^ result >>> 14) >>> 0) / 4294967296
  }
}

const signedJitter = (random, amount) => Math.round((random() * 2 - 1) * amount)

const resolveOverlaps = (positions, requiredSeparation, iterations, requireConvergence = false) => {
  for (let iteration = 0; iteration < iterations; iteration += 1) {
    let collisions = 0
    for (let leftIndex = 0; leftIndex < positions.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < positions.length; rightIndex += 1) {
        const left = positions[leftIndex]
        const right = positions[rightIndex]
        const deltaX = right.x - left.x
        const deltaY = right.y - left.y
        const overlapX = requiredSeparation - Math.abs(deltaX)
        const overlapY = requiredSeparation - Math.abs(deltaY)
        if (overlapX <= 0 || overlapY <= 0) continue
        collisions += 1

        if (overlapX <= overlapY) {
          const direction = deltaX === 0
            ? ((leftIndex + rightIndex) % 2 === 0 ? 1 : -1)
            : Math.sign(deltaX)
          const push = (overlapX / 2) + 0.75
          left.x -= direction * push
          right.x += direction * push
        } else {
          const direction = deltaY === 0
            ? ((leftIndex + rightIndex) % 2 === 0 ? 1 : -1)
            : Math.sign(deltaY)
          const push = (overlapY / 2) + 0.75
          left.y -= direction * push
          right.y += direction * push
        }
      }
    }
    if (collisions === 0) return true
    if (!requireConvergence) return false
  }
  if (requireConvergence) throw new Error('Organic card layout did not converge without overlaps.')
  return false
}

const placeCardsOrganically = (scene, layout) => {
  const cardCount = scene.wordIds.length
  const random = seededRandom(hashSeed(scene.id + ':' + layout.organicSeed))
  const requiredSeparation = layout.cardSize + layout.organicGap
  const clusterCount = Math.max(1, Math.ceil(cardCount / layout.organicClusterSize))
  const clusterSpread = requiredSeparation * Math.sqrt(clusterCount) * 1.35
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))
  const clusterAnchors = []

  // Seed a low-discrepancy point cloud. The anchors are not placed in a
  // scene rectangle; they form a loose embedding that later repulsion can
  // deform into a natural blob.
  for (let clusterIndex = 0; clusterIndex < clusterCount; clusterIndex += 1) {
    const normalized = clusterCount === 1 ? 0.15 : Math.sqrt((clusterIndex + 0.5) / clusterCount)
    const angle = (clusterIndex * goldenAngle) + (random() * 0.5)
    const radialScale = 0.88 + (random() * 0.24)
    clusterAnchors.push({
      x: Math.cos(angle) * clusterSpread * normalized * radialScale + signedJitter(random, layout.organicClusterJitter * 1.4),
      y: Math.sin(angle) * clusterSpread * normalized * radialScale + signedJitter(random, layout.organicClusterJitter * 1.4),
    })
  }

  const targets = Array.from({ length: cardCount }, (_, index) => {
    const anchor = clusterAnchors[Math.floor(index / layout.organicClusterSize)]
    return {
      x: anchor.x + signedJitter(random, layout.organicJitter),
      y: anchor.y + signedJitter(random, layout.organicJitter),
    }
  })
  const positions = targets.map((target) => ({ ...target }))

  // A small attraction to each card's embedded target preserves adjacency;
  // overlap repulsion is allowed to push the blob in any direction because
  // there are no artificial scene bounds during this phase.
  for (let iteration = 0; iteration < layout.organicIterations; iteration += 1) {
    const attraction = 0.034 - ((iteration / layout.organicIterations) * 0.014)
    for (let index = 0; index < positions.length; index += 1) {
      positions[index].x += (targets[index].x - positions[index].x) * attraction
      positions[index].y += (targets[index].y - positions[index].y) * attraction
    }
    resolveOverlaps(positions, requiredSeparation, 1)
  }
  resolveOverlaps(positions, requiredSeparation, layout.organicIterations * 3, true)

  const minX = Math.min(...positions.map((position) => position.x))
  const maxX = Math.max(...positions.map((position) => position.x))
  const minY = Math.min(...positions.map((position) => position.y))
  const maxY = Math.max(...positions.map((position) => position.y))
  const padding = layout.scenePadding + layout.organicGap
  const localPositions = positions.map((position) => ({
    x: Math.round(position.x - minX + padding),
    y: Math.round(position.y - minY + layout.sceneHeaderHeight + padding),
  }))

  return {
    positions: localPositions,
    width: Math.ceil((maxX - minX) + layout.cardSize + (padding * 2)),
    height: Math.ceil((maxY - minY) + layout.cardSize + layout.sceneHeaderHeight + (padding * 2)),
  }
}

const validateSourcePacks = async () => {
  const files = await listJsonFiles(sourceRoot)
  if (files.length === 0) throw new Error('No source JSON shards found in ' + sourceRoot + '.')

  const cards = []
  const ids = new Set()
  const packSummary = []

  for (const filePath of files) {
    const relativePath = path.relative(sourceRoot, filePath).replaceAll(path.sep, '/')
    const parts = relativePath.split('/')
    const shardId = relativePath.replace(/\.json$/i, '')
    const folder = parts[0]
    const shard = parts[1]?.replace(/\.json$/i, '')
    const shardNumber = Number(shard)
    if (parts.length !== 2 || !folder || !/^\d{2}$/.test(shard ?? '') || shardNumber < 1 || shardNumber > 10) {
      throw new Error('Source shard must be source/<word-type>/<01-10>.json: ' + relativePath)
    }

    const pack = await readJson(filePath)
    const words = pack.words
    const defaultPartOfSpeech = defaultPartOfSpeechFromFolder(folder)
    if (!Array.isArray(words)) throw new Error('Source shard ' + shardId + ' is missing a words array.')
    if (words.length !== 100) throw new Error('Source shard ' + shardId + ' has ' + words.length + ' words; every shard must contain exactly 100.')

    for (const sourceCard of words) {
      const partOfSpeech = sourceCard.partOfSpeech ?? defaultPartOfSpeech
      if (typeof partOfSpeech !== 'string' || partOfSpeech.trim() === '') {
        throw new Error('Word in ' + shardId + ' must declare partOfSpeech.')
      }
      const card = {
        ...sourceCard,
        id: sourceCardId(sourceCard, partOfSpeech),
        partOfSpeech,
      }
      for (const field of ['id', 'target', 'origin']) {
        if (typeof card[field] !== 'string' || card[field].trim() === '') {
          throw new Error('Word in ' + shardId + ' is missing a non-empty ' + field + '.')
        }
      }
      if (ids.has(card.id)) throw new Error('Duplicate source card id: ' + card.id)
      ids.add(card.id)
      cards.push({ ...card, sourcePackId: shardId })
    }

    packSummary.push({ id: shardId, cardCount: words.length })
  }

  return { cards, packSummary }
}

const validateHeuristic = (heuristic, cards) => {
  if (!Array.isArray(heuristic.scenes) || heuristic.scenes.length === 0) {
    throw new Error('The scene heuristic must declare at least one scene.')
  }

  const cardsById = new Map(cards.map((card) => [card.id, card]))
  const membership = new Map()

  for (const scene of heuristic.scenes) {
    if (!scene.id || !scene.name || !Array.isArray(scene.wordIds)) {
      throw new Error('Invalid scene declaration: ' + (scene.id ?? 'unknown'))
    }
    if (scene.wordIds.length === 0) {
      throw new Error('Scene ' + scene.id + ' has no declared wordIds.')
    }

    for (const wordId of scene.wordIds) {
      if (!cardsById.has(wordId)) {
        throw new Error('Heuristic scene ' + scene.id + ' references missing card ' + wordId + '.')
      }
      if (membership.has(wordId)) {
        throw new Error('Card ' + wordId + ' is assigned to both ' + membership.get(wordId) + ' and ' + scene.id + '.')
      }
      membership.set(wordId, scene.id)
    }
  }

  const unassigned = cards.filter((card) => !membership.has(card.id)).map((card) => card.id)
  if (unassigned.length > 0) {
    throw new Error('The heuristic leaves ' + unassigned.length + ' cards unassigned: ' + unassigned.slice(0, 12).join(', '))
  }

  return { cardsById, membership }
}

const placeScenes = (scenes, layout) => {
  const random = seededRandom(hashSeed('macro:' + layout.organicSeed))
  const averageExtent = scenes.reduce((total, scene) => total + Math.max(scene.width, scene.height), 0) / scenes.length
  const macroSpread = averageExtent * Math.sqrt(scenes.length) * layout.organicMacroCompression * 1.3
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))
  const targets = scenes.map((scene, index) => {
    const normalized = scenes.length === 1 ? 0.15 : Math.sqrt((index + 0.5) / scenes.length)
    const angle = (index * goldenAngle) + (random() * 0.5)
    const radialScale = 0.86 + (random() * 0.28)
    return {
      x: Math.cos(angle) * macroSpread * normalized * radialScale + signedJitter(random, averageExtent * 0.22),
      y: Math.sin(angle) * macroSpread * normalized * radialScale + signedJitter(random, averageExtent * 0.22),
    }
  })
  const centers = targets.map((target) => ({ ...target }))

  const minimumX = Math.min(...centers.map((center, index) => center.x - (scenes[index].width / 2)))
  const minimumY = Math.min(...centers.map((center, index) => center.y - (scenes[index].height / 2)))
  const padding = layout.scenePadding
  return scenes.map((scene, index) => ({
    ...scene,
    x: Math.round(centers[index].x - (scene.width / 2) - minimumX + padding),
    y: Math.round(centers[index].y - (scene.height / 2) - minimumY + padding),
  }))
}

const resolveGlobalCardOverlaps = (cards, layout) => {
  const requiredSeparation = layout.cardSize + layout.organicGap
  const cellSize = requiredSeparation
  const iterations = layout.organicIterations * 4

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    const buckets = new Map()
    const cellKey = (x, y) => x + ',' + y
    for (let index = 0; index < cards.length; index += 1) {
      const card = cards[index]
      const cellX = Math.floor(card.x / cellSize)
      const cellY = Math.floor(card.y / cellSize)
      const key = cellKey(cellX, cellY)
      const bucket = buckets.get(key)
      if (bucket) bucket.push(index)
      else buckets.set(key, [index])
    }

    let collisions = 0
    for (let leftIndex = 0; leftIndex < cards.length; leftIndex += 1) {
      const left = cards[leftIndex]
      const leftCellX = Math.floor(left.x / cellSize)
      const leftCellY = Math.floor(left.y / cellSize)
      for (let cellX = leftCellX - 1; cellX <= leftCellX + 1; cellX += 1) {
        for (let cellY = leftCellY - 1; cellY <= leftCellY + 1; cellY += 1) {
          const bucket = buckets.get(cellKey(cellX, cellY))
          if (!bucket) continue
          for (const rightIndex of bucket) {
            if (rightIndex <= leftIndex) continue
            const right = cards[rightIndex]
            const deltaX = right.x - left.x
            const deltaY = right.y - left.y
            const overlapX = requiredSeparation - Math.abs(deltaX)
            const overlapY = requiredSeparation - Math.abs(deltaY)
            if (overlapX <= 0 || overlapY <= 0) continue
            collisions += 1

            if (overlapX <= overlapY) {
              const direction = deltaX === 0
                ? ((leftIndex + rightIndex) % 2 === 0 ? 1 : -1)
                : Math.sign(deltaX)
              const push = (overlapX / 2) + 0.75
              left.x -= direction * push
              right.x += direction * push
            } else {
              const direction = deltaY === 0
                ? ((leftIndex + rightIndex) % 2 === 0 ? 1 : -1)
                : Math.sign(deltaY)
              const push = (overlapY / 2) + 0.75
              left.y -= direction * push
              right.y += direction * push
            }
          }
        }
      }
    }
    if (collisions === 0) return
  }
  throw new Error('Global organic card layout did not converge without overlaps.')
}

const deriveSceneBounds = (scenes, cards, layout) => scenes.map(({ scene }) => {
  const sceneCards = cards.filter((card) => card.sceneId === scene.id)
  const minX = Math.min(...sceneCards.map((card) => card.x))
  const maxX = Math.max(...sceneCards.map((card) => card.x))
  const minY = Math.min(...sceneCards.map((card) => card.y))
  const maxY = Math.max(...sceneCards.map((card) => card.y))
  const padding = layout.scenePadding + layout.organicGap

  return {
    id: scene.id,
    name: scene.name,
    kicker: scene.kicker ?? scene.name,
    description: scene.description ?? scene.name,
    x: Math.floor(minX - padding),
    y: Math.floor(minY - layout.sceneHeaderHeight - padding),
    width: Math.ceil((maxX - minX) + layout.cardSize + (padding * 2)),
    height: Math.ceil((maxY - minY) + layout.cardSize + layout.sceneHeaderHeight + (padding * 2)),
    accent: scene.accent,
  }
})

const validatePlacedCards = (scenes, cards, cardSize) => {
  for (const scene of scenes) {
    const sceneCards = cards.filter((card) => card.sceneId === scene.id)
    for (const card of sceneCards) {
      const insideScene = card.x >= scene.x
        && card.y >= scene.y
        && card.x + cardSize <= scene.x + scene.width
        && card.y + cardSize <= scene.y + scene.height
      if (!insideScene) {
        throw new Error('Card ' + card.id + ' falls outside scene ' + scene.id + '.')
      }
    }

    for (let leftIndex = 0; leftIndex < sceneCards.length; leftIndex += 1) {
      const left = sceneCards[leftIndex]
      for (let rightIndex = leftIndex + 1; rightIndex < sceneCards.length; rightIndex += 1) {
        const right = sceneCards[rightIndex]
        const overlaps = left.x < right.x + cardSize
          && left.x + cardSize > right.x
          && left.y < right.y + cardSize
          && left.y + cardSize > right.y
        if (overlaps) {
          throw new Error('Cards ' + left.id + ' and ' + right.id + ' overlap in scene ' + scene.id + '.')
        }
      }
    }
  }

  for (let leftIndex = 0; leftIndex < cards.length; leftIndex += 1) {
    const left = cards[leftIndex]
    for (let rightIndex = leftIndex + 1; rightIndex < cards.length; rightIndex += 1) {
      const right = cards[rightIndex]
      const overlaps = left.x < right.x + cardSize
        && left.x + cardSize > right.x
        && left.y < right.y + cardSize
        && left.y + cardSize > right.y
      if (overlaps) {
        throw new Error('Cards ' + left.id + ' and ' + right.id + ' overlap in the global embedding.')
      }
    }
  }
}

const build = async () => {
  const manifest = await readJson(manifestPath)
  const heuristic = await readJson(heuristicPath)
  const { cards, packSummary } = await validateSourcePacks()
  const { cardsById, membership } = validateHeuristic(heuristic, cards)
  const layout = validateLayout(heuristic.layout)
  const generatedImageFiles = await fs.readdir(generatedImagesRoot).catch((error) => error?.code === 'ENOENT' ? [] : Promise.reject(error))
  const generatedImageIds = new Set(generatedImageFiles.filter((file) => file.endsWith('.png')).map((file) => file.replace(/\.png$/, '')))
  const sceneLayouts = heuristic.scenes.map((scene) => ({
    scene,
    ...placeCardsOrganically(scene, layout),
  }))
  const placedScenes = placeScenes(sceneLayouts, layout)
  const outputCards = []

  for (const scene of placedScenes) {
    const positions = scene.positions
    scene.scene.wordIds.forEach((wordId, index) => {
      const sourceCard = cardsById.get(wordId)
      const position = positions[index]
      outputCards.push(toCompactCard(sourceCard, scene.scene.id, scene.x + position.x, scene.y + position.y, generatedImageIds))
    })
  }

  // Resolve collisions across scene membership as one point cloud. Scene
  // rectangles are derived afterwards, so no macro group boundary constrains
  // the embedding or forces it back into a grid.
  resolveGlobalCardOverlaps(outputCards, layout)

  const minimumCardX = Math.min(...outputCards.map((card) => card.x))
  const minimumCardY = Math.min(...outputCards.map((card) => card.y))
  const shiftX = minimumCardX < 0 ? -minimumCardX : 0
  const shiftY = minimumCardY < 0 ? -minimumCardY : 0
  for (const card of outputCards) {
    card.x += shiftX
    card.y += shiftY
  }

  const outputScenes = deriveSceneBounds(placedScenes, outputCards, layout)

  validatePlacedCards(outputScenes, outputCards, layout.cardSize)

  const output = {
    id: packId,
    name: manifest.name,
    targetLanguage: manifest.targetLanguage,
    originLanguage: manifest.originLanguage,
    version: manifest.version,
    scenes: outputScenes,
    cards: outputCards,
  }

  const expectedIds = new Set(cards.map((card) => card.id))
  const generatedIds = new Set(outputCards.map((card) => card.id))
  if (expectedIds.size !== generatedIds.size || [...expectedIds].some((id) => !generatedIds.has(id))) {
    throw new Error('Generated card ids do not match source card ids.')
  }
  if ([...membership.values()].some((sceneId) => !outputScenes.some((scene) => scene.id === sceneId))) {
    throw new Error('Generated cards contain an unknown scene id.')
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true })
  await fs.writeFile(outputPath, JSON.stringify(output, null, 2) + '\n', 'utf8')

  console.log('Built ' + output.cards.length + ' cards across ' + output.scenes.length + ' declared scenes.')
  console.log('Source shards: ' + packSummary.map((pack) => pack.id + ' (' + pack.cardCount + ')').join(', '))
  console.log('Output: ' + path.relative(projectRoot, outputPath))
}

build().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
