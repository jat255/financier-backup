const playwright = require('playwright');
const { PerformanceObserver, performance } = require('perf_hooks');
require('dotenv').config();
const ora = require('ora');
const moment = require('moment');
var spinner;

const url = 'https://app.financier.io';
const user = process.env.FINANCIER_USER;
const pass = process.env.FINANCIER_PASS;
const budgetId = process.env.FINANCIER_BUDGET_ID;
const timestamp = moment().format('YYYY-MM-DD[T]HHmm');
const filename = `${timestamp}_financier_backup.json`;

(async () => {
    spinner = ora(`Launching browser`).start();
    const browser = await playwright.chromium.launchPersistentContext(
        'chromium_dataDir',
        {
            acceptDownloads: true,
            headless: true,
            downloadsPath: '.',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
    );
    const page = await browser.newPage();
    spinner.succeed();

    spinner = ora(`Going to url: ${url}`).start();
    await page.goto(url);
    spinner.succeed();

    spinner = ora(`Waiting for page to load`).start();
    // when div.budgets is present, we can check for login/logout
    const BUDGETS_SELECTOR = 'css=div.budgets';
    await page.waitForSelector(BUDGETS_SELECTOR, {timeout: 60000});
    spinner.succeed();

    spinner = ora(`Waiting for 'Login' to appear`).start();
    try {
        const LOGIN_SELECTOR = 'li[ng-click="userCtrl.signin()"]';
        await page.waitForSelector(LOGIN_SELECTOR, {timeout: 100});
        spinner.succeed();

        spinner = ora(`Clicking on 'Login'`).start();
        await page.click(LOGIN_SELECTOR);
        spinner.succeed();

        INPUT_SELECTOR_USER = 'input[name="email"]';
        INPUT_SELECTOR_PASS = 'input[name="password"]';
        spinner = ora('Waiting for input form').start();
        await page.waitForSelector(INPUT_SELECTOR_USER);
        spinner.succeed();
        
        spinner = ora('Entering username and password').start();
        await page.type(INPUT_SELECTOR_USER, user, {delay: 10});
        await page.type(INPUT_SELECTOR_PASS, pass, {delay: 10});
        await page.keyboard.press('Enter');
        spinner.succeed();
    
    } catch (e) {
        // login selector wasn't present, which means we're already logged in
        spinner.succeed('Already logged in!')
    }
    
    spinner = ora('Waiting for budgets to sync (this can take some time)...').start();
    const SYNC_SELECTOR = 'css=sync-status.sync-status--complete';
    try {
        // wait for sync with six minute timeout
        let a = performance.now();
        await page.waitForSelector(SYNC_SELECTOR, {timeout: 720000});
        let b = performance.now();
        spinner.succeed(`Budgets synced in ${parseInt((b-a)/1000)}s`);
    }
    catch (e) {
        console.error(`\n${e}`);
        spinner.fail();
        spinner = ora(`Closing browser`).start();
        await browser.close();
        spinner.succeed();
        return 1;
    }
    
    const budgetUrl = url + '/' + budgetId + '/budget'
    spinner = ora(`Going to url: ${budgetUrl}`).start();
    await page.goto(budgetUrl);
    spinner.succeed();

    spinner = ora(`Waiting for individual budget syncing`).start();
    let a = performance.now();
    await page.waitForSelector(SYNC_SELECTOR, {timeout: 60000});
    let b = performance.now();
    spinner.succeed(`Budget synced in ${parseInt((b-a)/1000)}s`);

    const COG_SELECTOR = 'css=i.fa-cog';
    spinner = ora(`Waiting for page to load and clicking settings icon`).start();
    await page.waitForSelector(COG_SELECTOR);
    await page.click(COG_SELECTOR);
    spinner.succeed();

    const BACKUP_SELECTOR = 'text="Backup Budget"';
    spinner = ora(`Waiting for backup budget download`).start();
    await page.waitForSelector(BACKUP_SELECTOR);

    const [ download ] = await Promise.all([
        page.waitForEvent('download'), // wait for download to start
        page.click(BACKUP_SELECTOR)
      ]);
    // save as the filename we want and delete the original
    await download.saveAs(filename);
    await download.delete();
    spinner.succeed(`Backup downloaded to ${filename}`);

    spinner = ora(`Closing browser`).start();
    await browser.close();
    spinner.succeed();
})();