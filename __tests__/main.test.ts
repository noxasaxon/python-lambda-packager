import * as path from 'path';
import { DEFAULT_FUNCTIONS_DIR_NAME } from '../lib/constants';
import { makePackages, defaultPackagingArgs } from '../lib/index';

const MOCK_REPO_PATH = path.join(__dirname, './mock_repo');

describe('makePackages', () => {
  it('should be run', async () => {
    const pkgArgs = defaultPackagingArgs;
    pkgArgs.functionsDir = path.join(
      MOCK_REPO_PATH,
      DEFAULT_FUNCTIONS_DIR_NAME,
    );

    // run function
    await makePackages(pkgArgs);

    expect('test').toBe('test');
  });
});
