import net from 'node:net';

const ports = [3000, 5000];
const host = '127.0.0.1';

function check(port) {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        reject(new Error(`Port ${port} is already in use`));
      } else {
        reject(err);
      }
    });
    srv.listen(port, host, () => {
      srv.close(() => resolve());
    });
  });
}

const errors = [];
for (const p of ports) {
  try {
    // eslint-disable-next-line no-await-in-loop
    await check(p);
    console.log(`✅ Port ${p} free`);
  } catch (e) {
    console.error(`❌ ${e.message}`);
    errors.push(e);
  }
}
if (errors.length) process.exit(1);

