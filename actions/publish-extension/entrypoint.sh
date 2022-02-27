#!/bin/sh
echo "Publishing extension"
npx vsce publish --no-dependencies -p $1
