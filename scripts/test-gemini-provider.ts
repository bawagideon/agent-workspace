import { loadEnvironment } from './env-loader';
import { GeminiProvider } from '../packages/runtime/src/providers/GeminiProvider';

async function testGemini() {
  console.log('================================================================');
  console.log('🤖 TESTING GEMINI MODEL PROVIDER & LIVE API INGESTION');
  console.log('================================================================\n');

  const { loadedFile, keysFound } = loadEnvironment();

  console.log(`[Env Loader] Loaded file: ${loadedFile || 'NONE'}`);
  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

  console.log(`[Env Check] GEMINI_API_KEY: ${apiKey ? 'SET' : 'NOT_SET'}`);
  console.log(`[Env Check] GEMINI_MODEL: ${modelName}`);

  if (!apiKey) {
    console.error('\n❌ FAILED: GEMINI_API_KEY is not set in .env.local');
    process.exit(1);
  }

  console.log(`\n[Gemini] Initializing GeminiProvider with model: ${modelName}`);
  const provider = new GeminiProvider(apiKey, modelName);

  try {
    console.log('[Gemini] Requesting autonomous structured plan for goal: "Audit TypeScript strictness in src/index.ts"');
    const plan = await provider.generatePlan('Audit TypeScript strictness in src/index.ts', {
      workspaceId: 'ws-agent-workspace'
    });

    console.log(`\n✅ Live API Response received! Generated Plan ID: ${plan.id}`);
    console.log(`✅ Plan Version: ${plan.version} | Status: ${plan.status}`);
    console.log(`✅ Structured Plan Steps Formulated (${plan.steps.length} steps):`);

    plan.steps.forEach((step) => {
      console.log(`   Step #${step.stepNumber} [${step.toolId}]: ${step.description} (Risk: ${step.riskLevel})`);
      console.log(`     Params: ${JSON.stringify(step.inputParams)}`);
    });

    console.log('\n🏛️ LIVE GEMINI API PLANNING & JSON INGESTION VERIFIED!\n');
  } catch (err: any) {
    console.error('❌ Gemini execution failed:', err.message);
    process.exit(1);
  }
}

testGemini();
