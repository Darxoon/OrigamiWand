#!/bin/sh

git checkout master > /dev/null

echo -n "id of the new release: "
read tag

echo -n "title of release: "
read message

echo

git tag -a "$tag" -m "$message"

git push --tag > /dev/null

if [ $? != 0 ]; then
    exit
fi

echo
echo 'Build instruction:'
echo PUBLIC_OW_VERSION='"'"$tag"'"' PUBLIC_VERSION_TIMESTAMP=$(date +%s)000 PUBLIC_IS_DEV_VERSION=0 PUBLIC_DEBUG=0 npm run build