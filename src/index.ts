import { stdout, argv, exit } from 'node:process';

let had_error = false;

enum TokenType {
	// Single-char tokens
	LEFT_PAREN,
	RIGHT_PAREN,
	LEFT_BRACE,
	RIGHT_BRACE,
	COMMA,
	DOT,
	MINUS,
	PLUS,
	SEMICOLON,
	SLASH,
	STAR,

	// One or two character tokens.
	BANG,
	BANG_EQUAL,
	EQUAL,
	EQUAL_EQUAL,
	GREATER,
	GREATER_EQUAL,
	LESS,
	LESS_EQUAL,

	// Literals.
	IDENTIFIER,
	STRING,
	NUMBER,

	// Keywords.
	AND,
	CLASS,
	ELSE,
	FALSE,
	FUN,
	FOR,
	IF,
	NIL,
	OR,
	PRINT,
	RETURN,
	SUPER,
	THIS,
	TRUE,
	VAR,
	WHILE,

	EOF,
}

interface Token {
	type: TokenType;
	lexeme: string;
	literal: Object;
	line: number;
}

const toString = (t: Token) => {
	return TokenType[t.type] + ' ' + t.lexeme + ' ' + t.literal.toString();
};

interface Scanner {
	source: string;
	tokens: Array<Token>;
}

function error(line: number, message: string) {
	report(line, '', message);
}

function report(line: number, where: string, message: string) {
	console.error(`[line ${line}] Error ${where} : ${message}`);
	had_error = true;
}

function scanTokens(s: Scanner) {
	let start = 0;
	let current = 0;
	let line = 1;

	function isAtEnd() {
		return current >= s.source.length;
	}

	function advance() {
		return s.source.charAt(current++);
	}

	function addToken(t: TokenType, l?: Object) {
		let text = s.source.substring(start, current);
		console.log(text);
		s.tokens.push({
			type: t,
			lexeme: text,
			literal: typeof l === 'undefined' ? {} : l,
			line: line,
		});
	}

	function match(expected: string) {
		if (isAtEnd()) return false;
		if (s.source.charAt(current) != expected) return false;

		current++;
		return true;
	}

	function peek() {
		if (isAtEnd()) return '\0';
		return s.source.charAt(current);
	}

	function string() {
		while (peek() != '"' && !isAtEnd()) {
			if (peek() == '\n') line += 1;
			advance();
		}

		if (isAtEnd()) {
			error(line, 'Unterminated string.');
			return;
		}

		// Consume the closing "
		advance();

		// Trim surrounding quotes
		let value = s.source.substring(start + 1, current - 1);
		addToken(TokenType.STRING, value);
	}

	function scan() {
		while (!isAtEnd()) {
			start = current;
			scanToken();
		}

		s.tokens.push({ type: TokenType.EOF, lexeme: '', literal: {}, line: line });
	}

	function scanToken() {
		let c = advance();
		switch (c) {
			case '(':
				addToken(TokenType.LEFT_PAREN);
				break;
			case ')':
				addToken(TokenType.RIGHT_PAREN);
				break;
			case '{':
				addToken(TokenType.LEFT_BRACE);
				break;
			case '}':
				addToken(TokenType.RIGHT_BRACE);
				break;
			case ',':
				addToken(TokenType.COMMA);
				break;
			case '.':
				addToken(TokenType.DOT);
				break;
			case '-':
				addToken(TokenType.MINUS);
				break;
			case '+':
				addToken(TokenType.PLUS);
				break;
			case ';':
				addToken(TokenType.SEMICOLON);
				break;
			case '*':
				addToken(TokenType.STAR);
				break;
			case '!':
				addToken(match('=') ? TokenType.BANG_EQUAL : TokenType.BANG);
				break;
			case '=':
				addToken(match('=') ? TokenType.EQUAL_EQUAL : TokenType.EQUAL);
				break;
			case '<':
				addToken(match('=') ? TokenType.LESS_EQUAL : TokenType.LESS);
				break;
			case '>':
				addToken(match('=') ? TokenType.GREATER_EQUAL : TokenType.GREATER);
				break;
			case '/':
				if (match('/')) {
					while (peek() != '\n' && !isAtEnd()) {
						advance();
					}
				} else {
					addToken(TokenType.SLASH);
				}
				break;
			case ' ':
			case '\r':
			case '\t':
				// ignore whitespace
				break;
			case '\n':
				line++;
				break;
			case '"':
				string();
				break;
			default:
				error(line, 'Unexpected character.');
				break;
		}
	}

	scan();
}

async function main() {
	if (argv.length > 2) {
		stdout.write('Usage: gravlax [script]');
		exit(64);
	} else if (argv.length === 1) {
		run_file(argv[1]);
	} else {
		await run_prompt();
	}
}

async function run_file(input_file: string) {
	const file = Bun.file(input_file);
	const text = await file.text();
	run(text);

	if (had_error) {
		exit(65);
	}
}

async function run_prompt() {
	const prompt = '> ';
	stdout.write(prompt);
	for await (const line of console) {
		stdout.write(prompt);
		if (line.length === 0) break;
		run(line);

		// If user makes a mistake in interactive mode, don't kill the whole session
		had_error = false;
	}
}

function run(source: string) {
	// console.log(source);
	let scanner: Scanner = { source, tokens: new Array() };
	scanTokens(scanner);
	// console.log(scanner.tokens);
}

main();
