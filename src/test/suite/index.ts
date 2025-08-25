import * as path from 'path';
import Mocha from 'mocha';
import { glob } from 'glob';

export async function run(): Promise<void> {
	return new Promise((c, e) => {
		// Create the mocha test
		const mocha = new Mocha({
			ui: 'tdd',
			color: true,
			timeout: 60000, // 增加超时时间以支持集成测试
			reporter: 'spec'
		});

		const testsRoot = path.resolve(__dirname, '..');

		// 使用Promise-based glob
		glob('**/**.test.js', { cwd: testsRoot })
			.then((files: string[]) => {
				// Add files to the test suite
				files.forEach((f: string) => mocha.addFile(path.resolve(testsRoot, f)));

				try {
					// Run the mocha test
					mocha.run(failures => {
						if (failures > 0) {
							e(new Error(`${failures} tests failed.`));
						} else {
							c();
						}
					});
				} catch (err) {
					console.error(err);
					e(err);
				}
			})
			.catch((err: any) => {
				e(err);
			});
	});
}
