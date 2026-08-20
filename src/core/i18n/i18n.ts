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
  'history.acquired': 'Acquired',
  'history.acquiredThreshold': ({ count }) => `${count}% retrievability`,
  'history.acquiredDescription': ({ count }) => `At or above ${count}% retrievability`,
  'history.dueBand': 'Due',
  'history.dueBandDescription': ({ min, max }) => `${min}% to ${max}% retrievability`,
  'history.needsReturn': 'Needs a return',
  'history.needsReturnDescription': ({ lost, new: notStarted }) => `${lost} lost · ${notStarted} not tried`,
  'history.wordCount': ({ count }) => `of ${count} Cards`,
  'history.noWords': 'No Cards in this group yet.',
  'history.lost': 'lost',
  'history.notStarted': 'not tried',
  'history.openRetention': ({ card, score }) => `Open ${card}, ${score}`,
  'app.opening': 'Opening memolingo...',
  'nav.backToBoard': 'Back to board',
  'nav.openBoard': 'Open memolingo board',
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

  'board.aria': 'memolingo board',
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
  'run.end': 'End run',
  'run.endAria': 'End this run and save it as unfinished',
  'run.ended': 'Run saved as unfinished. Answered Cards still count toward retention.',
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
  'run.setupDescription': 'Choose a route and card count for this return.',
  'run.duration': 'Duration',
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
  'history.openStability': ({ card, score }) => `Open details for ${card}, ${score}% retrievable`,
  'history.savedRunsHeading': 'Saved runs',
  'history.recentPractice': 'Recent practice, without a streak trap',
  'history.firstRun': 'Your first run will appear here.',
  'history.firstRunDescription': 'The record stores hits, misses, reveals, duration, and the route you took.',
  'history.signal': 'signal',
  'history.hitsSmall': 'hits',
  'history.footer': 'memolingo does not invent missed days. It uses the time that really passed, then gives a returning learner a bounded, useful next Card.',
  'history.chartAria': 'Run performance chart',
  'history.graphStart': 'Your graph starts with your first run.',
  'history.older': 'older',
  'history.recent': 'recent',
  'history.runAgain': 'Run again',
  'history.criteriaCount': ({ count }) => `${count} criteria`,
  'history.unfinished': 'unfinished',
  'history.completed': 'completed',

  'settings.title': 'Make the board yours.',
  'settings.language': 'UI language',
  'settings.offlineDefault': 'Offline by default',
  'settings.startOver': 'Start the learning state over',
  'settings.resetLearning': 'Reset learning',

  'card.closeDetails': 'Close card details',
  'card.visualAlt': ({ card }) => `${card} visual`,
  'card.mnemonic': 'Mnemonic note',
  'card.notePlaceholder': 'Write a private mnemonic for this meaning...',
  'card.saveNote': 'Save note',

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

  'notice.noteSaved': 'Mnemonic note saved.',
  'notice.confirmReset': 'Reset all review history for the starter pack?',
  'notice.resetDone': 'The board is fresh again. Your bundled word images remain available.',
}

english['run.routePresets'] = 'Route presets'
english['run.send'] = 'Send answer'
english['run.hit'] = 'Hit'
english['run.miss'] = 'Miss'
english['run.review'] = 'Review'
english['run.streak'] = 'Streak'
english['run.addMode'] = 'Filter to matches'
english['notification.title'] = 'Notifications'
english['notification.dismiss'] = 'Dismiss notification'

const portuguese: MessageCatalog = {
  'run.end': 'Encerrar sessão', 'run.endAria': 'Encerrar esta sessão e salvar como incompleta', 'run.ended': 'Sessão salva como incompleta. Os cartões respondidos continuam contando para a retenção.', 'history.unfinished': 'incompleta', 'history.completed': 'concluída',
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
  'app.opening': 'Abrindo o memolingo...',
  'nav.backToBoard': 'Voltar ao quadro', 'nav.openBoard': 'Abrir quadro do memolingo', 'nav.searchWords': 'Pesquisar palavras', 'nav.findWord': 'Encontrar uma palavra', 'nav.clearSearch': 'Limpar pesquisa', 'nav.searchHint': 'Digite para encontrar no quadro.', 'nav.noMatches': 'Nenhuma palavra correspondente.', 'nav.openMoreViews': 'Abrir mais telas', 'nav.more': 'Mais', 'nav.secondaryViews': 'Telas secundárias', 'nav.history': 'Histórico', 'nav.settings': 'Configurações',
  'board.aria': 'Quadro do memolingo', 'board.interactive': 'Quadro de vocabulário interativo', 'board.focusCurrent': 'Focar cartão atual',
  'run.configureAria': 'Configurar uma sessão de estudo', 'run.studyRoute': 'Rota de estudo', 'run.chooseReturn': 'Escolha um retorno', 'run.closeConfig': 'Fechar configuração da sessão', 'run.route': 'Rota', 'run.dueNearby': 'Pendentes + próximas', 'run.oneScene': 'Uma cena', 'run.allWords': 'Todas as palavras', 'run.customRoute': 'Rota personalizada', 'run.chooseScene': 'Escolha uma cena', 'run.cards': ({ count }) => `${count} cartões`, 'run.dueNow': ({ count }) => `${count} pendentes agora`, 'run.startRoute': 'Começar rota', 'run.openConfig': 'Iniciar uma sessão de estudo', 'run.activeAria': 'Sessão de estudo ativa', 'run.live': 'Ao vivo', 'run.cardPosition': ({ current, total, scene }) => `${scene} · Cartão ${current} de ${total}`, 'run.score': 'Pontuação da sessão', 'run.details': 'Detalhes', 'run.leaveRun': 'Sair da sessão e manter a rota salva', 'run.board': 'Quadro', 'run.backOpen': 'Resposta aberta — mantenha a cena e marque o retorno.', 'run.recall': 'Lembre-se do termo e digite ou escolha um sinal.', 'run.noImage': 'Ainda sem imagem — use a palavra do cartão em foco como pista.', 'run.continueMiss': 'Continuar · contado como erro', 'run.typeTarget': 'Digite a palavra-alvo...', 'run.typeTargetAria': 'Digite a palavra-alvo', 'run.enter': 'Enter', 'run.iKnewIt': 'Eu sabia', 'run.missed': 'Errei', 'run.reveal': 'Revelar', 'run.ready': ({ label }) => `${label} pronto. Um cartão por vez.`, 'run.routeLabel': ({ scene }) => `Rota: ${scene}`, 'run.complete': 'Sessão concluída. A rota está um pouco mais clara.', 'run.noCards': 'Nenhum cartão corresponde a esta sessão. Tente uma opção mais ampla.',
  'history.eyebrow': 'Registro de memória', 'history.title': 'Um histórico que ajuda você a voltar.', 'history.description': 'Veja os sinais ao longo do tempo. Uma semana tranquila é uma lacuna no gráfico, não uma falha.', 'history.savedRuns': ({ count }) => `${count} sessões salvas`, 'history.reviews': 'Revisões', 'history.touchedCards': ({ count }) => `em ${count} cartões visitados`, 'history.averageAccuracy': 'Precisão média', 'history.selfReport': 'autoavaliação + respostas digitadas', 'history.anchored': 'Ancorados', 'history.boundedMeanings': ({ count }) => `de ${count} significados delimitados`, 'history.dueNow': 'Pendentes agora', 'history.reentryPoints': 'pontos de retorno', 'history.runPerformance': 'Desempenho das sessões', 'history.signalReturns': 'Seu sinal nos últimos retornos', 'history.hits': 'acertos', 'history.attempts': 'tentativas', 'history.stabilityWatch': 'Acompanhamento da estabilidade', 'history.cardsLosingAltitude': 'Cartões perdendo força', 'history.retrievability': 'recuperabilidade', 'history.completeRun': 'Conclua uma sessão para começar a ver sinais de perda.', 'history.openStability': ({ card, score }) => `Abrir estabilidade de ${card}, ${score}% recuperável`, 'history.savedRunsHeading': 'Sessões salvas', 'history.recentPractice': 'Prática recente, sem armadilha de sequência', 'history.firstRun': 'Sua primeira sessão aparecerá aqui.', 'history.firstRunDescription': 'O registro guarda acertos, erros, revelações, duração e a rota percorrida.', 'history.signal': 'sinal', 'history.hitsSmall': 'acertos', 'history.footer': 'O memolingo não inventa dias perdidos. Ele usa o tempo que realmente passou e oferece ao aprendiz que retorna um próximo cartão útil e limitado.', 'history.chartAria': 'Gráfico de desempenho das sessões', 'history.graphStart': 'Seu gráfico começa com a primeira sessão.', 'history.older': 'mais antigo', 'history.recent': 'recente',
  'settings.title': 'Faça o quadro ser seu.', 'settings.language': 'Idioma da interface', 'settings.offlineDefault': 'Offline por padrão', 'settings.startOver': 'Recomeçar o estado de aprendizagem', 'settings.resetLearning': 'Redefinir aprendizagem',
  'card.closeDetails': 'Fechar detalhes do cartão', 'card.visualAlt': ({ card }) => `Visual de ${card}`, 'card.mnemonic': 'Nota mnemônica', 'card.notePlaceholder': 'Escreva uma mnemônica privada para este significado...', 'card.saveNote': 'Salvar nota', 'stability.title': 'Estabilidade da palavra', 'stability.close': 'Fechar painel de estabilidade', 'stability.retrievableNow': 'recuperável agora', 'stability.firstSignal': 'O primeiro retorno dará a esta palavra seu primeiro sinal útil.', 'stability.comfortableToday': 'É provável que esta palavra volte com facilidade hoje.', 'stability.kindReturn': 'Esta palavra pede um retorno gentil e oportuno.', 'stability.stability': 'Estabilidade', 'stability.days': ({ count }) => `${count} dias`, 'stability.nextDue': 'Próxima revisão', 'stability.reviews': 'Revisões', 'stability.predicted': 'Recuperação prevista', 'stability.decayView': 'visão de perda', 'stability.graphAria': 'Gráfico previsto de perda da estabilidade da palavra', 'stability.now': 'agora', 'stability.in34Days': '+34 dias', 'stability.recentSignals': 'Sinais recentes', 'stability.saved': ({ count }) => `${count} salvos`, 'stability.noReviews': 'Ainda não há revisões. O primeiro sinal honesto inicia a curva.', 'stability.typedHit': 'Acerto digitado', 'stability.eventDelta': ({ before, after }) => `${before} a ${after} dias`, 'stability.principle': 'Intervalos são sugestões. Uma pausa longa não reescreve o histórico; a próxima revisão lê o que aconteceu agora e recalibra.',
  'status.new': 'Novo', 'status.emerging': 'Surgindo', 'status.familiar': 'Familiar', 'status.anchored': 'Ancorado', 'format.notReviewed': 'Ainda não revisado', 'format.today': 'Hoje', 'format.tomorrow': 'Amanhã', 'format.yesterday': 'Ontem', 'format.inDays': ({ count }) => `Em ${count} dias`, 'format.daysAgo': ({ count }) => `${count} dias atrás`,
  'notice.noteSaved': 'Nota mnemônica salva.', 'notice.confirmReset': 'Redefinir todo o histórico de revisões do pacote inicial?', 'notice.resetDone': 'O quadro está novo outra vez. Suas imagens nativas continuam disponíveis.',
}

const german: MessageCatalog = {
  'run.end': 'Lauf beenden', 'run.endAria': 'Diesen Lauf beenden und als unvollständig speichern', 'run.ended': 'Lauf als unvollständig gespeichert. Beantwortete Karten zählen weiter für die Retention.', 'history.unfinished': 'unvollständig', 'history.completed': 'abgeschlossen',
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
  'app.opening': 'memolingo wird geöffnet...',
  'nav.backToBoard': 'Zurück zum Board', 'nav.openBoard': 'memolingo-Board öffnen', 'nav.searchWords': 'Wörter suchen', 'nav.findWord': 'Wort finden', 'nav.clearSearch': 'Suche löschen', 'nav.searchHint': 'Tippe, um es auf dem Board zu finden.', 'nav.noMatches': 'Keine passenden Wörter.', 'nav.openMoreViews': 'Weitere Ansichten öffnen', 'nav.more': 'Mehr', 'nav.secondaryViews': 'Weitere Ansichten', 'nav.history': 'Verlauf', 'nav.settings': 'Einstellungen',
  'board.aria': 'memolingo-Board', 'board.interactive': 'Interaktives Vokabel-Board', 'board.focusCurrent': 'Aktuelle Karte fokussieren',
  'run.configureAria': 'Lernlauf konfigurieren', 'run.studyRoute': 'Lernroute', 'run.chooseReturn': 'Rückkehr auswählen', 'run.closeConfig': 'Lauf-Konfiguration schließen', 'run.route': 'Route', 'run.dueNearby': 'Fällig + nah', 'run.oneScene': 'Eine Szene', 'run.allWords': 'Alle Wörter', 'run.customRoute': 'Eigene Route', 'run.chooseScene': 'Szene auswählen', 'run.cards': ({ count }) => `${count} Karten`, 'run.dueNow': ({ count }) => `${count} jetzt fällig`, 'run.startRoute': 'Route starten', 'run.openConfig': 'Lernlauf starten', 'run.activeAria': 'Aktiver Lernlauf', 'run.live': 'Live', 'run.cardPosition': ({ current, total, scene }) => `${scene} · Karte ${current} von ${total}`, 'run.score': 'Laufwertung', 'run.details': 'Details', 'run.leaveRun': 'Lauf verlassen und Route speichern', 'run.board': 'Board', 'run.backOpen': 'Antwort geöffnet — behalte die Szene und markiere die Rückkehr.', 'run.recall': 'Rufe das Zielwort ab und tippe es oder wähle ein Signal.', 'run.noImage': 'Noch kein Bild — nutze das Wort auf der fokussierten Karte als Hinweis.', 'run.continueMiss': 'Weiter · als Fehlversuch gezählt', 'run.typeTarget': 'Zielwort eingeben...', 'run.typeTargetAria': 'Zielwort eingeben', 'run.enter': 'Enter', 'run.iKnewIt': 'Ich wusste es', 'run.missed': 'Verpasst', 'run.reveal': 'Aufdecken', 'run.ready': ({ label }) => `${label} bereit. Eine Karte nach der anderen.`, 'run.routeLabel': ({ scene }) => `Route: ${scene}`, 'run.complete': 'Lauf abgeschlossen. Die Route ist etwas heller.', 'run.noCards': 'Keine Karten passen zu diesem Lauf. Versuche eine breitere Auswahl.',
  'history.eyebrow': 'Gedächtnisprotokoll', 'history.title': 'Verlauf, der dich zurückbringt.', 'history.description': 'Sieh die Signale über die Zeit. Eine ruhige Woche ist eine Lücke im Diagramm, kein Fehlerzustand.', 'history.savedRuns': ({ count }) => `${count} gespeicherte Läufe`, 'history.reviews': 'Wiederholungen', 'history.touchedCards': ({ count }) => `über ${count} bearbeitete Karten`, 'history.averageAccuracy': 'Durchschnittliche Genauigkeit', 'history.selfReport': 'Selbsteinschätzung + getippte Antworten', 'history.anchored': 'Verankert', 'history.boundedMeanings': ({ count }) => `von ${count} abgegrenzten Bedeutungen`, 'history.dueNow': 'Jetzt fällig', 'history.reentryPoints': 'Punkte für die Rückkehr', 'history.runPerformance': 'Laufleistung', 'history.signalReturns': 'Dein Signal über die letzten Rückkehrläufe', 'history.hits': 'Treffer', 'history.attempts': 'Versuche', 'history.stabilityWatch': 'Stabilitätsbeobachtung', 'history.cardsLosingAltitude': 'Karten verlieren an Höhe', 'history.retrievability': 'Abrufbarkeit', 'history.completeRun': 'Schließe einen Lauf ab, um Verfallsignale zu sehen.', 'history.openStability': ({ card, score }) => `Stabilität für ${card} öffnen, ${score}% abrufbar`, 'history.savedRunsHeading': 'Gespeicherte Läufe', 'history.recentPractice': 'Letzte Übungen, ohne Serienfalle', 'history.firstRun': 'Dein erster Lauf erscheint hier.', 'history.firstRunDescription': 'Der Eintrag speichert Treffer, Fehlversuche, Aufdeckungen, Dauer und deine Route.', 'history.signal': 'Signal', 'history.hitsSmall': 'Treffer', 'history.footer': 'memolingo erfindet keine verpassten Tage. Es nutzt die tatsächlich vergangene Zeit und gibt zurückkehrenden Lernenden eine begrenzte, nützliche nächste Karte.', 'history.chartAria': 'Diagramm zur Laufleistung', 'history.graphStart': 'Dein Diagramm beginnt mit dem ersten Lauf.', 'history.older': 'älter', 'history.recent': 'aktuell',
  'settings.title': 'Mach das Board zu deinem.', 'settings.language': 'Oberflächensprache', 'settings.offlineDefault': 'Offline als Standard', 'settings.startOver': 'Lernzustand neu beginnen', 'settings.resetLearning': 'Lernen zurücksetzen',
  'card.closeDetails': 'Kartendetails schließen', 'card.visualAlt': ({ card }) => `Bild für ${card}`, 'card.mnemonic': 'Eselsbrückennotiz', 'card.notePlaceholder': 'Schreibe eine private Eselsbrücke für diese Bedeutung...', 'card.saveNote': 'Notiz speichern', 'stability.title': 'Wortstabilität', 'stability.close': 'Stabilitätsbereich schließen', 'stability.retrievableNow': 'jetzt abrufbar', 'stability.firstSignal': 'Die erste Rückkehr gibt diesem Wort sein erstes nützliches Signal.', 'stability.comfortableToday': 'Dieses Wort wird heute wahrscheinlich gut zurückkommen.', 'stability.kindReturn': 'Dieses Wort bittet um eine freundliche, rechtzeitige Rückkehr.', 'stability.stability': 'Stabilität', 'stability.days': ({ count }) => `${count} Tage`, 'stability.nextDue': 'Nächste Fälligkeit', 'stability.reviews': 'Wiederholungen', 'stability.predicted': 'Vorhergesagter Abruf', 'stability.decayView': 'Verfallsansicht', 'stability.graphAria': 'Diagramm zum vorhergesagten Stabilitätsverfall des Wortes', 'stability.now': 'jetzt', 'stability.in34Days': '+34 Tage', 'stability.recentSignals': 'Letzte Signale', 'stability.saved': ({ count }) => `${count} gespeichert`, 'stability.noReviews': 'Noch keine Wiederholungen. Das erste ehrliche Signal startet die Kurve.', 'stability.typedHit': 'Getippter Treffer', 'stability.eventDelta': ({ before, after }) => `${before} bis ${after} Tage`, 'stability.principle': 'Intervalle sind Vorschläge. Eine lange Pause schreibt den Verlauf nicht um; die nächste Wiederholung liest, was jetzt passiert ist, und kalibriert neu.',
  'status.new': 'Neu', 'status.emerging': 'Im Aufbau', 'status.familiar': 'Vertraut', 'status.anchored': 'Verankert', 'format.notReviewed': 'Noch nicht wiederholt', 'format.today': 'Heute', 'format.tomorrow': 'Morgen', 'format.yesterday': 'Gestern', 'format.inDays': ({ count }) => `In ${count} Tagen`, 'format.daysAgo': ({ count }) => `Vor ${count} Tagen`,
  'notice.noteSaved': 'Eselsbrückennotiz gespeichert.', 'notice.confirmReset': 'Den gesamten Wiederholungsverlauf des Starterpakets zurücksetzen?', 'notice.resetDone': 'Das Board ist wieder frisch. Deine gebündelten Wortbilder bleiben verfügbar.',
}

portuguese['run.routePresets'] = 'Predefinições de rota'
portuguese['run.send'] = 'Enviar resposta'
portuguese['run.hit'] = 'Acerto'
portuguese['run.miss'] = 'Erro'
portuguese['run.review'] = 'Revisar'
portuguese['run.streak'] = 'Sequência'
portuguese['run.addMode'] = 'Filtrar correspondências'
german['run.routePresets'] = 'Routenvorlagen'
german['run.send'] = 'Antwort senden'
german['run.hit'] = 'Treffer'
german['run.miss'] = 'Fehler'
german['run.review'] = 'Review'
german['run.streak'] = 'Serie'
german['run.addMode'] = 'Treffer filtern'

portuguese['notification.title'] = 'Notificacoes'
portuguese['notification.dismiss'] = 'Fechar notificacao'
german['notification.title'] = 'Benachrichtigungen'
german['notification.dismiss'] = 'Benachrichtigung schliessen'

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

Object.assign(catalogs['pt-BR'], {
  'run.setupDescription': 'Escolha uma rota e uma quantidade de cartões para este retorno.',
  'run.duration': 'Duração',
  'notice.confirmReset': 'Redefinir todo o histórico de revisões do pacote inicial?',
  'notice.resetDone': 'O quadro está novo outra vez. Suas imagens nativas continuam disponíveis.',
  'history.openStability': ({ card, score }: { card: string; score: string | number }) => `Abrir detalhes de ${card}, ${score}% recuperável`,
})
Object.assign(catalogs['de-DE'], {
  'run.setupDescription': 'Wähle eine Route und Kartenanzahl für diese Rückkehr.',
  'run.duration': 'Dauer',
  'notice.confirmReset': 'Den gesamten Wiederholungsverlauf des Starterpakets zurücksetzen?',
  'notice.resetDone': 'Das Board ist wieder frisch. Deine gebündelten Wortbilder bleiben verfügbar.',
  'history.openStability': ({ card, score }: { card: string; score: string | number }) => `Details für ${card} öffnen, ${score}% abrufbar`,
})

Object.assign(catalogs['pt-BR'], {
  'history.description': 'Numeros uteis para voltar: estado atual das palavras, precisao e sessoes recentes.',
  'history.acquired': 'Adquiridas',
  'history.acquiredThreshold': ({ count }: { count: string | number }) => `${count}% de recuperabilidade`,
  'history.acquiredDescription': ({ count }: { count: string | number }) => `Com pelo menos ${count}% de recuperabilidade`,
  'history.dueBand': 'Pendentes',
  'history.dueBandDescription': ({ min, max }: { min: string | number; max: string | number }) => `${min}% a ${max}% de recuperabilidade`,
  'history.needsReturn': 'Pedem retorno',
  'history.needsReturnDescription': ({ lost, new: notStarted }: { lost: string | number; new: string | number }) => `${lost} perdidas · ${notStarted} nao testadas`,
  'history.wordCount': ({ count }: { count: string | number }) => `de ${count} cartoes`,
  'history.noWords': 'Nenhum cartao neste grupo ainda.',
  'history.lost': 'perdida',
  'history.notStarted': 'nao testada',
  'history.openRetention': ({ card, score }: { card: string; score: string | number }) => `Abrir ${card}, ${score}`,
})

Object.assign(catalogs['de-DE'], {
  'history.description': 'Nutzliche Zahlen fur die Ruckkehr: aktueller Wortstatus, Genauigkeit und letzte Laufe.',
  'history.acquired': 'Aufgebaut',
  'history.acquiredThreshold': ({ count }: { count: string | number }) => `${count}% Abrufbarkeit`,
  'history.acquiredDescription': ({ count }: { count: string | number }) => `Ab ${count}% Abrufbarkeit`,
  'history.dueBand': 'Fallig',
  'history.dueBandDescription': ({ min, max }: { min: string | number; max: string | number }) => `${min}% bis ${max}% Abrufbarkeit`,
  'history.needsReturn': 'Brauchen Ruckkehr',
  'history.needsReturnDescription': ({ lost, new: notStarted }: { lost: string | number; new: string | number }) => `${lost} verloren · ${notStarted} noch nicht getestet`,
  'history.wordCount': ({ count }: { count: string | number }) => `von ${count} Karten`,
  'history.noWords': 'Noch keine Karten in dieser Gruppe.',
  'history.lost': 'verloren',
  'history.notStarted': 'nicht getestet',
  'history.openRetention': ({ card, score }: { card: string; score: string | number }) => `${card} öffnen, ${score}`,
})

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

export function runHitRateUnit(): string {
  return 'HPM'
}

export function runHitRateAriaLabel(locale: SupportedLocale): string {
  if (locale === 'pt-BR') return 'Acertos por minuto atuais'
  if (locale === 'de-DE') return 'Aktuelle Treffer pro Minute'
  return 'Current hits per minute'
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
