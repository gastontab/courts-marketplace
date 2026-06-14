#!/bin/bash

node install-rindexer.js

cd marketplaceIndexer

echo "Iniciando Rindexer..."
../rindexer start all || (sleep 5 && ../rindexer start all)