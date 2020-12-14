# Watcher

## Getting started

```
yarn add --dev @lerna-helpers/watcher
```

To use watcher, you can run the following:

```
watcher --change "lerna run build --scope %package%" "yarn start"
```

When `watcher` notices something has changed in your project it will:

1. Run whatever command is in `--change` and substitute in the package name into `%package%`. eg. If we change a 
   file in our `updator` package, it would run: `lerna run build --scope @lerna-helpers/updator`.
2. Once that command has finished, it will run the passed `<command>` eg. In this example, we run `yarn start` which 
   starts our app
   
So this simple little script will watch all your lerna packages, only re-build the ones that have a file changed, 
and restart your app! Easy!