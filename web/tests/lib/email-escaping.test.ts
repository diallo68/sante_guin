import { describe, it, expect } from 'vitest';
import { emailAppointmentConfirmation, emailNewMessage } from '@/lib/email';
import { escapeHtml } from '@/lib/htmlEscape';

// Régression S19 : les valeurs fournies par l'utilisateur (nom, message,
// motif) étaient interpolées sans échappement dans les templates HTML des
// emails, permettant de falsifier leur contenu (liens de phishing, mise en
// forme trompeuse).
describe('escapeHtml', () => {
  it('échappe les caractères spéciaux HTML', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(escapeHtml(`"quoted" & 'single'`)).toBe('&quot;quoted&quot; &amp; &#39;single&#39;');
  });
});

describe('Templates email — échappement (S19)', () => {
  it('emailAppointmentConfirmation échappe le nom du patient et le motif', () => {
    const tpl = emailAppointmentConfirmation({
      patientFirstName: '<img src=x onerror=alert(1)>',
      doctorName: 'Dupont',
      date: 'lundi 1 janvier',
      time: '10:00',
      reason: '<b>faux</b> motif <script>evil()</script>',
    });
    expect(tpl.html).not.toContain('<img src=x onerror=alert(1)>');
    expect(tpl.html).not.toContain('<script>evil()</script>');
    expect(tpl.html).toContain('&lt;img');
    expect(tpl.html).toContain('&lt;script&gt;evil()&lt;/script&gt;');
  });

  it('emailNewMessage échappe le nom de l\'expéditeur et l\'aperçu du message', () => {
    const tpl = emailNewMessage({
      recipientName: 'Alice',
      senderName: '<a href="https://phishing.example">Dr. Faux</a>',
      preview: 'Cliquez ici : <script>steal()</script>',
      conversationId: '507f1f77bcf86cd799439011',
      role: 'patient',
    });
    expect(tpl.html).not.toContain('<a href="https://phishing.example">');
    expect(tpl.html).not.toContain('<script>steal()</script>');
  });
});
