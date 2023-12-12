import { test } from '@japa/runner'

import { TokenizerService } from 'App/Diff/Service'

test.group('Tokenizer service', () => {
	test('Markdown', async ({ assert }) => {
		const input =
			'## Hello World\n\n___\n\nThis is a test.\n\n**This is bold text** Three   Spaces'
		const expectedOutput = [
			'##',
			' ',
			'Hello',
			' ',
			'World',
			'\n\n',
			'___',
			'\n\n',
			'This',
			' ',
			'is',
			' ',
			'a',
			' ',
			'test.',
			'\n\n',
			'**This',
			' ',
			'is',
			' ',
			'bold',
			' ',
			'text**',
			' ',
			'Three',
			'   ',
			'Spaces',
		]

		const tokenizedString = TokenizerService.tokenize(input)

		assert.deepEqual(tokenizedString, expectedOutput)
	})
	test('Empty String', async ({ assert }) => {
		const input = ''
		const expectedOutput = []

		const tokenizedString = TokenizerService.tokenize(input)

		assert.deepEqual(tokenizedString, expectedOutput)
	})
	test('String with Only Whitespace', async ({ assert }) => {
		const input = ' \n \t '
		const expectedOutput = [' ', '\n', ' ', '\t', ' ']

		const tokenizedString = TokenizerService.tokenize(input)

		assert.deepEqual(tokenizedString, expectedOutput)
	})
	test('Consecutive Tabs', async ({ assert }) => {
		const input = 'Hello\t\tWorld\t\t\tTest'
		const expectedOutput = ['Hello', '\t\t', 'World', '\t\t\t', 'Test']

		const tokenizedString = TokenizerService.tokenize(input)

		assert.deepEqual(tokenizedString, expectedOutput)
	})
	test('String with No Whitespace', async ({ assert }) => {
		const input = 'HelloWorld'
		const expectedOutput = ['HelloWorld']

		const tokenizedString = TokenizerService.tokenize(input)

		assert.deepEqual(tokenizedString, expectedOutput)
	})
	test('String with Whitespace at the Beginning and End', async ({
		assert,
	}) => {
		const input = ' Hello World '
		const expectedOutput = [' ', 'Hello', ' ', 'World', ' ']

		const tokenizedString = TokenizerService.tokenize(input)

		assert.deepEqual(tokenizedString, expectedOutput)
	})
	test('String with Multiple Lines and Mixed Whitespace', async ({
		assert,
	}) => {
		const input = '\nHello\n\nWorld \tTest\n'
		const expectedOutput = [
			'\n',
			'Hello',
			'\n\n',
			'World',
			' ',
			'\t',
			'Test',
			'\n',
		]

		const tokenizedString = TokenizerService.tokenize(input)

		assert.deepEqual(tokenizedString, expectedOutput)
	})
	test('String with Punctuation and Whitespace', async ({ assert }) => {
		const input = 'Hello, World! How are you?'
		const expectedOutput = [
			'Hello,',
			' ',
			'World!',
			' ',
			'How',
			' ',
			'are',
			' ',
			'you?',
		]

		const tokenizedString = TokenizerService.tokenize(input)

		assert.deepEqual(tokenizedString, expectedOutput)
	})
	test('String with Unicode Characters', async ({ assert }) => {
		const input = 'こんにちは 世界\n新しい 行'
		const expectedOutput = [
			'こんにちは',
			' ',
			'世界',
			'\n',
			'新しい',
			' ',
			'行',
		]

		const tokenizedString = TokenizerService.tokenize(input)

		assert.deepEqual(tokenizedString, expectedOutput)
	})
	test('Complex Markdown String', async ({ assert }) => {
		const input = '# Title\n\n- Item 1\n- Item 2\n\nEnd of list.'
		const expectedOutput = [
			'#',
			' ',
			'Title',
			'\n\n',
			'-',
			' ',
			'Item',
			' ',
			'1',
			'\n',
			'-',
			' ',
			'Item',
			' ',
			'2',
			'\n\n',
			'End',
			' ',
			'of',
			' ',
			'list.',
		]

		const tokenizedString = TokenizerService.tokenize(input)

		assert.deepEqual(tokenizedString, expectedOutput)
	})
})
