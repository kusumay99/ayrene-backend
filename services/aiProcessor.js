module.exports = async function aiProcessor(text, mode) {
  // Replace with your AI logic
  const start = Date.now();
  const processed = `${text} [processed in ${mode}]`;
  const lang = "en";
  const time = Date.now() - start;

  return { processed, lang, time };
};
