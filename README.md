# Financier Backup

This repo allows you to use `playwright` to backup a 
[Financier](https://financier.io) budget to JSON without 
user interaction. 

## Instructions

1. Clone this repository
2. Copy `.env.example` into a file named `.env` and edit the values to match your needs
3. Install via `npm` from the cloned repository: `$ npm install`
4. Run app with `$ node index.js`

The first time the app runs, it will likely take a while since
it needs to downlaod all the budgets in your account first. 
Subsequent runs will be faster, since the bulk of the syncing
has been done (and stored in a local directory), and the only
thing that needs to be synced is the recent changes.

After the app finishes running, you should be left with a 
timestamped JSON file in the same directory that could be used
restore a budget if you needed.