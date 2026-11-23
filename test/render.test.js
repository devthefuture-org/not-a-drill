import assert from 'node:assert/strict';
import { test } from 'node:test';
import { namesUsed, render, TemplateError } from '../src/render.js';

test('inserts variables and keeps truthy blocks', () => {
  assert.equal(render('Hello {{name}}{{#if loud}}!{{/if}}', { name: 'Ada', loud: true }), 'Hello Ada!');
  assert.equal(render('Hello {{name}}{{#if loud}}!{{/if}}', { name: 'Ada', loud: false }), 'Hello Ada');
});

test('a block tag alone on its line takes the line with it', () => {
  const template = 'a\n{{#if x}}\nb\n{{/if}}\nc\n';
  assert.equal(render(template, { x: true }), 'a\nb\nc\n');
  assert.equal(render(template, { x: false }), 'a\nc\n');
});

test('blocks nest', () => {
  const template = '{{#if a}}A{{#if b}}B{{/if}}{{/if}}';
  assert.equal(render(template, { a: true, b: true }), 'AB');
  assert.equal(render(template, { a: true, b: false }), 'A');
  assert.equal(render(template, { a: false }), '');
});

test('a value is inserted as is, never parsed as a template', () => {
  assert.equal(render('{{v}}', { v: '{{#if x}}' }), '{{#if x}}');
});

test('every mistake is an error', () => {
  assert.throws(() => render('{{ not valid }}', {}), TemplateError);
  assert.throws(() => render('{{#if a}}open', { a: true }), /never closed/);
  assert.throws(() => render('stray{{/if}}', {}), /without an open block/);
  assert.throws(() => render('{{missing}}', {}), /needs a string value, got nothing/);
  assert.throws(() => render('{{flag}}', { flag: true }), /needs a string value, got boolean/);
  assert.throws(() => render('{{#if unknown}}x{{/if}}', {}), /has no value in the context/);
});

test('a hidden block does not need its values', () => {
  assert.equal(render('{{#if a}}{{missing}}{{/if}}ok', { a: false }), 'ok');
});

test('namesUsed lists variables and block conditions', () => {
  assert.deepEqual([...namesUsed('{{a}}{{#if b}}{{c}}{{/if}}')].sort(), ['a', 'b', 'c']);
});
