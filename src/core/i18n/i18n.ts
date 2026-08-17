import { useMemo } from 'react'

export const supportedLocales = ['en-US', 'pt-BR', 'de-DE'] as const
export type SupportedLocale = (typeof supportedLocales)[number]

export interface LocaleOption {
  code: SupportedLocale
  label: string
  nativeLabel: string
}

export const localeOptions: LocaleOption[] = [
  { code: 'en-US', label: 'English', nativeLabel: 'English' },
  { code: 'pt-BR', label: 'Portuguese (Brazil)', nativeLabel: 'Português (Brasil)' },
  { code: 'de-DE', label: 'German', nativeLabel: 'Deutsch' },
]

type MessageValue = string | ((values: Record<string, string | number>) => string)
type MessageCatalog = Record<string, MessageValue>

const english: MessageCatalog = {
  'card.primarySense': 'Primary',
  'run.cardPositionShort': ({ current, total }) => `Card ${current} of ${total}`,
  'run.stabilityNow': ({ status, count }) => `${status} - ${count}% now`,
  'outcome.hit': 'Hit',
  'outcome.miss': 'Miss',
  'outcome.reveal': 'Reveal',
  'outcome.typed': 'Typed hit',
  'run.targetWord': 'Target word',
  'run.tapReveal': 'Tap to reveal',
  'run.percentComplete': ({ count }) => `${count}% complete`,
  'history.cardsCount': ({ count }) => `${count} Cards`,
  'app.opening': 'Opening SimpleSpeak...',
  'nav.backToBoard': 'Back to board',
  'nav.openBoard': 'Open SimpleSpeak board',
  'nav.searchWords': 'Search words',
  'nav.findWord': 'Find a word',
  'nav.clearSearch': 'Clear search',
  'nav.searchHint': 'Type to find it on the board.',
  'nav.noMatches': 'No matching words.',
  'nav.openMoreViews': 'Open more views',
  'nav.more': 'More',
  'nav.secondaryViews': 'Secondary views',
  'nav.history': 'History',
  'nav.settings': 'Settings',

  'board.aria': 'SimpleSpeak board',
  'board.interactive': 'Interactive vocabulary board',
  'board.focusCurrent': 'Focus current card',
  'run.configureAria': 'Configure a study run',
  'run.studyRoute': 'Study route',
  'run.chooseReturn': 'Choose a return',
  'run.closeConfig': 'Close run configuration',
  'run.route': 'Route',
  'run.dueNearby': 'Due + nearby',
  'run.oneScene': 'One scene',
  'run.allWords': 'All words',
  'run.customRoute': 'Custom route',
  'run.chooseScene': 'Choose scene',
  'run.cards': ({ count }) => `${count} cards`,
  'run.dueNow': ({ count }) => `${count} due now`,
  'run.startRoute': 'Start route',
  'run.openConfig': 'Start a study run',
  'run.activeAria': 'Active study run',
  'run.live': 'Live',
  'run.cardPosition': ({ current, total, scene }) => `${scene} · Card ${current} of ${total}`,
  'run.score': 'Run score',
  'run.details': 'Details',
  'run.leaveRun': 'Leave run and keep the route saved',
  'run.board': 'Board',
  'run.backOpen': 'Back open — keep the scene and mark the return.',
  'run.recall': 'Recall the target, then type it or choose a signal.',
  'run.noImage': 'No image yet — use the word on the focused Card as your cue.',
  'run.continueMiss': 'Continue',
  'run.typeTarget': 'Type the target word...',
  'run.typeTargetAria': 'Type the target word',
  'run.enter': 'Enter',
  'run.iKnewIt': 'I knew it',
  'run.missed': 'Missed',
  'run.reveal': 'Reveal',
  'run.ready': ({ label }) => `${label} ready. One card at a time.`,
  'run.routeLabel': ({ scene }) => `${scene} route`,
  'run.complete': 'Run complete. The route is a little brighter.',
  'run.noCards': 'No cards match this run. Try a wider preset.',
  'run.filters': 'Progressive filters',
  'run.progressiveFilters': 'Shape this run',
  'run.addFilter': 'Add criterion',
  'run.noFilters': 'No criteria yet. The preset defines the base set.',
  'run.filterMode': 'Criterion mode',
  'run.addMode': 'Add matches',
  'run.subtractMode': 'Subtract matches',
  'run.filterType': 'Criterion type',
  'run.filterGroup': 'Specific group',
  'run.filterPartOfSpeech': 'Part of speech',
  'run.filterRetention': 'Retention range',
  'run.selectGroup': 'Choose a group',
  'run.selectPartOfSpeech': 'Choose a part of speech',
  'run.minRetention': 'Minimum %',
  'run.maxRetention': 'Maximum %',
  'run.removeFilter': 'Remove criterion',

  'history.eyebrow': 'Memory ledger',
  'history.title': 'History that helps you return.',
  'history.description': 'See the signals over time. A quiet week is a gap in the graph, not a failure state.',
  'history.savedRuns': ({ count }) => `${count} saved runs`,
  'history.reviews': 'Reviews',
  'history.touchedCards': ({ count }) => `across ${count} touched Cards`,
  'history.averageAccuracy': 'Average accuracy',
  'history.selfReport': 'self-report + typed answers',
  'history.anchored': 'Anchored',
  'history.boundedMeanings': ({ count }) => `of ${count} bounded meanings`,
  'history.dueNow': 'Due now',
  'history.reentryPoints': 're-entry points',
  'history.runPerformance': 'Run performance',
  'history.signalReturns': 'Your signal over the last returns',
  'history.hits': 'hits',
  'history.attempts': 'attempts',
  'history.stabilityWatch': 'Stability watch',
  'history.cardsLosingAltitude': 'Cards losing altitude',
  'history.retrievability': 'retrievability',
  'history.completeRun': 'Complete a run to start seeing decay signals.',
  'history.openStability': ({ card, score }) => `Open stability for ${card}, ${score}% retrievable`,
  'history.savedRunsHeading': 'Saved runs',
  'history.recentPractice': 'Recent practice, without a streak trap',
  'history.firstRun': 'Your first run will appear here.',
  'history.firstRunDescription': 'The record stores hits, misses, reveals, duration, and the route you took.',
  'history.signal': 'signal',
  'history.hitsSmall': 'hits',
  'history.footer': 'SimpleSpeak does not invent missed days. It uses the time that really passed, then gives a returning learner a bounded, useful next Card.',
  'history.chartAria': 'Run performance chart',
  'history.graphStart': 'Your graph starts with your first run.',
  'history.older': 'older',
  'history.recent': 'recent',
  'history.runAgain': 'Run again',
  'history.criteriaCount': ({ count }) => `${count} criteria`,

  'settings.controlRoom': 'Control room',
  'settings.title': 'Make the board yours.',
  'settings.description': 'Everything stays on this device except the image request you explicitly send to Google.',
  'settings.localSettings': 'local settings',
  'settings.language': 'UI language',
  'settings.languageHelp': 'Choose the language for app controls, explanations, and messages.',
  'settings.imageStudio': 'Image studio',
  'settings.visualHook': 'Give the cards a visual hook.',
  'settings.keyPresent': 'key present',
  'settings.keyNeeded': 'key needed',
  'settings.imageLead': 'Paste a Google AI API key to generate square card visuals. A saved image is kept locally; regenerate to overwrite it, and a failed request leaves the previous image untouched.',
  'settings.apiKey': 'Google AI API key',
  'settings.hideKey': 'Hide API key',
  'settings.showKey': 'Show API key',
  'settings.saveKey': 'Save key',
  'settings.savedNoServer': 'Stored with device preferences; no SimpleSpeak server.',
  'settings.modelId': 'Model id',
  'settings.modelEffort': 'Model effort',
  'settings.resolution': 'Resolution',
  'settings.aspectRatio': 'Aspect ratio',
  'settings.square': '1:1 square',
  'settings.imageNote': 'Gemini 3.1 Flash Image uses 512px, 1K, or 2K here. 1K is the balanced default for card visuals.',
  'settings.innerPrompt': 'Inner image prompt',
  'settings.characters': ({ count }) => `${count} characters`,
  'settings.promptSent': 'Prompt is sent as the model instruction, followed by the card description.',
  'settings.resetDefault': 'Reset default',
  'settings.learningRhythm': 'Learning rhythm',
  'settings.irregularUse': 'Make irregular use work.',
  'settings.rhythmLead': 'The horizon shapes suggested targets. It does not punish a gap or create fake missed days.',
  'settings.overallHorizon': 'Overall horizon',
  'settings.dailyTarget': 'Daily target',
  'settings.daysQuick': 'quick orbit',
  'settings.daysSteady': 'steady orbit',
  'settings.daysLong': 'long orbit',
  'settings.daysDeep': 'deep board',
  'settings.cardsGentle': 'gentle',
  'settings.cardsBalanced': 'balanced',
  'settings.cardsFocused': 'focused',
  'settings.cardsDeep': 'deep',
  'settings.returnWhen': 'Return when you can.',
  'settings.engine': "The engine uses elapsed time and today's performance. It does not pretend you studied on days you did not.",
  'settings.loadedPack': 'Loaded language pack',
  'settings.cards': ({ count }) => `${count} cards`,
  'settings.scenes': ({ count }) => `${count} scenes`,
  'settings.exportPack': 'Export pack JSON',
  'settings.offlineDefault': 'Offline by default',
  'settings.offlineDescription': 'Board, notes, runs, review history, and generated images work without a network. Only generation uses the API key.',
  'settings.localState': 'local state',
  'settings.localImages': 'local images',
  'settings.localHistory': 'local history',
  'settings.maintenance': 'Maintenance',
  'settings.startOver': 'Start the learning state over',
  'settings.keepImages': 'Keep image settings, clear review history and saved images.',
  'settings.resetLearning': 'Reset learning',

  'card.wordCard': ({ sense }) => `Word card - ${sense}`,
  'card.closeDetails': 'Close card details',
  'card.visualAlt': ({ card }) => `${card} visual`,
  'card.noImage': 'No generated image yet',
  'card.selectedMeaning': ({ partOfSpeech }) => `Selected bounded meaning - ${partOfSpeech}`,
  'card.stabilityPanel': 'Stability panel',
  'card.savedImage': 'Saved image - regenerate to overwrite',
  'card.frontWord': 'Front will use the word until generated',
  'card.visualPrompt': 'Visual prompt',
  'card.promptPlaceholder': 'Describe the visual hook for this word...',
  'card.generating': 'Generating...',
  'card.regenerate': 'Regenerate image',
  'card.generate': 'Generate square image',
  'card.generationHelp': 'The request includes the inner prompt, this description, the target word, and the selected meaning. A failed request does not erase the saved image.',
  'card.mnemonic': 'Mnemonic note',
  'card.private': 'private to this card',
  'card.notePlaceholder': 'Write a private mnemonic for this meaning...',
  'card.saveNote': 'Save note',
  'card.context': 'Context',
  'card.packContent': 'pack content',
  'card.openStability': 'Open word stability',
  'card.reviewHalfLife': ({ reviews, days }) => `${reviews} reviews - ${days} day half-life`,
  'card.noMnemonic': 'No mnemonic note yet.',

  'stability.title': 'Word stability',
  'stability.close': 'Close stability panel',
  'stability.retrievableNow': 'retrievable now',
  'stability.firstSignal': 'The first return will give this word its first useful signal.',
  'stability.comfortableToday': 'This word is likely to come back comfortably today.',
  'stability.kindReturn': 'This word is asking for a kind, timely return.',
  'stability.stability': 'Stability',
  'stability.days': ({ count }) => `${count} days`,
  'stability.nextDue': 'Next due',
  'stability.reviews': 'Reviews',
  'stability.predicted': 'Predicted retrieval',
  'stability.decayView': 'decay view',
  'stability.graphAria': 'Predicted word stability decay graph',
  'stability.now': 'now',
  'stability.in34Days': '+34 days',
  'stability.recentSignals': 'Recent signals',
  'stability.saved': ({ count }) => `${count} saved`,
  'stability.noReviews': 'No reviews yet. The first honest signal starts the curve.',
  'stability.typedHit': 'Typed hit',
  'stability.eventDelta': ({ before, after }) => `${before} to ${after} days`,
  'stability.principle': 'Intervals are suggestions. A long gap does not rewrite history; the next review reads what happened now and recalibrates.',

  'status.new': 'New',
  'status.emerging': 'Emerging',
  'status.familiar': 'Familiar',
  'status.anchored': 'Anchored',
  'format.notReviewed': 'Not reviewed yet',
  'format.today': 'Today',
  'format.tomorrow': 'Tomorrow',
  'format.yesterday': 'Yesterday',
  'format.inDays': ({ count }) => `In ${count} days`,
  'format.daysAgo': ({ count }) => `${count} days ago`,

  'notice.keySaved': 'Image key saved on this device.',
  'notice.keyRemoved': 'Image key removed.',
  'notice.addKey': 'Add a Google AI API key in Settings before generating an image.',
  'notice.imageSaved': ({ card }) => `${card} image saved to this device.`,
  'notice.unknownImageError': 'Unknown image generation error.',
  'notice.imageNotChanged': ({ message }) => `Image not changed: ${message}`,
  'notice.noteSaved': 'Mnemonic note saved.',
  'notice.confirmReset': 'Reset all review history and generated images for the starter pack?',
  'notice.resetDone': 'The board is fresh again. Your image settings stayed saved.',

  'image.quickLight': 'quick and light',
  'image.standardRecommended': 'standard (recommended)',
  'image.detailedHeavier': 'detailed and heavier',
  'image.highEffort': 'High - more composition thinking',
  'image.minimalEffort': 'Minimal - quick card visuals',
}

const portuguese: MessageCatalog = {
  'run.filters': 'Filtros progressivos', 'run.progressiveFilters': 'Monte esta sessao', 'run.addFilter': 'Adicionar criterio', 'run.noFilters': 'Nenhum criterio ainda. A opcao define a base.', 'run.filterMode': 'Modo do criterio', 'run.addMode': 'Adicionar correspondencias', 'run.subtractMode': 'Subtrair correspondencias', 'run.filterType': 'Tipo do criterio', 'run.filterGroup': 'Grupo especifico', 'run.filterPartOfSpeech': 'Classe gramatical', 'run.filterRetention': 'Faixa de retencao', 'run.selectGroup': 'Escolha um grupo', 'run.selectPartOfSpeech': 'Escolha uma classe gramatical', 'run.minRetention': 'Minimo %', 'run.maxRetention': 'Maximo %', 'run.removeFilter': 'Remover criterio', 'history.runAgain': 'Repetir sessao', 'history.criteriaCount': ({ count }) => `${count} criterios`,
  'card.primarySense': 'Principal',
  'run.cardPositionShort': ({ current, total }) => `Cartão ${current} de ${total}`,
  'run.stabilityNow': ({ status, count }) => `${status} - ${count}% agora`,
  'outcome.hit': 'Acerto',
  'outcome.miss': 'Erro',
  'outcome.reveal': 'Revelação',
  'outcome.typed': 'Acerto digitado',
  'run.targetWord': 'Palavra-alvo',
  'run.tapReveal': 'Toque para revelar',
  'run.percentComplete': ({ count }) => `${count}% concluído`,
  'history.cardsCount': ({ count }) => `${count} cartões`,
  'app.opening': 'Abrindo o SimpleSpeak...',
  'nav.backToBoard': 'Voltar ao quadro', 'nav.openBoard': 'Abrir quadro do SimpleSpeak', 'nav.searchWords': 'Pesquisar palavras', 'nav.findWord': 'Encontrar uma palavra', 'nav.clearSearch': 'Limpar pesquisa', 'nav.searchHint': 'Digite para encontrar no quadro.', 'nav.noMatches': 'Nenhuma palavra correspondente.', 'nav.openMoreViews': 'Abrir mais telas', 'nav.more': 'Mais', 'nav.secondaryViews': 'Telas secundárias', 'nav.history': 'Histórico', 'nav.settings': 'Configurações',
  'board.aria': 'Quadro do SimpleSpeak', 'board.interactive': 'Quadro de vocabulário interativo', 'board.focusCurrent': 'Focar cartão atual',
  'run.configureAria': 'Configurar uma sessão de estudo', 'run.studyRoute': 'Rota de estudo', 'run.chooseReturn': 'Escolha um retorno', 'run.closeConfig': 'Fechar configuração da sessão', 'run.route': 'Rota', 'run.dueNearby': 'Pendentes + próximas', 'run.oneScene': 'Uma cena', 'run.allWords': 'Todas as palavras', 'run.customRoute': 'Rota personalizada', 'run.chooseScene': 'Escolha uma cena', 'run.cards': ({ count }) => `${count} cartões`, 'run.dueNow': ({ count }) => `${count} pendentes agora`, 'run.startRoute': 'Começar rota', 'run.openConfig': 'Iniciar uma sessão de estudo', 'run.activeAria': 'Sessão de estudo ativa', 'run.live': 'Ao vivo', 'run.cardPosition': ({ current, total, scene }) => `${scene} · Cartão ${current} de ${total}`, 'run.score': 'Pontuação da sessão', 'run.details': 'Detalhes', 'run.leaveRun': 'Sair da sessão e manter a rota salva', 'run.board': 'Quadro', 'run.backOpen': 'Resposta aberta — mantenha a cena e marque o retorno.', 'run.recall': 'Lembre-se do termo e digite ou escolha um sinal.', 'run.noImage': 'Ainda sem imagem — use a palavra do cartão em foco como pista.', 'run.continueMiss': 'Continuar · contado como erro', 'run.typeTarget': 'Digite a palavra-alvo...', 'run.typeTargetAria': 'Digite a palavra-alvo', 'run.enter': 'Enter', 'run.iKnewIt': 'Eu sabia', 'run.missed': 'Errei', 'run.reveal': 'Revelar', 'run.ready': ({ label }) => `${label} pronto. Um cartão por vez.`, 'run.routeLabel': ({ scene }) => `Rota: ${scene}`, 'run.complete': 'Sessão concluída. A rota está um pouco mais clara.', 'run.noCards': 'Nenhum cartão corresponde a esta sessão. Tente uma opção mais ampla.',
  'history.eyebrow': 'Registro de memória', 'history.title': 'Um histórico que ajuda você a voltar.', 'history.description': 'Veja os sinais ao longo do tempo. Uma semana tranquila é uma lacuna no gráfico, não uma falha.', 'history.savedRuns': ({ count }) => `${count} sessões salvas`, 'history.reviews': 'Revisões', 'history.touchedCards': ({ count }) => `em ${count} cartões visitados`, 'history.averageAccuracy': 'Precisão média', 'history.selfReport': 'autoavaliação + respostas digitadas', 'history.anchored': 'Ancorados', 'history.boundedMeanings': ({ count }) => `de ${count} significados delimitados`, 'history.dueNow': 'Pendentes agora', 'history.reentryPoints': 'pontos de retorno', 'history.runPerformance': 'Desempenho das sessões', 'history.signalReturns': 'Seu sinal nos últimos retornos', 'history.hits': 'acertos', 'history.attempts': 'tentativas', 'history.stabilityWatch': 'Acompanhamento da estabilidade', 'history.cardsLosingAltitude': 'Cartões perdendo força', 'history.retrievability': 'recuperabilidade', 'history.completeRun': 'Conclua uma sessão para começar a ver sinais de perda.', 'history.openStability': ({ card, score }) => `Abrir estabilidade de ${card}, ${score}% recuperável`, 'history.savedRunsHeading': 'Sessões salvas', 'history.recentPractice': 'Prática recente, sem armadilha de sequência', 'history.firstRun': 'Sua primeira sessão aparecerá aqui.', 'history.firstRunDescription': 'O registro guarda acertos, erros, revelações, duração e a rota percorrida.', 'history.signal': 'sinal', 'history.hitsSmall': 'acertos', 'history.footer': 'O SimpleSpeak não inventa dias perdidos. Ele usa o tempo que realmente passou e oferece ao aprendiz que retorna um próximo cartão útil e limitado.', 'history.chartAria': 'Gráfico de desempenho das sessões', 'history.graphStart': 'Seu gráfico começa com a primeira sessão.', 'history.older': 'mais antigo', 'history.recent': 'recente',
  'settings.controlRoom': 'Central de controle', 'settings.title': 'Faça o quadro ser seu.', 'settings.description': 'Tudo fica neste dispositivo, exceto o pedido de imagem que você decide enviar ao Google.', 'settings.localSettings': 'configurações locais', 'settings.language': 'Idioma da interface', 'settings.languageHelp': 'Escolha o idioma dos controles, explicações e mensagens do app.', 'settings.imageStudio': 'Estúdio de imagens', 'settings.visualHook': 'Dê uma pista visual aos cartões.', 'settings.keyPresent': 'chave presente', 'settings.keyNeeded': 'chave necessária', 'settings.imageLead': 'Cole uma chave de API do Google AI para gerar visuais quadrados. Uma imagem salva fica localmente; regenere para substituí-la, e um pedido falho mantém a imagem anterior.', 'settings.apiKey': 'Chave de API do Google AI', 'settings.hideKey': 'Ocultar chave de API', 'settings.showKey': 'Mostrar chave de API', 'settings.saveKey': 'Salvar chave', 'settings.savedNoServer': 'Armazenada nas preferências do dispositivo; sem servidor do SimpleSpeak.', 'settings.modelId': 'ID do modelo', 'settings.modelEffort': 'Esforço do modelo', 'settings.resolution': 'Resolução', 'settings.aspectRatio': 'Proporção', 'settings.square': 'quadrado 1:1', 'settings.imageNote': 'O Gemini 3.1 Flash Image usa 512px, 1K ou 2K aqui. 1K é o padrão equilibrado para visuais de cartões.', 'settings.innerPrompt': 'Prompt interno da imagem', 'settings.characters': ({ count }) => `${count} caracteres`, 'settings.promptSent': 'O prompt é enviado como instrução do modelo, seguido pela descrição do cartão.', 'settings.resetDefault': 'Restaurar padrão', 'settings.learningRhythm': 'Ritmo de aprendizagem', 'settings.irregularUse': 'Faça o uso irregular funcionar.', 'settings.rhythmLead': 'O horizonte orienta as sugestões. Ele não pune uma pausa nem cria dias perdidos falsos.', 'settings.overallHorizon': 'Horizonte geral', 'settings.dailyTarget': 'Meta diária', 'settings.daysQuick': 'ciclo rápido', 'settings.daysSteady': 'ciclo constante', 'settings.daysLong': 'ciclo longo', 'settings.daysDeep': 'quadro profundo', 'settings.cardsGentle': 'leve', 'settings.cardsBalanced': 'equilibrado', 'settings.cardsFocused': 'focado', 'settings.cardsDeep': 'intenso', 'settings.returnWhen': 'Volte quando puder.', 'settings.engine': 'O mecanismo usa o tempo decorrido e o desempenho de hoje. Ele não finge que você estudou nos dias em que não estudou.', 'settings.loadedPack': 'Pacote de idiomas carregado', 'settings.cards': ({ count }) => `${count} cartões`, 'settings.scenes': ({ count }) => `${count} cenas`, 'settings.exportPack': 'Exportar JSON do pacote', 'settings.offlineDefault': 'Offline por padrão', 'settings.offlineDescription': 'Quadro, notas, sessões, histórico de revisões e imagens geradas funcionam sem rede. Só a geração usa a chave de API.', 'settings.localState': 'estado local', 'settings.localImages': 'imagens locais', 'settings.localHistory': 'histórico local', 'settings.maintenance': 'Manutenção', 'settings.startOver': 'Recomeçar o estado de aprendizagem', 'settings.keepImages': 'Manter configurações de imagem e limpar histórico de revisões e imagens salvas.', 'settings.resetLearning': 'Redefinir aprendizagem',
  'card.wordCard': ({ sense }) => `Cartão de palavra - ${sense}`, 'card.closeDetails': 'Fechar detalhes do cartão', 'card.visualAlt': ({ card }) => `Visual de ${card}`, 'card.noImage': 'Nenhuma imagem gerada ainda', 'card.selectedMeaning': ({ partOfSpeech }) => `Significado delimitado selecionado - ${partOfSpeech}`, 'card.stabilityPanel': 'Painel de estabilidade', 'card.savedImage': 'Imagem salva - regenere para substituir', 'card.frontWord': 'A frente usará a palavra até que uma imagem seja gerada', 'card.visualPrompt': 'Prompt visual', 'card.promptPlaceholder': 'Descreva a pista visual desta palavra...', 'card.generating': 'Gerando...', 'card.regenerate': 'Regenerar imagem', 'card.generate': 'Gerar imagem quadrada', 'card.generationHelp': 'O pedido inclui o prompt interno, esta descrição, a palavra-alvo e o significado selecionado. Um pedido falho não apaga a imagem salva.', 'card.mnemonic': 'Nota mnemônica', 'card.private': 'privada deste cartão', 'card.notePlaceholder': 'Escreva uma mnemônica privada para este significado...', 'card.saveNote': 'Salvar nota', 'card.context': 'Contexto', 'card.packContent': 'conteúdo do pacote', 'card.openStability': 'Abrir estabilidade da palavra', 'card.reviewHalfLife': ({ reviews, days }) => `${reviews} revisões - meia-vida de ${days} dias`, 'card.noMnemonic': 'Ainda não há nota mnemônica.',
  'stability.title': 'Estabilidade da palavra', 'stability.close': 'Fechar painel de estabilidade', 'stability.retrievableNow': 'recuperável agora', 'stability.firstSignal': 'O primeiro retorno dará a esta palavra seu primeiro sinal útil.', 'stability.comfortableToday': 'É provável que esta palavra volte com facilidade hoje.', 'stability.kindReturn': 'Esta palavra pede um retorno gentil e oportuno.', 'stability.stability': 'Estabilidade', 'stability.days': ({ count }) => `${count} dias`, 'stability.nextDue': 'Próxima revisão', 'stability.reviews': 'Revisões', 'stability.predicted': 'Recuperação prevista', 'stability.decayView': 'visão de perda', 'stability.graphAria': 'Gráfico previsto de perda da estabilidade da palavra', 'stability.now': 'agora', 'stability.in34Days': '+34 dias', 'stability.recentSignals': 'Sinais recentes', 'stability.saved': ({ count }) => `${count} salvos`, 'stability.noReviews': 'Ainda não há revisões. O primeiro sinal honesto inicia a curva.', 'stability.typedHit': 'Acerto digitado', 'stability.eventDelta': ({ before, after }) => `${before} a ${after} dias`, 'stability.principle': 'Intervalos são sugestões. Uma pausa longa não reescreve o histórico; a próxima revisão lê o que aconteceu agora e recalibra.',
  'status.new': 'Novo', 'status.emerging': 'Surgindo', 'status.familiar': 'Familiar', 'status.anchored': 'Ancorado', 'format.notReviewed': 'Ainda não revisado', 'format.today': 'Hoje', 'format.tomorrow': 'Amanhã', 'format.yesterday': 'Ontem', 'format.inDays': ({ count }) => `Em ${count} dias`, 'format.daysAgo': ({ count }) => `${count} dias atrás`,
  'notice.keySaved': 'Chave de imagem salva neste dispositivo.', 'notice.keyRemoved': 'Chave de imagem removida.', 'notice.addKey': 'Adicione uma chave de API do Google AI em Configurações antes de gerar uma imagem.', 'notice.imageSaved': ({ card }) => `Imagem de ${card} salva neste dispositivo.`, 'notice.unknownImageError': 'Erro desconhecido ao gerar imagem.', 'notice.imageNotChanged': ({ message }) => `Imagem não alterada: ${message}`, 'notice.noteSaved': 'Nota mnemônica salva.', 'notice.confirmReset': 'Redefinir todo o histórico de revisões e as imagens geradas do pacote inicial?', 'notice.resetDone': 'O quadro está novo novamente. Suas configurações de imagem continuam salvas.',
  'image.quickLight': 'rápido e leve', 'image.standardRecommended': 'padrão (recomendado)', 'image.detailedHeavier': 'detalhado e pesado', 'image.highEffort': 'Alto - mais raciocínio de composição', 'image.minimalEffort': 'Mínimo - visuais rápidos para cartões',
}

const german: MessageCatalog = {
  'run.filters': 'Progressive Filter', 'run.progressiveFilters': 'Diesen Lauf formen', 'run.addFilter': 'Kriterium hinzufuegen', 'run.noFilters': 'Noch keine Kriterien. Die Auswahl definiert die Basis.', 'run.filterMode': 'Kriteriumsmodus', 'run.addMode': 'Treffer hinzufuegen', 'run.subtractMode': 'Treffer abziehen', 'run.filterType': 'Kriteriumstyp', 'run.filterGroup': 'Bestimmte Gruppe', 'run.filterPartOfSpeech': 'Wortart', 'run.filterRetention': 'Abrufbarkeitsbereich', 'run.selectGroup': 'Gruppe auswaehlen', 'run.selectPartOfSpeech': 'Wortart auswaehlen', 'run.minRetention': 'Minimum %', 'run.maxRetention': 'Maximum %', 'run.removeFilter': 'Kriterium entfernen', 'history.runAgain': 'Erneut starten', 'history.criteriaCount': ({ count }) => `${count} Kriterien`,
  'card.primarySense': 'Primär',
  'run.cardPositionShort': ({ current, total }) => `Karte ${current} von ${total}`,
  'run.stabilityNow': ({ status, count }) => `${status} - ${count}% jetzt`,
  'outcome.hit': 'Treffer',
  'outcome.miss': 'Fehlversuch',
  'outcome.reveal': 'Aufdeckung',
  'outcome.typed': 'Getippter Treffer',
  'run.targetWord': 'Zielwort',
  'run.tapReveal': 'Zum Aufdecken tippen',
  'run.percentComplete': ({ count }) => `${count}% abgeschlossen`,
  'history.cardsCount': ({ count }) => `${count} Karten`,
  'app.opening': 'SimpleSpeak wird geöffnet...',
  'nav.backToBoard': 'Zurück zum Board', 'nav.openBoard': 'SimpleSpeak-Board öffnen', 'nav.searchWords': 'Wörter suchen', 'nav.findWord': 'Wort finden', 'nav.clearSearch': 'Suche löschen', 'nav.searchHint': 'Tippe, um es auf dem Board zu finden.', 'nav.noMatches': 'Keine passenden Wörter.', 'nav.openMoreViews': 'Weitere Ansichten öffnen', 'nav.more': 'Mehr', 'nav.secondaryViews': 'Weitere Ansichten', 'nav.history': 'Verlauf', 'nav.settings': 'Einstellungen',
  'board.aria': 'SimpleSpeak-Board', 'board.interactive': 'Interaktives Vokabel-Board', 'board.focusCurrent': 'Aktuelle Karte fokussieren',
  'run.configureAria': 'Lernlauf konfigurieren', 'run.studyRoute': 'Lernroute', 'run.chooseReturn': 'Rückkehr auswählen', 'run.closeConfig': 'Lauf-Konfiguration schließen', 'run.route': 'Route', 'run.dueNearby': 'Fällig + nah', 'run.oneScene': 'Eine Szene', 'run.allWords': 'Alle Wörter', 'run.customRoute': 'Eigene Route', 'run.chooseScene': 'Szene auswählen', 'run.cards': ({ count }) => `${count} Karten`, 'run.dueNow': ({ count }) => `${count} jetzt fällig`, 'run.startRoute': 'Route starten', 'run.openConfig': 'Lernlauf starten', 'run.activeAria': 'Aktiver Lernlauf', 'run.live': 'Live', 'run.cardPosition': ({ current, total, scene }) => `${scene} · Karte ${current} von ${total}`, 'run.score': 'Laufwertung', 'run.details': 'Details', 'run.leaveRun': 'Lauf verlassen und Route speichern', 'run.board': 'Board', 'run.backOpen': 'Antwort geöffnet — behalte die Szene und markiere die Rückkehr.', 'run.recall': 'Rufe das Zielwort ab und tippe es oder wähle ein Signal.', 'run.noImage': 'Noch kein Bild — nutze das Wort auf der fokussierten Karte als Hinweis.', 'run.continueMiss': 'Weiter · als Fehlversuch gezählt', 'run.typeTarget': 'Zielwort eingeben...', 'run.typeTargetAria': 'Zielwort eingeben', 'run.enter': 'Enter', 'run.iKnewIt': 'Ich wusste es', 'run.missed': 'Verpasst', 'run.reveal': 'Aufdecken', 'run.ready': ({ label }) => `${label} bereit. Eine Karte nach der anderen.`, 'run.routeLabel': ({ scene }) => `Route: ${scene}`, 'run.complete': 'Lauf abgeschlossen. Die Route ist etwas heller.', 'run.noCards': 'Keine Karten passen zu diesem Lauf. Versuche eine breitere Auswahl.',
  'history.eyebrow': 'Gedächtnisprotokoll', 'history.title': 'Verlauf, der dich zurückbringt.', 'history.description': 'Sieh die Signale über die Zeit. Eine ruhige Woche ist eine Lücke im Diagramm, kein Fehlerzustand.', 'history.savedRuns': ({ count }) => `${count} gespeicherte Läufe`, 'history.reviews': 'Wiederholungen', 'history.touchedCards': ({ count }) => `über ${count} bearbeitete Karten`, 'history.averageAccuracy': 'Durchschnittliche Genauigkeit', 'history.selfReport': 'Selbsteinschätzung + getippte Antworten', 'history.anchored': 'Verankert', 'history.boundedMeanings': ({ count }) => `von ${count} abgegrenzten Bedeutungen`, 'history.dueNow': 'Jetzt fällig', 'history.reentryPoints': 'Punkte für die Rückkehr', 'history.runPerformance': 'Laufleistung', 'history.signalReturns': 'Dein Signal über die letzten Rückkehrläufe', 'history.hits': 'Treffer', 'history.attempts': 'Versuche', 'history.stabilityWatch': 'Stabilitätsbeobachtung', 'history.cardsLosingAltitude': 'Karten verlieren an Höhe', 'history.retrievability': 'Abrufbarkeit', 'history.completeRun': 'Schließe einen Lauf ab, um Verfallsignale zu sehen.', 'history.openStability': ({ card, score }) => `Stabilität für ${card} öffnen, ${score}% abrufbar`, 'history.savedRunsHeading': 'Gespeicherte Läufe', 'history.recentPractice': 'Letzte Übungen, ohne Serienfalle', 'history.firstRun': 'Dein erster Lauf erscheint hier.', 'history.firstRunDescription': 'Der Eintrag speichert Treffer, Fehlversuche, Aufdeckungen, Dauer und deine Route.', 'history.signal': 'Signal', 'history.hitsSmall': 'Treffer', 'history.footer': 'SimpleSpeak erfindet keine verpassten Tage. Es nutzt die tatsächlich vergangene Zeit und gibt zurückkehrenden Lernenden eine begrenzte, nützliche nächste Karte.', 'history.chartAria': 'Diagramm zur Laufleistung', 'history.graphStart': 'Dein Diagramm beginnt mit dem ersten Lauf.', 'history.older': 'älter', 'history.recent': 'aktuell',
  'settings.controlRoom': 'Kontrollraum', 'settings.title': 'Mach das Board zu deinem.', 'settings.description': 'Alles bleibt auf diesem Gerät, außer der Bildanfrage, die du ausdrücklich an Google sendest.', 'settings.localSettings': 'lokale Einstellungen', 'settings.language': 'Oberflächensprache', 'settings.languageHelp': 'Wähle die Sprache für App-Steuerelemente, Erklärungen und Nachrichten.', 'settings.imageStudio': 'Bildstudio', 'settings.visualHook': 'Gib den Karten einen visuellen Anker.', 'settings.keyPresent': 'Schlüssel vorhanden', 'settings.keyNeeded': 'Schlüssel erforderlich', 'settings.imageLead': 'Füge einen Google-AI-API-Schlüssel ein, um quadratische Kartenbilder zu erzeugen. Ein gespeichertes Bild bleibt lokal; beim erneuten Erzeugen wird es ersetzt, und eine fehlgeschlagene Anfrage lässt das vorige Bild unverändert.', 'settings.apiKey': 'Google-AI-API-Schlüssel', 'settings.hideKey': 'API-Schlüssel verbergen', 'settings.showKey': 'API-Schlüssel anzeigen', 'settings.saveKey': 'Schlüssel speichern', 'settings.savedNoServer': 'In den Geräteeinstellungen gespeichert; kein SimpleSpeak-Server.', 'settings.modelId': 'Modell-ID', 'settings.modelEffort': 'Modellaufwand', 'settings.resolution': 'Auflösung', 'settings.aspectRatio': 'Seitenverhältnis', 'settings.square': '1:1 quadratisch', 'settings.imageNote': 'Gemini 3.1 Flash Image verwendet hier 512px, 1K oder 2K. 1K ist der ausgewogene Standard für Kartenbilder.', 'settings.innerPrompt': 'Interner Bild-Prompt', 'settings.characters': ({ count }) => `${count} Zeichen`, 'settings.promptSent': 'Der Prompt wird als Modellanweisung und danach mit der Kartenbeschreibung gesendet.', 'settings.resetDefault': 'Standard zurücksetzen', 'settings.learningRhythm': 'Lernrhythmus', 'settings.irregularUse': 'Unregelmäßiges Lernen möglich machen.', 'settings.rhythmLead': 'Der Zeitraum formt vorgeschlagene Ziele. Er bestraft keine Pause und erfindet keine verpassten Tage.', 'settings.overallHorizon': 'Gesamter Zeitraum', 'settings.dailyTarget': 'Tagesziel', 'settings.daysQuick': 'schnelle Runde', 'settings.daysSteady': 'ruhige Runde', 'settings.daysLong': 'lange Runde', 'settings.daysDeep': 'tiefes Board', 'settings.cardsGentle': 'sanft', 'settings.cardsBalanced': 'ausgewogen', 'settings.cardsFocused': 'fokussiert', 'settings.cardsDeep': 'intensiv', 'settings.returnWhen': 'Komm zurück, wenn du kannst.', 'settings.engine': 'Der Mechanismus nutzt die vergangene Zeit und die Leistung von heute. Er tut nicht so, als hättest du an freien Tagen gelernt.', 'settings.loadedPack': 'Geladenes Sprachpaket', 'settings.cards': ({ count }) => `${count} Karten`, 'settings.scenes': ({ count }) => `${count} Szenen`, 'settings.exportPack': 'Paket als JSON exportieren', 'settings.offlineDefault': 'Offline als Standard', 'settings.offlineDescription': 'Board, Notizen, Läufe, Wiederholungsverlauf und erzeugte Bilder funktionieren ohne Netzwerk. Nur die Erzeugung nutzt den API-Schlüssel.', 'settings.localState': 'lokaler Zustand', 'settings.localImages': 'lokale Bilder', 'settings.localHistory': 'lokaler Verlauf', 'settings.maintenance': 'Wartung', 'settings.startOver': 'Lernzustand neu beginnen', 'settings.keepImages': 'Bildeinstellungen behalten, Wiederholungsverlauf und gespeicherte Bilder löschen.', 'settings.resetLearning': 'Lernen zurücksetzen',
  'card.wordCard': ({ sense }) => `Wortkarte - ${sense}`, 'card.closeDetails': 'Kartendetails schließen', 'card.visualAlt': ({ card }) => `Bild für ${card}`, 'card.noImage': 'Noch kein Bild erzeugt', 'card.selectedMeaning': ({ partOfSpeech }) => `Ausgewählte abgegrenzte Bedeutung - ${partOfSpeech}`, 'card.stabilityPanel': 'Stabilitätsbereich', 'card.savedImage': 'Gespeichertes Bild - zum Ersetzen neu erzeugen', 'card.frontWord': 'Bis zur Bilderzeugung wird vorne das Wort verwendet', 'card.visualPrompt': 'Bild-Prompt', 'card.promptPlaceholder': 'Beschreibe den visuellen Anker für dieses Wort...', 'card.generating': 'Wird erzeugt...', 'card.regenerate': 'Bild neu erzeugen', 'card.generate': 'Quadratisches Bild erzeugen', 'card.generationHelp': 'Die Anfrage enthält den internen Prompt, diese Beschreibung, das Zielwort und die ausgewählte Bedeutung. Eine fehlgeschlagene Anfrage löscht das gespeicherte Bild nicht.', 'card.mnemonic': 'Eselsbrückennotiz', 'card.private': 'privat für diese Karte', 'card.notePlaceholder': 'Schreibe eine private Eselsbrücke für diese Bedeutung...', 'card.saveNote': 'Notiz speichern', 'card.context': 'Kontext', 'card.packContent': 'Paketinhalt', 'card.openStability': 'Wortstabilität öffnen', 'card.reviewHalfLife': ({ reviews, days }) => `${reviews} Wiederholungen - ${days} Tage Halbwertszeit`, 'card.noMnemonic': 'Noch keine Eselsbrückennotiz.',
  'stability.title': 'Wortstabilität', 'stability.close': 'Stabilitätsbereich schließen', 'stability.retrievableNow': 'jetzt abrufbar', 'stability.firstSignal': 'Die erste Rückkehr gibt diesem Wort sein erstes nützliches Signal.', 'stability.comfortableToday': 'Dieses Wort wird heute wahrscheinlich gut zurückkommen.', 'stability.kindReturn': 'Dieses Wort bittet um eine freundliche, rechtzeitige Rückkehr.', 'stability.stability': 'Stabilität', 'stability.days': ({ count }) => `${count} Tage`, 'stability.nextDue': 'Nächste Fälligkeit', 'stability.reviews': 'Wiederholungen', 'stability.predicted': 'Vorhergesagter Abruf', 'stability.decayView': 'Verfallsansicht', 'stability.graphAria': 'Diagramm zum vorhergesagten Stabilitätsverfall des Wortes', 'stability.now': 'jetzt', 'stability.in34Days': '+34 Tage', 'stability.recentSignals': 'Letzte Signale', 'stability.saved': ({ count }) => `${count} gespeichert`, 'stability.noReviews': 'Noch keine Wiederholungen. Das erste ehrliche Signal startet die Kurve.', 'stability.typedHit': 'Getippter Treffer', 'stability.eventDelta': ({ before, after }) => `${before} bis ${after} Tage`, 'stability.principle': 'Intervalle sind Vorschläge. Eine lange Pause schreibt den Verlauf nicht um; die nächste Wiederholung liest, was jetzt passiert ist, und kalibriert neu.',
  'status.new': 'Neu', 'status.emerging': 'Im Aufbau', 'status.familiar': 'Vertraut', 'status.anchored': 'Verankert', 'format.notReviewed': 'Noch nicht wiederholt', 'format.today': 'Heute', 'format.tomorrow': 'Morgen', 'format.yesterday': 'Gestern', 'format.inDays': ({ count }) => `In ${count} Tagen`, 'format.daysAgo': ({ count }) => `Vor ${count} Tagen`,
  'notice.keySaved': 'Bildschlüssel auf diesem Gerät gespeichert.', 'notice.keyRemoved': 'Bildschlüssel entfernt.', 'notice.addKey': 'Füge in den Einstellungen einen Google-AI-API-Schlüssel hinzu, bevor du ein Bild erzeugst.', 'notice.imageSaved': ({ card }) => `Bild für ${card} auf diesem Gerät gespeichert.`, 'notice.unknownImageError': 'Unbekannter Fehler bei der Bilderzeugung.', 'notice.imageNotChanged': ({ message }) => `Bild nicht geändert: ${message}`, 'notice.noteSaved': 'Eselsbrückennotiz gespeichert.', 'notice.confirmReset': 'Den gesamten Wiederholungsverlauf und die erzeugten Bilder des Starterpakets zurücksetzen?', 'notice.resetDone': 'Das Board ist wieder frisch. Deine Bildeinstellungen bleiben gespeichert.',
  'image.quickLight': 'schnell und leicht', 'image.standardRecommended': 'Standard (empfohlen)', 'image.detailedHeavier': 'detailliert und schwerer', 'image.highEffort': 'Hoch - mehr Kompositionsdenken', 'image.minimalEffort': 'Minimal - schnelle Kartenbilder',
}

export const DEFAULT_LOCALE: SupportedLocale = 'en-US'

function isSupportedLocale(value: unknown): value is SupportedLocale {
  return typeof value === 'string' && (supportedLocales as readonly string[]).includes(value)
}

export function normalizeLocale(value: unknown): SupportedLocale {
  return isSupportedLocale(value) ? value : DEFAULT_LOCALE
}

export function getBrowserLocale(): SupportedLocale {
  if (typeof navigator === 'undefined') return DEFAULT_LOCALE
  const language = navigator.language.toLowerCase()
  if (language.startsWith('pt')) return 'pt-BR'
  if (language.startsWith('de')) return 'de-DE'
  return DEFAULT_LOCALE
}

const catalogs: Record<SupportedLocale, MessageCatalog> = { 'en-US': english, 'pt-BR': portuguese, 'de-DE': german }

export function translate(locale: SupportedLocale, key: string, values: Record<string, string | number> = {}): string {
  const message = catalogs[locale][key] ?? english[key] ?? key
  const text = typeof message === 'function' ? message(values) : message
  return text.replace(/\{\{(\w+)\}\}/g, (_, name: string) => String(values[name] ?? ''))
}

export function useI18n(locale: SupportedLocale): { locale: SupportedLocale; t: (key: string, values?: Record<string, string | number>) => string } {
  return useMemo(() => ({ locale, t: (key: string, values?: Record<string, string | number>) => translate(locale, key, values) }), [locale])
}

export function localeName(locale: SupportedLocale): string {
  return localeOptions.find((option) => option.code === locale)?.nativeLabel ?? locale
}

export function runSpeedUnit(locale: SupportedLocale): string {
  if (locale === 'pt-BR') return 'PPM'
  if (locale === 'de-DE') return 'Wörter/Min.'
  return 'WPM'
}

export function runSpeedAriaLabel(locale: SupportedLocale): string {
  if (locale === 'pt-BR') return 'Ritmo atual de acertos corretos'
  if (locale === 'de-DE') return 'Aktuelles Tempo richtiger Antworten'
  return 'Current correct-answer pace'
}

export function runLabelForLocale(preset: 'scene' | 'due-nearby' | 'all' | 'custom', sceneName: string | null, locale: SupportedLocale): string {
  if (preset === 'scene' && sceneName) return translate(locale, 'run.routeLabel', { scene: sceneName })
  if (preset === 'due-nearby') return translate(locale, 'run.dueNearby')
  if (preset === 'all') return translate(locale, 'run.allWords')
  return translate(locale, 'run.customRoute')
}

export function messageCatalogKeys(): string[] {
  return Object.keys(english)
}
