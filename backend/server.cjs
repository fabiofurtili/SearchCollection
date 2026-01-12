// Passenger loads CommonJS; bootstrap the ESM app via dynamic import.
(async () => {
  await import("./server.js");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
