#!/bin/sh

git checkout master > /dev/null

echo -n "id of the new release: "
read tag

echo -n "title of release: "
read message

echo

git tag -a "$tag" -m "$message"

if [ $? != 0 ]; then
    exit
fi

git switch build > /dev/null

echo
git merge master

echo
git switch master > /dev/null
