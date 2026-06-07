'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useState } from 'react'
import { Send, MessageCircle, Loader } from 'lucide-react'

export default function AIChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
  })

  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="text-primary" size={28} />
            <h1 className="text-3xl font-bold text-foreground">AI Assistant</h1>
          </div>
          <p className="text-muted-foreground">Ask SupplyMind AI for supply chain insights and recommendations</p>
        </div>

        <div className="bg-card border border-border rounded-lg flex flex-col h-96 shadow-lg">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center">
                <div>
                  <MessageCircle size={48} className="text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">Start a conversation with SupplyMind AI</p>
                  <p className="text-xs text-muted-foreground mt-2">Ask about forecasting, inventory, suppliers, or business scenarios</p>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-foreground'
                    }`}
                  >
                    <p className="text-sm">
                      {message.content}
                    </p>
                  </div>
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-secondary text-foreground px-4 py-2 rounded-lg flex items-center gap-2">
                  <Loader size={16} className="animate-spin" />
                  <span className="text-sm">Thinking...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="flex justify-start">
                <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm max-w-xs">
                  {error.message || 'An error occurred'}
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-border p-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder="Ask SupplyMind AI..."
                className="flex-1 px-3 py-2 border border-border rounded-lg bg-white text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                <Send size={18} />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">Quick Tips:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Ask about demand forecasting accuracy</li>
            <li>• Request inventory optimization suggestions</li>
            <li>• Inquire about supplier performance and risks</li>
            <li>• Discuss revenue scenarios and simulations</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
