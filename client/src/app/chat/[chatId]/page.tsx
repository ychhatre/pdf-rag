"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Send, ArrowLeft } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Message {
  role: "user" | "assistant"
  content: string
  sources?: string[]
}

export default function ChatPage() {
  const params = useParams() as { chatId: string }
  const { chatId } = params
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const [userMessage, setUserMessage] = useState("")
  const [chatLog, setChatLog] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // ---------------------------
  // 1) On mount, add chatId to "myChats" in localStorage (if not present)
  useEffect(() => {
    const storedChats = JSON.parse(localStorage.getItem("myChats") || "[]")
    if (!storedChats.includes(chatId)) {
      storedChats.push(chatId)
      localStorage.setItem("myChats", JSON.stringify(storedChats))
    }
  }, [chatId])
  // ---------------------------

  // Load any existing chat history from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(`chatLog-${chatId}`)
    if (stored) {
      setChatLog(JSON.parse(stored))
    }
  }, [chatId])

  // Whenever chatLog changes, store it in localStorage
  useEffect(() => {
    localStorage.setItem(`chatLog-${chatId}`, JSON.stringify(chatLog))
  }, [chatId, chatLog])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [chatLog])

  const handleSend = async () => {
    if (!userMessage.trim()) return
    setIsLoading(true)

    // Add user message to chatLog
    const newUserMessage: Message = {
      role: "user",
      content: userMessage,
    }
    setChatLog((prev) => [...prev, newUserMessage])
    const query = userMessage
    setUserMessage("")

    try {
      const res = await fetch(`http://localhost:8000/ask/${chatId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: query,
        }),
      })
      const data = await res.json()

      // Add assistant message
      const newAssistantMessage: Message = {
        role: "assistant",
        content: data.response || "No response",
        sources: data.sources || [],
      }
      setChatLog((prev) => [...prev, newAssistantMessage])
    } catch (e) {
      console.error(e)
      setChatLog((prev) => [
        ...prev,
        { role: "assistant", content: "Error: " + (e as Error).message },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back to home</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Chat Session</h1>
            <p className="text-sm text-muted-foreground">ID: {chatId}</p>
          </div>
        </div>

        <Card className="border-none shadow-lg">
          <CardHeader className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
            <CardTitle>Conversation</CardTitle>
            <CardDescription>
              Ask questions about the uploaded document or start a new conversation
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px] p-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {chatLog.map((msg, idx) => {
                  const isAssistant = msg.role === "assistant"
                  return (
                    <div
                      key={idx}
                      className={`flex flex-col ${
                        isAssistant ? "items-start" : "items-end"
                      }`}
                    >
                      <div
                        className={`rounded-lg px-4 py-2 max-w-[80%] ${
                          isAssistant
                            ? "bg-muted"
                            : "bg-primary text-primary-foreground"
                        }`}
                      >
                        <div className="text-sm">{msg.content}</div>
                        {isAssistant && msg.sources && msg.sources.length > 0 && (
                          <div className="mt-2 text-xs">
                            <p className="font-medium text-muted-foreground">Citations:</p>
                            <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                              {msg.sources.map((src, i) => (
                                <li key={i}>{src}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
                {isLoading && (
                  <div className="flex items-start">
                    <div className="bg-muted rounded-lg px-4 py-2 max-w-[80%]">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
                        <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0.2s]" />
                        <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0.4s]" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            <div className="border-t p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSend()
                }}
                className="flex items-center gap-2"
              >
                <Input
                  placeholder="Type your message..."
                  value={userMessage}
                  onChange={(e) => setUserMessage(e.target.value)}
                  disabled={isLoading}
                />
                <Button type="submit" disabled={isLoading}>
                  <Send className="h-4 w-4" />
                  <span className="sr-only">Send message</span>
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
