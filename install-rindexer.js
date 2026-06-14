const fs = require('fs');
const http = require('https');
const { execSync } = require('child_process');

const url = "https://github.com/jcarbonnell/rindexer/releases/download/v0.2.4/rindexer-x86_64-unknown-linux-gnu.tar.gz";
const tarFile = "rindexer.tar.gz";

if (fs.existsSync('./rindexer')) {
    console.log("Rindexer ya está instalado.");
    process.exit(0);
}

console.log("Descargando Rindexer vía Node.js fetch...");
const file = fs.createWriteStream(tarFile);
http.get(url, function(response) {
    response.pipe(file);
    file.on('finish', function() {
        file.close(() => {
            console.log("Descomprimiendo binario...");
            try {
                // Descomprime el tar.gz nativamente en Linux
                execSync(`tar -xzf ${tarFile}`);
                execSync('chmod +x rindexer');
                fs.unlinkSync(tarFile); // Limpia el temporal
                console.log("¡Rindexer instalado con éxito!");
            } catch (err) {
                console.error("Error al descomprimir:", err);
            }
        });
    });
});