export function eventOptions(config = {}) {
  const event = config.event || 'standard';
  if (!['standard', 'noel'].includes(event)) throw new Error('Événement inconnu');
  if (event === 'standard') return { event, answerSeconds: 12, roundSeconds: config.reponses === 'clavier' ? 60 : 40 };
  const answerSeconds = Number(config.answerSeconds ?? 12);
  const roundSeconds = Number(config.roundSeconds ?? 45);
  if (![8,12,20].includes(answerSeconds) || ![30,45,60,90].includes(roundSeconds)) throw new Error('Durée non autorisée');
  return { event, answerSeconds, roundSeconds };
}
