#!/bin/bash

# 1. Instalar Rindexer en el contenedor si no existe
if ! command -v rindexer &> /dev/null
then
    echo "Instalando Rindexer en el servidor..."
    curl -L https://raw.githubusercontent.com/jcarbonnell/rindexer/main/install.sh | bash
    export PATH="$HOME/.rindexer/bin:$PATH"
else
    echo "Rindexer ya está instalado."
fi

# 2. Moverse a la carpeta del indexador (Cambiá 'marketplaceIndexer' por el nombre real de tu carpeta)
cd marketplaceIndexer

# 3. Arrancar Rindexer con el salvavidas de reintento
echo "Iniciando Rindexer..."
rindexer start all || (sleep 5 && rindexer start all)