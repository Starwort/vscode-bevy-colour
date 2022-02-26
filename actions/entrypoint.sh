#!/bin/sh
echo "Pushing changes to $1"
if ! git ls-remote --exit-code azure --quiet; then
    git remote add azure "$1"
fi

git push -f azure main
