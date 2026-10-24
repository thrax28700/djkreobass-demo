/*
  DJ KREOBASS — Génération PDF des devis/factures
  ─────────────────────────────────────
  Script partagé entre l'espace admin (admin.js) et la page publique
  d'acceptation (devis-view.js). Nécessite jsPDF + jspdf-autotable
  (chargés en CDN avant ce fichier) et window.BUSINESS_INFO.

  Usage : window.generateQuotePDF(quote) → déclenche le téléchargement.
*/
(function () {
  const EVENT_LABELS = {
    wedding: 'Mariage',
    birthday: 'Anniversaire',
    corporate: 'Séminaire / Entreprise',
    bar: 'Soirée Bar / Guinguette',
    other: 'Autre',
  };

  function fmtEUR(n) {
    return (Number(n) || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
  }

  function fmtDate(d) {
    if (!d) return '—';
    const [y, m, day] = String(d).split('-');
    if (!y || !m || !day) return d;
    return `${day}/${m}/${y}`;
  }

  window.generateQuotePDF = function generateQuotePDF(quote) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const info = window.BUSINESS_INFO || {};
    const isFacture = quote.type === 'facture';
    const docLabel = isFacture ? 'FACTURE' : 'DEVIS';
    const goldRGB = [212, 175, 55];
    const darkRGB = [20, 18, 12];
    const grayRGB = [110, 105, 90];

    /* ── En-tête ── */
    doc.setFillColor(...darkRGB);
    doc.rect(0, 0, 210, 34, 'F');
    doc.setTextColor(...goldRGB);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('DJ KREOBASS', 14, 16);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(230, 224, 200);
    doc.text('Animateur — Centre-Val de Loire', 14, 23);
    doc.text(`${info.phone || ''}   ·   ${info.email || ''}`, 14, 28.5);

    doc.setTextColor(...goldRGB);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(docLabel, 196, 16, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(230, 224, 200);
    doc.text(`N° ${quote.number || '—'}`, 196, 23, { align: 'right' });
    doc.text(`Date : ${fmtDate(quote.issueDate)}`, 196, 28.5, { align: 'right' });

    let y = 44;
    doc.setTextColor(...darkRGB);

    /* ── Émetteur / Client ── */
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Émetteur', 14, y);
    doc.text('Client', 110, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...grayRGB);

    const emitterLines = [
      info.legalName && !info.legalName.startsWith('REMPLACER_') ? info.legalName : 'DJ KREOBASS',
      info.address && !info.address.startsWith('REMPLACER_') ? info.address : '',
      info.siret && !info.siret.startsWith('REMPLACER_') ? `SIRET : ${info.siret}` : '',
      info.vatMention && !info.vatMention.startsWith('REMPLACER_') ? info.vatMention : '',
    ].filter(Boolean);
    const clientLines = [
      quote.client?.name || '',
      quote.client?.email || '',
      quote.client?.phone || '',
    ].filter(Boolean);

    let ey = y + 6;
    emitterLines.forEach(line => { doc.text(line, 14, ey, { maxWidth: 88 }); ey += 5; });
    let cy = y + 6;
    clientLines.forEach(line => { doc.text(line, 110, cy, { maxWidth: 88 }); cy += 5; });

    y = Math.max(ey, cy) + 6;

    /* ── Détail événement ── */
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...darkRGB);
    doc.text('Événement', 14, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...grayRGB);
    const eventLine = [
      EVENT_LABELS[quote.event?.type] || quote.event?.type || '',
      quote.event?.date ? `le ${fmtDate(quote.event.date)}` : '',
      quote.event?.venue || '',
    ].filter(Boolean).join(' · ');
    doc.text(eventLine || '—', 14, y + 6);

    y += 14;

    /* ── Tableau des prestations ── */
    const rows = (quote.items || []).map(it => [
      it.label || '',
      String(it.qty ?? 1),
      fmtEUR(it.unitPrice),
      fmtEUR((Number(it.qty) || 1) * (Number(it.unitPrice) || 0)),
    ]);

    doc.autoTable({
      startY: y,
      head: [['Prestation', 'Qté', 'Prix unitaire', 'Total']],
      body: rows,
      theme: 'plain',
      styles: { font: 'helvetica', fontSize: 9.5, cellPadding: 3, textColor: darkRGB, lineColor: [225, 220, 200], lineWidth: 0.2 },
      headStyles: { fillColor: darkRGB, textColor: goldRGB, fontStyle: 'bold' },
      columnStyles: {
        1: { halign: 'center', cellWidth: 18 },
        2: { halign: 'right', cellWidth: 34 },
        3: { halign: 'right', cellWidth: 34 },
      },
      margin: { left: 14, right: 14 },
    });

    let afterTableY = doc.lastAutoTable.finalY + 8;

    /* ── Total ── */
    doc.setFillColor(...darkRGB);
    doc.rect(130, afterTableY, 66, 12, 'F');
    doc.setTextColor(...goldRGB);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('TOTAL', 134, afterTableY + 8);
    doc.text(fmtEUR(quote.total), 192, afterTableY + 8, { align: 'right' });

    afterTableY += 20;

    /* ── Notes / conditions ── */
    doc.setTextColor(...grayRGB);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    if (quote.notes) {
      doc.text(doc.splitTextToSize(quote.notes, 182), 14, afterTableY);
      afterTableY += doc.splitTextToSize(quote.notes, 182).length * 4 + 6;
    }
    if (!isFacture) {
      doc.text(`Devis valable jusqu'au ${fmtDate(quote.validUntil)}. Acceptation en ligne via le lien envoyé par email.`, 14, afterTableY, { maxWidth: 182 });
      afterTableY += 6;
    } else if (info.iban && !info.iban.startsWith('REMPLACER_')) {
      doc.text(`Paiement par virement — IBAN : ${info.iban}${info.bic && !info.bic.startsWith('REMPLACER_') ? '  BIC : ' + info.bic : ''}`, 14, afterTableY, { maxWidth: 182 });
      afterTableY += 6;
    }

    /* ── Pied de page ── */
    doc.setFontSize(7.5);
    doc.setTextColor(...grayRGB);
    doc.text('DJ KREOBASS — document généré depuis djkreobass.fr', 14, 288);

    const fileName = `${docLabel}-${quote.number || 'DJKREOBASS'}.pdf`;
    doc.save(fileName);
  };
})();
