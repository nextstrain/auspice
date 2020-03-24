#!/bin/bash

if ! [ -d "data" ]; then
  echo "Creating empty data directory"
  mkdir data
fi
if ! [ -d "narratives" ]; then
  echo "Creating empty narratives directory"
  mkdir narratives
fi
