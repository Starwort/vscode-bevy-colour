#!/bin/sh
echo "Pushing changes to $1"

git push -f $1 main
