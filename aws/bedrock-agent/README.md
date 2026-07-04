# Bedrock Agent — "Prep Roadmap Planner"

The agentic layer. Instead of a chat wrapper, this agent autonomously:
1. Reads the user's weak areas (Action Group -> progress-service REST API)
2. Decides the next focus area (its own reasoning)
3. Triggers generation of the next question set (Action Group -> question-service)

## Setup (AWS Console)
1. Bedrock -> Agents -> Create agent, name `careerpilot-planner`
2. Model: Claude 3.5 Sonnet
3. Agent instructions: paste `agent-instructions.txt`
4. Action groups -> Add:
   - Name: `progress-actions`
   - Executor: a Lambda that proxies to your progress-service ALB URL
     (or use "Return control" during local demos)
   - Schema: `action-group-schema.json`
5. Prepare -> Test in console: "Plan the next study focus for user demo-user"

## Trigger options
- Manual: invoke from console or a "Re-plan" button in Angular
- Automated: an EventBridge rule on a schedule, or a Lambda consuming the
  `session.completed` topic (via MSK -> Lambda event source mapping) that calls
  `bedrock-agent-runtime InvokeAgent`

## Interview talking points
- Action Groups = tools; the agent decides *when* to call them (planning loop)
- "Return control" vs Lambda executor trade-off
- Guardrails can be attached to constrain output
