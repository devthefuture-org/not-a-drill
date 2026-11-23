import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** A fresh directory under the system temp dir. Tests never delete anything. */
export function scratchDir() {
  return mkdtempSync(join(tmpdir(), 'not-a-drill-test-'));
}

export const TODAY = '2026-11-23';
export const NOW = new Date(2026, 10, 23, 12, 0, 0);

/** Answers with every option on, in both languages. */
export function fullAnswers() {
  return {
    realSystem: true,
    languages: ['en', 'fr'],
    date: TODAY,
    owner: 'ACME Cooperative',
    activity: { en: 'running its shop', fr: 'faire tourner sa boutique' },
    contact: 'security@acme-cooperative.org',
    responseTime: { en: '48 hours', fr: '48 heures' },
    emergencyContact: '+33 1 23 45 67 89',
    publicPaths: 'https://acme-cooperative.org and /srv/public',
    guestRoom: { url: 'https://guest.acme-cooperative.org/api', quota: { en: '100 requests per day', fr: '100 requêtes par jour' } },
    atLeastList: true,
    cooperation: { goals: { en: 'help with audits', fr: "de l'aide pour des audits" }, offer: { en: 'hosting', fr: "de l'hébergement" } },
    siteUrl: 'https://acme-cooperative.org/',
    snippets: true,
  };
}

/** The smallest valid answers, in English. */
export function minimalAnswers() {
  return {
    realSystem: true,
    owner: 'ACME Cooperative',
    activity: 'running its shop',
    contact: 'security@acme-cooperative.org',
    responseTime: '72 hours',
  };
}
