import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hasDoubleConsonant, isDoublesSlip, matchAnswer } from './answerCheck';

test('una doppia mancante o di troppo è un errore sulle doppie', () => {
  assert.equal(isDoublesSlip('caro', 'carro'), true);
  assert.equal(isDoublesSlip('carro', 'caro'), true);
  assert.equal(isDoublesSlip('capuccino', 'cappuccino'), true);
  assert.equal(isDoublesSlip('aqua', 'acqua'), true);
  // anche con un accento sbagliato in più resta un errore sulle doppie
  assert.equal(isDoublesSlip('cafe', 'caffè'), true);
});

test('risposte giuste, solo accenti o sbagliate non sono errori sulle doppie', () => {
  assert.equal(isDoublesSlip('Sette', 'sette'), false);
  assert.equal(isDoublesSlip('caffe', 'caffè'), false);
  assert.equal(matchAnswer('caffe', 'caffè'), 'accents');
  assert.equal(isDoublesSlip('sono', 'sei'), false);
  assert.equal(isDoublesSlip('pala', 'palo'), false);
});

test('riconosce le risposte che contengono una doppia', () => {
  assert.equal(hasDoubleConsonant('Buonasera'), false);
  assert.equal(hasDoubleConsonant('stanno'), true);
  assert.equal(hasDoubleConsonant('acqua'), true);
  assert.equal(hasDoubleConsonant('Caffè'), true);
});
