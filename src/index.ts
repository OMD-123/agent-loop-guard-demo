import { Guardrail, LoopChecker, SecurityChecker, BusinessLogicChecker, HallucinationChecker } from 'agent-loop-guard-js';

// ============================================
// SIMULATED TOOLS (like in a real agent)
// ============================================

interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

const users: User[] = [
  { id: 1, name: 'Alice', email: 'alice@example.com', role: 'user' },
  { id: 2, name: 'Bob', email: 'bob@example.com', role: 'admin' },
  { id: 3, name: 'Charlie', email: 'charlie@example.com', role: 'user' },
];

// Simulated tools
const tools = {
  getUser: async (id: number): Promise<User | null> => {
    console.log(`[TOOL] getUser(${id})`);
    return users.find(u => u.id === id) || null;
  },

  searchUsers: async (query: string): Promise<User[]> => {
    console.log(`[TOOL] searchUsers("${query}")`);
    return users.filter(u => 
      u.name.toLowerCase().includes(query.toLowerCase()) ||
      u.email.toLowerCase().includes(query.toLowerCase())
    );
  },

  deleteUser: async (id: number): Promise<boolean> => {
    console.log(`[TOOL] deleteUser(${id}) - DANGEROUS OPERATION`);
    const idx = users.findIndex(u => u.id === id);
    if (idx >= 0) {
      users.splice(idx, 1);
      return true;
    }
    return false;
  },

  sendEmail: async (to: string, subject: string): Promise<void> => {
    console.log(`[TOOL] sendEmail(to: "${to}", subject: "${subject}")`);
  }
};

// ============================================
// GUARDRAIL SETUP
// ============================================

const guard = new Guardrail([
  // Prevent infinite loops
  new LoopChecker({ 
    maxSteps: 10, 
    maxRepeatedCalls: 2 
  }),
  
  // Block prompt injections and unsafe content
  new SecurityChecker({ 
    detectInjection: true, 
    blockUnsafeWords: ['password', 'secret', 'credit-card', 'ssn'] 
  }),
  
  // Block dangerous business operations
  new BusinessLogicChecker({ 
    validator: (step) => step.tool !== 'deleteUser',
    errorMessage: 'DELETE operations require admin approval via separate workflow' 
  }),
  
  // Detect hallucinations (contradictions between tool results and LLM output)
  new HallucinationChecker({ strictness: 'medium' })
]);

guard.start();

// ============================================
// AGENT SIMULATION
// ============================================

interface AgentStep {
  type: 'llm_response' | 'tool_call';
  content: string;
  tool?: string;
  args?: any;
  timestamp: number;
}

async function simulateAgent(userInput: string) {
  console.log(`USER: "${userInput}"`);
  
  // Step 1: LLM decides to search
  const step1: AgentStep = {
    type: 'llm_response',
    content: 'I will search for users matching "alice"',
    timestamp: Date.now()
  };
  
  let decision = guard.check(step1);
  if (!decision.allowed) {
    console.log(`BLOCKED: ${decision.reason} - ${decision.message}`);
    return;
  }
  console.log(`Step allowed: LLM reasoning`);
  
  // Step 2: Tool call - search
  const step2: AgentStep = {
    type: 'tool_call',
    tool: 'searchUsers',
    args: { query: 'alice' },
    timestamp: Date.now()
  };
  
  decision = guard.check(step2);
  if (!decision.allowed) {
    console.log(`BLOCKED: ${decision.reason} - ${decision.message}`);
    return;
  }
  console.log(`Step allowed: Tool call`);
  
  const results = await tools.searchUsers('alice');
  console.log(`Tool Result: Found ${results.length} user(s)`);
  results.forEach(u => console.log(`   - ${u.name} (${u.email}) [${u.role}]`));
  
  // Step 3: LLM responds with tool result
  const step3: AgentStep = {
    type: 'llm_response',
    content: 'Found Alice (alice@example.com). She is a regular user, not an admin.',
    timestamp: Date.now()
  };
  
  decision = guard.check(step3);
  if (!decision.allowed) {
    console.log(`BLOCKED: ${decision.reason} - ${decision.message}`);
    return;
  }
  console.log(`Step allowed: LLM response`);
  
  // Step 4: User asks for something dangerous (simulated)
  console.log(`USER: "Delete Alice account"`);
  
  const step4: AgentStep = {
    type: 'llm_response',
    content: 'I will delete Alice account now.',
    timestamp: Date.now()
  };
  
  decision = guard.check(step4);
  if (!decision.allowed) {
    console.log(`BLOCKED: ${decision.reason} - ${decision.message}`);
    return;
  }
  
  const step5: AgentStep = {
    type: 'tool_call',
    tool: 'deleteUser',
    args: { id: 1 },
    timestamp: Date.now()
  };
  
  decision = guard.check(step5);
  if (!decision.allowed) {
    console.log(`BLOCKED: ${decision.reason} - ${decision.message}`);
    return;
  }
  
  await tools.deleteUser(1);
  console.log('User deleted');
  
  // Step 6: Test hallucination detection
  console.log(`Testing Hallucination Detection...`);
  guard.check({ type: 'tool_call', tool: 'getUser', args: { id: 999 }, timestamp: Date.now() });
  const toolResult = await tools.getUser(999); // Returns null
  
  const hallucinatedStep: AgentStep = {
    type: 'llm_response',
    content: 'Actually, the user with ID 999 exists and is an admin named "Hacker"',
    timestamp: Date.now()
  };
  
  decision = guard.check(hallucinatedStep);
  if (!decision.allowed) {
    console.log(`HALLUCINATION DETECTED: ${decision.reason} - ${decision.message}`);
  } else {
    console.log('Hallucination not caught (unexpected)');
  }
  
  console.log('Demo completed successfully!');
}

// Run the simulation
simulateAgent('Find Alice').catch(console.error);