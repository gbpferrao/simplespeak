import type { LanguagePack, Scene, WordCard } from '../../../core/contracts/types'

export const starterScenes: Scene[] = [
  {
    id: 'home',
    name: 'Home base',
    kicker: 'Scene 01  -  familiar ground',
    description: 'The objects and actions that make a place feel like yours.',
    x: 90,
    y: 130,
    width: 640,
    height: 500,
    accent: '#a78bfa',
  },
  {
    id: 'street',
    name: 'The street',
    kicker: 'Scene 02  -  movement',
    description: 'Routes, signs, and the little decisions that move you forward.',
    x: 790,
    y: 90,
    width: 680,
    height: 500,
    accent: '#72e6c7',
  },
  {
    id: 'kitchen',
    name: 'The kitchen',
    kicker: 'Scene 03  -  sensory hooks',
    description: 'Words with taste, texture, temperature, and an easy visual handle.',
    x: 1530,
    y: 150,
    width: 650,
    height: 500,
    accent: '#f6c76f',
  },
  {
    id: 'people',
    name: 'People',
    kicker: 'Scene 04  -  social orbit',
    description: 'People, conversation, and the emotional signals around them.',
    x: 210,
    y: 810,
    width: 660,
    height: 500,
    accent: '#f09ab4',
  },
  {
    id: 'work',
    name: 'Work table',
    kicker: 'Scene 05  -  making progress',
    description: 'Plans, projects, time, and the vocabulary of getting things done.',
    x: 950,
    y: 760,
    width: 700,
    height: 510,
    accent: '#8cbcff',
  },
  {
    id: 'nature',
    name: 'Open air',
    kicker: 'Scene 06  -  wider world',
    description: 'Weather, landscape, and words that keep the map feeling alive.',
    x: 1730,
    y: 790,
    width: 680,
    height: 500,
    accent: '#9ae48a',
  },
]

type SeedCard = Omit<WordCard, 'x' | 'y'>

const seedCards: SeedCard[] = [
  { id: 'welcome-greeting', lexemeKey: 'welcome', senseKey: 'greeting', target: 'welcome', origin: 'bem-vindo', partOfSpeech: 'adjective', sceneId: 'home', exampleTarget: 'Welcome home.', exampleOrigin: 'Bem-vindo em casa.', noteSeed: 'A warm word at the threshold.', imagePromptSeed: 'A warmly lit open doorway with a small welcome mat.', acceptedAnswers: ['welcome'] },
  { id: 'door-object', lexemeKey: 'door', senseKey: 'object', target: 'door', origin: 'porta', partOfSpeech: 'noun', sceneId: 'home', exampleTarget: 'Close the door, please.', exampleOrigin: 'Feche a porta, por favor.', noteSeed: 'The boundary between one room and another.', imagePromptSeed: 'A simple wooden door slightly open with a warm room behind it.', acceptedAnswers: ['door'] },
  { id: 'window-object', lexemeKey: 'window', senseKey: 'object', target: 'window', origin: 'janela', partOfSpeech: 'noun', sceneId: 'home', exampleTarget: 'The window is open.', exampleOrigin: 'A janela esta aberta.', noteSeed: 'A frame for the world outside.', imagePromptSeed: 'A bright window with morning light and a quiet view outside.', acceptedAnswers: ['window'] },
  { id: 'room-place', lexemeKey: 'room', senseKey: 'place', target: 'room', origin: 'quarto / sala', partOfSpeech: 'noun', sceneId: 'home', exampleTarget: 'This room feels calm.', exampleOrigin: 'Este comodo parece tranquilo.', noteSeed: 'A space with its own atmosphere.', imagePromptSeed: 'A calm, tidy room with a chair, a lamp, and soft daylight.', acceptedAnswers: ['room'] },
  { id: 'table-object', lexemeKey: 'table', senseKey: 'object', target: 'table', origin: 'mesa', partOfSpeech: 'noun', sceneId: 'home', exampleTarget: 'The keys are on the table.', exampleOrigin: 'As chaves estao na mesa.', noteSeed: 'The landing place for ordinary life.', imagePromptSeed: 'A wooden table with keys, a notebook, and a cup arranged clearly.', acceptedAnswers: ['table'] },
  { id: 'chair-object', lexemeKey: 'chair', senseKey: 'object', target: 'chair', origin: 'cadeira', partOfSpeech: 'noun', sceneId: 'home', exampleTarget: 'Pull up a chair.', exampleOrigin: 'Puxe uma cadeira.', noteSeed: 'An invitation to stay for a while.', imagePromptSeed: 'A single comfortable chair beside a small reading lamp.', acceptedAnswers: ['chair'] },
  { id: 'key-object', lexemeKey: 'key', senseKey: 'object', target: 'key', origin: 'chave', partOfSpeech: 'noun', sceneId: 'home', exampleTarget: 'I found the key.', exampleOrigin: 'Eu encontrei a chave.', noteSeed: 'Small object, large access.', imagePromptSeed: 'A brass key resting on a simple wooden surface.', acceptedAnswers: ['key'] },
  { id: 'book-object', lexemeKey: 'book', senseKey: 'object', target: 'book', origin: 'livro', partOfSpeech: 'noun', sceneId: 'home', exampleTarget: 'She opened the book.', exampleOrigin: 'Ela abriu o livro.', noteSeed: 'A portable room for ideas.', imagePromptSeed: 'An open book with a few soft pages and a bookmark.', acceptedAnswers: ['book'] },

  { id: 'street-place', lexemeKey: 'street', senseKey: 'place', target: 'street', origin: 'rua', partOfSpeech: 'noun', sceneId: 'street', exampleTarget: 'The street is busy today.', exampleOrigin: 'A rua esta movimentada hoje.', noteSeed: 'A route shared with other people.', imagePromptSeed: 'A lively but friendly city street with clear sidewalks.', acceptedAnswers: ['street'] },
  { id: 'bus-transport', lexemeKey: 'bus', senseKey: 'transport', target: 'bus', origin: 'onibus', partOfSpeech: 'noun', sceneId: 'street', exampleTarget: 'The bus is arriving.', exampleOrigin: 'O onibus esta chegando.', noteSeed: 'A moving room that carries a crowd.', imagePromptSeed: 'A colorful city bus arriving at a clean bus stop.', acceptedAnswers: ['bus'] },
  { id: 'train-transport', lexemeKey: 'train', senseKey: 'transport', target: 'train', origin: 'trem', partOfSpeech: 'noun', sceneId: 'street', exampleTarget: 'We took the train.', exampleOrigin: 'Nos pegamos o trem.', noteSeed: 'A long line with a destination.', imagePromptSeed: 'A modern train seen from a platform, simple and recognizable.', acceptedAnswers: ['train'] },
  { id: 'ticket-object', lexemeKey: 'ticket', senseKey: 'object', target: 'ticket', origin: 'bilhete / ingresso', partOfSpeech: 'noun', sceneId: 'street', exampleTarget: 'Keep your ticket safe.', exampleOrigin: 'Guarde seu bilhete.', noteSeed: 'A small permission slip for movement.', imagePromptSeed: 'A simple paper transit ticket held between two fingers.', acceptedAnswers: ['ticket'] },
  { id: 'corner-place', lexemeKey: 'corner', senseKey: 'place', target: 'corner', origin: 'esquina', partOfSpeech: 'noun', sceneId: 'street', exampleTarget: 'Turn at the next corner.', exampleOrigin: 'Vire na proxima esquina.', noteSeed: 'Where one direction becomes another.', imagePromptSeed: 'A friendly street corner with two intersecting sidewalks.', acceptedAnswers: ['corner'] },
  { id: 'map-object', lexemeKey: 'map', senseKey: 'object', target: 'map', origin: 'mapa', partOfSpeech: 'noun', sceneId: 'street', exampleTarget: 'Check the map.', exampleOrigin: 'Confira o mapa.', noteSeed: 'A small surface that holds a larger world.', imagePromptSeed: 'A folded city map spread open with a route marked in ink.', acceptedAnswers: ['map'] },
  { id: 'turn-action', lexemeKey: 'turn', senseKey: 'action', target: 'turn', origin: 'virar', partOfSpeech: 'verb', sceneId: 'street', exampleTarget: 'Turn left here.', exampleOrigin: 'Vire a esquerda aqui.', noteSeed: 'A change of direction.', imagePromptSeed: 'A clear arrow turning left at a simple intersection.', acceptedAnswers: ['turn'] },
  { id: 'arrive-action', lexemeKey: 'arrive', senseKey: 'action', target: 'arrive', origin: 'chegar', partOfSpeech: 'verb', sceneId: 'street', exampleTarget: 'We arrive at noon.', exampleOrigin: 'Nos chegamos ao meio-dia.', noteSeed: 'The moment a route becomes a place.', imagePromptSeed: 'A person arriving at a bright station with a small bag.', acceptedAnswers: ['arrive'] },

  { id: 'bread-food', lexemeKey: 'bread', senseKey: 'food', target: 'bread', origin: 'pao', partOfSpeech: 'noun', sceneId: 'kitchen', exampleTarget: 'The bread is fresh.', exampleOrigin: 'O pao esta fresco.', noteSeed: 'Warm, familiar, and easy to picture.', imagePromptSeed: 'A fresh loaf of bread on a kitchen counter, soft morning light.', acceptedAnswers: ['bread'] },
  { id: 'coffee-drink', lexemeKey: 'coffee', senseKey: 'drink', target: 'coffee', origin: 'cafe', partOfSpeech: 'noun', sceneId: 'kitchen', exampleTarget: 'I drink coffee in the morning.', exampleOrigin: 'Eu tomo cafe de manha.', noteSeed: 'A daily signal that the day has started.', imagePromptSeed: 'A steaming cup of coffee beside a small spoon.', acceptedAnswers: ['coffee'] },
  { id: 'water-drink', lexemeKey: 'water', senseKey: 'drink', target: 'water', origin: 'agua', partOfSpeech: 'noun', sceneId: 'kitchen', exampleTarget: 'Drink some water.', exampleOrigin: 'Beba um pouco de agua.', noteSeed: 'Simple, necessary, everywhere.', imagePromptSeed: 'A clear glass of water with a few bright reflections.', acceptedAnswers: ['water'] },
  { id: 'plate-object', lexemeKey: 'plate', senseKey: 'object', target: 'plate', origin: 'prato', partOfSpeech: 'noun', sceneId: 'kitchen', exampleTarget: 'Put it on the plate.', exampleOrigin: 'Coloque no prato.', noteSeed: 'A small stage for food.', imagePromptSeed: 'A white ceramic plate with a simple meal, top-down view.', acceptedAnswers: ['plate'] },
  { id: 'knife-object', lexemeKey: 'knife', senseKey: 'object', target: 'knife', origin: 'faca', partOfSpeech: 'noun', sceneId: 'kitchen', exampleTarget: 'Use the knife carefully.', exampleOrigin: 'Use a faca com cuidado.', noteSeed: 'Sharp, useful, and worth a clear image.', imagePromptSeed: 'A kitchen knife resting safely beside a cutting board.', acceptedAnswers: ['knife'] },
  { id: 'cook-action', lexemeKey: 'cook', senseKey: 'action', target: 'cook', origin: 'cozinhar', partOfSpeech: 'verb', sceneId: 'kitchen', exampleTarget: 'I like to cook.', exampleOrigin: 'Eu gosto de cozinhar.', noteSeed: 'Turning ingredients into an event.', imagePromptSeed: 'A person cooking vegetables in a bright home kitchen.', acceptedAnswers: ['cook'] },
  { id: 'eat-action', lexemeKey: 'eat', senseKey: 'action', target: 'eat', origin: 'comer', partOfSpeech: 'verb', sceneId: 'kitchen', exampleTarget: 'Let us eat together.', exampleOrigin: 'Vamos comer juntos.', noteSeed: 'A basic action with a social center.', imagePromptSeed: 'Two people sharing a relaxed meal at a small table.', acceptedAnswers: ['eat'] },
  { id: 'market-place', lexemeKey: 'market', senseKey: 'place', target: 'market', origin: 'mercado', partOfSpeech: 'noun', sceneId: 'kitchen', exampleTarget: 'The market opens early.', exampleOrigin: 'O mercado abre cedo.', noteSeed: 'Where ingredients meet people.', imagePromptSeed: 'A colorful neighborhood market with fruit and simple signs.', acceptedAnswers: ['market'] },

  { id: 'friend-person', lexemeKey: 'friend', senseKey: 'person', target: 'friend', origin: 'amigo / amiga', partOfSpeech: 'noun', sceneId: 'people', exampleTarget: 'My friend called me.', exampleOrigin: 'Meu amigo me ligou.', noteSeed: 'Someone who makes the route lighter.', imagePromptSeed: 'Two friends greeting each other with an easy smile.', acceptedAnswers: ['friend'] },
  { id: 'family-group', lexemeKey: 'family', senseKey: 'group', target: 'family', origin: 'familia', partOfSpeech: 'noun', sceneId: 'people', exampleTarget: 'Her family lives nearby.', exampleOrigin: 'A familia dela mora perto.', noteSeed: 'A group with a long shared story.', imagePromptSeed: 'A warm multigenerational family moment at home.', acceptedAnswers: ['family'] },
  { id: 'child-person', lexemeKey: 'child', senseKey: 'person', target: 'child', origin: 'crianca', partOfSpeech: 'noun', sceneId: 'people', exampleTarget: 'The child is curious.', exampleOrigin: 'A crianca e curiosa.', noteSeed: 'Attention moving toward the world.', imagePromptSeed: 'A curious child looking at a bright paper kite.', acceptedAnswers: ['child'] },
  { id: 'name-identity', lexemeKey: 'name', senseKey: 'identity', target: 'name', origin: 'nome', partOfSpeech: 'noun', sceneId: 'people', exampleTarget: 'What is your name?', exampleOrigin: 'Qual e o seu nome?', noteSeed: 'The first handle we give another person.', imagePromptSeed: 'A small name card on a friendly desk, clear and uncluttered.', acceptedAnswers: ['name'] },
  { id: 'speak-action', lexemeKey: 'speak', senseKey: 'action', target: 'speak', origin: 'falar', partOfSpeech: 'verb', sceneId: 'people', exampleTarget: 'Please speak slowly.', exampleOrigin: 'Por favor, fale devagar.', noteSeed: 'Putting an idea into the shared air.', imagePromptSeed: 'A person speaking calmly in a small conversation circle.', acceptedAnswers: ['speak'] },
  { id: 'listen-action', lexemeKey: 'listen', senseKey: 'action', target: 'listen', origin: 'escutar', partOfSpeech: 'verb', sceneId: 'people', exampleTarget: 'Listen to this song.', exampleOrigin: 'Escute esta musica.', noteSeed: 'Making room for another signal.', imagePromptSeed: 'A person listening closely with gentle concentration.', acceptedAnswers: ['listen'] },
  { id: 'help-action', lexemeKey: 'help', senseKey: 'action', target: 'help', origin: 'ajudar', partOfSpeech: 'verb', sceneId: 'people', exampleTarget: 'Can you help me?', exampleOrigin: 'Voce pode me ajudar?', noteSeed: 'A small action that changes the whole scene.', imagePromptSeed: 'One person helping another carry a box, warm and practical.', acceptedAnswers: ['help'] },
  { id: 'happy-feeling', lexemeKey: 'happy', senseKey: 'feeling', target: 'happy', origin: 'feliz', partOfSpeech: 'adjective', sceneId: 'people', exampleTarget: 'She looks happy today.', exampleOrigin: 'Ela parece feliz hoje.', noteSeed: 'A lightness that can be noticed.', imagePromptSeed: 'A person smiling in soft sunlight, natural and not exaggerated.', acceptedAnswers: ['happy'] },

  { id: 'office-place', lexemeKey: 'office', senseKey: 'place', target: 'office', origin: 'escritorio', partOfSpeech: 'noun', sceneId: 'work', exampleTarget: 'The office is quiet.', exampleOrigin: 'O escritorio esta quieto.', noteSeed: 'A place where plans become tangible.', imagePromptSeed: 'A calm modern office desk with a notebook and a plant.', acceptedAnswers: ['office'] },
  { id: 'meeting-event', lexemeKey: 'meeting', senseKey: 'event', target: 'meeting', origin: 'reuniao', partOfSpeech: 'noun', sceneId: 'work', exampleTarget: 'The meeting starts at nine.', exampleOrigin: 'A reuniao comeca as nove.', noteSeed: 'Several minds sharing one table.', imagePromptSeed: 'A small meeting around a table with simple notes.', acceptedAnswers: ['meeting'] },
  { id: 'project-work', lexemeKey: 'project', senseKey: 'work', target: 'project', origin: 'projeto', partOfSpeech: 'noun', sceneId: 'work', exampleTarget: 'This project matters.', exampleOrigin: 'Este projeto importa.', noteSeed: 'A shape that is still becoming.', imagePromptSeed: 'A project board with a few connected cards and a clear path.', acceptedAnswers: ['project'] },
  { id: 'plan-idea', lexemeKey: 'plan', senseKey: 'idea', target: 'plan', origin: 'plano / planejar', partOfSpeech: 'noun', sceneId: 'work', exampleTarget: 'We need a plan.', exampleOrigin: 'Precisamos de um plano.', noteSeed: 'A route before the route begins.', imagePromptSeed: 'A simple plan sketched on paper with three connected steps.', acceptedAnswers: ['plan'] },
  { id: 'time-measure', lexemeKey: 'time', senseKey: 'measure', target: 'time', origin: 'tempo', partOfSpeech: 'noun', sceneId: 'work', exampleTarget: 'Take your time.', exampleOrigin: 'Tenha seu tempo.', noteSeed: 'The invisible material all practice uses.', imagePromptSeed: 'A simple clock beside a notebook, calm rather than urgent.', acceptedAnswers: ['time'] },
  { id: 'learn-action', lexemeKey: 'learn', senseKey: 'action', target: 'learn', origin: 'aprender', partOfSpeech: 'verb', sceneId: 'work', exampleTarget: 'We learn by returning.', exampleOrigin: 'Nos aprendemos voltando.', noteSeed: 'Knowledge becoming easier to retrieve.', imagePromptSeed: 'A small path of stepping stones leading toward a glowing book.', acceptedAnswers: ['learn'] },
  { id: 'bank-money', lexemeKey: 'bank', senseKey: 'financial-institution', target: 'bank', origin: 'banco (financeiro)', partOfSpeech: 'noun', sceneId: 'work', exampleTarget: 'The bank closes at four.', exampleOrigin: 'O banco fecha as quatro.', noteSeed: 'A financial institution; keep this sense separate.', imagePromptSeed: 'A friendly modern bank facade with a subtle currency symbol.', acceptedAnswers: ['bank'] },
  { id: 'work-action', lexemeKey: 'work', senseKey: 'action', target: 'work', origin: 'trabalhar', partOfSpeech: 'verb', sceneId: 'work', exampleTarget: 'I work from home.', exampleOrigin: 'Eu trabalho de casa.', noteSeed: 'Effort directed toward a result.', imagePromptSeed: 'A focused person working at a tidy desk with daylight.', acceptedAnswers: ['work'] },

  { id: 'tree-nature', lexemeKey: 'tree', senseKey: 'nature', target: 'tree', origin: 'arvore', partOfSpeech: 'noun', sceneId: 'nature', exampleTarget: 'The tree gives shade.', exampleOrigin: 'A arvore da sombra.', noteSeed: 'A vertical memory palace landmark.', imagePromptSeed: 'A single broad tree casting a clear patch of shade.', acceptedAnswers: ['tree'] },
  { id: 'river-nature', lexemeKey: 'river', senseKey: 'nature', target: 'river', origin: 'rio', partOfSpeech: 'noun', sceneId: 'nature', exampleTarget: 'The river is wide here.', exampleOrigin: 'O rio e largo aqui.', noteSeed: 'A path that keeps moving without walking.', imagePromptSeed: 'A bright river winding through a green landscape.', acceptedAnswers: ['river'] },
  { id: 'mountain-nature', lexemeKey: 'mountain', senseKey: 'nature', target: 'mountain', origin: 'montanha', partOfSpeech: 'noun', sceneId: 'nature', exampleTarget: 'We can see the mountain.', exampleOrigin: 'Podemos ver a montanha.', noteSeed: 'A large fixed point on the mental map.', imagePromptSeed: 'A single mountain with a clear silhouette and open sky.', acceptedAnswers: ['mountain'] },
  { id: 'rain-weather', lexemeKey: 'rain', senseKey: 'weather', target: 'rain', origin: 'chuva', partOfSpeech: 'noun', sceneId: 'nature', exampleTarget: 'The rain stopped.', exampleOrigin: 'A chuva parou.', noteSeed: 'A sound and texture as much as a fact.', imagePromptSeed: 'Gentle rain on a window with soft green shapes behind it.', acceptedAnswers: ['rain'] },
  { id: 'sun-weather', lexemeKey: 'sun', senseKey: 'weather', target: 'sun', origin: 'sol', partOfSpeech: 'noun', sceneId: 'nature', exampleTarget: 'The sun is bright.', exampleOrigin: 'O sol esta forte.', noteSeed: 'A reliable light source in the scene.', imagePromptSeed: 'Warm sunlight breaking through a few soft clouds.', acceptedAnswers: ['sun'] },
  { id: 'bird-animal', lexemeKey: 'bird', senseKey: 'animal', target: 'bird', origin: 'passaro', partOfSpeech: 'noun', sceneId: 'nature', exampleTarget: 'A bird landed nearby.', exampleOrigin: 'Um passaro pousou perto.', noteSeed: 'A quick moving detail that keeps a scene alive.', imagePromptSeed: 'A small bird perched on a branch against a simple sky.', acceptedAnswers: ['bird'] },
  { id: 'walk-action', lexemeKey: 'walk', senseKey: 'action', target: 'walk', origin: 'caminhar', partOfSpeech: 'verb', sceneId: 'nature', exampleTarget: 'Let us walk by the river.', exampleOrigin: 'Vamos caminhar perto do rio.', noteSeed: 'Learning as a route taken one step at a time.', imagePromptSeed: 'A person walking on a path beside a river in open air.', acceptedAnswers: ['walk'] },
  { id: 'bank-river', lexemeKey: 'bank', senseKey: 'river-edge', target: 'bank', origin: 'margem (do rio)', partOfSpeech: 'noun', sceneId: 'nature', exampleTarget: 'We sat on the river bank.', exampleOrigin: 'Nos sentamos na margem do rio.', noteSeed: 'A river edge; keep this sense separate from finance.', imagePromptSeed: 'A grassy river bank with a person sitting near the water.', acceptedAnswers: ['bank'] },
]

const sceneOffsets: Record<string, number> = {}

export const starterCards: WordCard[] = seedCards.map((card) => {
  const scene = starterScenes.find((candidate) => candidate.id === card.sceneId)
  if (!scene) {
    throw new Error(`Unknown scene ${card.sceneId}`)
  }

  const index = sceneOffsets[card.sceneId] ?? 0
  sceneOffsets[card.sceneId] = index + 1
  const column = index % 4
  const row = Math.floor(index / 4)

  return {
    ...card,
    x: scene.x + 34 + column * 150,
    y: scene.y + 122 + row * 156,
  }
})

export const starterPack: LanguagePack = {
  id: 'en-ptbr-foundations-v1',
  name: 'English foundations',
  targetLanguage: 'English',
  originLanguage: 'Portugues (Brasil)',
  version: '1.0.0',
  scenes: starterScenes,
  cards: starterCards,
}

