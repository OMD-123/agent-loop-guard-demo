# 🛡️ agent-loop-guard-js Demo

A practical demonstration of the **agent-loop-guard-js** framework protecting an AI agent from common failure modes.

## 🎯 What This Demo Shows

This project simulates an AI agent with access to user management tools, demonstrating how `agent-loop-guard-js` intercepts and blocks:

| Guardrail | Threat Detected | Demo Scenario |
|-----------|----------------|---------------|
| **LoopGuard** | Infinite loops / token burn | Repeated tool calls blocked after limit |
| **SecurityGuard** | Prompt injection & unsafe content | Jailbreak attempts blocked |
| **LogicGuard** | Business logic violations | `deleteUser` blocked by policy |
| **HallucinationGuard** | Factual contradictions | LLM claiming deleted user exists |

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run the demo
npm run dev
```

## 📁 Project Structure

```
agent-loop-guard-demo/
├── src/
│   └── index.ts          # Main demo simulation
├── package.json
├── tsconfig.json
└── .gitignore
```

## 🧪 Expected Output

```
USER: "Find Alice"
✅ Step allowed: LLM reasoning
✅ Step allowed: Tool call
[TOOL] searchUsers("alice")
Tool Result: Found 1 user(s)
   - Alice (alice@example.com) [user]
✅ Step allowed: LLM response

USER: "Delete Alice account"
🛑 BLOCKED: BUSINESS_LOGIC_VIOLATION - DELETE operations require admin approval

🧪 Testing Hallucination Detection...
🛑 HALLUCINATION DETECTED: HALLUCINATION_SUSPECTED - LLM response appears to contradict the tool result.
```

## 🔗 Related

- **Core Library**: [agent-loop-guard-js](https://github.com/OMD-123/agent-loop-guard)
- **NPM Package**: [agent-loop-guard-js](https://www.npmjs.com/package/agent-loop-guard-js)

## 📄 License

MIT
