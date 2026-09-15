export const DEFAULT_TEST_MAX_TOKENS = 32;

const TEST_PROMPTS = [
  'Tell me a fun fact about the ocean.',
  'What are a few tips for staying focused while working?',
  'Suggest a good book to read on a rainy day.',
  'Explain the water cycle in simple terms.',
  'What is a creative way to use leftover vegetables?',
  'Give me a short, upbeat quote to start the day.',
  'What are some benefits of taking a short walk?',
  'Recommend a relaxing weekend activity.',
];

export const pickTestPrompt = (): string =>
  TEST_PROMPTS[Math.floor(Math.random() * TEST_PROMPTS.length)];
