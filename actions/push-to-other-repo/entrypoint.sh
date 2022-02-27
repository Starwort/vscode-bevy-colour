#!/bin/sh
echo "Pushing changes to $1"

git push "$1" main -f
