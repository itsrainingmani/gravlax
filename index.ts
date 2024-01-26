import { stdout, argv, exit } from 'node:process';

let has_error = false;

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
}

async function run_prompt() {
	const prompt = '> ';
	stdout.write(prompt);
	for await (const line of console) {
		stdout.write(prompt);
		if (line.length === 0) break;
		run(line);
	}
}

function run(source: string) {
	console.log(source);
}

main();
