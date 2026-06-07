import {
  consumeStream,
  convertToModelMessages,
  streamText,
  UIMessage,
} from 'ai'

export const maxDuration = 30

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  const result = streamText({
    model: 'openai/gpt-5-mini',
    system: `You are SupplyMind AI, an expert supply chain and business intelligence assistant. You provide strategic recommendations on:
- Demand forecasting and demand planning
- Inventory optimization and reorder strategies
- Supplier relationship management and risk mitigation
- Revenue optimization and pricing strategies
- Supply chain analytics and KPI interpretation
- Business simulation scenarios and impact analysis

Be concise, data-driven, and actionable in your recommendations. When users ask about their data, provide specific insights with context.`,
    // Note: convertToModelMessages is async in version 6
    messages: await convertToModelMessages(messages),
    abortSignal: req.signal,
  })

  return result.toUIMessageStreamResponse({
    // Pass original messages for persistence - onFinish receives complete history
    originalMessages: messages,
    onFinish: async ({ messages: allMessages, isAborted }) => {
      if (isAborted) return
      // allMessages includes the new AI response as UIMessage[]
      // await saveChat({ chatId, messages: allMessages })
    },
    consumeSseStream: consumeStream,
  })
}
