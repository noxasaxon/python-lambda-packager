import * as path from 'path';
import { makePackages, defaultPackagingArgs } from '../lib/index';

const MOCK_REPO_PATH = path.join(__dirname, './mock_repo');

describe('makePackages', () => {
  it('should be run', async () => {
    const pkgArgs = defaultPackagingArgs;
    pkgArgs.functionsDir = path.join(MOCK_REPO_PATH, 'functions');

    // run function
    await makePackages(pkgArgs);

    expect('test').toBe('test');
  });
});
