const $ = s => document.querySelector(s);
let declaration, requestId, savedDeclaration;
$('#withdrawalForm').addEventListener('submit', e => {
  e.preventDefault();
  declaration = {
    name: $('#withdrawalName').value.trim(),
    email: $('#withdrawalEmail').value.trim(),
    order: $('#withdrawalOrder').value.trim()
  };
  if (!declaration.name || !declaration.order) return;
  $('#withdrawalSummary').textContent = summary(declaration);
  $('#withdrawalForm').hidden = true;
  $('#withdrawalReview').hidden = false;
});
function summary(d) {
  return 'Je notifie à DB Digital ma rétractation de l’achat Bibi Quizz.\n\nNom et prénom : ' + d.name + '\nE-mail : ' + d.email + '\nCommande : ' + d.order;
}
$('#editWithdrawal').addEventListener('click', () => {
  $('#withdrawalReview').hidden = true;
  $('#withdrawalForm').hidden = false;
});
$('#confirmWithdrawal').addEventListener('click', async () => {
  const button = $('#confirmWithdrawal');
  button.disabled = true;
  $('#editWithdrawal').disabled = true;
  $('#withdrawalStatus').textContent = 'Transmission de votre déclaration…';
  try {
    const [{ ready, db, uid }, { doc, runTransaction, serverTimestamp, getDocFromServer }] = await Promise.all([
      import('../js/firebase.js'),
      import('https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js')
    ]);
    await ready();
    const content = JSON.stringify(declaration);
    if (!requestId || savedDeclaration !== content) {
      requestId = crypto.randomUUID();
      savedDeclaration = content;
    }
    const ref = doc(db, 'withdrawalRequests', requestId);
    await runTransaction(db, async tx => {
      const old = await tx.get(ref);
      if (!old.exists()) tx.set(ref, { ...declaration, uid: uid(), createdAt: serverTimestamp() });
    });
    const received = await getDocFromServer(ref);
    const date = received.data()?.createdAt?.toDate();
    if (!date) throw new Error('Réception non confirmée');
    const receipt = 'DB Digital — Accusé de réception de rétractation\nRéférence : ' + requestId
      + '\nReçue le : ' + date.toISOString() + '\n\n' + summary(received.data())
      + '\n\nLa demande a été enregistrée. Le remboursement sera traité après identification de la commande.';
    const link = $('#withdrawalReceipt');
    link.href = URL.createObjectURL(new Blob([receipt], { type: 'text/plain;charset=utf-8' }));
    link.download = 'bibi-quizz-retractation-' + requestId + '.txt';
    link.hidden = false;
    $('#withdrawalReview').hidden = true;
    $('#withdrawalStatus').textContent = 'Votre déclaration a été reçue le ' + date.toLocaleString('fr-FR') + '. Téléchargez et conservez votre accusé de réception.';
  } catch {
    $('#withdrawalStatus').textContent = 'La réception n’a pas pu être confirmée. Réessayez ou envoyez votre déclaration à dbartisandigital@gmail.com. Ne considérez pas ce message comme une confirmation de dépôt.';
    button.disabled = false;
    $('#editWithdrawal').disabled = false;
  }
});
