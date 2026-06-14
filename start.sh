#!/bin/bash


cd marketplaceIndexer


echo "Iniciando Rindexer mediante pnpm dlx..."
pnpm dlx rindexer start all || (sleep 5 && pnpm dlx rindexer start all)